import { describe, expect, it } from 'vitest';
import {
  collectFacingFarm,
  createInitialSave,
  createPlayerProfile,
  getAccruedFarmRecord,
  MAGIC_DUST_CURRENCY_ID,
  MAGIC_DUST_FARM_ID,
  MAGIC_DUST_FARM_TYPE,
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
