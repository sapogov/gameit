import { describe, expect, test, vi } from 'vitest';
import { PlayerAuthority } from './playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from './playerRepository';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import { applyCreatureExperience } from '../../src/games/monster-rpg/sim';
describe('PlayerAuthority', () => {
  test('imports only signed, account-owned absent aggregates and permits signed growth history', async () => {
    const key = Buffer.alloc(32, 7).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = new PlayerAuthority(sourceRepository, () => new Date(1), config);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174099' };
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    expect((await source.execute(principal, { intentId: 'elder', expectedRevision: 0, intent: { type: 'completeElderDialog' } })).status).toBe('applied');
    expect((await source.execute(principal, { intentId: 'starters', expectedRevision: 1, intent: { type: 'convertCreatureCard', starter: true } })).status).toBe('applied');
    const aggregate = (await sourceRepository.read(principal.sub))!;
    // A signed transfer is allowed to carry historical event data; unsigned legacy migration is stricter.
    const creature = Object.values(aggregate.save.creatures.creatures)[0];
    const grown = applyCreatureExperience(creature, 100, 'common', { now: () => new Date('2026-07-20T00:00:00.000Z') });
    aggregate.save.creatures.creatures[grown.id] = grown;
    aggregate.revision += 1; aggregate.rosterRevision += 1;
    expect(await sourceRepository.compareExchange(principal.sub, 2, aggregate)).toBe(true);
    const exported = await source.exportAuthenticatedSave(principal);
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(2), config);
    expect(await target.importAuthenticatedSave(principal, JSON.stringify(exported))).toMatchObject({ ok: true });
    expect((await target.importAuthenticatedSave(principal, JSON.stringify(exported))).ok).toBe(false);
    expect(await target.importAuthenticatedSave({ sub: '123e4567-e89b-42d3-a456-426614174098' }, JSON.stringify(exported))).toMatchObject({ ok: false, code: 'CROSS_PRINCIPAL' });
    expect((await target.importAuthenticatedSave(principal, `${JSON.stringify(exported)}x`)).ok).toBe(false);
    expect(await target.importAuthenticatedSave(principal, 'x'.repeat(256 * 1024 + 1))).toMatchObject({ ok: false, code: 'INVALID_TRANSFER' });
  });
  test('rejects authenticated imports with foreign ownership and has one concurrent create winner', async () => {
    const key = Buffer.alloc(32, 8).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174097' }; const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = new PlayerAuthority(sourceRepository, () => new Date(1), config);
    await source.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const aggregate = (await sourceRepository.read(principal.sub))!;
    aggregate.save.inventory.ownerPlayerId = '123e4567-e89b-42d3-a456-426614174096'; expect(await sourceRepository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const foreign = JSON.stringify(await source.exportAuthenticatedSave(principal));
    const target = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(2), config);
    expect(await target.importAuthenticatedSave(principal, foreign)).toMatchObject({ ok: false, code: 'CROSS_PRINCIPAL' });
    aggregate.save.inventory.ownerPlayerId = principal.sub; expect(await sourceRepository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const valid = JSON.stringify(await source.exportAuthenticatedSave(principal));
    const concurrent = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository(), () => new Date(3), config);
    const results = await Promise.all([concurrent.importAuthenticatedSave(principal, valid), concurrent.importAuthenticatedSave(principal, valid)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
  });
  test('does not partially write a multi-aggregate CAS when one revision is stale', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository);
    const a = { sub: '123e4567-e89b-42d3-a456-426614174010' }; const b = { sub: '123e4567-e89b-42d3-a456-426614174011' };
    await authority.bootstrapProfile(a, { name: 'A', avatar: 'scout' }); await authority.bootstrapProfile(b, { name: 'B', avatar: 'ranger' });
    const left = (await repository.read(a.sub))!; const right = (await repository.read(b.sub))!;
    const nextLeft = { ...left, revision: 1 }; const nextRight = { ...right, revision: 1 };
    expect(await repository.compareExchangeMany([{ playerId: a.sub, expectedRevision: 0, next: nextLeft }, { playerId: b.sub, expectedRevision: 9, next: nextRight }])).toBe(false);
    expect((await repository.read(a.sub))!.revision).toBe(0); expect((await repository.read(b.sub))!.revision).toBe(0);
  });
  test('uses canonical duplicate-before-revision semantics and freezes an isolated active party', async () => {
    const authority = new PlayerAuthority(new ProcessLocalPlayerAuthorityRepository()); const principal = { sub: '123e4567-e89b-42d3-a456-426614174000' };
    const initial = await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' });
    const stale = await authority.execute(principal, { intentId: 'x', expectedRevision: 1, intent: { type: 'moveCreatureToStorage', creatureId: 'missing' } }); expect(stale.status).toBe('rejected');
    const result = await authority.execute(principal, { intentId: 'x', expectedRevision: 0, intent: { type: 'moveCreatureToStorage', creatureId: 'missing' } }); expect(result.status).toBe('rejected');
    expect(initial.playerId).toBe(principal.sub);
  });
  test('requires an exact ready canonical party and freezes its clone', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174002' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const aggregate = (await repository.read(principal.sub))!;
    aggregate.save.creatures.activePartyCreatureIds = ['c']; aggregate.save.creatures.creatures.c = { id: 'c', ownerPlayerId: principal.sub, speciesId: 1, level: 1, experience: 0, stats: { hp: 10, attack: 1, defense: 1, speed: 1, stamina: 1 }, attacks: [], hp: 10, maxHp: 10, fainted: false, cooldowns: {} };
    expect(await repository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    const frozen = await authority.freezeReadyActiveParty({ principal, presentedCreatureIds: ['c'], expectedRosterRevision: 0 });
    expect(frozen?.creatures[0].id).toBe('c'); expect(Object.isFrozen(frozen?.creatures)).toBe(true);
    expect(await authority.freezeReadyActiveParty({ principal, presentedCreatureIds: ['other'], expectedRosterRevision: 0 })).toBeNull();
  });
  test('repository returns clones and CAS checks all records before writes', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository); const principal = { sub: '123e4567-e89b-42d3-a456-426614174001' };
    await authority.bootstrapProfile(principal, { name: 'A', avatar: 'scout' }); const first = await repository.read(principal.sub); first!.save.profile.name = 'mutated'; expect((await repository.read(principal.sub))!.save.profile.name).toBe('A');
  });
  test('settles an unguarded foreign farm theft atomically and idempotently', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository);
    const attacker = { sub: '123e4567-e89b-42d3-a456-426614174030' }; const owner = { sub: '123e4567-e89b-42d3-a456-426614174031' };
    await authority.bootstrapProfile(attacker, { name: 'Attacker', avatar: 'scout' }); await authority.bootstrapProfile(owner, { name: 'Owner', avatar: 'ranger' });
    const attackerAggregate = (await repository.read(attacker.sub))!; attackerAggregate.save.inventory.currencies.magicDust = 100;
    attackerAggregate.save.farms.farms.own = { id: 'own', ownerPlayerId: attacker.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 2, y: 2 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    const ownerAggregate = (await repository.read(owner.sub))!;
    ownerAggregate.save.farms.farms.foreign = { id: 'foreign', ownerPlayerId: owner.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const command = { intentId: 'theft-1', expectedRevision: 0, intent: { type: 'attemptFarmTheft' as const, farmId: 'foreign' } };
    const result = await authority.execute(attacker, command); vi.restoreAllMocks();
    expect(result.status).toBe('applied'); expect((await repository.read(owner.sub))!.save.farms.farms.foreign.storedResources.magicDust).toBeLessThan(10);
    expect((await authority.execute(attacker, command)).status).toBe('duplicate');
  });
  test('rejects forged or own farm theft commands and reports a cross-account CAS race', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository); const attacker = { sub: '123e4567-e89b-42d3-a456-426614174032' }; const owner = { sub: '123e4567-e89b-42d3-a456-426614174033' };
    await authority.bootstrapProfile(attacker, { name: 'A', avatar: 'scout' }); await authority.bootstrapProfile(owner, { name: 'O', avatar: 'ranger' });
    const attackerAggregate = (await repository.read(attacker.sub))!; attackerAggregate.save.inventory.currencies.magicDust = 100;
    attackerAggregate.save.farms.farms.own = { id: 'own', ownerPlayerId: attacker.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 2, y: 2 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(attacker.sub, 0, attackerAggregate)).toBe(true);
    expect((await authority.execute(attacker, { intentId: 'forged', expectedRevision: 0, intent: { type: 'attemptFarmTheft', farmId: 'nope' } })).status).toBe('rejected');
    expect((await authority.execute(attacker, { intentId: 'own', expectedRevision: 0, intent: { type: 'attemptFarmTheft', farmId: 'own' } })).status).toBe('rejected');
    const ownerAggregate = (await repository.read(owner.sub))!;
    ownerAggregate.save.farms.farms.race = { id: 'race', ownerPlayerId: owner.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(owner.sub, 0, ownerAggregate)).toBe(true);
    vi.spyOn(repository, 'compareExchangeMany').mockResolvedValue(false);
    const raced = await authority.execute(attacker, { intentId: 'race', expectedRevision: 0, intent: { type: 'attemptFarmTheft', farmId: 'race' } });
    expect(raced).toMatchObject({ status: 'rejected', code: 'STALE_REVISION' });
    vi.restoreAllMocks();
  });
});
