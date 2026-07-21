import { afterEach, describe, expect, test, vi } from 'vitest';
import { activateTrainerBattleClaim, createBattleClaim, getBattleStateSeed, prepareTrainerBattleClaim, registerTrainerBattleClaim, removeBattleClaim } from './battleRegistry';
import { createBattleRoomState, createPlayerProfile, type CreatureSaveRecord } from '../src/games/monster-rpg/sim';

describe('wild battle claims', () => {
  test('preserve the server encounter zone into the battle reward context', () => {
    const profile = createPlayerProfile('Zone Tester', 'scout');
    const claim = createBattleClaim({
      encounterId: 'encounter-zone', locationRoomId: 'location-zone', mapId: 'world-map', playerProfile: profile,
      playerCreature: creature(profile.playerId), wildSpeciesId: 3, zoneId: 'world-north-fields'
    });
    const battle = createBattleRoomState({ ...getBattleStateSeed(claim), playerProfile: profile, playerCreature: claim.playerCreature });
    expect(battle.zoneId).toBe('world-north-fields');
    removeBattleClaim(claim.battleId);
  });
});

describe('trainer battle claims', () => {
  afterEach(() => vi.useRealTimers());

  test('releases a pending authority reservation when its unactivated claim expires', async () => {
    vi.useFakeTimers();
    const profile = createPlayerProfile('Trainer Tester', 'scout');
    const release = vi.fn().mockResolvedValue(true);
    const prepared = prepareTrainerBattleClaim();
    registerTrainerBattleClaim({
      prepared, trainerId: 'route-trainer', locationRoomId: 'location-trainer', mapId: 'world-map', playerProfile: profile,
      playerParty: [creature(profile.playerId)], releaseReservedTrainerBattle: release
    });

    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test('activating a trainer claim prevents pending cleanup from releasing its reservation', async () => {
    vi.useFakeTimers();
    const profile = createPlayerProfile('Trainer Active', 'scout');
    const release = vi.fn().mockResolvedValue(true);
    const prepared = prepareTrainerBattleClaim();
    const claim = registerTrainerBattleClaim({
      prepared, trainerId: 'route-trainer', locationRoomId: 'location-trainer', mapId: 'world-map', playerProfile: profile,
      playerParty: [creature(profile.playerId)], releaseReservedTrainerBattle: release
    });

    expect(activateTrainerBattleClaim(claim.battleId)).toBe(true);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(release).not.toHaveBeenCalled();
    removeBattleClaim(claim.battleId);
  });
});

function creature(ownerPlayerId: string): CreatureSaveRecord {
  return {
    id: 'zone-creature', ownerPlayerId, speciesId: 1, level: 1, experience: 0,
    stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 }, attacks: [], hp: 20, maxHp: 20, fainted: false, cooldowns: {}
  };
}
