import { describe, expect, test } from 'vitest';
import { CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG, validateGameBalanceConfig } from './gameBalance';
import { WILD_ENCOUNTER_RESPAWN_MS } from './wildEncounters';
import { ACTIVE_PARTY_LIMIT, REVIVE_ITEM_RESTORE_RATIO, STARTING_REVIVE_ITEM_QUANTITY } from './creatureParty';
import { BATTLE_BASE_RUN_CHANCE, BATTLE_DISCONNECT_GRACE_MS, BATTLE_FATIGUE_RECOVERY_FLOOR, BATTLE_RUN_ATTEMPT_BONUS } from './battles';
import { BATTLE_REWARD_DIRECT_EGG_CHANCE, BATTLE_REWARD_MAGIC_DUST_BASE, BATTLE_REWARD_MATERIAL_CHANCE, BATTLE_REWARD_PACK_CHANCE } from './battleRewards';
import { CARD_PACK_SIZE } from './cards';
import { STATION_TRAVEL_BASE_COST, STATION_TRAVEL_LEVEL_DIFF_COST } from './stations';
import { createInitialSave, createPlayerProfile } from './saveState';

describe('game balance config', () => {
  test('provides every approved immutable balance section at v1', () => {
    expect(GAME_BALANCE_CONFIG.version).toBe(CURRENT_BALANCE_VERSION);
    expect(Object.isFrozen(GAME_BALANCE_CONFIG)).toBe(true);
    expect(Object.values(GAME_BALANCE_CONFIG).filter((value) => typeof value === 'object').every(Object.isFrozen)).toBe(true);
    expect(Object.keys(GAME_BALANCE_CONFIG)).toEqual([
      'version', 'creatures', 'battles', 'items', 'inventory', 'chests', 'rewards', 'economy', 'maps'
    ]);
    expect(validateGameBalanceConfig()).toEqual([]);
  });

  test('reports actionable validation issues for missing and invalid sections', () => {
    expect(validateGameBalanceConfig({ version: 1, creatures: { activePartyLimit: 1, reviveRestoreRatio: 2 } })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'creatures.reviveRestoreRatio' }),
        expect.objectContaining({ path: 'battles.disconnectGraceMs', message: 'must be a finite number' })
      ])
    );
  });

  test('validates every required property and cross-field rule', () => {
    const requiredPaths = [
      'creatures.activePartyLimit', 'creatures.reviveRestoreRatio', 'battles.disconnectGraceMs',
      'battles.fatigueRecoveryFloor', 'battles.baseRunChance', 'battles.runAttemptBonus',
      'items.startingReviveQuantity', 'inventory.startingMagicDust', 'chests.cardPackSize',
      'rewards.battleMagicDustBase', 'rewards.battlePackChance', 'rewards.battleDirectEggChance',
      'rewards.battleMaterialChance', 'economy.stationTravelBaseCost', 'economy.stationTravelLevelDiffCost',
      'maps.transitionTokenTtlMs', 'maps.wildEncounterRespawnMs'
    ];
    for (const path of requiredPaths) {
      const invalid = structuredClone(GAME_BALANCE_CONFIG) as Record<string, any>;
      const [section, property] = path.split('.');
      delete invalid[section][property];
      expect(validateGameBalanceConfig(invalid)).toEqual(expect.arrayContaining([expect.objectContaining({ path })]));
    }
    const invalidCrossField = structuredClone(GAME_BALANCE_CONFIG) as any;
    invalidCrossField.maps.transitionTokenTtlMs = invalidCrossField.maps.wildEncounterRespawnMs + 1;
    expect(validateGameBalanceConfig(invalidCrossField)).toContainEqual({ path: 'maps.transitionTokenTtlMs', message: 'must not exceed maps.wildEncounterRespawnMs' });
  });

  test('exports configured values consumed by their runtime domains', () => {
    expect(WILD_ENCOUNTER_RESPAWN_MS).toBe(GAME_BALANCE_CONFIG.maps.wildEncounterRespawnMs);
    expect(ACTIVE_PARTY_LIMIT).toBe(GAME_BALANCE_CONFIG.creatures.activePartyLimit);
    expect(REVIVE_ITEM_RESTORE_RATIO).toBe(GAME_BALANCE_CONFIG.creatures.reviveRestoreRatio);
    expect(STARTING_REVIVE_ITEM_QUANTITY).toBe(GAME_BALANCE_CONFIG.items.startingReviveQuantity);
    expect(BATTLE_DISCONNECT_GRACE_MS).toBe(GAME_BALANCE_CONFIG.battles.disconnectGraceMs);
    expect(BATTLE_FATIGUE_RECOVERY_FLOOR).toBe(GAME_BALANCE_CONFIG.battles.fatigueRecoveryFloor);
    expect(BATTLE_BASE_RUN_CHANCE).toBe(GAME_BALANCE_CONFIG.battles.baseRunChance);
    expect(BATTLE_RUN_ATTEMPT_BONUS).toBe(GAME_BALANCE_CONFIG.battles.runAttemptBonus);
    expect(BATTLE_REWARD_MAGIC_DUST_BASE).toBe(GAME_BALANCE_CONFIG.rewards.battleMagicDustBase);
    expect(BATTLE_REWARD_PACK_CHANCE).toBe(GAME_BALANCE_CONFIG.rewards.battlePackChance);
    expect(BATTLE_REWARD_DIRECT_EGG_CHANCE).toBe(GAME_BALANCE_CONFIG.rewards.battleDirectEggChance);
    expect(BATTLE_REWARD_MATERIAL_CHANCE).toBe(GAME_BALANCE_CONFIG.rewards.battleMaterialChance);
    expect(CARD_PACK_SIZE).toBe(GAME_BALANCE_CONFIG.chests.cardPackSize);
    expect(STATION_TRAVEL_BASE_COST).toBe(GAME_BALANCE_CONFIG.economy.stationTravelBaseCost);
    expect(STATION_TRAVEL_LEVEL_DIFF_COST).toBe(GAME_BALANCE_CONFIG.economy.stationTravelLevelDiffCost);
    expect(createInitialSave(createPlayerProfile('Balance', 'scout')).inventory.currencies.magicDust).toBe(GAME_BALANCE_CONFIG.inventory.startingMagicDust);
  });
});
