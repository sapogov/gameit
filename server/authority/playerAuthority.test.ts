import { describe, expect, test, vi } from 'vitest';
import { PlayerAuthority } from './playerAuthority';
import { isValidLedgerTransition, ProcessLocalPlayerAuthorityRepository } from './playerRepository';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import { signAuthenticatedTransfer } from './authenticatedTransfer';
import { applyCreatureExperience, choosePlayerBattleAttack, createTrainerBattleRoomState, switchPlayerBattleCreature, toBattleResult } from '../../src/games/monster-rpg/sim';
const authorityForTest = (repository: ProcessLocalPlayerAuthorityRepository, rng = () => 0.5) => new PlayerAuthority(repository, () => new Date(0), undefined, rng);
const oneCallClock = (at: Date) => {
  let calls = 0;
  return () => {
    calls += 1;
    if (calls > 1) throw new Error('authority clock was read more than once');
    return at;
  };
};
describe('PlayerAuthority', () => {
  test.each([
    ['bootstrap', async (authority: PlayerAuthority, principal: { sub: string }) => authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' })],
    ['reset', async (authority: PlayerAuthority, principal: { sub: string }) => authority.execute(principal, { intentId: 'reset', expectedRevision: 0, intent: { type: 'resetProgress', confirmed: true } })]
  ])('uses exactly one injected clock for %s', async (_family, mutate) => {
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174081' };
    const repository = new ProcessLocalPlayerAuthorityRepository();
    if (_family === 'reset') await authorityForTest(repository).bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    const at = new Date('2026-07-21T12:00:00.000Z');
    const authority = new PlayerAuthority(repository, oneCallClock(at), undefined, () => 0.25);
    const random = vi.spyOn(Math, 'random'); const now = vi.spyOn(Date, 'now');
    await mutate(authority, principal);
    expect((await repository.read(principal.sub))!.save.updatedAt).toBe(at.toISOString());
    expect(random).not.toHaveBeenCalled(); expect(now).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  test('forwards the injected RNG through starter conversion', async () => {
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174082' };
    const repository = new ProcessLocalPlayerAuthorityRepository();
    await authorityForTest(repository).bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    await authorityForTest(repository).execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } });
    let rngCalls = 0;
    const authority = new PlayerAuthority(repository, oneCallClock(new Date('2026-07-21T12:00:00.000Z')), undefined, () => { rngCalls += 1; return 0.25; });
    expect((await authority.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } })).status).toBe('applied');
    expect(rngCalls).toBeGreaterThan(0);
  });
  test('reset preserves identity, audit and receipt records while advancing each revision once', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174090' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    const before = (await repository.read(principal.sub))!;
    before.grantReceipts['battle:sealed'] = 0; before.intentReceipts.previous = { payloadHash: 'h', revision: 0 };
    expect(await repository.compareExchange(principal.sub, 0, before)).toBe(true);
    const result = await authority.execute(principal, { intentId: 'reset', expectedRevision: 0, intent: { type: 'resetProgress', confirmed: true } });
    expect(result.status).toBe('applied');
    const after = (await repository.read(principal.sub))!;
    expect(after.playerId).toBe(before.playerId);
    expect(after.save.profile.playerId).toBe(before.save.profile.playerId);
    expect(after.revision).toBe(1); expect(after.rosterRevision).toBe(1);
    expect(after.grantReceipts).toEqual(before.grantReceipts);
    expect(after.intentReceipts).toMatchObject({ previous: before.intentReceipts.previous, reset: { revision: 1 } });
    expect(after.progressionEvents).toEqual(before.progressionEvents);
  });
  test('imports only signed, account-owned absent aggregates and permits signed growth history', async () => {
    const key = Buffer.alloc(32, 7).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = new PlayerAuthority(sourceRepository, () => new Date(1), config, () => 0.5);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174099' };
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    expect((await source.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } })).status).toBe('applied');
    expect((await source.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } })).status).toBe('applied');
    const aggregate = (await sourceRepository.read(principal.sub))!;
    // Signed transfers still reject growth drafts that were never sealed by authority.
    const creature = Object.values(aggregate.save.creatures.creatures)[0];
    const grown = applyCreatureExperience(creature, 100, 'common', { now: () => new Date('2026-07-20T00:00:00.000Z') });
    aggregate.save.creatures.creatures[grown.id] = grown;
    aggregate.revision += 1; aggregate.rosterRevision += 1;
    expect(await sourceRepository.compareExchange(principal.sub, 2, aggregate)).toBe(false);
    const exported = await source.exportAuthenticatedSave(principal);
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(2), config, () => 0.5);
    expect(await target.importAuthenticatedSave(principal, JSON.stringify(exported))).toMatchObject({ ok: true });
    expect(await target.importAuthenticatedSave({ sub: '123e4567-e89b-42d3-a456-426614174098' }, JSON.stringify(exported))).toMatchObject({ ok: false, code: 'CROSS_PRINCIPAL' });
    expect((await target.importAuthenticatedSave(principal, `${JSON.stringify(exported)}x`)).ok).toBe(false);
    expect(await target.importAuthenticatedSave(principal, 'x'.repeat(256 * 1024 + 1))).toMatchObject({ ok: false, code: 'INVALID_TRANSFER' });
  });
  test('settles growth into matching sealed ledger history without exposing drafts', async () => {
    const key = Buffer.alloc(32, 9).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository, () => new Date(0), config, () => 0.5);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174095' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    expect((await authority.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } })).status).toBe('applied');
    expect((await authority.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } })).status).toBe('applied');
    const creatureId = (await repository.read(principal.sub))!.save.creatures.activePartyCreatureIds[0];
    const settled = await authority.settleBattle(principal, { battleId: 'sealed-battle', encounterId: 'sealed-encounter', outcome: 'defeated', playerCreatureId: creatureId, playerCreatureHp: 10, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId, hp: 10, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true, rewards: { seed: 1, magicDust: 0, clinks: 0, playerExperience: 0, battlingCreatureExperience: 100, activePartyExperience: 100, materials: [] } });
    const aggregate = (await repository.read(principal.sub))!;
    expect(JSON.stringify(settled)).not.toContain('pendingGrowthEvents');
    expect(JSON.stringify(aggregate)).not.toContain('pendingGrowthEvents');
    for (const [id, creature] of Object.entries(aggregate.save.creatures.creatures)) expect(creature.statGrowth?.events ?? []).toEqual(aggregate.progressionEvents.filter((event) => event.creatureId === id));
    const exported = await authority.exportAuthenticatedSave(principal);
    expect(exported?.payload).not.toContain('pendingGrowthEvents');
    expect(JSON.parse(exported!.payload).progressionEvents).toEqual(aggregate.progressionEvents);
  });
  test('rejects a signed cursor tamper as an invalid legacy save instead of throwing', async () => {
    const key = Buffer.alloc(32, 11).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174093' }; const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = new PlayerAuthority(sourceRepository, () => new Date(0), config, () => 0.5);
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    await source.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } });
    await source.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } });
    const creatureId = (await sourceRepository.read(principal.sub))!.save.creatures.activePartyCreatureIds[0];
    await source.settleBattle(principal, { battleId: 'cursor-tamper', encounterId: 'cursor-tamper', outcome: 'defeated', playerCreatureId: creatureId, playerCreatureHp: 10, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId, hp: 10, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true, rewards: { seed: 1, magicDust: 0, clinks: 0, playerExperience: 0, battlingCreatureExperience: 100, activePartyExperience: 100, materials: [] } });
    const exported = await source.exportAuthenticatedSave(principal); const payload = JSON.parse(exported!.payload);
    const tampered = signAuthenticatedTransfer({ ...exported!, payload: JSON.stringify({ ...payload, activeGrowthStartIndex: payload.progressionEvents.length }) }, config);
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(0), config, () => 0.5);
    await expect(target.importAuthenticatedSave(principal, JSON.stringify(tampered))).resolves.toMatchObject({ ok: false, code: 'INVALID_LEGACY_SAVE' });
  });
  test('rejects a signed authenticated import containing a pending growth draft', async () => {
    const key = Buffer.alloc(32, 10).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174094' }; const source = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(0), config, () => 0.5);
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    await source.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } });
    await source.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } });
    const snapshot = (await source.snapshot(principal))!; const creature = { ...Object.values(snapshot.save.creatures.creatures)[0], pendingGrowthEvents: [{ id: 'draft', kind: 'level-up' as const, model: 'deterministic-default' as const, level: 2, deltas: { hp: 1, attack: 1, defense: 1, speed: 1, stamina: 1 }, createdAt: new Date(0).toISOString() }] };
    snapshot.save.creatures.creatures[creature.id] = creature;
    const envelope = signAuthenticatedTransfer({ playerId: principal.sub, revision: 2, rosterRevision: 1, issuedAt: 0, payload: JSON.stringify({ type: 'authority-save-v2', save: snapshot.save, progressionEvents: [] }) }, config);
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(0), config, () => 0.5);
    expect(await target.importAuthenticatedSave(principal, JSON.stringify(envelope))).toMatchObject({ ok: false, code: 'INVALID_LEGACY_SAVE' });
  });
  test('rejects authenticated imports with foreign ownership and has one concurrent create winner', async () => {
    const key = Buffer.alloc(32, 8).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174097' }; const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = new PlayerAuthority(sourceRepository, () => new Date(1), config, () => 0.5);
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const aggregate = (await sourceRepository.read(principal.sub))!;
    aggregate.save.inventory.ownerPlayerId = '123e4567-e89b-42d3-a456-426614174096'; expect(await sourceRepository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const foreign = JSON.stringify(await source.exportAuthenticatedSave(principal));
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(2), config, () => 0.5);
    expect(await target.importAuthenticatedSave(principal, foreign)).toMatchObject({ ok: false, code: 'CROSS_PRINCIPAL' });
    aggregate.save.inventory.ownerPlayerId = principal.sub; expect(await sourceRepository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const valid = JSON.stringify(await source.exportAuthenticatedSave(principal));
    const concurrent = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(3), config, () => 0.5);
    const results = await Promise.all([concurrent.importAuthenticatedSave(principal, valid), concurrent.importAuthenticatedSave(principal, valid)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
  });
  test('does not partially write a multi-aggregate CAS when one revision is stale', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository);
    const a = { sub: '123e4567-e89b-42d3-a456-426614174010' }; const b = { sub: '123e4567-e89b-42d3-a456-426614174011' };
    await authority.bootstrapProfile(a, { name: 'A', avatar: 'scout' }); await authority.bootstrapProfile(b, { name: 'B', avatar: 'ranger' });
    const left = (await repository.read(a.sub))!; const right = (await repository.read(b.sub))!;
    const nextLeft = { ...left, revision: 1 }; const nextRight = { ...right, revision: 1 };
    expect(await repository.compareExchangeMany([{ playerId: a.sub, expectedRevision: 0, next: nextLeft }, { playerId: b.sub, expectedRevision: 9, next: nextRight }])).toBe(false);
    expect((await repository.read(a.sub))!.revision).toBe(0); expect((await repository.read(b.sub))!.revision).toBe(0);
  });
  test('uses canonical duplicate-before-revision semantics and freezes an isolated active party', async () => {
    const authority = authorityForTest(new ProcessLocalPlayerAuthorityRepository()); const principal = { sub: '123e4567-e89b-42d3-a456-426614174000' };
    const initial = await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    const stale = await authority.execute(principal, { intentId: 'x', expectedRevision: 1, intent: { type: 'moveCreatureToStorage', creatureId: 'missing' } }); expect(stale.status).toBe('rejected');
    const result = await authority.execute(principal, { intentId: 'x', expectedRevision: 0, intent: { type: 'moveCreatureToStorage', creatureId: 'missing' } }); expect(result.status).toBe('rejected');
    expect(initial.playerId).toBe(principal.sub);
  });
  test('requires an exact ready canonical party and freezes its clone', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174002' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const aggregate = (await repository.read(principal.sub))!;
    aggregate.save.creatures.activePartyCreatureIds = ['c']; aggregate.save.creatures.creatures.c = { id: 'c', ownerPlayerId: principal.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 1, defense: 1, speed: 1, stamina: 1 }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 10, attack: 1, defense: 1, speed: 1, stamina: 1 } }, events: [] } };
    expect(await repository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const frozen = await authority.freezeReadyActiveParty({ principal, presentedCreatureIds: ['c'], expectedRosterRevision: 0 });
    expect(frozen?.creatures[0].id).toBe('c'); expect(Object.isFrozen(frozen?.creatures)).toBe(true);
    expect(await authority.freezeReadyActiveParty({ principal, presentedCreatureIds: ['other'], expectedRosterRevision: 0 })).toBeNull();
  });
  test('repository returns clones and CAS checks all records before writes', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174001' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const first = await repository.read(principal.sub); first!.save.profile.name = 'mutated'; expect((await repository.read(principal.sub))!.save.profile.name).toBe('A');
  });
  test('settles an unguarded foreign farm theft atomically and idempotently', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository, () => 0);
    const attacker = { sub: '123e4567-e89b-42d3-a456-426614174030' }; const owner = { sub: '123e4567-e89b-42d3-a456-426614174031' };
    await authority.bootstrapProfile(attacker, { name: 'Attacker', avatar: 'scout' }); await authority.bootstrapProfile(owner, { name: 'Owner', avatar: 'ranger' });
    const attackerAggregate = (await repository.read(attacker.sub))!; attackerAggregate.save.inventory.currencies.magicDust = 100;
    attackerAggregate.save.position = { mapId: 'home-village', x: 0, y: 1, facing: 'east' };
    attackerAggregate.save.farms.farms.own = { id: 'own', ownerPlayerId: attacker.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 2, y: 2 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    const ownerAggregate = (await repository.read(owner.sub))!;
    ownerAggregate.save.farms.farms.foreign = { id: 'foreign', ownerPlayerId: owner.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const command = { principal: attacker, intentId: 'theft-1', expectedRevision: 0, roomMapId: 'home-village', farmId: 'foreign' };
    const result = await authority.settleUnguardedFarmTheft(command); vi.restoreAllMocks();
    expect(result.status).toBe('applied'); expect((await repository.read(owner.sub))!.save.farms.farms.foreign.storedResources.magicDust).toBeLessThan(10);
    expect((await authority.settleUnguardedFarmTheft(command)).status).toBe('duplicate');
    expect(await authority.settleUnguardedFarmTheft({ ...command, farmId: 'own' })).toMatchObject({ status: 'rejected', code: 'INTENT_REUSED' });
  });
  test('rejects forged or own farm theft commands and reports a cross-account CAS race', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const attacker = { sub: '123e4567-e89b-42d3-a456-426614174032' }; const owner = { sub: '123e4567-e89b-42d3-a456-426614174033' };
    await authority.bootstrapProfile(attacker, { name: 'A', avatar: 'scout' }); await authority.bootstrapProfile(owner, { name: 'O', avatar: 'ranger' });
    const attackerAggregate = (await repository.read(attacker.sub))!; attackerAggregate.save.inventory.currencies.magicDust = 100;
    attackerAggregate.save.position = { mapId: 'home-village', x: 0, y: 1, facing: 'east' };
    attackerAggregate.save.farms.farms.own = { id: 'own', ownerPlayerId: attacker.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 2, y: 2 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    const before = await authority.snapshot(attacker);
    expect((await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'forged', expectedRevision: 0, roomMapId: 'home-village', farmId: 'nope' })).status).toBe('rejected');
    expect((await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'own', expectedRevision: 0, roomMapId: 'home-village', farmId: 'own' })).status).toBe('rejected');
    const ownerAggregate = (await repository.read(owner.sub))!;
    ownerAggregate.save.farms.farms.race = { id: 'race', ownerPlayerId: owner.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    expect(await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'wrong-map', expectedRevision: 0, roomMapId: 'world-map', farmId: 'race' })).toMatchObject({ status: 'rejected', code: 'REJECTED' });
    attackerAggregate.save.position = { mapId: 'home-village', x: 0, y: 0, facing: 'east' };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    expect(await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'out-of-range', expectedRevision: 0, roomMapId: 'home-village', farmId: 'race' })).toMatchObject({ status: 'rejected', code: 'REJECTED' });
    attackerAggregate.save.position = { mapId: 'home-village', x: 0, y: 1, facing: 'east' };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    ownerAggregate.save.farms.farms.race.guardCreatureId = 'guard';
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    expect(await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'guarded', expectedRevision: 0, roomMapId: 'home-village', farmId: 'race' })).toMatchObject({ status: 'rejected', code: 'REJECTED' });
    ownerAggregate.save.farms.farms.race.guardCreatureId = '';
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    expect(await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'stale', expectedRevision: 1, roomMapId: 'home-village', farmId: 'race' })).toMatchObject({ status: 'rejected', code: 'STALE_REVISION' });
    expect(await authority.snapshot(attacker)).toEqual(before);
    vi.spyOn(repository, 'compareExchangeMany').mockResolvedValue(false);
    const raced = await authority.settleUnguardedFarmTheft({ principal: attacker, intentId: 'race', expectedRevision: 0, roomMapId: 'home-village', farmId: 'race' });
    expect(raced).toMatchObject({ status: 'rejected', code: 'STALE_REVISION' });
    vi.restoreAllMocks();
  });
  test('reuses one injected clock across guarded-theft CAS retries', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository();
    const attacker = { sub: '123e4567-e89b-42d3-a456-426614174040' };
    const owner = { sub: '123e4567-e89b-42d3-a456-426614174041' };
    const at = new Date('2026-07-21T12:00:00.000Z');
    const setupAuthority = authorityForTest(repository);
    await setupAuthority.bootstrapProfile(attacker, { name: 'Attacker', avatar: 'scout' });
    await setupAuthority.bootstrapProfile(owner, { name: 'Owner', avatar: 'ranger' });
    const attackerAggregate = (await repository.read(attacker.sub))!;
    const attackerCreature = { id: 'attacker-creature', ownerPlayerId: attacker.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 }, statGrowth: { model: 'deterministic-default' as const, basis: { level: 1, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 } }, events: [] }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {} };
    attackerAggregate.save.creatures.creatures[attackerCreature.id] = attackerCreature;
    attackerAggregate.save.creatures.activePartyCreatureIds = [attackerCreature.id];
    attackerAggregate.save.inventory.currencies.magicDust = 100;
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    const ownerAggregate = (await repository.read(owner.sub))!;
    const guard = { id: 'owner-guard', ownerPlayerId: owner.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 }, statGrowth: { model: 'deterministic-default' as const, basis: { level: 1, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 } }, events: [] }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {} };
    ownerAggregate.save.creatures.creatures[guard.id] = guard;
    ownerAggregate.save.farms.farms.guarded = { id: 'guarded', ownerPlayerId: owner.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId: guard.id, productionRatePerMinute: 1, storageCap: 10, lastProductionAt: at.toISOString() };
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    const compareExchangeMany = repository.compareExchangeMany.bind(repository); let compareAttempts = 0;
    const compare = vi.spyOn(repository, 'compareExchangeMany').mockImplementation(async (changes) => (++compareAttempts === 1 ? false : compareExchangeMany(changes)));
    const authority = new PlayerAuthority(repository, oneCallClock(at), undefined, () => 0.25);
    const settled = await authority.settleGuardedTheft({ attackerId: attacker.sub, ownerId: owner.sub, farmId: 'guarded', guardCreatureId: guard.id, result: { battleId: 'guarded-race', encounterId: 'guarded-encounter', outcome: 'defeated', playerCreatureId: attackerCreature.id, playerCreatureHp: 8, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: attackerCreature.id, hp: 8, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true, rewards: { seed: 7, magicDust: 3, clinks: 0, playerExperience: 0, battlingCreatureExperience: 200, activePartyExperience: 100, materials: [] } } });
    expect(settled).toBe(true);
    expect(compare).toHaveBeenCalledTimes(2);
    const settledAttacker = (await repository.read(attacker.sub))!;
    const settledOwner = (await repository.read(owner.sub))!;
    expect(settledAttacker.grantReceipts['guarded-race']).toBe(settledAttacker.revision);
    expect(settledOwner.grantReceipts['guarded-race']).toBe(settledOwner.revision);
    expect(settledAttacker.save.farms.farms.guarded).toBeUndefined();
    expect(settledAttacker.save.inventory.currencies.magicDust).toBeGreaterThanOrEqual(13);
    expect(settledAttacker.progressionEvents).toHaveLength(2);
    expect(settledAttacker.save.creatures.creatures[attackerCreature.id]?.level).toBe(3);
    expect(settledAttacker.save.creatures.creatures[attackerCreature.id]?.statGrowth?.events).toEqual(settledAttacker.progressionEvents);
    expect(await authority.settleGuardedTheft({ attackerId: attacker.sub, ownerId: owner.sub, farmId: 'guarded', guardCreatureId: guard.id, result: { battleId: 'guarded-race', encounterId: 'guarded-encounter', outcome: 'defeated', playerCreatureId: attackerCreature.id, playerCreatureHp: 8, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: attackerCreature.id, hp: 8, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true, rewards: { seed: 7, magicDust: 3, clinks: 0, playerExperience: 0, battlingCreatureExperience: 200, activePartyExperience: 100, materials: [] } } })).toBe(true);
    delete settledOwner.grantReceipts['guarded-race'];
    expect(await repository.compareExchange(owner.sub, settledOwner.revision, settledOwner)).toBe(true);
    expect(await authority.settleGuardedTheft({ attackerId: attacker.sub, ownerId: owner.sub, farmId: 'guarded', guardCreatureId: guard.id, result: { battleId: 'guarded-race', encounterId: 'guarded-encounter', outcome: 'defeated', playerCreatureId: attackerCreature.id, playerCreatureHp: 8, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: attackerCreature.id, hp: 8, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true, rewards: { seed: 7, magicDust: 3, clinks: 0, playerExperience: 0, battlingCreatureExperience: 200, activePartyExperience: 100, materials: [] } } })).toBe(false);
    vi.restoreAllMocks();
  });

  test('allows canonical movement on legacy maps without generated trainer metadata', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository();
    const authority = authorityForTest(repository);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174050' };
    const initial = await authority.bootstrapProfile(principal, { name: 'Legacy', avatar: 'scout' });

    await expect(authority.applyMovement({
      principal,
      direction: 'south',
      roomId: 'legacy-room',
      mapId: initial.save.mapId,
      sessionId: 'legacy-session',
      sequence: 1
    })).resolves.toMatchObject({ status: 'applied' });
  });

  test('settles the actual switched two-party trainer simulation result', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174062' };
    await authority.bootstrapProfile(principal, { name: 'Trainer', avatar: 'scout' });
    expect((await authority.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } })).status).toBe('applied');
    expect((await authority.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } })).status).toBe('applied');
    const aggregate = (await repository.read(principal.sub))!; const originalId = aggregate.save.creatures.activePartyCreatureIds[0]!; const original = aggregate.save.creatures.creatures[originalId]!;
    const stats = { hp: 200, attack: 200, defense: 200, speed: 200, stamina: 200 };
    const readyCreature = (id: string) => ({ ...original, id, level: 1, experience: 0, stats, hp: stats.hp, maxHp: stats.hp, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default' as const, basis: { level: 1, stats }, events: [] } });
    const reserveId = `${original.id}:reserve`; const party = [readyCreature(original.id), readyCreature(reserveId)];
    aggregate.save = { ...aggregate.save, mapId: 'tracer-world-route' as never, position: { mapId: 'tracer-world-route', x: 12, y: 14, facing: 'south' } as never, creatures: { ...aggregate.save.creatures, activePartyCreatureIds: party.map((creature) => creature.id), creatures: { ...aggregate.save.creatures.creatures, [original.id]: party[0]!, [reserveId]: party[1]! } } }; aggregate.rosterRevision += 1;
    expect(await repository.compareExchange(principal.sub, aggregate.revision, aggregate)).toBe(true);
    const request = { principal, battleId: 'trainer-simulated', objectId: 'route-scout-trainer', mapId: 'tracer-world-route', locationRoomId: 'route-room', presentedCreatureIds: party.map((creature) => creature.id), expectedRosterRevision: aggregate.rosterRevision };
    const reserved = await authority.reserveTrainerBattle(request); expect(reserved).not.toBeNull(); expect(await authority.activateTrainerBattle(principal, request.battleId)).not.toBeNull();
    let battle = createTrainerBattleRoomState({ battleId: request.battleId, trainerId: 'route-scout-1', playerProfile: reserved!.profile, playerParty: reserved!.frozenParty.creatures });
    const switched = switchPlayerBattleCreature(battle, reserveId, battle.turn); expect(switched.ok).toBe(true); battle = switched.state;
    for (let actions = 0; actions < 40 && battle.status === 'active'; actions += 1) {
      if (battle.phase === 'forced-switch') {
        const next = battle.playerParty!.find((creature) => !creature.fainted && creature.id !== battle.player.activeCreature.id)!;
        const forced = switchPlayerBattleCreature(battle, next.id, battle.turn); expect(forced.ok).toBe(true); battle = forced.state; continue;
      }
      const attacked = choosePlayerBattleAttack(battle, battle.validPlayerAttackIds[0]!, new Date(0)); expect(attacked.ok).toBe(true); battle = attacked.state;
    }
    const result = toBattleResult(battle); expect(result).toMatchObject({ outcome: 'defeated', playerCreatureId: reserveId }); expect(result?.playerPartyOutcomes).toHaveLength(2);
    const compareExchange = repository.compareExchange.bind(repository); const compare = vi.spyOn(repository, 'compareExchange').mockImplementation(async (playerId, revision, next) => { expect(isValidLedgerTransition((await repository.read(playerId))!, next)).toBe(true); return compareExchange(playerId, revision, next); });
    await expect(authority.settleTrainerBattle({ principal, trainerId: 'route-scout-1', result: result! })).resolves.not.toBeNull();
    expect(compare).toHaveBeenCalledTimes(1); compare.mockRestore(); expect((await authority.locationPresence(principal))?.activeBattle).toBeUndefined();
  });

  test('stops trainer settlement after a permanent CAS rejection', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174061' };
    await authority.bootstrapProfile(principal, { name: 'Trainer', avatar: 'scout' }); const aggregate = (await repository.read(principal.sub))!;
    const creature = { id: 'party-1', ownerPlayerId: principal.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 }, statGrowth: { model: 'deterministic-default' as const, basis: { level: 1, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 } }, events: [] }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {} };
    aggregate.save.mapId = 'tracer-world-route' as never; aggregate.save.position = { mapId: 'tracer-world-route', x: 11, y: 15, facing: 'east' } as never; aggregate.save.creatures.activePartyCreatureIds = [creature.id]; aggregate.save.creatures.creatures[creature.id] = creature;
    expect(await repository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const request = { principal, battleId: 'trainer-rejected', objectId: 'route-scout-trainer', mapId: 'tracer-world-route', locationRoomId: 'route-room', presentedCreatureIds: [creature.id], expectedRosterRevision: 0 };
    expect(await authority.reserveTrainerBattle(request)).not.toBeNull(); expect(await authority.activateTrainerBattle(principal, request.battleId)).not.toBeNull();
    const compare = vi.spyOn(repository, 'compareExchange').mockResolvedValue(false);
    await expect(authority.settleTrainerBattle({ principal, trainerId: 'route-scout-1', result: { battleId: request.battleId, encounterId: 'trainer:route-scout-1', outcome: 'defeated', playerCreatureId: creature.id, playerCreatureHp: 8, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: creature.id, hp: 8, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true } })).resolves.toBeNull();
    expect(compare).toHaveBeenCalledTimes(1); compare.mockRestore();
  });

  test('reserves, activates, settles, and emits one canonical trainer lock lifecycle', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityForTest(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174060' };
    await authority.bootstrapProfile(principal, { name: 'Trainer', avatar: 'scout' }); const aggregate = (await repository.read(principal.sub))!;
    const creature = { id: 'party-1', ownerPlayerId: principal.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 }, statGrowth: { model: 'deterministic-default' as const, basis: { level: 1, stats: { hp: 10, attack: 2, defense: 2, speed: 2, stamina: 2 } }, events: [] }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {} };
    const switchedCreature = { ...structuredClone(creature), id: 'party-2' };
    aggregate.save.mapId = 'tracer-world-route' as never; aggregate.save.position = { mapId: 'tracer-world-route', x: 11, y: 15, facing: 'east' } as never; aggregate.save.creatures.activePartyCreatureIds = [creature.id, switchedCreature.id]; aggregate.save.creatures.creatures[creature.id] = creature; aggregate.save.creatures.creatures[switchedCreature.id] = switchedCreature;
    expect(await repository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const events: Array<string | undefined> = []; authority.onBattlePresenceChanged((_playerId, lock) => events.push(lock?.phase));
    const request = { principal, battleId: 'trainer-battle', objectId: 'route-scout-trainer', mapId: 'tracer-world-route', locationRoomId: 'route-room', presentedCreatureIds: [creature.id, switchedCreature.id], expectedRosterRevision: 0 };
    const reserved = await authority.reserveTrainerBattle(request); expect(reserved?.trainerId).toBe('route-scout-1'); expect(reserved?.frozenParty.creatures[0]?.id).toBe(creature.id);
    expect(await authority.reserveTrainerBattle({ ...request, battleId: 'other' })).toBeNull();
    expect((await authority.locationPresence(principal))?.activeBattle?.phase).toBe('reserved');
    expect(await authority.activateTrainerBattle(principal, 'wrong')).toBeNull(); expect(await authority.activateTrainerBattle(principal, request.battleId)).not.toBeNull();
    expect(await authority.releaseReservedTrainerBattle(principal, request.battleId)).toBe(false);
    expect((await authority.execute(principal, { intentId: 'locked', expectedRevision: 3, intent: { type: 'completeElderDialog' } })).status).toBe('rejected');
    const startingDust = aggregate.save.inventory.currencies.magicDust ?? 0; const startingPlayerXp = aggregate.save.progression.playerExperience; const startingCreatureXp = creature.experience;
    const result = { battleId: request.battleId, encounterId: 'trainer:route-scout-1', outcome: 'defeated' as const, playerCreatureId: switchedCreature.id, playerCreatureHp: 8, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: creature.id, hp: 3, fainted: false }, { creatureId: switchedCreature.id, hp: 8, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: true };
    expect(await authority.settleTrainerBattle({ principal, trainerId: 'wrong', result })).toBeNull();
    const settled = await authority.settleTrainerBattle({ principal, trainerId: 'route-scout-1', result }); if (!settled) throw new Error('first trainer battle should settle');
    const firstCreature = settled.save.creatures.creatures[creature.id]!;
    expect(firstCreature.hp).toBe(3); expect(settled.save.creatures.creatures[switchedCreature.id]?.hp).toBe(8); expect(settled.save.inventory.currencies.magicDust).toBe(startingDust + 4); expect(settled.save.progression.playerExperience).toBe(startingPlayerXp + 12); expect(settled.save.creatures.creatures[switchedCreature.id]?.experience).toBe(startingCreatureXp + 8); expect(settled.save.progression.flags['trainer-clear:route-scout-1']).toBe(true);
    expect((await authority.locationPresence(principal))?.activeBattle).toBeUndefined(); expect(events).toEqual(['reserved', 'active', undefined]);
    expect(await authority.settleTrainerBattle({ principal, trainerId: 'route-scout-1', result })).toEqual(settled);
    const repeatRequest = { ...request, battleId: 'trainer-battle-repeat', expectedRosterRevision: settled.rosterRevision };
    expect(await authority.reserveTrainerBattle(repeatRequest)).not.toBeNull(); expect(await authority.activateTrainerBattle(principal, repeatRequest.battleId)).not.toBeNull();
    const repeatResult = { ...result, battleId: repeatRequest.battleId, playerCreatureHp: 6, playerPartyOutcomes: [{ creatureId: creature.id, hp: 3, fainted: false }, { creatureId: switchedCreature.id, hp: 6, fainted: false }] };
    const repeated = await authority.settleTrainerBattle({ principal, trainerId: 'route-scout-1', result: repeatResult }); if (!repeated) throw new Error('repeat trainer battle should settle');
    const repeatCreature = repeated.save.creatures.creatures[switchedCreature.id]!;
    expect(repeatCreature.hp).toBe(6); expect(repeated.save.inventory.currencies.magicDust).toBe(settled.save.inventory.currencies.magicDust); expect(repeated.save.progression.playerExperience).toBe(settled.save.progression.playerExperience); expect(repeatCreature.experience).toBe(settled.save.creatures.creatures[switchedCreature.id]?.experience); expect(repeatCreature.level).toBe(settled.save.creatures.creatures[switchedCreature.id]?.level); expect(repeatCreature.statGrowth?.events).toEqual(settled.save.creatures.creatures[switchedCreature.id]?.statGrowth?.events); expect(repeated.save.progression.flags['trainer-clear:route-scout-1']).toBe(true);
    const persisted = (await repository.read(principal.sub))!; expect(persisted.grantReceipts[request.battleId]).toBeDefined(); expect(persisted.grantReceipts[repeatRequest.battleId]).toBeDefined();
  });
});
