import type { CreatureLabelMode } from './types';

export const MONSTER_RPG_SETTINGS_KEY = 'gameit.monsterRpg.settings';

export interface MonsterRpgSettings {
  creatureLabelMode: CreatureLabelMode;
}

export const defaultMonsterRpgSettings: MonsterRpgSettings = {
  creatureLabelMode: 'icon-only'
};

export function loadMonsterRpgSettings(): MonsterRpgSettings {
  const raw = localStorage.getItem(MONSTER_RPG_SETTINGS_KEY);
  if (!raw) return defaultMonsterRpgSettings;

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    localStorage.removeItem(MONSTER_RPG_SETTINGS_KEY);
    return defaultMonsterRpgSettings;
  }
}

export function saveMonsterRpgSettings(settings: MonsterRpgSettings): void {
  localStorage.setItem(MONSTER_RPG_SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

function normalizeSettings(value: unknown): MonsterRpgSettings {
  if (!value || typeof value !== 'object') return defaultMonsterRpgSettings;
  const candidate = value as Partial<MonsterRpgSettings>;

  return {
    creatureLabelMode:
      candidate.creatureLabelMode === 'icon-plus-name' ? 'icon-plus-name' : defaultMonsterRpgSettings.creatureLabelMode
  };
}
