import type { CreatureSaveRecord, CreatureSaveContainer, MonsterRpgSaveState } from './types';

export const ACTIVE_PARTY_LIMIT = 5;
export const REVIVE_ITEM_ID = 'item:revive';
export const REVIVE_ITEM_RESTORE_RATIO = 0.25;
export const STARTING_REVIVE_ITEM_QUANTITY = 1;

export type CreatureUseRole = 'battle' | 'guard' | 'mount';

export type CreaturePartyFailureReason =
  | 'missing-creature'
  | 'party-full'
  | 'already-active'
  | 'already-stored'
  | 'missing-item'
  | 'not-fainted'
  | 'not-at-hospital';

export type CreaturePartyResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; state: MonsterRpgSaveState; reason: CreaturePartyFailureReason };

export function placeNewCreature(
  state: MonsterRpgSaveState,
  creatureId: string,
  creature: CreatureSaveRecord
): MonsterRpgSaveState {
  const goesToActiveParty = state.creatures.activePartyCreatureIds.length < ACTIVE_PARTY_LIMIT;

  return {
    ...state,
    creatures: {
      ...state.creatures,
      activePartyCreatureIds: goesToActiveParty
        ? [...state.creatures.activePartyCreatureIds, creatureId]
        : state.creatures.activePartyCreatureIds,
      storedCreatureIds: goesToActiveParty
        ? state.creatures.storedCreatureIds
        : [...state.creatures.storedCreatureIds, creatureId],
      creatures: {
        ...state.creatures.creatures,
        [creatureId]: creature
      }
    }
  };
}

export function moveCreatureToActiveParty(state: MonsterRpgSaveState, creatureId: string): CreaturePartyResult {
  if (!state.creatures.creatures[creatureId]) return { ok: false, state, reason: 'missing-creature' };
  if (state.creatures.activePartyCreatureIds.includes(creatureId)) {
    return { ok: false, state, reason: 'already-active' };
  }
  if (state.creatures.activePartyCreatureIds.length >= ACTIVE_PARTY_LIMIT) {
    return { ok: false, state, reason: 'party-full' };
  }

  return {
    ok: true,
    state: {
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: [...state.creatures.activePartyCreatureIds, creatureId],
        storedCreatureIds: state.creatures.storedCreatureIds.filter((id) => id !== creatureId)
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function moveCreatureToStorage(state: MonsterRpgSaveState, creatureId: string): CreaturePartyResult {
  if (!state.creatures.creatures[creatureId]) return { ok: false, state, reason: 'missing-creature' };
  if (state.creatures.storedCreatureIds.includes(creatureId)) {
    return { ok: false, state, reason: 'already-stored' };
  }

  return {
    ok: true,
    state: {
      ...state,
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: state.creatures.activePartyCreatureIds.filter((id) => id !== creatureId),
        storedCreatureIds: [...state.creatures.storedCreatureIds, creatureId]
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function setCreatureHp(state: MonsterRpgSaveState, creatureId: string, hp: number): CreaturePartyResult {
  const creature = state.creatures.creatures[creatureId];
  if (!creature) return { ok: false, state, reason: 'missing-creature' };

  const nextHp = Math.max(0, Math.min(creature.maxHp, hp));
  const nextCreature = {
    ...creature,
    hp: nextHp,
    fainted: nextHp === 0
  };

  return {
    ok: true,
    state: {
      ...state,
      creatures: {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [creatureId]: nextCreature
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function healAllCreaturesAtHospital(state: MonsterRpgSaveState): MonsterRpgSaveState {
  const healedCreatures = Object.fromEntries(
    Object.entries(state.creatures.creatures).map(([id, creature]) => [
      id,
      {
        ...creature,
        hp: creature.maxHp,
        fainted: false
      }
    ])
  );

  return {
    ...state,
    creatures: {
      ...state.creatures,
      creatures: healedCreatures
    },
    updatedAt: new Date().toISOString()
  };
}

export function isAtVillageHospital(state: MonsterRpgSaveState): boolean {
  return state.mapId.endsWith('-clinic-interior');
}

export function useReviveItem(state: MonsterRpgSaveState, creatureId: string): CreaturePartyResult {
  const creature = state.creatures.creatures[creatureId];
  if (!creature) return { ok: false, state, reason: 'missing-creature' };
  if (!isCreatureFainted(creature)) return { ok: false, state, reason: 'not-fainted' };

  const reviveStack = state.inventory.items[REVIVE_ITEM_ID];
  if (!reviveStack || reviveStack.quantity < 1) return { ok: false, state, reason: 'missing-item' };

  const restoredHp = Math.max(1, Math.ceil(creature.maxHp * REVIVE_ITEM_RESTORE_RATIO));
  const items = { ...state.inventory.items };
  if (reviveStack.quantity === 1) {
    delete items[REVIVE_ITEM_ID];
  } else {
    items[REVIVE_ITEM_ID] = {
      ...reviveStack,
      quantity: reviveStack.quantity - 1
    };
  }

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        items
      },
      creatures: {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [creatureId]: {
            ...creature,
            hp: restoredHp,
            fainted: false
          }
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function canCreatureUseRole(creature: CreatureSaveRecord | undefined, _role: CreatureUseRole): boolean {
  return Boolean(creature && !isCreatureFainted(creature));
}

export function isCreatureFainted(creature: CreatureSaveRecord): boolean {
  return creature.fainted || creature.hp <= 0;
}

export function isValidCreatureContainerLayout(container: CreatureSaveContainer): boolean {
  if (container.activePartyCreatureIds.length > ACTIVE_PARTY_LIMIT) return false;

  const activeIds = new Set(container.activePartyCreatureIds);
  const storedIds = new Set(container.storedCreatureIds);
  const knownCreatureIds = Object.keys(container.creatures);
  if (knownCreatureIds.length !== activeIds.size + storedIds.size) return false;

  return knownCreatureIds.every((id) => activeIds.has(id) !== storedIds.has(id));
}
