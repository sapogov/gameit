import type {
  AvatarId,
  CreatureSaveContainer,
  CreatureSaveRecord,
  FarmSaveContainer,
  FarmSaveRecord,
  InventorySaveContainer,
  JournalSaveContainer,
  JournalSpeciesState,
  MonsterRpgSaveState,
  PlayerProfile,
  ProgressionSaveContainer,
  SaveStack,
  VillageSaveContainer
} from './types';
import { canEnterTile, getMapById, homeVillageMap, isMapId, villageDefinitions } from './maps';
import { isKnownSpeciesId } from './speciesCatalog';

export const MONSTER_RPG_PROFILE_KEY = 'gameit.monsterRpg.profile';
export const MONSTER_RPG_SAVE_KEY = 'gameit.monsterRpg.save';
export const MONSTER_RPG_SCHEMA_VERSION = 5;

export type SaveImportResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; reason: 'invalid-json' | 'unsupported-schema' | 'invalid-save' };

export interface MonsterRpgSaveRepository {
  loadProfile: () => PlayerProfile | null;
  loadSave: () => MonsterRpgSaveState | null;
  save: (state: MonsterRpgSaveState) => void;
  clear: () => void;
  exportSave: (state: MonsterRpgSaveState) => string;
  importPayload: (payload: string) => SaveImportResult;
}

const validVillageIds = new Set(villageDefinitions.map((village) => village.id));
const validJournalStates = new Set<JournalSpeciesState>(['silhouette', 'discovered']);

export const localMonsterRpgSaveRepository: MonsterRpgSaveRepository = {
  loadProfile() {
    const profile = readJson<PlayerProfile>(MONSTER_RPG_PROFILE_KEY);
    if (profile && isValidProfile(profile)) return profile;

    localStorage.removeItem(MONSTER_RPG_PROFILE_KEY);
    return null;
  },
  loadSave() {
    const state = readJson<MonsterRpgSaveState>(MONSTER_RPG_SAVE_KEY);
    if (state && isValidSaveState(state)) return state;

    localStorage.removeItem(MONSTER_RPG_SAVE_KEY);
    return null;
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

export function loadSave(): MonsterRpgSaveState | null {
  return localMonsterRpgSaveRepository.loadSave();
}

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
      currencies: { magicDust: 0 },
      items: {},
      cards: {}
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
    farms: {
      ownerPlayerId: playerId,
      farms: {}
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
      completedQuestIds: []
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
  if (!isValidSaveState(parsed)) return { ok: false, reason: 'invalid-save' };

  return { ok: true, state: parsed };
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
    isValidFarms(candidate.farms, playerId) &&
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
    isStackRecord(candidate.cards, playerId)
  );
}

function isValidCreatures(creatures: unknown, playerId: string): creatures is CreatureSaveContainer {
  if (!creatures || typeof creatures !== 'object') return false;
  const candidate = creatures as CreatureSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!isUniqueStringArray(candidate.activePartyCreatureIds) || !isUniqueStringArray(candidate.storedCreatureIds)) return false;

  const records = candidate.creatures;
  if (!records || typeof records !== 'object' || Array.isArray(records)) return false;
  const knownCreatureIds = new Set(Object.keys(records));

  return (
    candidate.activePartyCreatureIds.every((id) => knownCreatureIds.has(id)) &&
    candidate.storedCreatureIds.every((id) => knownCreatureIds.has(id)) &&
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
    isNonNegativeInteger(candidate.hp) &&
    isNonNegativeInteger(candidate.maxHp) &&
    candidate.hp <= candidate.maxHp &&
    typeof candidate.fainted === 'boolean' &&
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

function isValidFarms(farms: unknown, playerId: string): farms is FarmSaveContainer {
  if (!farms || typeof farms !== 'object') return false;
  const candidate = farms as FarmSaveContainer;
  if (candidate.ownerPlayerId !== playerId) return false;
  if (!candidate.farms || typeof candidate.farms !== 'object' || Array.isArray(candidate.farms)) return false;

  return Object.entries(candidate.farms).every(([id, farm]) => id === farm.id && isValidFarmRecord(farm, playerId));
}

function isValidFarmRecord(record: unknown, playerId: string): record is FarmSaveRecord {
  if (!record || typeof record !== 'object') return false;
  const candidate = record as FarmSaveRecord;

  return (
    isNonEmptyString(candidate.id) &&
    candidate.ownerPlayerId === playerId &&
    isNonEmptyString(candidate.farmType) &&
    isNonNegativeInteger(candidate.level) &&
    candidate.level > 0 &&
    isQuantityRecord(candidate.storedResources) &&
    (candidate.collectCooldownUntil === undefined || isIsoDate(candidate.collectCooldownUntil)) &&
    isCooldownRecord(candidate.theftCooldowns)
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
    isUniqueStringArray(candidate.completedQuestIds)
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

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}
