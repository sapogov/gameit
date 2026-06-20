import { describe, expect, it } from 'vitest';
import {
  collectFacingFarm,
  createInitialSave,
  createPlayerProfile,
  getAccruedFarmRecord,
  getFarmUpgradePreview,
  assignFarmGuard,
  isFarmGuardActive,
  MAGIC_DUST_CURRENCY_ID,
  MAGIC_DUST_FARM_CARD_ID,
  MAGIC_DUST_FARM_ID,
  MAGIC_DUST_FARM_TYPE,
  setCreatureHp,
  upgradeFarm,
  type CreatureSaveRecord,
  createFarmSaveRecord,
  type FarmSaveRecord
} from '.';

describe('Magic Dust Farms', () => {
  it('creates a built farm with owner, plot, production rate, cap, and resource type', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const farm = createFarmSaveRecord({
      id: MAGIC_DUST_FARM_ID,
      ownerPlayerId: profile.playerId,
      farmType: MAGIC_DUST_FARM_TYPE,
      villageId: profile.homeVillageId,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    expect(farm).toMatchObject({
      id: MAGIC_DUST_FARM_ID,
      ownerPlayerId: profile.playerId,
      farmType: MAGIC_DUST_FARM_TYPE,
      resourceId: MAGIC_DUST_CURRENCY_ID,
      mapId: 'home-village',
      position: { mapId: 'home-village', x: 24, y: 16 },
      productionRatePerMinute: 1,
      storageCap: 24,
      storedResources: { [MAGIC_DUST_CURRENCY_ID]: 0 },
      lastProductionAt: '2026-06-20T12:00:00.000Z'
    });
  });

  it('accrues production over time up to the storage cap', () => {
    const farm = createFarm({
      stored: 3,
      storageCap: 10,
      productionRatePerMinute: 2,
      lastProductionAt: '2026-06-20T12:00:00.000Z'
    });

    const accrued = getAccruedFarmRecord(farm, new Date('2026-06-20T12:05:30.000Z'));

    expect(accrued.storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(10);
    expect(accrued.lastProductionAt).toBe('2026-06-20T12:05:30.000Z');
  });

  it('collects only when the owner is adjacent and facing the farm', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, stored: 4 }));
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const collected = collectFacingFarm(adjacent, new Date('2026-06-20T12:05:00.000Z'));

    expect(collected.ok).toBe(true);
    if (!collected.ok) throw new Error(collected.reason);
    expect(collected.collectedQuantity).toBe(9);
    expect(collected.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(collected.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(0);
  });

  it('rejects collection when not facing a farm or when the farm is empty', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId }));
    const notFacing = collectFacingFarm(state);
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };
    const empty = collectFacingFarm(adjacent, new Date('2026-06-20T12:00:20.000Z'));

    expect(notFacing.ok).toBe(false);
    if (notFacing.ok) throw new Error('Expected collection failure');
    expect(notFacing.reason).toBe('not-facing-farm');
    expect(empty.ok).toBe(false);
    if (empty.ok) throw new Error('Expected empty farm failure');
    expect(empty.reason).toBe('empty');
  });

  it('upgrades a farm by consuming matching Farm Cards and materials', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, stored: 4 }));
    const stocked = {
      ...state,
      inventory: {
        ...state.inventory,
        currencies: { [MAGIC_DUST_CURRENCY_ID]: 12 },
        cards: {
          [MAGIC_DUST_FARM_CARD_ID]: {
            id: MAGIC_DUST_FARM_CARD_ID,
            ownerPlayerId: profile.playerId,
            quantity: 1
          }
        }
      }
    };

    const upgraded = upgradeFarm(stocked, MAGIC_DUST_FARM_ID, new Date('2026-06-20T12:03:00.000Z'));

    expect(upgraded.ok).toBe(true);
    if (!upgraded.ok) throw new Error(upgraded.reason);
    expect(upgraded.farm.level).toBe(2);
    expect(upgraded.farm.productionRatePerMinute).toBe(2);
    expect(upgraded.farm.storageCap).toBe(48);
    expect(upgraded.farm.storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(7);
    expect(upgraded.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(4);
    expect(upgraded.state.inventory.cards[MAGIC_DUST_FARM_CARD_ID]).toBeUndefined();
  });

  it('exposes farm upgrade requirements before confirming', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId }));

    const preview = getFarmUpgradePreview(state, MAGIC_DUST_FARM_ID);

    expect(preview?.plan?.toLevel).toBe(2);
    expect(preview?.plan?.requirements.materials).toEqual([{ materialId: MAGIC_DUST_CURRENCY_ID, quantity: 8 }]);
    expect(preview?.plan?.requirements.farmCards).toEqual([
      {
        cardDefinitionId: MAGIC_DUST_FARM_CARD_ID,
        quantity: 1,
        scope: { farmType: MAGIC_DUST_FARM_TYPE, rarity: 'uncommon' }
      }
    ]);
    expect(preview?.canUpgrade).toBe(false);
    expect(preview?.missingMaterials).toHaveLength(1);
    expect(preview?.missingFarmCards).toHaveLength(1);
  });

  it('assigns only non-fainted owned Creatures as farm guards', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const readyCreature = createCreature({ id: 'creature-ready', ownerPlayerId: profile.playerId });
    const faintedCreature = createCreature({
      id: 'creature-fainted',
      ownerPlayerId: profile.playerId,
      hp: 0,
      fainted: true
    });
    const state = withCreature(
      withCreature(withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId })), readyCreature),
      faintedCreature
    );

    const rejected = assignFarmGuard(state, MAGIC_DUST_FARM_ID, faintedCreature.id);
    const assigned = assignFarmGuard(state, MAGIC_DUST_FARM_ID, readyCreature.id);

    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('Expected fainted guard rejection');
    expect(rejected.reason).toBe('creature-fainted');
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) throw new Error(assigned.reason);
    expect(assigned.farm.guardCreatureId).toBe(readyCreature.id);
    expect(isFarmGuardActive(assigned.state, assigned.farm)).toBe(true);
  });

  it('keeps a fainted assigned guard persisted but inactive for theft checks', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const guard = createCreature({ id: 'guard-1', ownerPlayerId: profile.playerId });
    const state = withCreature(
      withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, guardCreatureId: guard.id })),
      guard
    );

    const fainted = setCreatureHp(state, guard.id, 0);

    expect(fainted.ok).toBe(true);
    if (!fainted.ok) throw new Error(fainted.reason);
    const farm = fainted.state.farms.farms[MAGIC_DUST_FARM_ID];
    expect(farm.guardCreatureId).toBe(guard.id);
    expect(isFarmGuardActive(fainted.state, farm)).toBe(false);
  });
});

function createFarm(overrides: Partial<FarmSaveRecord> & { stored?: number } = {}): FarmSaveRecord {
  const { stored: storedOverride, ...farmOverrides } = overrides;
  const ownerPlayerId = overrides.ownerPlayerId ?? 'player-1';
  const stored = storedOverride ?? 0;

  return {
    id: MAGIC_DUST_FARM_ID,
    ownerPlayerId,
    farmType: MAGIC_DUST_FARM_TYPE,
    resourceId: MAGIC_DUST_CURRENCY_ID,
    level: 1,
    mapId: 'home-village',
    position: { mapId: 'home-village', x: 24, y: 16 },
    productionRatePerMinute: 1,
    storageCap: 24,
    storedResources: { [MAGIC_DUST_CURRENCY_ID]: stored },
    lastProductionAt: '2026-06-20T12:00:00.000Z',
    theftCooldowns: {},
    ...farmOverrides
  };
}

function withFarm(state: ReturnType<typeof createInitialSave>, farm: FarmSaveRecord) {
  return {
    ...state,
    farms: {
      ...state.farms,
      farms: {
        [farm.id]: farm
      }
    }
  };
}

function withCreature(state: ReturnType<typeof createInitialSave>, creature: CreatureSaveRecord) {
  return {
    ...state,
    creatures: {
      ...state.creatures,
      activePartyCreatureIds: [...state.creatures.activePartyCreatureIds, creature.id],
      creatures: {
        ...state.creatures.creatures,
        [creature.id]: creature
      }
    }
  };
}

function createCreature(overrides: Partial<CreatureSaveRecord> = {}): CreatureSaveRecord {
  return {
    id: 'creature-1',
    ownerPlayerId: 'player-1',
    speciesId: 1,
    level: 1,
    experience: 0,
    stats: { hp: 10, attack: 4, defense: 4, speed: 4, stamina: 4 },
    attacks: [
      { id: 'attack-1', name: 'Tackle', type: 'verdant', power: 4, statFocus: 'attack' },
      { id: 'attack-2', name: 'Brace', type: 'stone', power: 3, statFocus: 'defense' },
      { id: 'attack-3', name: 'Dash', type: 'gale', power: 3, statFocus: 'speed' },
      { id: 'attack-4', name: 'Pulse', type: 'lumen', power: 3, statFocus: 'stamina' }
    ],
    hp: 10,
    maxHp: 10,
    fainted: false,
    cooldowns: {},
    ...overrides
  };
}
