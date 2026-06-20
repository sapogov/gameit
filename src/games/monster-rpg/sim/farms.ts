import type { FarmSaveRecord, MonsterRpgSaveState, VillageId, WorldPosition } from './types';

export const MAGIC_DUST_FARM_TYPE = 'magic-dust';
export const MAGIC_DUST_RESOURCE_ID = 'magicDust';
export const MAGIC_DUST_FARM_ID = 'home-magic-dust-farm';

export type FarmCollectionFailureReason = 'not-facing-farm' | 'not-owner' | 'empty';

export type FarmCollectionResult =
  | { ok: true; state: MonsterRpgSaveState; farm: FarmSaveRecord; collectedQuantity: number }
  | { ok: false; state: MonsterRpgSaveState; reason: FarmCollectionFailureReason; farm?: FarmSaveRecord };

export interface FarmDefinition {
  farmType: string;
  displayName: string;
  resourceId: string;
  resourceName: string;
  productionRatePerMinute: number;
  storageCap: number;
  plotByVillage: Record<VillageId, { x: number; y: number }>;
}

const farmDefinitions: Record<string, FarmDefinition> = {
  [MAGIC_DUST_FARM_TYPE]: {
    farmType: MAGIC_DUST_FARM_TYPE,
    displayName: 'Magic Dust Farm',
    resourceId: MAGIC_DUST_RESOURCE_ID,
    resourceName: 'Magic Dust',
    productionRatePerMinute: 1,
    storageCap: 24,
    plotByVillage: {
      'home-village': { x: 24, y: 16 },
      'brookhaven-village': { x: 24, y: 16 },
      'cedar-grove-village': { x: 24, y: 16 },
      'sunfield-village': { x: 24, y: 16 },
      'stoneford-village': { x: 24, y: 16 },
      'mistfall-village': { x: 24, y: 16 },
      'emberwick-village': { x: 24, y: 16 },
      'northwatch-village': { x: 24, y: 16 }
    }
  }
};

export function getFarmDefinition(farmType: string): FarmDefinition | undefined {
  return farmDefinitions[farmType];
}

export function createFarmSaveRecord({
  farmType,
  id,
  now = new Date(),
  ownerPlayerId,
  villageId
}: {
  farmType: string;
  id: string;
  now?: Date;
  ownerPlayerId: string;
  villageId: VillageId;
}): FarmSaveRecord {
  const definition = getFarmDefinition(farmType);
  if (!definition) throw new Error(`Unknown farm type "${farmType}"`);
  const plot = definition.plotByVillage[villageId];

  return {
    id,
    ownerPlayerId,
    farmType,
    resourceId: definition.resourceId,
    level: 1,
    mapId: villageId,
    position: {
      mapId: villageId,
      x: plot.x,
      y: plot.y
    },
    productionRatePerMinute: definition.productionRatePerMinute,
    storageCap: definition.storageCap,
    storedResources: {
      [definition.resourceId]: 0
    },
    lastProductionAt: now.toISOString(),
    theftCooldowns: {}
  };
}

export function getAccruedFarmRecord(farm: FarmSaveRecord, now = new Date()): FarmSaveRecord {
  const resourceId = farm.resourceId;
  const currentStored = farm.storedResources[resourceId] ?? 0;
  const cap = Math.max(0, farm.storageCap);
  if (currentStored >= cap || farm.productionRatePerMinute <= 0) {
    return {
      ...farm,
      storedResources: {
        ...farm.storedResources,
        [resourceId]: Math.min(currentStored, cap)
      }
    };
  }

  const lastProductionTime = new Date(farm.lastProductionAt).getTime();
  const nowTime = now.getTime();
  const elapsedMs = Math.max(0, nowTime - lastProductionTime);
  const msPerResource = 60_000 / farm.productionRatePerMinute;
  const produced = Math.floor(elapsedMs / msPerResource);
  if (produced <= 0) return farm;

  const nextStored = Math.min(cap, currentStored + produced);
  const consumedProductionMs = (nextStored - currentStored) * msPerResource;

  return {
    ...farm,
    storedResources: {
      ...farm.storedResources,
      [resourceId]: nextStored
    },
    lastProductionAt:
      nextStored >= cap ? now.toISOString() : new Date(lastProductionTime + consumedProductionMs).toISOString()
  };
}

export function getFarmStoredQuantity(farm: FarmSaveRecord, now = new Date()): number {
  const accrued = getAccruedFarmRecord(farm, now);
  return accrued.storedResources[accrued.resourceId] ?? 0;
}

export function collectFacingFarm(state: MonsterRpgSaveState, now = new Date()): FarmCollectionResult {
  const farm = getFacingFarm(state);
  if (!farm) return { ok: false, state, reason: 'not-facing-farm' };
  if (farm.ownerPlayerId !== state.profile.playerId) return { ok: false, state, reason: 'not-owner', farm };

  const accruedFarm = getAccruedFarmRecord(farm, now);
  const resourceId = accruedFarm.resourceId;
  const collectedQuantity = accruedFarm.storedResources[resourceId] ?? 0;
  if (collectedQuantity <= 0) return { ok: false, state, reason: 'empty', farm: accruedFarm };

  const nextFarm: FarmSaveRecord = {
    ...accruedFarm,
    storedResources: {
      ...accruedFarm.storedResources,
      [resourceId]: 0
    },
    lastProductionAt: now.toISOString()
  };

  return {
    ok: true,
    farm: nextFarm,
    collectedQuantity,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        currencies: {
          ...state.inventory.currencies,
          [resourceId]: (state.inventory.currencies[resourceId] ?? 0) + collectedQuantity
        }
      },
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [nextFarm.id]: nextFarm
        }
      },
      updatedAt: now.toISOString()
    }
  };
}

export function getFacingFarm(state: MonsterRpgSaveState): FarmSaveRecord | undefined {
  const target = getFacingPosition(state.position);

  return Object.values(state.farms.farms).find(
    (farm) => farm.position.mapId === target.mapId && farm.position.x === target.x && farm.position.y === target.y
  );
}

function getFacingPosition(position: WorldPosition): Pick<WorldPosition, 'mapId' | 'x' | 'y'> {
  const deltaByDirection = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  } as const;
  const delta = deltaByDirection[position.facing];

  return {
    mapId: position.mapId,
    x: position.x + delta.x,
    y: position.y + delta.y
  };
}
