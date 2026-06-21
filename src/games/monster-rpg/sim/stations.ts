import { canEnterTile, getGameMap, getMapById, getVillageDefinition, villageDefinitions } from './maps';
import type {
  MapId,
  MonsterRpgSaveState,
  StationDestination,
  StationSaveContainer,
  VillageId
} from './types';

export const STATION_TRAVEL_RESOURCE_ID = 'magicDust';
export const STATION_TRAVEL_BASE_COST = 2;
export const STATION_TRAVEL_LEVEL_DIFF_COST = 3;

export type StationTravelFailureReason =
  | 'missing-destination'
  | 'already-there'
  | 'unsafe-spawn'
  | 'missing-magic-dust';

export type StationTravelQuote =
  | { ok: true; destination: StationDestination; cost: number; resourceId: typeof STATION_TRAVEL_RESOURCE_ID }
  | {
      ok: false;
      reason: StationTravelFailureReason;
      destination?: StationDestination;
      costRequired?: number;
      resourceId: typeof STATION_TRAVEL_RESOURCE_ID;
    };

export type StationTravelResult =
  | { ok: true; state: MonsterRpgSaveState; destination: StationDestination; costPaid: number }
  | {
      ok: false;
      state: MonsterRpgSaveState;
      reason: StationTravelFailureReason;
      destination?: StationDestination;
      costRequired?: number;
    };

export function createInitialStationContainer(
  playerId: string,
  homeVillageId: VillageId
): StationSaveContainer {
  const homeDestination = createPlayerVillageStationDestination(homeVillageId, {
    ownerPlayerId: playerId,
    level: 1
  });

  return {
    ownerPlayerId: playerId,
    discoveredDestinations: {
      [homeDestination.id]: homeDestination
    }
  };
}

export function createPlayerVillageStationDestination(
  villageId: VillageId,
  options?: {
    ownerPlayerId?: string;
    level?: number;
  }
): StationDestination {
  const village = getVillageDefinition(villageId);

  return {
    id: getPlayerVillageStationDestinationId(villageId),
    kind: 'player-village',
    mapId: villageId,
    displayName: village.name,
    level: options?.level ?? getDefaultVillageStationLevel(villageId),
    ownerPlayerId: options?.ownerPlayerId ?? `village-owner:${villageId}`,
    spawn: { ...village.spawn },
    futureHooks: {
      reputationKey: `village:${villageId}:reputation`,
      guardPolicyKey: `village:${villageId}:guards`,
      banFlagKey: `village:${villageId}:ban`
    }
  };
}

export function getPlayerVillageStationDestinationId(villageId: VillageId): string {
  return `player-village:${villageId}`;
}

export function getStationDestinations(state: MonsterRpgSaveState): StationDestination[] {
  return Object.values(state.station.discoveredDestinations).sort(
    (left, right) => left.displayName.localeCompare(right.displayName) || left.id.localeCompare(right.id)
  );
}

export function discoverCurrentStationDestination(state: MonsterRpgSaveState): MonsterRpgSaveState {
  if (!isVillageId(state.mapId)) return state;
  return discoverPlayerVillageForStation(state, state.mapId);
}

export function discoverPlayerVillageForStation(
  state: MonsterRpgSaveState,
  villageId: VillageId
): MonsterRpgSaveState {
  const destination = createPlayerVillageStationDestination(villageId, {
    ownerPlayerId: villageId === state.village.id ? state.village.ownerPlayerId : undefined,
    level: villageId === state.village.id ? state.village.level : undefined
  });
  const alreadyDiscovered = Boolean(state.station.discoveredDestinations[destination.id]);
  const discoveredVillageIds = state.village.discoveredVillageIds.includes(villageId)
    ? state.village.discoveredVillageIds
    : [...state.village.discoveredVillageIds, villageId];

  if (alreadyDiscovered && discoveredVillageIds === state.village.discoveredVillageIds) return state;

  return {
    ...state,
    village: {
      ...state.village,
      discoveredVillageIds
    },
    station: alreadyDiscovered
      ? state.station
      : {
          ...state.station,
          discoveredDestinations: {
            ...state.station.discoveredDestinations,
            [destination.id]: destination
          }
        },
    updatedAt: new Date().toISOString()
  };
}

export function getStationTravelCost(currentLevel: number, targetLevel: number): number {
  return STATION_TRAVEL_BASE_COST + Math.max(0, currentLevel - targetLevel) * STATION_TRAVEL_LEVEL_DIFF_COST;
}

export function getStationContextLevel(state: MonsterRpgSaveState): number {
  const currentDestination = getStationDestinations(state).find((destination) => destination.mapId === state.mapId);
  return Math.max(state.progression.playerLevel, state.village.level, currentDestination?.level ?? 1);
}

export function quoteStationTravel(state: MonsterRpgSaveState, destinationId: string): StationTravelQuote {
  const destination = state.station.discoveredDestinations[destinationId];
  if (!destination) {
    return { ok: false, reason: 'missing-destination', resourceId: STATION_TRAVEL_RESOURCE_ID };
  }

  const cost = getStationTravelCost(getStationContextLevel(state), destination.level);
  if (state.mapId === destination.mapId) {
    return {
      ok: false,
      reason: 'already-there',
      destination,
      costRequired: cost,
      resourceId: STATION_TRAVEL_RESOURCE_ID
    };
  }

  if (!isSafeStationSpawn(destination)) {
    return {
      ok: false,
      reason: 'unsafe-spawn',
      destination,
      costRequired: cost,
      resourceId: STATION_TRAVEL_RESOURCE_ID
    };
  }

  if ((state.inventory.currencies[STATION_TRAVEL_RESOURCE_ID] ?? 0) < cost) {
    return {
      ok: false,
      reason: 'missing-magic-dust',
      destination,
      costRequired: cost,
      resourceId: STATION_TRAVEL_RESOURCE_ID
    };
  }

  return {
    ok: true,
    destination,
    cost,
    resourceId: STATION_TRAVEL_RESOURCE_ID
  };
}

export function confirmStationTravel(state: MonsterRpgSaveState, destinationId: string): StationTravelResult {
  const quote = quoteStationTravel(state, destinationId);
  if (!quote.ok) {
    return {
      ok: false,
      state,
      reason: quote.reason,
      destination: quote.destination,
      costRequired: quote.costRequired
    };
  }

  const nextState: MonsterRpgSaveState = {
    ...state,
    mapId: quote.destination.mapId,
    position: { ...quote.destination.spawn },
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        [STATION_TRAVEL_RESOURCE_ID]: state.inventory.currencies[STATION_TRAVEL_RESOURCE_ID] - quote.cost
      }
    },
    updatedAt: new Date().toISOString()
  };

  return {
    ok: true,
    state: discoverCurrentStationDestination(nextState),
    destination: quote.destination,
    costPaid: quote.cost
  };
}

export function isValidStationDestination(destination: unknown): destination is StationDestination {
  if (!destination || typeof destination !== 'object') return false;
  const candidate = destination as StationDestination;
  const map = typeof candidate.mapId === 'string' ? getMapById(candidate.mapId) : undefined;

  return (
    isNonEmptyString(candidate.id) &&
    (candidate.kind === 'player-village' || candidate.kind === 'city') &&
    Boolean(map) &&
    isNonEmptyString(candidate.displayName) &&
    Number.isSafeInteger(candidate.level) &&
    candidate.level > 0 &&
    (candidate.ownerPlayerId === undefined || isNonEmptyString(candidate.ownerPlayerId)) &&
    candidate.spawn?.mapId === candidate.mapId &&
    Number.isInteger(candidate.spawn.x) &&
    Number.isInteger(candidate.spawn.y) &&
    ['north', 'east', 'south', 'west'].includes(candidate.spawn.facing) &&
    Boolean(map && canEnterTile(map, candidate.spawn.x, candidate.spawn.y)) &&
    isValidFutureHooks(candidate.futureHooks)
  );
}

function isSafeStationSpawn(destination: StationDestination): boolean {
  const map = getGameMap(destination.mapId);
  return destination.spawn.mapId === destination.mapId && canEnterTile(map, destination.spawn.x, destination.spawn.y);
}

function isVillageId(mapId: MapId): mapId is VillageId {
  return villageDefinitions.some((village) => village.id === mapId);
}

function getDefaultVillageStationLevel(villageId: VillageId): number {
  const index = villageDefinitions.findIndex((village) => village.id === villageId);
  return Math.max(1, Math.floor(index / 2) + 1);
}

function isValidFutureHooks(value: StationDestination['futureHooks']): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return (
    (value.reputationKey === undefined || isNonEmptyString(value.reputationKey)) &&
    (value.guardPolicyKey === undefined || isNonEmptyString(value.guardPolicyKey)) &&
    (value.banFlagKey === undefined || isNonEmptyString(value.banFlagKey))
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
