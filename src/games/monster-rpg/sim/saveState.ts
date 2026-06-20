import type { AvatarId, MonsterRpgSaveState, PlayerProfile } from './types';
import { canEnterTile, getMapById, homeVillageMap } from './maps';

export const MONSTER_RPG_PROFILE_KEY = 'gameit.monsterRpg.profile';
export const MONSTER_RPG_SAVE_KEY = 'gameit.monsterRpg.save';
export const MONSTER_RPG_SCHEMA_VERSION = 4;

export function createPlayerProfile(name: string, avatar: AvatarId): PlayerProfile {
  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    id: crypto.randomUUID(),
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
    updatedAt: new Date().toISOString()
  };
}

export function loadProfile(): PlayerProfile | null {
  const profile = readJson<PlayerProfile>(MONSTER_RPG_PROFILE_KEY);
  if (profile && isValidProfile(profile)) return profile;

  localStorage.removeItem(MONSTER_RPG_PROFILE_KEY);
  return null;
}

export function loadSave(): MonsterRpgSaveState | null {
  const state = readJson<MonsterRpgSaveState>(MONSTER_RPG_SAVE_KEY);
  if (state && isValidSaveState(state)) return state;

  localStorage.removeItem(MONSTER_RPG_SAVE_KEY);
  return null;
}

export function saveProgress(state: MonsterRpgSaveState): void {
  localStorage.setItem(MONSTER_RPG_PROFILE_KEY, JSON.stringify(state.profile));
  localStorage.setItem(MONSTER_RPG_SAVE_KEY, JSON.stringify(state));
}

export function clearProgress(): void {
  localStorage.removeItem(MONSTER_RPG_PROFILE_KEY);
  localStorage.removeItem(MONSTER_RPG_SAVE_KEY);
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

function isValidProfile(profile: PlayerProfile): boolean {
  return (
    profile.schemaVersion === MONSTER_RPG_SCHEMA_VERSION &&
    typeof profile.id === 'string' &&
    profile.id.length > 0 &&
    typeof profile.name === 'string' &&
    profile.name.trim().length > 0 &&
    isAvatarId(profile.avatar) &&
    profile.homeVillageId === homeVillageMap.id
  );
}

function isValidSaveState(state: MonsterRpgSaveState): boolean {
  const map = getMapById(state.position?.mapId);
  if (!map) return false;

  return (
    state.schemaVersion === MONSTER_RPG_SCHEMA_VERSION &&
    isValidProfile(state.profile) &&
    state.mapId === state.position.mapId &&
    Number.isInteger(state.position.x) &&
    Number.isInteger(state.position.y) &&
    canEnterTile(map, state.position.x, state.position.y) &&
    ['north', 'east', 'south', 'west'].includes(state.position.facing) &&
    typeof state.updatedAt === 'string'
  );
}

function isAvatarId(avatar: AvatarId): boolean {
  return avatar === 'scout' || avatar === 'ranger' || avatar === 'keeper';
}
