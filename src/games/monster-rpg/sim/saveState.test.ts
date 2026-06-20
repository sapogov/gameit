import { beforeEach, describe, expect, test } from 'vitest';
import {
  createInitialSave,
  createPlayerProfile,
  exportSave,
  importSavePayload,
  loadSave,
  saveProgress
} from './saveState';
import { REVIVE_ITEM_ID, STARTING_REVIVE_ITEM_QUANTITY } from './creatureParty';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true
  });
});

describe('Monster RPG save import and export', () => {
  test('valid export and import keep the same stable Player ID', () => {
    const profile = createPlayerProfile('Mira', 'scout');
    const save = createInitialSave(profile);

    const exported = exportSave(save);
    const imported = importSavePayload(exported);

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state.profile.playerId).toBe(profile.playerId);
    expect(imported.state.profile.playerId).toMatch(/[0-9a-f-]{36}/);
    expect(imported.state.profile.name).toBe('Mira');
    expect(imported.state.position).toEqual(save.position);
    expect(imported.state.inventory.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.creatures.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.village.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.farms.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.journal.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.progression.ownerPlayerId).toBe(profile.playerId);
    expect(imported.state.inventory).toMatchObject({
      currencies: { magicDust: 0 },
      items: {
        [REVIVE_ITEM_ID]: {
          id: REVIVE_ITEM_ID,
          ownerPlayerId: profile.playerId,
          quantity: STARTING_REVIVE_ITEM_QUANTITY
        }
      },
      cards: {},
      creatureCards: {},
      eggs: {}
    });
  });

  test('invalid JSON import fails without mutating the current save', () => {
    const currentSave = createInitialSave(createPlayerProfile('Sol', 'ranger'));
    saveProgress(currentSave);

    const imported = importSavePayload('{not-json');

    expect(imported).toEqual({ ok: false, reason: 'invalid-json' });
    expect(loadSave()?.profile.playerId).toBe(currentSave.profile.playerId);
    expect(loadSave()?.profile.name).toBe('Sol');
  });

  test('unsupported schema version import fails clearly', () => {
    const save = createInitialSave(createPlayerProfile('Vera', 'keeper'));
    const payload = JSON.stringify({ ...save, schemaVersion: -1 });

    expect(importSavePayload(payload)).toEqual({ ok: false, reason: 'unsupported-schema' });
  });

  test('import rejects owned containers that do not match the profile Player ID', () => {
    const save = createInitialSave(createPlayerProfile('Nia', 'scout'));
    const payload = JSON.stringify({
      ...save,
      inventory: { ...save.inventory, ownerPlayerId: 'other-player' }
    });

    expect(importSavePayload(payload)).toEqual({ ok: false, reason: 'invalid-save' });
  });

  test('import rejects malformed quantities and cooldown dates', () => {
    const save = createInitialSave(createPlayerProfile('Paz', 'ranger'));
    const malformedQuantity = JSON.stringify({
      ...save,
      inventory: {
        ...save.inventory,
        items: {
          dust: { id: 'dust', ownerPlayerId: save.profile.playerId, quantity: -1 }
        }
      }
    });
    const malformedCooldown = JSON.stringify({
      ...save,
      farms: {
        ...save.farms,
        farms: {
          'dust-farm': {
            id: 'dust-farm',
            ownerPlayerId: save.profile.playerId,
            farmType: 'magic-dust',
            resourceId: 'magicDust',
            level: 1,
            mapId: 'home-village',
            position: { mapId: 'home-village', x: 24, y: 16 },
            productionRatePerMinute: 1,
            storageCap: 24,
            storedResources: { magicDust: 4 },
            lastProductionAt: '2026-06-20T12:00:00.000Z',
            collectCooldownUntil: 'soon',
            theftCooldowns: {}
          }
        }
      }
    });

    expect(importSavePayload(malformedQuantity)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(importSavePayload(malformedCooldown)).toEqual({ ok: false, reason: 'invalid-save' });
  });

  test('import rejects invalid journal species state and unknown species IDs', () => {
    const save = createInitialSave(createPlayerProfile('Jun', 'scout'));
    const invalidState = JSON.stringify({
      ...save,
      journal: {
        ...save.journal,
        species: { '1': 'fought' }
      }
    });
    const unknownSpecies = JSON.stringify({
      ...save,
      journal: {
        ...save.journal,
        species: { '999': 'silhouette' }
      }
    });

    expect(importSavePayload(invalidState)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(importSavePayload(unknownSpecies)).toEqual({ ok: false, reason: 'invalid-save' });
  });

  test('import rejects creature records with unknown species IDs', () => {
    const save = createInitialSave(createPlayerProfile('Ren', 'keeper'));
    const payload = JSON.stringify({
      ...save,
      creatures: {
        ...save.creatures,
        activePartyCreatureIds: ['ren-1'],
        creatures: {
          'ren-1': {
            id: 'ren-1',
            ownerPlayerId: save.profile.playerId,
            speciesId: 999,
            level: 1,
            experience: 0,
            hp: 10,
            maxHp: 10,
            fainted: false,
            cooldowns: {}
          }
        }
      }
    });

    expect(importSavePayload(payload)).toEqual({ ok: false, reason: 'invalid-save' });
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
