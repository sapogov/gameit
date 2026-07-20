import type {
  AvatarId,
  CreationRequirement,
  CreatureSaveContainer,
  CreatureAttackRecord,
  CreatureCardInstance,
  CreatureSaveRecord,
  CreatureStatKey,
  EggSaveRecord,
  FarmPosition,
  FarmSaveContainer,
  FarmSaveRecord,
  FarmTheftLogEntry,
  InventorySaveContainer,
  JournalSaveContainer,
  JournalSpeciesState,
  MonsterRpgSaveState,
  PlayerProfile,
  ProgressionSaveContainer,
  SaveStack,
  StationSaveContainer,
  VillageSaveContainer
} from './types';
import { canEnterTile, getMapById, homeVillageMap, isMapId, villageDefinitions } from './maps';
import { creatureTypes, isKnownSpeciesId } from './speciesCatalog';
import { cardRarities } from './cards';
import { isValidCreatureContainerLayout, REVIVE_ITEM_ID, STARTING_REVIVE_ITEM_QUANTITY } from './creatureParty';
import { createInitialStationContainer, isValidStationDestination } from './stations';
import { CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG } from './gameBalance';
import { createItemInventory } from './inventory';
import { createRewardInbox, isValidRewardBundle, isValidRewardSourceId } from './rewardInbox';
import { getItemDefinition, isItemId } from './items';

export const MONSTER_RPG_PROFILE_KEY = 'gameit.monsterRpg.profile';
export const MONSTER_RPG_SAVE_KEY = 'gameit.monsterRpg.save';
export const MONSTER_RPG_SCHEMA_VERSION = 9;

export type SaveImportResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; reason: 'invalid-json' | 'unsupported-schema' | 'invalid-save' | 'unsupported-balance-version' | 'missing-balance-migration' };

export type SaveBalanceMigrationResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; reason: 'unsupported-balance-version' | 'missing-balance-migration' | 'invalid-save' };

export type SaveBalanceMigrationFailure = Extract<SaveBalanceMigrationResult, { ok: false }>;
export type SaveLoadResult = { ok: true; state: MonsterRpgSaveState | null } | SaveBalanceMigrationFailure;

export interface MonsterRpgSaveRepository {
  loadProfile: () => PlayerProfile | null;
  loadSave: () => SaveLoadResult;
  save: (state: MonsterRpgSaveState) => void;
  clear: () => void;
  exportSave: (state: MonsterRpgSaveState) => string;
  importPayload: (payload: string) => SaveImportResult;
}

const validVillageIds = new Set(villageDefinitions.map((village) => village.id));
const validJournalStates = new Set<JournalSpeciesState>(['silhouette', 'discovered']);
const validCardRarities = new Set<string>(cardRarities);
const validCreatureTypes = new Set<string>(creatureTypes);
const validStatKeys = new Set<CreatureStatKey>(['hp', 'attack', 'defense', 'speed', 'stamina']);

export const localMonsterRpgSaveRepository: MonsterRpgSaveRepository = {
  loadProfile() {
    const profile = readJson<PlayerProfile>(MONSTER_RPG_PROFILE_KEY);
    if (profile && isValidProfile(profile)) return profile;

    localStorage.removeItem(MONSTER_RPG_PROFILE_KEY);
    return null;
  },
  loadSave() {
    const state = readJson<unknown>(MONSTER_RPG_SAVE_KEY);
    const migrated = migrateSaveBalance(state);
    if (state === null) return { ok: true, state: null };
    return migrated.ok ? { ok: true, state: migrated.state } : migrated;
  },
  save(state) {
    localStorage.setItem(MONSTER_RPG_PROFILE_KEY, JSON.stringify(state.profile));
    localStorage.setItem(MONSTER_RPG_SAVE_KEY, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(MONSTER_RPG_PROFILE_KEY);
    localStorage.removeItem(MONSTER_RPG_SAVE_KEY);
  },
  exportSave(state) {
    return JSON.stringify(state, null, 2);
  },
  importPayload(payload) {
    return parseSavePayload(payload);
  }
};

export function createPlayerProfile(name: string, avatar: AvatarId): PlayerProfile {
  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    playerId: crypto.randomUUID(),
    name: name.trim(),
    avatar,
    homeVillageId: 'home-village'
  };
}

export function createInitialSave(profile: PlayerProfile): MonsterRpgSaveState {
  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    balanceVersion: CURRENT_BALANCE_VERSION,
    profile,
    position: { ...homeVillageMap.spawn },
    mapId: homeVillageMap.id,
    ...createEmptySaveContainers(profile.playerId, profile.homeVillageId),
    updatedAt: new Date().toISOString()
  };
}

export function loadProfile(): PlayerProfile | null {
  return localMonsterRpgSaveRepository.loadProfile();
}

export function loadSave(): SaveLoadResult { return localMonsterRpgSaveRepository.loadSave(); }

export const loadSaveResult = loadSave;

export function saveProgress(state: MonsterRpgSaveState): void {
  localMonsterRpgSaveRepository.save(state);
}

export function exportSave(state: MonsterRpgSaveState): string {
  return localMonsterRpgSaveRepository.exportSave(state);
}

export function importSavePayload(payload: string): SaveImportResult {
  return localMonsterRpgSaveRepository.importPayload(payload);
}

export function clearProgress(): void {
  localMonsterRpgSaveRepository.clear();
}

function createEmptySaveContainers(playerId: string, homeVillageId: PlayerProfile['homeVillageId']) {
  return {
    inventory: {
      ownerPlayerId: playerId,
      currencies: { magicDust: GAME_BALANCE_CONFIG.inventory.startingMagicDust, clinks: GAME_BALANCE_CONFIG.inventory.startingClinks },
      items: {
        [REVIVE_ITEM_ID]: {
          id: REVIVE_ITEM_ID,
          ownerPlayerId: playerId,
          quantity: STARTING_REVIVE_ITEM_QUANTITY
        }
      },
      cards: {},
      creatureCards: {},
      eggs: {},
      itemInventory: createItemInventory(),
      rewardInbox: createRewardInbox(playerId)
    },
    creatures: {
      ownerPlayerId: playerId,
      activePartyCreatureIds: [],
      storedCreatureIds: [],
      creatures: {}
    },
    village: {
      id: homeVillageId,
      ownerPlayerId: playerId,
      level: 1,
      discoveredVillageIds: [homeVillageId]
    },
    station: createInitialStationContainer(playerId, homeVillageId),
    farms: {
      ownerPlayerId: playerId,
      farms: {},
      theftLog: []
    },
    journal: {
      ownerPlayerId: playerId,
      species: {}
    },
    progression: {
      ownerPlayerId: playerId,
      playerLevel: 1,
      playerExperience: 0,
      flags: {},
      completedQuestIds: [],
      claimedLevelRewardIds: [],
      unlockedPlayerSkillIds: [],
      activeCardBuffs: {}
    }
  };
}

function parseSavePayload(payload: string): SaveImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }

  if (hasUnsupportedSchemaVersion(parsed)) return { ok: false, reason: 'unsupported-schema' };
  const migrated = migrateSaveBalance(parsed);
  if (!migrated.ok) return migrated;

  return migrated;
}

export function migrateSaveBalance(input: unknown): SaveBalanceMigrationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, reason: 'invalid-save' };
  const source = input as Record<string, unknown>;
  const version = source.balanceVersion === undefined ? 0 : source.balanceVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0 || version > CURRENT_BALANCE_VERSION) {
    return { ok: false, reason: 'unsupported-balance-version' };
  }
  if (version < 2 && !hasValidLegacyCurrencies(source)) return { ok: false, reason: 'invalid-save' };
  let candidate: Record<string, unknown>;
  try {
    candidate = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: 'invalid-save' };
  }
  const migrations: Record<number, (save: Record<string, unknown>) => Record<string, unknown>> = {
    0: (save) => ({ ...save, balanceVersion: 1 }),
    1: migrateBalanceV1ToV2
  };
  let working = candidate;
  for (let current = version; current < CURRENT_BALANCE_VERSION; current += 1) {
    const migrate = migrations[current];
    if (!migrate) return { ok: false, reason: 'missing-balance-migration' };
    working = migrate(working);
  }
  if (!isValidSaveState(working)) return { ok: false, reason: 'invalid-save' };
  return { ok: true, state: working };
}

function migrateBalanceV1ToV2(save: Record<string, unknown>): Record<string, unknown> {
  const profile = save.profile;
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return { ...save, balanceVersion: 2 };
  const playerId = (profile as { playerId?: unknown }).playerId;
  if (typeof playerId !== 'string') return { ...save, balanceVersion: 2 };
  const inventory = save.inventory && typeof save.inventory === 'object' && !Array.isArray(save.inventory)
    ? save.inventory as Record<string, unknown>
    : {};
  const currencies = inventory.currencies && typeof inventory.currencies === 'object' && !Array.isArray(inventory.currencies)
    ? inventory.currencies as Record<string, unknown>
    : {};
  const itemInventory = Object.prototype.hasOwnProperty.call(inventory, 'itemInventory')
    ? inventory.itemInventory
    : createItemInventory();
  const rewardInbox = Object.prototype.hasOwnProperty.call(inventory, 'rewardInbox')
    ? inventory.rewardInbox
    : createRewardInbox(playerId);
  return {
    ...save,
    balanceVersion: 2,
    inventory: {
      ...inventory,
      currencies: { ...currencies, clinks: Number(currencies.clinks ?? 0) },
      itemInventory,
      rewardInbox
    }
  };
}

function hasValidLegacyCurrencies(save: Record<string, unknown>): boolean {
  if (!isPlainObject(save.inventory)) return false;
  const inventory = save.inventory;
  if (!isPlainObject(inventory.currencies)) return false;
  const currencies = inventory.currencies;
  if (!Object.prototype.hasOwnProperty.call(currencies, 'clinks')) return true;
  return typeof currencies.clinks === 'number' && Number.isSafeInteger(currencies.clinks) && currencies.clinks >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function isValidProfile(profile: unknown): profile is PlayerProfile {
  if (!profile || typeof profile !== 'object') return false;
  const candidate = profile as PlayerProfile;

  return (
    candidate.schemaVersion === MONSTER_RPG_SCHEMA_VERSION &&
    typeof candidate.playerId === 'string' &&
    candidate.playerId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    isAvatarId(candidate.avatar) &&
    candidate.homeVillageId === homeVillageMap.id
  );
}

function isValidSaveState(state: unknown): state is MonsterRpgSaveState {
  if (!state || typeof state !== 'object') return false;
  const candidate = state as MonsterRpgSaveState;
  const map = getMapById(candidate.position?.mapId);
  if (!map) return false;
  const playerId = candidate.profile?.playerId;

  return (
    candidate.schemaVersion === MONSTER_RPG_SCHEMA_VERSION &&
    candidate.balanceVersion === CURRENT_BALANCE_VERSION &&
    isValidProfile(candidate.profile) &&
    isMapId(candidate.mapId) &&
    candidate.mapId === candidate.position.mapId &&
    Number.isInteger(candidate.position.x) &&
    Number.isInteger(candidate.position.y) &&
    canEnterTile(map, candidate.position.x, candidate.position.y) &&
    ['north', 'east', 'south', 'west'].includes(candidate.position.facing) &&
    isValidInventory(candidate.inventory, playerId) &&
    isValidCreatures(candidate.creatures, playerId) &&
    isValidVillage(candidate.village, candidate.profile) &&
    isValidStation(candidate.station, playerId) &&
    isValidFarms(candidate.farms, playerId, candidate.creatures) &&
    isValidJournal(candidate.journal, playerId) &&
    isValidProgression(candidate.progression, playerId) &&
    isIsoDate(candidate.updatedAt)
  );
}

function isValidInventory(inventory: unknown, playerId: string): inventory is InventorySaveContainer {
  if (!inventory || typeof inventory !== 'object') return false;
  const candidate = inventory as InventorySaveContainer;

  return (
    candidate.ownerPlayerId === playerId &&
    isQuantityRecord(candidate.currencies) &&
    isStackRecord(candidate.items, playerId) &&
    isValidItemInventory(candidate.itemInventory) &&
    isValidRewardInbox(candidate.rewardInbox, playerId) &&
    isStackRecord(candidate.cards, playerId) &&
    isCreatureCardRecord(candidate.creatureCards, playerId) &&
    isEggRecord(candidate.eggs, playerId)
  );
}

function isValidItemInventory(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const stacks = (value as { stacks?: unknown }).stacks;
  if (!stacks || typeof stacks !== 'object' || Array.isArray(stacks) || Object.keys(stacks).length > 150) return false;
  return Object.entries(stacks).every(([id, stack]) => {
    if (!stack || typeof stack !== 'object') return false;
    const candidate = stack as { id?: unknown; itemId?: unknown; quantity?: unknown };
    const definition = isItemId(candidate.itemId) ? getItemDefinition(candidate.itemId) : undefined;
    return candidate.id === id && definition !== undefined && isNonNegativeInteger(candidate.quantity) && candidate.quantity > 0 && candidate.quantity <= definition.maxStack;
  });
}

function isValidRewardInbox(value: unknown, playerId: string): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as { ownerPlayerId?: unknown; bundles?: unknown; claimedSourceIds?: unknown };
  if (candidate.ownerPlayerId !== playerId || !isRecord(candidate.bundles) || Object.keys(candidate.bundles).length > 50 || !isRecord(candidate.claimedSourceIds)) return false;
  const claimedSourcesAreValid = Object.entries(candidate.claimedSourceIds).every(([sourceId, claimed]) => isValidRewardSourceId(sourceId) && claimed === true);
  if (!claimedSourcesAreValid) return false;
  return Object.entries(candidate.bundles).every(([sourceId, bundle]) => isValidRewardBundle(bundle, sourceId, playerId) && !Object.prototype.hasOwnProperty.call(candidate.claimedSourceIds, sourceId));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isCreatureCardRecord(value: unknown, playerId: string): value is Record<string, CreatureCardInstance> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(
    ([id, card]) =>
      id === card.id &&
      isNonEmptyString(card.id) &&
      card.ownerPlayerId === playerId &&
      isNonEmptyString(card.cardDefinitionId) &&
      Number.isSafeInteger(card.speciesId) &&
      isKnownSpeciesId(card.speciesId) &&
      validCardRarities.has(card.rarity) &&
      isValidStats(card.stats) &&
      Array.isArray(card.knownAttacks) &&
      card.knownAttacks.length === 2 &&
      card.knownAttacks.every(isValidAttackRecord)
  );
}

function isEggRecord(value: unknown, playerId: string): value is Record<string, EggSaveRecord> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(
    ([id, egg]) =>
      id === egg.id &&
      isNonEmptyString(egg.id) &&
      egg.ownerPlayerId === playerId &&
      Number.isSafeInteger(egg.speciesId) &&
      isKnownSpeciesId(egg.speciesId) &&
      validCardRarities.has(egg.rarity) &&
      (egg.origin === 'card' || egg.origin === 'direct-drop') &&
      Array.isArray(egg.requirements) &&
      egg.requirements.every(isValidCreationRequirement) &&
      isIsoDate(egg.createdAt) &&
      (egg.stats === undefined || isValidStats(egg.stats)) &&
      (egg.inheritedAttacks === undefined ||
        (Array.isArray(egg.inheritedAttacks) &&
          egg.inheritedAttacks.length === 2 &&
          egg.inheritedAttacks.every(isValidAttackRecord)))
  );
}

function isValidCreatures(creatures: unknown, playerId: string): creatures is CreatureSaveContainer {
  if (!creatures || typeof creatures !== 'object') return false;
  const candidate = creatures as CreatureSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!isUniqueStringArray(candidate.activePartyCreatureIds) || !isUniqueStringArray(candidate.storedCreatureIds)) return false;

  const records = candidate.creatures;
  if (!records || typeof records !== 'object' || Array.isArray(records)) return false;
  return (
    isValidCreatureContainerLayout(candidate) &&
    Object.entries(records).every(([id, record]) => id === record.id && isValidCreatureRecord(record, playerId))
  );
}

function isValidCreatureRecord(record: unknown, playerId: string): record is CreatureSaveRecord {
  if (!record || typeof record !== 'object') return false;
  const candidate = record as CreatureSaveRecord;

  return (
    isNonEmptyString(candidate.id) &&
    candidate.ownerPlayerId === playerId &&
    Number.isSafeInteger(candidate.speciesId) &&
    isKnownSpeciesId(candidate.speciesId) &&
    isNonNegativeInteger(candidate.level) &&
    candidate.level > 0 &&
    isNonNegativeInteger(candidate.experience) &&
    isValidStats(candidate.stats) &&
    Array.isArray(candidate.attacks) &&
    candidate.attacks.length === 4 &&
    candidate.attacks.every(isValidAttackRecord) &&
    isNonNegativeInteger(candidate.hp) &&
    isNonNegativeInteger(candidate.maxHp) &&
    candidate.maxHp > 0 &&
    candidate.hp <= candidate.maxHp &&
    typeof candidate.fainted === 'boolean' &&
    candidate.fainted === (candidate.hp === 0) &&
    isCooldownRecord(candidate.cooldowns)
  );
}

function isValidVillage(village: unknown, profile: PlayerProfile): village is VillageSaveContainer {
  if (!village || typeof village !== 'object') return false;
  const candidate = village as VillageSaveContainer;

  return (
    candidate.id === profile.homeVillageId &&
    candidate.ownerPlayerId === profile.playerId &&
    isNonNegativeInteger(candidate.level) &&
    candidate.level > 0 &&
    isUniqueStringArray(candidate.discoveredVillageIds) &&
    candidate.discoveredVillageIds.every((id) => validVillageIds.has(id as PlayerProfile['homeVillageId']))
  );
}

function isValidStation(station: unknown, playerId: string): station is StationSaveContainer {
  if (!station || typeof station !== 'object') return false;
  const candidate = station as StationSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!candidate.discoveredDestinations || typeof candidate.discoveredDestinations !== 'object') return false;
  if (Array.isArray(candidate.discoveredDestinations)) return false;

  return Object.entries(candidate.discoveredDestinations).every(
    ([id, destination]) => isValidStationDestination(destination) && id === destination.id
  );
}

function isValidFarms(
  farms: unknown,
  playerId: string,
  creatures: CreatureSaveContainer
): farms is FarmSaveContainer {
  if (!farms || typeof farms !== 'object') return false;
  const candidate = farms as FarmSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!candidate.farms || typeof candidate.farms !== 'object' || Array.isArray(candidate.farms)) return false;

  return Object.entries(candidate.farms).every(
    ([id, farm]) => id === farm.id && isValidFarmRecord(farm, playerId, creatures)
  ) && isFarmTheftLog(candidate.theftLog);
}

function isValidFarmRecord(
  record: unknown,
  playerId: string,
  creatures: CreatureSaveContainer
): record is FarmSaveRecord {
  if (!record || typeof record !== 'object') return false;
  const candidate = record as FarmSaveRecord;

  return (
    isNonEmptyString(candidate.id) &&
    candidate.ownerPlayerId === playerId &&
    isNonEmptyString(candidate.farmType) &&
    isNonEmptyString(candidate.resourceId) &&
    isNonNegativeInteger(candidate.level) &&
    candidate.level > 0 &&
    validVillageIds.has(candidate.mapId) &&
    isValidFarmPosition(candidate.position, candidate.mapId) &&
    isPositiveFiniteNumber(candidate.productionRatePerMinute) &&
    isNonNegativeInteger(candidate.storageCap) &&
    candidate.storageCap > 0 &&
    isQuantityRecord(candidate.storedResources) &&
    Object.prototype.hasOwnProperty.call(candidate.storedResources, candidate.resourceId) &&
    candidate.storedResources[candidate.resourceId] <= candidate.storageCap &&
    isIsoDate(candidate.lastProductionAt) &&
    (candidate.guardCreatureId === undefined ||
      (isNonEmptyString(candidate.guardCreatureId) &&
        (candidate.ownerPlayerId !== playerId ||
          creatures.creatures[candidate.guardCreatureId]?.ownerPlayerId === playerId))) &&
    (candidate.collectCooldownUntil === undefined || isIsoDate(candidate.collectCooldownUntil)) &&
    isCooldownRecord(candidate.theftCooldowns)
  );
}

function isFarmTheftLog(value: unknown): value is FarmTheftLogEntry[] | undefined {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;

  return value.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const candidate = entry as FarmTheftLogEntry;

    return (
      isNonEmptyString(candidate.id) &&
      isNonEmptyString(candidate.farmId) &&
      isNonEmptyString(candidate.farmType) &&
      validVillageIds.has(candidate.villageId) &&
      isNonEmptyString(candidate.attackerPlayerId) &&
      isNonEmptyString(candidate.defenderPlayerId) &&
      isIsoDate(candidate.attemptedAt) &&
      (candidate.outcome === 'success' || candidate.outcome === 'failed') &&
      isNonEmptyString(candidate.resourceId) &&
      isNonNegativeInteger(candidate.stolenQuantity) &&
      isNonNegativeInteger(candidate.costPaid) &&
      candidate.costPaid > 0 &&
      (candidate.guardResult === 'unguarded' ||
        candidate.guardResult === 'visitor-won' ||
        candidate.guardResult === 'visitor-lost')
    );
  });
}

function isValidFarmPosition(position: unknown, mapId: FarmSaveRecord['mapId']): position is FarmPosition {
  if (!position || typeof position !== 'object') return false;
  const candidate = position as FarmPosition;

  return (
    candidate.mapId === mapId &&
    Number.isInteger(candidate.x) &&
    Number.isInteger(candidate.y) &&
    candidate.x >= 0 &&
    candidate.y >= 0
  );
}

function isValidJournal(journal: unknown, playerId: string): journal is JournalSaveContainer {
  if (!journal || typeof journal !== 'object') return false;
  const candidate = journal as JournalSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!candidate.species || typeof candidate.species !== 'object' || Array.isArray(candidate.species)) return false;

  return Object.entries(candidate.species).every(
    ([speciesId, state]) =>
      isNumericRecordKey(speciesId) &&
      isKnownSpeciesId(Number(speciesId)) &&
      validJournalStates.has(state as JournalSpeciesState)
  );
}

function isValidProgression(progression: unknown, playerId: string): progression is ProgressionSaveContainer {
  if (!progression || typeof progression !== 'object') return false;
  const candidate = progression as ProgressionSaveContainer;

  return (
    candidate.ownerPlayerId === playerId &&
    isNonNegativeInteger(candidate.playerLevel) &&
    candidate.playerLevel > 0 &&
    isNonNegativeInteger(candidate.playerExperience) &&
    isBooleanRecord(candidate.flags) &&
    isUniqueStringArray(candidate.completedQuestIds) &&
    isUniqueStringArray(candidate.claimedLevelRewardIds) &&
    isUniqueStringArray(candidate.unlockedPlayerSkillIds) &&
    isCardBuffRecord(candidate.activeCardBuffs)
  );
}

function isCardBuffRecord(value: unknown): value is ProgressionSaveContainer['activeCardBuffs'] {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(
    ([buffType, cardId]) =>
      (buffType === 'battle' || buffType === 'drop-chance') && isNonEmptyString(cardId)
  );
}

function hasUnsupportedSchemaVersion(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { schemaVersion?: unknown };

  return typeof candidate.schemaVersion === 'number' && candidate.schemaVersion !== MONSTER_RPG_SCHEMA_VERSION;
}

function isAvatarId(avatar: AvatarId): boolean {
  return avatar === 'scout' || avatar === 'ranger' || avatar === 'keeper';
}

function isStackRecord(value: unknown, playerId: string): value is Record<string, SaveStack> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(
    ([id, stack]) =>
      isNonEmptyString(id) &&
      id === stack.id &&
      stack.ownerPlayerId === playerId &&
      isNonNegativeInteger(stack.quantity) &&
      stack.quantity > 0
  );
}

function isQuantityRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(([id, quantity]) => isNonEmptyString(id) && isNonNegativeInteger(quantity));
}

function isValidStats(value: unknown): value is CreatureSaveRecord['stats'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const stats = value as CreatureSaveRecord['stats'];

  return (
    isNonNegativeInteger(stats.hp) &&
    stats.hp > 0 &&
    isNonNegativeInteger(stats.attack) &&
    isNonNegativeInteger(stats.defense) &&
    isNonNegativeInteger(stats.speed) &&
    isNonNegativeInteger(stats.stamina)
  );
}

function isValidAttackRecord(value: unknown): value is CreatureAttackRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const attack = value as CreatureAttackRecord;

  return (
    isNonEmptyString(attack.id) &&
    isNonEmptyString(attack.name) &&
    validCreatureTypes.has(attack.type) &&
    isNonNegativeInteger(attack.power) &&
    attack.power > 0 &&
    validStatKeys.has(attack.statFocus)
  );
}

function isValidCreationRequirement(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const requirement = value as CreationRequirement;
  const scope = requirement.scope;

  return (
    isNonEmptyString(requirement.materialId) &&
    isNonNegativeInteger(requirement.quantity) &&
    requirement.quantity > 0 &&
    (scope === undefined ||
      (typeof scope === 'object' &&
        !Array.isArray(scope) &&
        (scope.rarity === undefined || validCardRarities.has(scope.rarity)) &&
        (scope.type === undefined || validCreatureTypes.has(scope.type)) &&
        (scope.speciesId === undefined ||
          (Number.isSafeInteger(scope.speciesId) && isKnownSpeciesId(scope.speciesId)))))
  );
}

function isCooldownRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(([id, date]) => isNonEmptyString(id) && isIsoDate(date));
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.entries(value).every(([id, flag]) => isNonEmptyString(id) && typeof flag === 'boolean');
}

function isUniqueStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) return false;
  return new Set(value).size === value.length;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumericRecordKey(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}
