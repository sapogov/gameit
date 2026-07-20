import { describe, expect, test } from 'vitest';
import { createBattleClaim, getBattleStateSeed, removeBattleClaim } from './battleRegistry';
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

function creature(ownerPlayerId: string): CreatureSaveRecord {
  return {
    id: 'zone-creature', ownerPlayerId, speciesId: 1, level: 1, experience: 0,
    stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 }, attacks: [], hp: 20, maxHp: 20, fainted: false, cooldowns: {}
  };
}
