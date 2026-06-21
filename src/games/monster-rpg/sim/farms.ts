import { canCreatureUseRole } from './creatureParty';
import type {
  CardRarity,
  CreationRequirement,
  FarmTheftLogEntry,
  FarmSaveRecord,
  MonsterRpgSaveState,
  VillageId,
  WorldPosition
} from './types';

export const MAGIC_DUST_FARM_TYPE = 'magic-dust';
export const MAGIC_DUST_RESOURCE_ID = 'magicDust';
export const MAGIC_DUST_FARM_ID = 'home-magic-dust-farm';
export const MAGIC_DUST_FARM_CARD_ID = 'farm-card:magic-dust-farm';
export const FARM_THEFT_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
export const FARM_THEFT_STEAL_PERCENT = 0.25;

export type FarmCollectionFailureReason = 'not-facing-farm' | 'not-owner' | 'empty';
export type FarmUpgradeFailureReason = 'missing-farm' | 'not-owner' | 'max-level' | 'missing-card' | 'missing-material';
export type FarmGuardFailureReason = 'missing-farm' | 'not-owner' | 'missing-creature' | 'creature-fainted';
export type FarmTheftFailureReason =
  | 'not-facing-farm'
  | 'owner-cannot-steal'
  | 'guarded'
  | 'cooldown'
  | 'empty'
  | 'missing-magic-dust';

export type GuardedFarmTheftResolutionFailureReason =
  | 'missing-farm'
  | 'owner-cannot-steal'
  | 'unguarded'
  | 'cooldown'
  | 'empty'
  | 'missing-magic-dust';

export type FarmCollectionResult =
  | { ok: true; state: MonsterRpgSaveState; farm: FarmSaveRecord; collectedQuantity: number }
  | { ok: false; state: MonsterRpgSaveState; reason: FarmCollectionFailureReason; farm?: FarmSaveRecord };

export type FarmUpgradeResult =
  | { ok: true; state: MonsterRpgSaveState; farm: FarmSaveRecord; plan: FarmUpgradePlan }
  | { ok: false; state: MonsterRpgSaveState; reason: FarmUpgradeFailureReason; farm?: FarmSaveRecord };

export type FarmGuardAssignmentResult =
  | { ok: true; state: MonsterRpgSaveState; farm: FarmSaveRecord }
  | { ok: false; state: MonsterRpgSaveState; reason: FarmGuardFailureReason; farm?: FarmSaveRecord };

export type FarmTheftAttemptResult =
  | {
      ok: true;
      state: MonsterRpgSaveState;
      farm: FarmSaveRecord;
      outcome: 'success' | 'failed';
      stolenQuantity: number;
      costPaid: number;
      successChance: number;
      cooldownUntil?: string;
      logEntry: FarmTheftLogEntry;
    }
  | {
      ok: false;
      state: MonsterRpgSaveState;
      reason: FarmTheftFailureReason;
      farm?: FarmSaveRecord;
      cooldownUntil?: string;
      costRequired?: number;
    };

export type GuardedFarmTheftResolutionResult =
  | {
      ok: true;
      state: MonsterRpgSaveState;
      farm: FarmSaveRecord;
      outcome: 'success' | 'failed';
      stolenQuantity: number;
      costPaid: number;
      cooldownUntil?: string;
      logEntry: FarmTheftLogEntry;
    }
  | {
      ok: false;
      state: MonsterRpgSaveState;
      reason: GuardedFarmTheftResolutionFailureReason;
      farm?: FarmSaveRecord;
      cooldownUntil?: string;
      costRequired?: number;
    };

export interface FarmCardUpgradeRequirement {
  cardDefinitionId: string;
  quantity: number;
  scope?: {
    farmType?: string;
    rarity?: CardRarity;
  };
}

export interface FarmUpgradeRequirements {
  materials: CreationRequirement[];
  farmCards: FarmCardUpgradeRequirement[];
}

export interface FarmUpgradePlan {
  fromLevel: number;
  toLevel: number;
  requirements: FarmUpgradeRequirements;
  productionRatePerMinute: number;
  storageCap: number;
}

export interface FarmUpgradePreview {
  farm: FarmSaveRecord;
  plan?: FarmUpgradePlan;
  missingMaterials: CreationRequirement[];
  missingFarmCards: FarmCardUpgradeRequirement[];
  canUpgrade: boolean;
}

export interface FarmDefinition {
  farmType: string;
  displayName: string;
  resourceId: string;
  resourceName: string;
  productionRatePerMinute: number;
  storageCap: number;
  upgradePlans: FarmUpgradePlan[];
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
    upgradePlans: [
      createMagicDustFarmUpgradePlan(1, 2, 1, 8, 2, 48),
      createMagicDustFarmUpgradePlan(2, 3, 1, 16, 3, 84),
      createMagicDustFarmUpgradePlan(3, 4, 2, 32, 4, 132),
      createMagicDustFarmUpgradePlan(4, 5, 2, 64, 6, 192)
    ],
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

export function getFarmUpgradePreview(state: MonsterRpgSaveState, farmId: string): FarmUpgradePreview | undefined {
  const farm = state.farms.farms[farmId];
  if (!farm) return undefined;

  const plan = getFarmUpgradePlan(farm);
  if (!plan) {
    return {
      farm,
      missingFarmCards: [],
      missingMaterials: [],
      canUpgrade: false
    };
  }

  const missingMaterials = plan.requirements.materials.filter(
    (requirement) => (state.inventory.currencies[requirement.materialId] ?? 0) < requirement.quantity
  );
  const missingFarmCards = plan.requirements.farmCards.filter(
    (requirement) => (state.inventory.cards[requirement.cardDefinitionId]?.quantity ?? 0) < requirement.quantity
  );

  return {
    farm,
    plan,
    missingMaterials,
    missingFarmCards,
    canUpgrade: missingMaterials.length === 0 && missingFarmCards.length === 0
  };
}

export function upgradeFarm(
  state: MonsterRpgSaveState,
  farmId: string,
  now = new Date()
): FarmUpgradeResult {
  const farm = state.farms.farms[farmId];
  if (!farm) return { ok: false, state, reason: 'missing-farm' };
  if (farm.ownerPlayerId !== state.profile.playerId) return { ok: false, state, reason: 'not-owner', farm };

  const preview = getFarmUpgradePreview(state, farmId);
  if (!preview?.plan) return { ok: false, state, reason: 'max-level', farm };
  if (preview.missingFarmCards.length > 0) return { ok: false, state, reason: 'missing-card', farm };
  if (preview.missingMaterials.length > 0) return { ok: false, state, reason: 'missing-material', farm };

  const accruedFarm = getAccruedFarmRecord(farm, now);
  const nextFarm: FarmSaveRecord = {
    ...accruedFarm,
    level: preview.plan.toLevel,
    productionRatePerMinute: preview.plan.productionRatePerMinute,
    storageCap: preview.plan.storageCap
  };

  return {
    ok: true,
    farm: nextFarm,
    plan: preview.plan,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards: consumeFarmCardRequirements(
          state.inventory.cards,
          preview.plan.requirements.farmCards,
          state.profile.playerId
        ),
        currencies: consumeMaterialRequirements(state.inventory.currencies, preview.plan.requirements.materials)
      },
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [farmId]: nextFarm
        }
      },
      updatedAt: now.toISOString()
    }
  };
}

export function assignFarmGuard(
  state: MonsterRpgSaveState,
  farmId: string,
  creatureId: string,
  now = new Date()
): FarmGuardAssignmentResult {
  const farm = state.farms.farms[farmId];
  if (!farm) return { ok: false, state, reason: 'missing-farm' };
  if (farm.ownerPlayerId !== state.profile.playerId) return { ok: false, state, reason: 'not-owner', farm };

  const creature = state.creatures.creatures[creatureId];
  if (!creature || creature.ownerPlayerId !== state.profile.playerId) {
    return { ok: false, state, reason: 'missing-creature', farm };
  }
  if (!canCreatureUseRole(creature, 'guard')) {
    return { ok: false, state, reason: 'creature-fainted', farm };
  }

  const nextFarm = {
    ...farm,
    guardCreatureId: creatureId
  };

  return {
    ok: true,
    farm: nextFarm,
    state: {
      ...state,
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [farmId]: nextFarm
        }
      },
      updatedAt: now.toISOString()
    }
  };
}

export function clearFarmGuard(
  state: MonsterRpgSaveState,
  farmId: string,
  now = new Date()
): FarmGuardAssignmentResult {
  const farm = state.farms.farms[farmId];
  if (!farm) return { ok: false, state, reason: 'missing-farm' };
  if (farm.ownerPlayerId !== state.profile.playerId) return { ok: false, state, reason: 'not-owner', farm };

  const { guardCreatureId: _guardCreatureId, ...nextFarm } = farm;

  return {
    ok: true,
    farm: nextFarm,
    state: {
      ...state,
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [farmId]: nextFarm
        }
      },
      updatedAt: now.toISOString()
    }
  };
}

export function isFarmGuardActive(state: MonsterRpgSaveState, farm: FarmSaveRecord): boolean {
  if (!farm.guardCreatureId) return false;
  return canCreatureUseRole(state.creatures.creatures[farm.guardCreatureId], 'guard');
}

function getFarmUpgradePlan(farm: FarmSaveRecord): FarmUpgradePlan | undefined {
  return getFarmDefinition(farm.farmType)?.upgradePlans.find((plan) => plan.fromLevel === farm.level);
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

export function attemptFacingFarmTheft(
  state: MonsterRpgSaveState,
  now = new Date(),
  options: { rng?: () => number; targetVillageLevel?: number } = {}
): FarmTheftAttemptResult {
  const farm = getFacingFarm(state);
  if (!farm) return { ok: false, state, reason: 'not-facing-farm' };
  if (farm.ownerPlayerId === state.profile.playerId) {
    return { ok: false, state, reason: 'owner-cannot-steal', farm };
  }

  const accruedFarm = getAccruedFarmRecord(farm, now);
  const cooldownUntil = getFarmTheftCooldown(accruedFarm, state.profile.playerId, now);
  if (cooldownUntil) return { ok: false, state, reason: 'cooldown', farm: accruedFarm, cooldownUntil };

  const storedQuantity = accruedFarm.storedResources[accruedFarm.resourceId] ?? 0;
  if (storedQuantity <= 0) return { ok: false, state, reason: 'empty', farm: accruedFarm };

  const targetVillageLevel = options.targetVillageLevel ?? getTargetVillageLevel(state, accruedFarm);
  const costRequired = getFarmTheftAttemptCost(state, targetVillageLevel);
  if ((state.inventory.currencies[MAGIC_DUST_RESOURCE_ID] ?? 0) < costRequired) {
    return { ok: false, state, reason: 'missing-magic-dust', farm: accruedFarm, costRequired };
  }
  if (isFarmGuardBlockingTheft(state, accruedFarm)) return { ok: false, state, reason: 'guarded', farm: accruedFarm };

  const successChance = getFarmTheftSuccessChance(state, targetVillageLevel);
  const succeeded = (options.rng ?? Math.random)() < successChance;
  const stolenQuantity = succeeded ? getFarmTheftStolenQuantity(storedQuantity) : 0;
  const nextCooldownUntil = succeeded ? new Date(now.getTime() + FARM_THEFT_COOLDOWN_MS).toISOString() : undefined;
  const theftCooldowns: Record<string, string> =
    succeeded && nextCooldownUntil
      ? {
          ...accruedFarm.theftCooldowns,
          [getFarmTheftCooldownKey(state.profile.playerId)]: nextCooldownUntil
        }
      : accruedFarm.theftCooldowns;
  const nextFarm: FarmSaveRecord = {
    ...accruedFarm,
    storedResources: {
      ...accruedFarm.storedResources,
      [accruedFarm.resourceId]: storedQuantity - stolenQuantity
    },
    theftCooldowns
  };
  const logEntry = createFarmTheftLogEntry({
    attackerPlayerId: state.profile.playerId,
    costPaid: costRequired,
    farm: nextFarm,
    now,
    outcome: succeeded ? 'success' : 'failed',
    stolenQuantity
  });

  return {
    ok: true,
    farm: nextFarm,
    outcome: logEntry.outcome,
    stolenQuantity,
    costPaid: costRequired,
    successChance,
    cooldownUntil: nextCooldownUntil,
    logEntry,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        currencies: {
          ...state.inventory.currencies,
          [MAGIC_DUST_RESOURCE_ID]:
            (state.inventory.currencies[MAGIC_DUST_RESOURCE_ID] ?? 0) - costRequired + stolenQuantity
        }
      },
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [nextFarm.id]: nextFarm
        },
        theftLog: [...(state.farms.theftLog ?? []), logEntry]
      },
      updatedAt: now.toISOString()
    }
  };
}

export function resolveGuardedFarmTheft(
  state: MonsterRpgSaveState,
  {
    farmId,
    guardCreatureHp,
    now = new Date(),
    playerCreatureFainted,
    playerCreatureHp,
    playerCreatureId,
    visitorWon
  }: {
    farmId: string;
    guardCreatureHp?: number;
    now?: Date;
    playerCreatureFainted: boolean;
    playerCreatureHp: number;
    playerCreatureId: string;
    visitorWon: boolean;
  }
): GuardedFarmTheftResolutionResult {
  const farm = state.farms.farms[farmId];
  if (!farm) return { ok: false, state, reason: 'missing-farm' };
  if (farm.ownerPlayerId === state.profile.playerId) {
    return { ok: false, state, reason: 'owner-cannot-steal', farm };
  }
  if (!isFarmGuardBlockingTheft(state, farm)) return { ok: false, state, reason: 'unguarded', farm };

  const accruedFarm = getAccruedFarmRecord(farm, now);
  const cooldownUntil = getFarmTheftCooldown(accruedFarm, state.profile.playerId, now);
  if (cooldownUntil) return { ok: false, state, reason: 'cooldown', farm: accruedFarm, cooldownUntil };

  const storedQuantity = accruedFarm.storedResources[accruedFarm.resourceId] ?? 0;
  if (storedQuantity <= 0) return { ok: false, state, reason: 'empty', farm: accruedFarm };

  const targetVillageLevel = getTargetVillageLevel(state, accruedFarm);
  const costRequired = getFarmTheftAttemptCost(state, targetVillageLevel);
  if ((state.inventory.currencies[MAGIC_DUST_RESOURCE_ID] ?? 0) < costRequired) {
    return { ok: false, state, reason: 'missing-magic-dust', farm: accruedFarm, costRequired };
  }

  const stolenQuantity = visitorWon ? getFarmTheftStolenQuantity(storedQuantity) : 0;
  const nextCooldownUntil = visitorWon ? new Date(now.getTime() + FARM_THEFT_COOLDOWN_MS).toISOString() : undefined;
  const theftCooldowns =
    visitorWon && nextCooldownUntil
      ? {
          ...accruedFarm.theftCooldowns,
          [getFarmTheftCooldownKey(state.profile.playerId)]: nextCooldownUntil
        }
      : accruedFarm.theftCooldowns;
  const nextFarm: FarmSaveRecord = {
    ...accruedFarm,
    storedResources: {
      ...accruedFarm.storedResources,
      [accruedFarm.resourceId]: storedQuantity - stolenQuantity
    },
    theftCooldowns
  };
  const logEntry = createFarmTheftLogEntry({
    attackerPlayerId: state.profile.playerId,
    costPaid: costRequired,
    farm: nextFarm,
    guardResult: visitorWon ? 'visitor-won' : 'visitor-lost',
    now,
    outcome: visitorWon ? 'success' : 'failed',
    stolenQuantity
  });
  const playerCreature = state.creatures.creatures[playerCreatureId];
  const guardCreature =
    farm.guardCreatureId && visitorWon ? state.creatures.creatures[farm.guardCreatureId] : undefined;

  return {
    ok: true,
    farm: nextFarm,
    outcome: logEntry.outcome,
    stolenQuantity,
    costPaid: costRequired,
    cooldownUntil: nextCooldownUntil,
    logEntry,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        currencies: {
          ...state.inventory.currencies,
          [MAGIC_DUST_RESOURCE_ID]:
            (state.inventory.currencies[MAGIC_DUST_RESOURCE_ID] ?? 0) - costRequired + stolenQuantity
        }
      },
      creatures: {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          ...(playerCreature
            ? {
                [playerCreatureId]: {
                  ...playerCreature,
                  hp: visitorWon ? Math.max(0, Math.min(playerCreature.maxHp, playerCreatureHp)) : 0,
                  fainted: visitorWon ? playerCreatureFainted || playerCreatureHp <= 0 : true
                }
              }
            : {}),
          ...(guardCreature
            ? {
                [guardCreature.id]: {
                  ...guardCreature,
                  hp: Math.max(0, Math.min(guardCreature.maxHp, guardCreatureHp ?? 0)),
                  fainted: (guardCreatureHp ?? 0) <= 0
                }
              }
            : {})
        }
      },
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [nextFarm.id]: nextFarm
        },
        theftLog: [...(state.farms.theftLog ?? []), logEntry]
      },
      updatedAt: now.toISOString()
    }
  };
}

export function getFarmTheftCooldown(
  farm: FarmSaveRecord,
  visitorPlayerId: string,
  now = new Date()
): string | undefined {
  const cooldown = farm.theftCooldowns[getFarmTheftCooldownKey(visitorPlayerId)];
  if (!cooldown) return undefined;
  return Date.parse(cooldown) > now.getTime() ? cooldown : undefined;
}

export function getFarmTheftAttemptCost(state: MonsterRpgSaveState, targetVillageLevel: number): number {
  const visitorPowerLevel = Math.max(state.progression.playerLevel, state.village.level);
  const levelGap = Math.max(0, visitorPowerLevel - Math.max(1, targetVillageLevel));
  return 1 + levelGap * 2;
}

export function getFarmTheftSuccessChance(state: MonsterRpgSaveState, targetVillageLevel: number): number {
  const visitorPowerLevel = Math.max(state.progression.playerLevel, state.village.level);
  const levelDelta = visitorPowerLevel - Math.max(1, targetVillageLevel);
  return Math.max(0.35, Math.min(0.9, 0.6 + levelDelta * 0.05));
}

export function isFarmGuardBlockingTheft(state: MonsterRpgSaveState, farm: FarmSaveRecord): boolean {
  if (!farm.guardCreatureId) return false;
  if (farm.ownerPlayerId !== state.profile.playerId && !state.creatures.creatures[farm.guardCreatureId]) return true;
  return isFarmGuardActive(state, farm);
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

function getFarmTheftCooldownKey(visitorPlayerId: string): string {
  return `visitor:${visitorPlayerId}`;
}

function getTargetVillageLevel(state: MonsterRpgSaveState, farm: FarmSaveRecord): number {
  if (farm.ownerPlayerId === state.village.ownerPlayerId && farm.mapId === state.village.id) return state.village.level;
  return farm.level;
}

function getFarmTheftStolenQuantity(storedQuantity: number): number {
  return Math.min(storedQuantity, Math.max(1, Math.floor(storedQuantity * FARM_THEFT_STEAL_PERCENT)));
}

function createFarmTheftLogEntry({
  attackerPlayerId,
  costPaid,
  farm,
  guardResult = 'unguarded',
  now,
  outcome,
  stolenQuantity
}: {
  attackerPlayerId: string;
  costPaid: number;
  farm: FarmSaveRecord;
  guardResult?: FarmTheftLogEntry['guardResult'];
  now: Date;
  outcome: 'success' | 'failed';
  stolenQuantity: number;
}): FarmTheftLogEntry {
  const attemptedAt = now.toISOString();
  return {
    id: `theft:${farm.id}:${attackerPlayerId}:${attemptedAt}`,
    farmId: farm.id,
    farmType: farm.farmType,
    villageId: farm.mapId,
    attackerPlayerId,
    defenderPlayerId: farm.ownerPlayerId,
    attemptedAt,
    outcome,
    resourceId: farm.resourceId,
    stolenQuantity,
    costPaid,
    guardResult
  };
}

function createMagicDustFarmUpgradePlan(
  fromLevel: number,
  toLevel: number,
  cardQuantity: number,
  magicDustQuantity: number,
  productionRatePerMinute: number,
  storageCap: number
): FarmUpgradePlan {
  return {
    fromLevel,
    toLevel,
    productionRatePerMinute,
    storageCap,
    requirements: {
      materials: [
        {
          materialId: MAGIC_DUST_RESOURCE_ID,
          quantity: magicDustQuantity
        }
      ],
      farmCards: [
        {
          cardDefinitionId: MAGIC_DUST_FARM_CARD_ID,
          quantity: cardQuantity,
          scope: {
            farmType: MAGIC_DUST_FARM_TYPE,
            rarity: 'uncommon'
          }
        }
      ]
    }
  };
}

function consumeMaterialRequirements(
  currencies: Record<string, number>,
  requirements: CreationRequirement[]
): Record<string, number> {
  return requirements.reduce(
    (nextCurrencies, requirement) => ({
      ...nextCurrencies,
      [requirement.materialId]: Math.max(0, (nextCurrencies[requirement.materialId] ?? 0) - requirement.quantity)
    }),
    { ...currencies }
  );
}

function consumeFarmCardRequirements(
  cards: MonsterRpgSaveState['inventory']['cards'],
  requirements: FarmCardUpgradeRequirement[],
  ownerPlayerId: string
): MonsterRpgSaveState['inventory']['cards'] {
  return requirements.reduce((nextCards, requirement) => {
    const current = nextCards[requirement.cardDefinitionId];
    if (!current) return nextCards;

    const nextQuantity = current.quantity - requirement.quantity;
    const withConsumed = { ...nextCards };
    if (nextQuantity <= 0) {
      delete withConsumed[requirement.cardDefinitionId];
    } else {
      withConsumed[requirement.cardDefinitionId] = {
        ...current,
        ownerPlayerId: current.ownerPlayerId ?? ownerPlayerId,
        quantity: nextQuantity
      };
    }
    return withConsumed;
  }, cards);
}
