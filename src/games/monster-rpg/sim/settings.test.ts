import { beforeEach, describe, expect, it } from 'vitest';
import {
  MONSTER_RPG_SETTINGS_KEY,
  loadMonsterRpgSettings,
  saveMonsterRpgSettings
} from './settings';

describe('Monster RPG settings persistence', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true
    });
  });

  it('defaults Creature labels to icon only', () => {
    expect(loadMonsterRpgSettings()).toEqual({ creatureLabelMode: 'icon-only' });
  });

  it('persists Creature label mode across reloads', () => {
    saveMonsterRpgSettings({ creatureLabelMode: 'icon-plus-name' });

    expect(loadMonsterRpgSettings()).toEqual({ creatureLabelMode: 'icon-plus-name' });
  });

  it('recovers invalid settings to the icon-only default', () => {
    localStorage.setItem(MONSTER_RPG_SETTINGS_KEY, '{"creatureLabelMode":"bad"}');

    expect(loadMonsterRpgSettings()).toEqual({ creatureLabelMode: 'icon-only' });
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}
