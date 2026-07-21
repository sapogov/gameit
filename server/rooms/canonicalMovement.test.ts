import { describe, expect, test, vi } from 'vitest';
import { createPlayerProfile } from '../../src/games/monster-rpg/sim';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import { PlayerAuthority } from '../authority/playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from '../authority/playerRepository';
import { playerAuthority } from '../authority/runtime';
import { markBattleClaimResolved, removeBattleClaim } from '../battleRegistry';
import { LocationRoom, resolveCanonicalJoinPosition } from './LocationRoom';

const foreignFarm = (guardCreatureId = '') => ({ id: 'foreign', ownerPlayerId: 'owner', farmType: 'magic-dust' as const, resourceId: 'magicDust', mapId: 'home-village' as const, position: { mapId: 'home-village' as const, x: 1, y: 1 }, level: 1, storedResources: { magicDust: 10 }, theftCooldowns: {}, guardCreatureId, productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() });

const principal = (suffix: string) => ({ sub: `123e4567-e89b-42d3-a456-426614174${suffix}` });
const authorityFor = (repository: ProcessLocalPlayerAuthorityRepository, transferKeys?: ReturnType<typeof loadGuestCredentialConfig>) => new PlayerAuthority(repository, () => new Date(0), transferKeys, () => 0.5);
const move = (authority: PlayerAuthority, user: { sub: string }, direction: 'north' | 'east' | 'south' | 'west', mapId: 'home-village' | 'world-map', sequence = 1, sessionId = 'movement-session', roomId = 'movement-room') => authority.applyMovement({ principal: user, direction, mapId, sequence, sessionId, roomId });

async function at(authority: PlayerAuthority, repository: ProcessLocalPlayerAuthorityRepository, user: { sub: string }, mapId: 'home-village' | 'world-map', x: number, y: number, facing: 'north' | 'east' | 'south' | 'west' = 'east') {
  await authority.bootstrapProfile(user, { name: 'Mover', avatar: 'scout' });
  const aggregate = (await repository.read(user.sub))!;
  aggregate.save.mapId = mapId;
  aggregate.save.position = { mapId, x, y, facing };
  expect(await repository.compareExchange(user.sub, 0, aggregate)).toBe(true);
}

describe('canonical location movement', () => {
  test('persists normal, blocked, and transition movement only through canonical authority', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository);
    const normal = principal('201'); await at(authority, repository, normal, 'home-village', 27, 10);
    const moved = await move(authority, normal, 'east', 'home-village');
    expect(moved).toMatchObject({ status: 'applied', snapshot: { revision: 1, save: { position: { mapId: 'home-village', x: 28, y: 10, facing: 'east' } } } });

    const blocked = principal('202'); await at(authority, repository, blocked, 'world-map', 61, 3, 'south');
    const blockedResult = await move(authority, blocked, 'east', 'world-map');
    expect(blockedResult).toMatchObject({ status: 'applied', snapshot: { revision: 1, save: { position: { mapId: 'world-map', x: 61, y: 3, facing: 'east' } } } });

    const transition = principal('203'); await at(authority, repository, transition, 'home-village', 28, 10);
    const transitioned = await move(authority, transition, 'east', 'home-village');
    expect(transitioned).toMatchObject({ status: 'applied', transition: { toMapId: 'world-map' }, snapshot: { save: { position: { mapId: 'world-map' } } } });
  });

  test('rejects unknown principal and stale map context without mutation, and retries a CAS race', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository);
    expect((await move(authority, principal('204'), 'east', 'home-village')).status).toBe('rejected');
    const user = principal('205'); await at(authority, repository, user, 'home-village', 27, 10);
    expect((await move(authority, user, 'east', 'world-map')).status).toBe('rejected');
    expect((await authority.snapshot(user))?.revision).toBe(0);
    const original = repository.compareExchange.bind(repository); let attempts = 0;
    vi.spyOn(repository, 'compareExchange').mockImplementation(async (...args) => (++attempts === 1 ? false : original(...args)));
    const result = await move(authority, user, 'east', 'home-village');
    expect(attempts).toBe(2); expect(result.status === 'applied' && result.snapshot.revision).toBe(1);
  });

  test('supplies the real room/session identifiers while authority rejects replayed sequences', async () => {
    const apply = vi.spyOn(playerAuthority, 'applyMovement');
    const client = { sessionId: 'session-a', send: vi.fn() };
    const room = { roomId: 'room-a', mapId: 'home-village', state: { players: new Map() } };
    const handler = (LocationRoom.prototype as unknown as { handleMoveIntent: (client: unknown, payload: unknown) => Promise<void> }).handleMoveIntent;
    await handler.call(room, client, { direction: 'east', sequence: 5 });
    expect(apply).not.toHaveBeenCalled(); expect(client.send).not.toHaveBeenCalled();
    const player = { profile: { id: 'player-a' }, position: {} };
    room.state.players.set('session-a', player);
    apply.mockResolvedValue({ status: 'applied', snapshot: { save: { position: { mapId: 'home-village', x: 28, y: 10, facing: 'east' } } } } as never);
    await handler.call(room, client, { direction: 'east', sequence: 1 });
    await handler.call(room, client, { direction: 'east', sequence: 1 });
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenLastCalledWith({ principal: { sub: 'player-a' }, direction: 'east', roomId: 'room-a', mapId: 'home-village', sessionId: 'session-a', sequence: 1 });
    apply.mockRestore();
  });

  test('atomically consumes exact sequences, including blocked moves, and rejects gaps or tuple changes', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository); const user = principal('208');
    await at(authority, repository, user, 'world-map', 61, 3, 'south');
    const first = await move(authority, user, 'east', 'world-map', 1, 'session-208', 'room-208');
    expect(first).toMatchObject({ status: 'applied', snapshot: { revision: 1 } });
    expect((await move(authority, user, 'east', 'world-map', 1, 'session-208', 'room-208')).status).toBe('rejected');
    expect((await move(authority, user, 'east', 'world-map', 3, 'session-208', 'room-208')).status).toBe('rejected');
    expect((await move(authority, user, 'east', 'world-map', 2, 'session-208', 'other-room')).status).toBe('rejected');
    expect((await move(authority, user, 'east', 'home-village', 2, 'session-208', 'room-208')).status).toBe('rejected');
    const second = await move(authority, user, 'east', 'world-map', 2, 'session-208', 'room-208');
    expect(second).toMatchObject({ status: 'applied', snapshot: { revision: 2 } });
  });

  test('reconnect and authenticated transfer expose the current canonical position', async () => {
    const key = Buffer.alloc(32, 9).toString('base64url'); const keys = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = authorityFor(sourceRepository, keys); const user = principal('206');
    await at(source, sourceRepository, user, 'home-village', 27, 10);
    const moved = await move(source, user, 'east', 'home-village');
    if (moved.status !== 'applied') throw new Error('movement should apply');
    const profile = createPlayerProfile('Mover', 'scout'); profile.playerId = user.sub;
    expect(resolveCanonicalJoinPosition(undefined, moved!.snapshot.save.position, profile, 'home-village')).toEqual(moved!.snapshot.save.position);
    const target = authorityFor(new ProcessLocalPlayerAuthorityRepository(), keys);
    expect(await target.importAuthenticatedSave(user, JSON.stringify(await source.exportAuthenticatedSave(user)))).toMatchObject({ ok: true, snapshot: { save: { position: moved!.snapshot.save.position } } });
  });

  test('fans canonical settlement presence snapshots to every connected session of the principal', () => {
    const first = { sessionId: 'session-first', send: vi.fn() };
    const second = { sessionId: 'session-second', send: vi.fn() };
    const other = { sessionId: 'session-other', send: vi.fn() };
    const room = {
      clients: [first, second, other],
      state: { players: new Map([
        ['session-first', { profile: { id: 'player' }, connected: true, inBattle: true, battleId: 'battle-1' }],
        ['session-second', { profile: { id: 'player' }, connected: true, inBattle: true, battleId: 'battle-1' }],
        ['session-other', { profile: { id: 'other' }, connected: true, inBattle: false, battleId: '' }]
      ]) }
    };
    const snapshot = { playerId: 'player', revision: 7, rosterRevision: 2, save: {} };
    const sync = (LocationRoom.prototype as unknown as { syncBattlePresence: (playerId: string, activeBattle: undefined, snapshot: unknown) => void }).syncBattlePresence;

    sync.call(room, 'player', undefined, snapshot);

    expect(room.state.players.get('session-first')).toMatchObject({ inBattle: false, battleId: '' });
    expect(room.state.players.get('session-second')).toMatchObject({ inBattle: false, battleId: '' });
    expect(first.send).toHaveBeenCalledWith('authoritySnapshot', snapshot);
    expect(second.send).toHaveBeenCalledWith('authoritySnapshot', snapshot);
    expect(other.send).not.toHaveBeenCalled();
  });

  test('rejects a direct room join when the canonical position is bound to another map', () => {
    const profile = createPlayerProfile('Mover', 'scout');
    const canonicalPosition = { mapId: 'home-village' as const, x: 27, y: 10, facing: 'east' as const };

    expect(() => resolveCanonicalJoinPosition(undefined, canonicalPosition, profile, 'world-map')).toThrow('Canonical position is bound to a different map');
  });

  test('rejects a direct room join from an invalid canonical tile', () => {
    const profile = createPlayerProfile('Mover', 'scout');
    const canonicalPosition = { mapId: 'home-village' as const, x: -1, y: 10, facing: 'east' as const };

    expect(() => resolveCanonicalJoinPosition(undefined, canonicalPosition, profile, 'home-village')).toThrow('Invalid canonical position');
  });

  test('leaves the pushed canonical revision usable by the next Account command', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository); const user = principal('207');
    await at(authority, repository, user, 'home-village', 27, 10);
    const moved = await move(authority, user, 'east', 'home-village');
    if (moved.status !== 'applied') throw new Error('movement should apply');
    const next = await authority.execute(user, { intentId: 'after-move', expectedRevision: moved!.snapshot.revision, intent: { type: 'completeElderDialog' } });
    expect(next).toMatchObject({ status: 'applied', snapshot: { revision: 2 } });
  });

  test('routes empty-guard farms to canonical unguarded theft while guarded claims still require a guard', async () => {
    const client = { sessionId: 'session-a', send: vi.fn() };
    const player = { profile: { id: 'attacker' }, position: { mapId: 'home-village', x: 0, y: 1, facing: 'east' } };
    const room = { mapId: 'home-village', state: { players: new Map([['session-a', player]]) }, loadForeignFarm: (LocationRoom.prototype as unknown as { loadForeignFarm: (client: unknown, farmId: string) => unknown }).loadForeignFarm };
    const findFarm = vi.spyOn(playerAuthority, 'findFarm').mockResolvedValue({ playerId: 'owner', farm: foreignFarm() } as never);
    const settleUnguarded = vi.spyOn(playerAuthority, 'settleUnguardedFarmTheft').mockResolvedValue({ status: 'applied', snapshot: { revision: 4 } } as never);
    const attempt = (LocationRoom.prototype as unknown as { handleAttemptFarmTheft: (client: unknown, payload: unknown) => Promise<void> }).handleAttemptFarmTheft;
    await attempt.call(room, client, { farmId: 'foreign', intentId: 'theft-1', expectedRevision: 3 });
    expect(settleUnguarded).toHaveBeenCalledWith(expect.objectContaining({ farmId: 'foreign', expectedRevision: 3 }));
    expect(client.send).toHaveBeenLastCalledWith('farmTheftResult', expect.objectContaining({ status: 'applied', snapshot: { revision: 4 } }));

    const guarded = (LocationRoom.prototype as unknown as { handleClaimGuardedFarmTheft: (client: unknown, payload: unknown) => Promise<void> }).handleClaimGuardedFarmTheft;
    const frozen = vi.fn().mockResolvedValue({ creatures: [{ id: 'attacker-creature' }] });
    const guardedRoom = { ...room, freezeClaimParty: frozen, battleResultCleanups: new Map(), finalizedBattleIds: new Set(), finalizeBattleResult: vi.fn() };
    await guarded.call(guardedRoom, client, { farmId: 'foreign', activePartyCreatureIds: ['attacker-creature'], expectedRosterRevision: 0 });
    expect(client.send).toHaveBeenLastCalledWith('guardedFarmTheftClaimRejected', { farmId: 'foreign', reason: 'unguarded' });

    findFarm.mockResolvedValue({ playerId: 'owner', farm: foreignFarm('guard') } as never);
    const ownerSnapshot = vi.spyOn(playerAuthority, 'snapshot')
      .mockResolvedValueOnce({ save: { creatures: { creatures: { guard: { id: 'guard', ownerPlayerId: 'owner', hp: 10, maxHp: 10, fainted: false, stats: {}, attacks: [], cooldowns: {} } } } } } as never)
      .mockResolvedValueOnce({ revision: 6 } as never);
    const settleGuarded = vi.spyOn(playerAuthority, 'settleGuardedTheft').mockResolvedValue(true);
    await guarded.call(guardedRoom, client, { farmId: 'foreign', activePartyCreatureIds: ['attacker-creature'], expectedRosterRevision: 0 });
    expect(client.send).toHaveBeenLastCalledWith('guardedFarmTheftClaimed', expect.objectContaining({ farmId: 'foreign' }));
    const guardedCalls = (client.send as ReturnType<typeof vi.fn>).mock.calls;
    const guardedClaim = guardedCalls[guardedCalls.length - 1]![1];
    markBattleClaimResolved({ battleId: guardedClaim.battleId, encounterId: 'guard-theft:foreign', outcome: 'defeated', playerCreatureId: 'attacker-creature', playerCreatureHp: 1, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: 'attacker-creature', hp: 1, fainted: false }], opponentCreatureHp: 0, opponentCreatureFainted: true, rewardGranted: false, rewards: { seed: 0, magicDust: 0, clinks: 0, playerExperience: 0, battlingCreatureExperience: 0, activePartyExperience: 0, materials: [] } });
    await vi.waitFor(() => expect(client.send).toHaveBeenCalledWith('authoritySnapshot', { revision: 6 }));
    const guardedOrder = (client.send as ReturnType<typeof vi.fn>).mock.invocationCallOrder;
    expect(guardedOrder[guardedOrder.length - 1]).toBeLessThan(guardedRoom.finalizeBattleResult.mock.invocationCallOrder[0]);
    removeBattleClaim(guardedClaim.battleId);
    findFarm.mockRestore(); settleUnguarded.mockRestore(); ownerSnapshot.mockRestore(); settleGuarded.mockRestore();
  });

  test('publishes a terminal wild settlement snapshot before finalizing the room battle', async () => {
    const client = { sessionId: 'session-wild', send: vi.fn() };
    const player = { profile: { id: 'attacker', name: 'Attacker', avatar: 'scout' }, position: { mapId: 'home-village', x: 0, y: 0, facing: 'east' }, inBattle: false, battleId: '' };
    const encounter = { id: 'encounter', zoneId: 'zone', mapId: 'home-village', speciesId: 1, x: 1, y: 0, status: 'available', claimedByPlayerId: '', respawnAt: '' };
    const finalizeBattleResult = vi.fn();
    const room = { roomId: 'location', mapId: 'home-village', state: { players: new Map([['session-wild', player]]), encounters: new Map([['encounter', encounter]]) }, encounterCooldowns: new Map(), freezeClaimParty: vi.fn().mockResolvedValue({ creatures: [{ id: 'attacker-creature' }] }), battleResultCleanups: new Map(), finalizedBattleIds: new Set(), finalizeBattleResult, scheduleEncounterTimer: vi.fn() };
    const settleBattle = vi.spyOn(playerAuthority, 'settleBattle').mockResolvedValue({ revision: 5 } as never);
    const handler = (LocationRoom.prototype as unknown as { handleClaimWildEncounter: (client: unknown, payload: unknown) => Promise<void> }).handleClaimWildEncounter;
    await handler.call(room, client, { encounterId: 'encounter', activePartyCreatureIds: ['attacker-creature'], expectedRosterRevision: 0 });
    const calls = (client.send as ReturnType<typeof vi.fn>).mock.calls;
    const claim = calls[calls.length - 1]![1];
    markBattleClaimResolved({ battleId: claim.battleId, encounterId: 'encounter', outcome: 'lost', playerCreatureId: 'attacker-creature', playerCreatureHp: 1, playerCreatureFainted: false, playerPartyOutcomes: [{ creatureId: 'attacker-creature', hp: 1, fainted: false }], opponentCreatureHp: 1, opponentCreatureFainted: false, rewardGranted: false, rewards: { seed: 0, magicDust: 0, clinks: 0, playerExperience: 0, battlingCreatureExperience: 0, activePartyExperience: 0, materials: [] } });
    await vi.waitFor(() => expect(client.send).toHaveBeenCalledWith('authoritySnapshot', { revision: 5 }));
    const callOrder = (client.send as ReturnType<typeof vi.fn>).mock.invocationCallOrder;
    expect(callOrder[callOrder.length - 1]).toBeLessThan(finalizeBattleResult.mock.invocationCallOrder[0]);
    removeBattleClaim(claim.battleId); settleBattle.mockRestore();
  });
});
