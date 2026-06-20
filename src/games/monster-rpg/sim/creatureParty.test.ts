import { describe, expect, it } from 'vitest';
import {
  ACTIVE_PARTY_LIMIT,
  REVIVE_ITEM_ID,
  STARTING_REVIVE_ITEM_QUANTITY,
  canCreatureUseRole,
  convertCreatureCardViaElder,
  createCreatureCardInstance,
  createDirectDropEgg,
  createInitialSave,
  createPlayerProfile,
  exportSave,
  getCreatureCardById,
  hatchEgg,
  healAllCreaturesAtHospital,
  importSavePayload,
  isAtVillageHospital,
  moveCreatureToActiveParty,
  moveCreatureToStorage,
  setCreatureHp,
  useReviveItem,
  type MonsterRpgSaveState
} from '.';

describe('Monster RPG creature party, storage, and recovery', () => {
  it('places newly created Creatures in active party until the cap, then storage', () => {
    const state = createStateWithMagicDust(20);
    const filled = createCommonCreatures(state, ACTIVE_PARTY_LIMIT + 1);

    expect(filled.creatures.activePartyCreatureIds).toHaveLength(ACTIVE_PARTY_LIMIT);
    expect(filled.creatures.storedCreatureIds).toHaveLength(1);
    expect(Object.keys(filled.creatures.creatures)).toHaveLength(ACTIVE_PARTY_LIMIT + 1);
  });

  it('starts new saves with a reachable Revive item', () => {
    const state = createInitialSave(createPlayerProfile('Ivo', 'scout'));

    expect(state.inventory.items[REVIVE_ITEM_ID]).toMatchObject({
      id: REVIVE_ITEM_ID,
      ownerPlayerId: state.profile.playerId,
      quantity: STARTING_REVIVE_ITEM_QUANTITY
    });
  });

  it('also routes hatched Creatures to storage when active party is full', () => {
    const filled = createCommonCreatures(createStateWithMagicDust(30), ACTIVE_PARTY_LIMIT);
    const eggResult = createDirectDropEgg(filled, 1, { seed: 44 });
    expect(eggResult.ok).toBe(true);
    if (!eggResult.ok) throw new Error(eggResult.reason);

    const egg = Object.values(eggResult.state.inventory.eggs)[0];
    const hatchResult = hatchEgg(eggResult.state, egg.id, { seed: 45 });
    expect(hatchResult.ok).toBe(true);
    if (!hatchResult.ok) throw new Error(hatchResult.reason);

    expect(hatchResult.state.creatures.activePartyCreatureIds).toHaveLength(ACTIVE_PARTY_LIMIT);
    expect(hatchResult.state.creatures.storedCreatureIds).toContain(hatchResult.creatureId);
  });

  it('marks 0 HP Creatures as Fainted and blocks battle, guard, and mount use', () => {
    const state = createCommonCreatures(createStateWithMagicDust(5), 1);
    const creatureId = state.creatures.activePartyCreatureIds[0];

    const fainted = setCreatureHp(state, creatureId, 0);
    expect(fainted.ok).toBe(true);
    if (!fainted.ok) throw new Error(fainted.reason);

    const creature = fainted.state.creatures.creatures[creatureId];
    expect(creature.hp).toBe(0);
    expect(creature.fainted).toBe(true);
    expect(canCreatureUseRole(creature, 'battle')).toBe(false);
    expect(canCreatureUseRole(creature, 'guard')).toBe(false);
    expect(canCreatureUseRole(creature, 'mount')).toBe(false);
  });

  it('full-heals at Hospital for free and Revive item restores small HP', () => {
    const state = createCommonCreatures(createStateWithMagicDust(5), 1);
    const creatureId = state.creatures.activePartyCreatureIds[0];
    const fainted = setCreatureHp(state, creatureId, 0);
    expect(fainted.ok).toBe(true);
    if (!fainted.ok) throw new Error(fainted.reason);

    const revived = useReviveItem(withReviveItems(fainted.state, 1), creatureId);
    expect(revived.ok).toBe(true);
    if (!revived.ok) throw new Error(revived.reason);
    const revivedCreature = revived.state.creatures.creatures[creatureId];
    expect(revivedCreature.fainted).toBe(false);
    expect(revivedCreature.hp).toBeGreaterThan(0);
    expect(revivedCreature.hp).toBeLessThan(revivedCreature.maxHp);
    expect(revived.state.inventory.items[REVIVE_ITEM_ID]).toBeUndefined();

    const hospitalHealed = healAllCreaturesAtHospital(fainted.state);
    const healedCreature = hospitalHealed.creatures.creatures[creatureId];
    expect(healedCreature.fainted).toBe(false);
    expect(healedCreature.hp).toBe(healedCreature.maxHp);
  });

  it('detects Village Hospital availability only in clinic interiors', () => {
    const state = createInitialSave(createPlayerProfile('Cyra', 'keeper'));
    const clinicState = {
      ...state,
      mapId: 'home-village-clinic-interior' as const,
      position: {
        ...state.position,
        mapId: 'home-village-clinic-interior' as const
      }
    };

    expect(isAtVillageHospital(state)).toBe(false);
    expect(isAtVillageHospital(clinicState)).toBe(true);
  });

  it('persists party and storage changes across export/import', () => {
    const state = createCommonCreatures(createStateWithMagicDust(10), 2);
    const creatureId = state.creatures.activePartyCreatureIds[0];
    const stored = moveCreatureToStorage(state, creatureId);
    expect(stored.ok).toBe(true);
    if (!stored.ok) throw new Error(stored.reason);

    const reactivated = moveCreatureToActiveParty(stored.state, creatureId);
    expect(reactivated.ok).toBe(true);
    if (!reactivated.ok) throw new Error(reactivated.reason);

    const imported = importSavePayload(exportSave(reactivated.state));
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.reason);
    expect(imported.state.creatures.activePartyCreatureIds).toEqual(reactivated.state.creatures.activePartyCreatureIds);
    expect(imported.state.creatures.storedCreatureIds).toEqual(reactivated.state.creatures.storedCreatureIds);
  });

  it('rejects imported party layouts above the active cap', () => {
    const state = createCommonCreatures(createStateWithMagicDust(20), ACTIVE_PARTY_LIMIT + 1);
    const invalidPayload = JSON.stringify({
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: Object.keys(state.creatures.creatures),
        storedCreatureIds: []
      }
    });

    expect(importSavePayload(invalidPayload)).toEqual({ ok: false, reason: 'invalid-save' });
  });

  it('rejects imported creature layouts with duplicate, missing, or unlisted container IDs', () => {
    const state = createCommonCreatures(createStateWithMagicDust(5), 1);
    const creatureId = state.creatures.activePartyCreatureIds[0];
    const duplicatePayload = JSON.stringify({
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: [creatureId],
        storedCreatureIds: [creatureId]
      }
    });
    const missingPayload = JSON.stringify({
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: ['missing-creature'],
        storedCreatureIds: []
      }
    });
    const unlistedPayload = JSON.stringify({
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: [],
        storedCreatureIds: []
      }
    });

    expect(importSavePayload(duplicatePayload)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(importSavePayload(missingPayload)).toEqual({ ok: false, reason: 'invalid-save' });
    expect(importSavePayload(unlistedPayload)).toEqual({ ok: false, reason: 'invalid-save' });
  });
});

function createStateWithMagicDust(quantity: number): MonsterRpgSaveState {
  const state = createInitialSave(createPlayerProfile('Pax', 'scout'));
  return {
    ...state,
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        magicDust: quantity
      }
    }
  };
}

function createCommonCreatures(state: MonsterRpgSaveState, count: number): MonsterRpgSaveState {
  const definition = getCreatureCardById('creature-card:spriglet');
  if (!definition) throw new Error('Spriglet Creature Card not configured');
  let current = state;

  for (let index = 0; index < count; index += 1) {
    const instance = createCreatureCardInstance(definition, current.profile.playerId, current.inventory.creatureCards, {
      seed: index + 1
    });
    current = {
      ...current,
      inventory: {
        ...current.inventory,
        creatureCards: {
          ...current.inventory.creatureCards,
          [instance.id]: instance
        }
      }
    };
    const converted = convertCreatureCardViaElder(current, instance.id, { seed: index + 100 });
    if (!converted.ok) throw new Error(converted.reason);
    current = converted.state;
  }

  return current;
}

function withReviveItems(state: MonsterRpgSaveState, quantity: number): MonsterRpgSaveState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      items: {
        ...state.inventory.items,
        [REVIVE_ITEM_ID]: {
          id: REVIVE_ITEM_ID,
          ownerPlayerId: state.profile.playerId,
          quantity
        }
      }
    }
  };
}
