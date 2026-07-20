import { beforeEach, describe, expect, test } from 'vitest';
import {
  createInitialSave,
  createPlayerProfile,
  exportSave,
  importSavePayload,
  loadSave,
  localMonsterRpgSaveRepository,
  migrateSaveBalance,
  saveProgress
} from './saveState';
import { REVIVE_ITEM_ID, STARTING_REVIVE_ITEM_QUANTITY } from './creatureParty';
import { claimReward, enqueueReward } from './rewardInbox';
import { CURRENT_BALANCE_VERSION } from './gameBalance';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true
  });
});

describe('Monster RPG save import and export', () => {
  test('new saves persist the current balance version and migrate legacy balance v0', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    expect(save.balanceVersion).toBe(CURRENT_BALANCE_VERSION);
    const legacy = { ...save } as Record<string, unknown>;
    delete legacy.balanceVersion;
    const migrated = migrateSaveBalance(legacy);
    expect(migrated).toMatchObject({ ok: true, state: { balanceVersion: CURRENT_BALANCE_VERSION, inventory: { rewardInbox: { claimedSourceIds: {} } } } });
    if (migrated.ok) expect(migrated.state.inventory.currencies.clinks).toBe(0);
  });

  test('missing balance migration rejects atomically without mutating input', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    const unsupported = { ...save, balanceVersion: 99 };
    const original = JSON.stringify(unsupported);
    expect(migrateSaveBalance(unsupported)).toEqual({ ok: false, reason: 'unsupported-balance-version' });
    expect(JSON.stringify(unsupported)).toBe(original);
  });

  test('v1 migration rejects malformed profile or inventory without throwing or mutating input', () => {
    const malformedProfile = { balanceVersion: 1, profile: null, inventory: null };
    const malformedInventory = { balanceVersion: 1, profile: { playerId: 'player' }, inventory: null };
    const profileBefore = JSON.stringify(malformedProfile);
    const inventoryBefore = JSON.stringify(malformedInventory);

    expect(() => migrateSaveBalance(malformedProfile)).not.toThrow();
    expect(migrateSaveBalance(malformedProfile)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(migrateSaveBalance(malformedInventory)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(JSON.stringify(malformedProfile)).toBe(profileBefore);
    expect(JSON.stringify(malformedInventory)).toBe(inventoryBefore);
  });

  test('v1 to v2 migration adds missing Clinks and preserves valid existing Clinks exactly', () => {
    for (const clinks of [undefined, 0, 17, Number.MAX_SAFE_INTEGER]) {
      const save = createInitialSave(createPlayerProfile('Mira', 'scout')) as any;
      save.balanceVersion = 1;
      if (clinks === undefined) delete save.inventory.currencies.clinks;
      else save.inventory.currencies.clinks = clinks;

      const migrated = migrateSaveBalance(save);

      expect(migrated).toMatchObject({ ok: true, state: { inventory: { currencies: { clinks: clinks ?? 0 } } } });
    }
  });

  test('v1 to v2 migration rejects malformed currency containers and Clinks without mutation', () => {
    const malformed = [
      { inventory: null },
      { inventory: [] },
      { inventory: 'inventory' },
      { inventory: false },
      { inventory: {} },
      { currencies: null },
      { currencies: [] },
      { currencies: 'currencies' },
      { currencies: false },
      { clinks: Number.NaN },
      { clinks: -1 },
      { clinks: 1.5 },
      { clinks: Number.MAX_SAFE_INTEGER + 1 },
      { clinks: '4' },
      { clinks: null },
      { clinks: false }
    ];

    malformed.forEach((failure) => {
      const save = createInitialSave(createPlayerProfile('Mira', 'scout')) as any;
      save.balanceVersion = 1;
      if ('inventory' in failure) save.inventory = failure.inventory;
      if ('currencies' in failure) save.inventory.currencies = failure.currencies;
      if ('clinks' in failure) save.inventory.currencies.clinks = failure.clinks;
      const original = structuredClone(save);

      expect(migrateSaveBalance(save)).toEqual({ ok: false, reason: 'invalid-save' });
      expect(save).toEqual(original);
    });
  });

  test('stored unsupported balance save preserves its bytes and reports a typed failure', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    const raw = JSON.stringify({ ...save, balanceVersion: 99 });
    localStorage.setItem('gameit.monsterRpg.save', raw);
    expect(localMonsterRpgSaveRepository.loadSave()).toEqual({ ok: false, reason: 'unsupported-balance-version' });
    expect(localStorage.getItem('gameit.monsterRpg.save')).toBe(raw);
  });
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
    expect(imported.state.station.ownerPlayerId).toBe(profile.playerId);
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

  test('claimed Reward Inbox sources survive export and import and still reject replay delivery', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    const queued = enqueueReward(save.inventory.rewardInbox, { sourceId: 'battle:persisted', ownerPlayerId: save.profile.playerId, items: [{ itemId: 'worn-key', quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' });
    expect(queued.ok).toBe(true); if (!queued.ok) return;
    const claimed = claimReward(queued.inbox, save.inventory.itemInventory, save.profile.playerId, 'battle:persisted');
    expect(claimed.ok).toBe(true); if (!claimed.ok) return;
    const imported = importSavePayload(exportSave({ ...save, inventory: { ...save.inventory, itemInventory: claimed.inventory, rewardInbox: claimed.inbox } }));
    expect(imported.ok).toBe(true); if (!imported.ok) return;
    expect(imported.state.inventory.rewardInbox.claimedSourceIds).toEqual({ 'battle:persisted': true });
    expect(enqueueReward(imported.state.inventory.rewardInbox, { sourceId: 'battle:persisted', ownerPlayerId: save.profile.playerId, items: [{ itemId: 'worn-key', quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' })).toEqual({ ok: false, reason: 'duplicate-source' });
  });

  test('import rejects malformed claimed-source ledgers', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    for (const claimedSourceIds of [{ toString: true }, { replay: false }, ['replay']]) {
      const payload = JSON.stringify({ ...save, inventory: { ...save.inventory, rewardInbox: { ...save.inventory.rewardInbox, claimedSourceIds } } });
      expect(importSavePayload(payload)).toEqual({ ok: false, reason: 'invalid-save' });
    }
  });

  test('invalid JSON import fails without mutating the current save', () => {
    const currentSave = createInitialSave(createPlayerProfile('Sol', 'ranger'));
    saveProgress(currentSave);

    const imported = importSavePayload('{not-json');

    expect(imported).toEqual({ ok: false, reason: 'invalid-json' });
    const loaded = loadSave();
    expect(loaded).toMatchObject({ ok: true, state: { profile: { playerId: currentSave.profile.playerId, name: 'Sol' } } });
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

  test('import preserves farm guard assignment and rejects unknown guard references', () => {
    const save = createInitialSave(createPlayerProfile('Ivo', 'scout'));
    const creature = createValidCreature(save.profile.playerId);
    const guardedSave = {
      ...save,
      creatures: {
        ...save.creatures,
        activePartyCreatureIds: [creature.id],
        creatures: {
          [creature.id]: creature
        }
      },
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
            guardCreatureId: creature.id,
            theftCooldowns: {}
          }
        }
      }
    };
    const imported = importSavePayload(JSON.stringify(guardedSave));
    const brokenGuard = importSavePayload(
      JSON.stringify({
        ...guardedSave,
        farms: {
          ...guardedSave.farms,
          farms: {
            'dust-farm': {
              ...guardedSave.farms.farms['dust-farm'],
              guardCreatureId: 'missing-creature'
            }
          }
        }
      })
    );

    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state.farms.farms['dust-farm'].guardCreatureId).toBe(creature.id);
    expect(brokenGuard).toEqual({ ok: false, reason: 'invalid-save' });
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

function createValidCreature(ownerPlayerId: string) {
  return {
    id: 'creature-1',
    ownerPlayerId,
    speciesId: 1,
    level: 1,
    experience: 0,
    stats: { hp: 10, attack: 4, defense: 4, speed: 4, stamina: 4 },
    attacks: [
      { id: 'attack-1', name: 'Tackle', type: 'verdant', power: 4, statFocus: 'attack' },
      { id: 'attack-2', name: 'Brace', type: 'stone', power: 3, statFocus: 'defense' },
      { id: 'attack-3', name: 'Dash', type: 'gale', power: 3, statFocus: 'speed' },
      { id: 'attack-4', name: 'Pulse', type: 'lumen', power: 3, statFocus: 'stamina' }
    ],
    hp: 10,
    maxHp: 10,
    fainted: false,
    cooldowns: {}
  } as const;
}
