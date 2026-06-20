import type { CreatureSaveRecord, MonsterRpgSaveState, SaveStack } from './types';
import { getSpeciesById } from './speciesCatalog';

export const MAGIC_DUST_CURRENCY_ID = 'magicDust';
export const MAGIC_DUST_FARM_TYPE = 'magic-dust';
export const MAGIC_DUST_FARM_ID = 'home-magic-dust-farm';
export const STARTER_FARM_CARD_ID = 'farm-card:magic-dust-farm';
export const STARTER_CREATURE_MAGIC_DUST_COST = 1;
export const STARTER_PACK_MAGIC_DUST_GRANT = 3;
export const STARTER_PACK_ONBOARDING_TEXT =
  'Common Creature Cards convert directly into Creatures. Each starter conversion costs 1 Magic Dust.';

export const villageElderFlags = {
  dialogComplete: 'villageElder.dialogComplete',
  starterPackClaimed: 'villageElder.starterPackClaimed',
  starterCreaturesConverted: 'villageElder.starterCreaturesConverted',
  starterFarmBuilt: 'villageElder.starterFarmBuilt',
  onboardingComplete: 'villageElder.onboardingComplete'
} as const;

export const starterCreatureCards = [
  { cardId: 'creature-card:spriglet', speciesId: 1 },
  { cardId: 'creature-card:bramblet', speciesId: 2 },
  { cardId: 'creature-card:dashkit', speciesId: 3 }
] as const;

export type VillageElderOnboardingStep = 'elder-dialog' | 'convert-creatures' | 'build-farm' | 'finish' | 'complete';

export type StarterCreatureConversionResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; state: MonsterRpgSaveState; reason: 'already-converted' | 'missing-card' | 'missing-magic-dust' };

export type StarterFarmBuildResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; state: MonsterRpgSaveState; reason: 'already-built' | 'missing-card' };

export function getVillageElderOnboardingStep(state: MonsterRpgSaveState): VillageElderOnboardingStep {
  if (!isVillageElderDialogComplete(state)) return 'elder-dialog';
  if (!hasConvertedStarterCreatureCards(state)) return 'convert-creatures';
  if (!hasBuiltStarterMagicDustFarm(state)) return 'build-farm';
  if (!isVillageElderOnboardingComplete(state)) return 'finish';
  return 'complete';
}

export function isVillageElderDialogComplete(state: MonsterRpgSaveState): boolean {
  return state.progression.flags[villageElderFlags.dialogComplete] === true;
}

export function isVillageElderOnboardingComplete(state: MonsterRpgSaveState): boolean {
  return state.progression.flags[villageElderFlags.onboardingComplete] === true;
}

export function hasClaimedStarterPack(state: MonsterRpgSaveState): boolean {
  return state.progression.flags[villageElderFlags.starterPackClaimed] === true;
}

export function hasConvertedStarterCreatureCards(state: MonsterRpgSaveState): boolean {
  return state.progression.flags[villageElderFlags.starterCreaturesConverted] === true;
}

export function hasBuiltStarterMagicDustFarm(state: MonsterRpgSaveState): boolean {
  return state.progression.flags[villageElderFlags.starterFarmBuilt] === true;
}

export function getStarterCreatureConversionCost(): number {
  return starterCreatureCards.length * STARTER_CREATURE_MAGIC_DUST_COST;
}

export function completeVillageElderDialog(state: MonsterRpgSaveState): MonsterRpgSaveState {
  const withPack = grantStarterPack(state);

  return withFlags(withPack, {
    [villageElderFlags.dialogComplete]: true
  });
}

export function convertStarterCreatureCards(state: MonsterRpgSaveState): StarterCreatureConversionResult {
  if (hasConvertedStarterCreatureCards(state)) {
    return { ok: false, state, reason: 'already-converted' };
  }

  if (starterCreatureCards.some((card) => (state.inventory.cards[card.cardId]?.quantity ?? 0) < 1)) {
    return { ok: false, state, reason: 'missing-card' };
  }

  const requiredMagicDust = getStarterCreatureConversionCost();
  const currentMagicDust = state.inventory.currencies[MAGIC_DUST_CURRENCY_ID] ?? 0;
  if (currentMagicDust < requiredMagicDust) {
    return { ok: false, state, reason: 'missing-magic-dust' };
  }

  const ownerPlayerId = state.profile.playerId;
  const convertedCreatures = Object.fromEntries(
    starterCreatureCards.map((card) => {
      const species = getSpeciesById(card.speciesId);
      if (!species) throw new Error(`Unknown starter species ${card.speciesId}`);
      const creatureId = `starter-creature-${card.speciesId}`;
      const creature: CreatureSaveRecord = {
        id: creatureId,
        ownerPlayerId,
        speciesId: card.speciesId,
        level: 1,
        experience: 0,
        hp: species.baseStats.hp,
        maxHp: species.baseStats.hp,
        fainted: false,
        cooldowns: {}
      };

      return [creatureId, creature];
    })
  );
  const convertedCreatureIds = Object.keys(convertedCreatures);

  const stateWithCreatures: MonsterRpgSaveState = {
    ...state,
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        [MAGIC_DUST_CURRENCY_ID]: currentMagicDust - requiredMagicDust
      },
      cards: starterCreatureCards.reduce(
        (cards, card) => decrementStack(cards, card.cardId, 1),
        state.inventory.cards
      )
    },
    creatures: {
      ...state.creatures,
      activePartyCreatureIds: [
        ...state.creatures.activePartyCreatureIds,
        ...convertedCreatureIds.filter((id) => !state.creatures.activePartyCreatureIds.includes(id))
      ],
      creatures: {
        ...state.creatures.creatures,
        ...convertedCreatures
      }
    }
  };

  return {
    ok: true,
    state: withFlags(stateWithCreatures, {
      [villageElderFlags.starterCreaturesConverted]: true
    })
  };
}

export function buildStarterMagicDustFarm(state: MonsterRpgSaveState): StarterFarmBuildResult {
  if (hasBuiltStarterMagicDustFarm(state)) {
    return { ok: false, state, reason: 'already-built' };
  }

  if ((state.inventory.cards[STARTER_FARM_CARD_ID]?.quantity ?? 0) < 1) {
    return { ok: false, state, reason: 'missing-card' };
  }

  const ownerPlayerId = state.profile.playerId;
  const withFarm: MonsterRpgSaveState = {
    ...state,
    inventory: {
      ...state.inventory,
      cards: decrementStack(state.inventory.cards, STARTER_FARM_CARD_ID, 1)
    },
    farms: {
      ...state.farms,
      farms: {
        ...state.farms.farms,
        [MAGIC_DUST_FARM_ID]: {
          id: MAGIC_DUST_FARM_ID,
          ownerPlayerId,
          farmType: MAGIC_DUST_FARM_TYPE,
          level: 1,
          storedResources: {
            [MAGIC_DUST_CURRENCY_ID]: 0
          },
          theftCooldowns: {}
        }
      }
    }
  };

  return {
    ok: true,
    state: withFlags(withFarm, {
      [villageElderFlags.starterFarmBuilt]: true
    })
  };
}

export function completeVillageElderOnboarding(state: MonsterRpgSaveState): MonsterRpgSaveState {
  if (!hasConvertedStarterCreatureCards(state) || !hasBuiltStarterMagicDustFarm(state)) return state;

  return withFlags(state, {
    [villageElderFlags.onboardingComplete]: true
  });
}

function grantStarterPack(state: MonsterRpgSaveState): MonsterRpgSaveState {
  if (hasClaimedStarterPack(state)) return state;

  const ownerPlayerId = state.profile.playerId;
  const cards = {
    ...state.inventory.cards
  };
  starterCreatureCards.forEach((card) => {
    cards[card.cardId] = incrementStack(cards[card.cardId], card.cardId, ownerPlayerId, 1);
  });
  cards[STARTER_FARM_CARD_ID] = incrementStack(cards[STARTER_FARM_CARD_ID], STARTER_FARM_CARD_ID, ownerPlayerId, 1);

  const withPack: MonsterRpgSaveState = {
    ...state,
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        [MAGIC_DUST_CURRENCY_ID]:
          (state.inventory.currencies[MAGIC_DUST_CURRENCY_ID] ?? 0) + STARTER_PACK_MAGIC_DUST_GRANT
      },
      cards
    },
    journal: {
      ...state.journal,
      species: {
        ...state.journal.species,
        ...Object.fromEntries(starterCreatureCards.map((card) => [String(card.speciesId), 'discovered']))
      }
    }
  };

  return withFlags(withPack, {
    [villageElderFlags.starterPackClaimed]: true
  });
}

function withFlags(state: MonsterRpgSaveState, flags: Record<string, boolean>): MonsterRpgSaveState {
  return {
    ...state,
    progression: {
      ...state.progression,
      flags: {
        ...state.progression.flags,
        ...flags
      }
    },
    updatedAt: new Date().toISOString()
  };
}

function incrementStack(
  stack: SaveStack | undefined,
  id: string,
  ownerPlayerId: string,
  quantity: number
): SaveStack {
  return {
    id,
    ownerPlayerId,
    quantity: (stack?.quantity ?? 0) + quantity
  };
}

function decrementStack(cards: Record<string, SaveStack>, id: string, quantity: number): Record<string, SaveStack> {
  const stack = cards[id];
  if (!stack) return cards;

  const nextCards = { ...cards };
  const nextQuantity = stack.quantity - quantity;
  if (nextQuantity > 0) {
    nextCards[id] = { ...stack, quantity: nextQuantity };
  } else {
    delete nextCards[id];
  }

  return nextCards;
}
