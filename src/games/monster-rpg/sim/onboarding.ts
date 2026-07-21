import type { MonsterRpgSaveState, SaveStack } from './types';
import { getCreatureCardById, MAGIC_DUST_CURRENCY_ID, STARTER_FARM_CARD_ID, STARTER_CREATURE_CARD_IDS } from './cards';
import { convertCreatureCardViaElder, createCreatureCardInstance, type CreatureLifecycleOptions } from './creatureLifecycle';
import { createFarmSaveRecord, MAGIC_DUST_FARM_ID, MAGIC_DUST_FARM_TYPE } from './farms';

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

export const starterCreatureCards = STARTER_CREATURE_CARD_IDS.map((cardId) => {
  const definition = getCreatureCardById(cardId);
  if (!definition) throw new Error(`Missing creature card definition for starter card ${cardId}`);

  return {
    cardId,
    speciesId: definition.speciesId
  };
});

export type VillageElderOnboardingStep = 'elder-dialog' | 'convert-creatures' | 'build-farm' | 'finish' | 'complete';

export type StarterCreatureConversionResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; state: MonsterRpgSaveState; reason: 'already-converted' | 'missing-card' | 'missing-magic-dust' };

export type StarterFarmBuildResult =
  | { ok: true; state: MonsterRpgSaveState }
  | { ok: false; state: MonsterRpgSaveState; reason: 'already-built' | 'missing-card' };

export type OnboardingOptions = Pick<CreatureLifecycleOptions, 'now' | 'rng'>;

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

export function completeVillageElderDialog(state: MonsterRpgSaveState, options?: OnboardingOptions): MonsterRpgSaveState {
  const now = options?.now ?? new Date();
  const withPack = grantStarterPack(state, { ...options, now });

  return withFlags(withPack, {
    [villageElderFlags.dialogComplete]: true
  }, now);
}

export function convertStarterCreatureCards(state: MonsterRpgSaveState, options?: OnboardingOptions): StarterCreatureConversionResult {
  if (hasConvertedStarterCreatureCards(state)) {
    return { ok: false, state, reason: 'already-converted' };
  }

  if (
    starterCreatureCards.some(
      (card) =>
        !Object.values(state.inventory.creatureCards).some(
          (creatureCard) => creatureCard.cardDefinitionId === card.cardId
        )
    )
  ) {
    return { ok: false, state, reason: 'missing-card' };
  }

  const requiredMagicDust = getStarterCreatureConversionCost();
  const currentMagicDust = state.inventory.currencies[MAGIC_DUST_CURRENCY_ID] ?? 0;
  if (currentMagicDust < requiredMagicDust) {
    return { ok: false, state, reason: 'missing-magic-dust' };
  }

  const now = options?.now ?? new Date();
  const stateWithCreatures = starterCreatureCards.reduce((currentState, card) => {
    const instance = Object.values(currentState.inventory.creatureCards).find(
      (creatureCard) => creatureCard.cardDefinitionId === card.cardId
    );
    if (!instance) throw new Error(`Missing starter Creature Card instance ${card.cardId}`);

    const result = convertCreatureCardViaElder(currentState, instance.id, { ...options, now });
    if (!result.ok) throw new Error(`Starter Creature Card conversion failed: ${result.reason}`);

    return result.state;
  }, state);

  return {
    ok: true,
    state: withFlags(stateWithCreatures, {
      [villageElderFlags.starterCreaturesConverted]: true
    }, now)
  };
}

export function buildStarterMagicDustFarm(state: MonsterRpgSaveState, options?: OnboardingOptions): StarterFarmBuildResult {
  if (hasBuiltStarterMagicDustFarm(state)) {
    return { ok: false, state, reason: 'already-built' };
  }

  if ((state.inventory.cards[STARTER_FARM_CARD_ID]?.quantity ?? 0) < 1) {
    return { ok: false, state, reason: 'missing-card' };
  }

  const ownerPlayerId = state.profile.playerId;
  const now = options?.now ?? new Date();
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
        [MAGIC_DUST_FARM_ID]: createFarmSaveRecord({
          id: MAGIC_DUST_FARM_ID,
          ownerPlayerId,
          farmType: MAGIC_DUST_FARM_TYPE,
          villageId: state.profile.homeVillageId,
          now
        })
      }
    }
  };

  return {
    ok: true,
    state: withFlags(withFarm, {
      [villageElderFlags.starterFarmBuilt]: true
    }, now)
  };
}

export function completeVillageElderOnboarding(state: MonsterRpgSaveState, options?: OnboardingOptions): MonsterRpgSaveState {
  if (!hasConvertedStarterCreatureCards(state) || !hasBuiltStarterMagicDustFarm(state)) return state;
  const now = options?.now ?? new Date();

  return withFlags(state, {
    [villageElderFlags.onboardingComplete]: true
  }, now);
}

function grantStarterPack(state: MonsterRpgSaveState, options: OnboardingOptions & { now: Date }): MonsterRpgSaveState {
  if (hasClaimedStarterPack(state)) return state;

  const ownerPlayerId = state.profile.playerId;
  const cards = {
    ...state.inventory.cards
  };
  let creatureCards = {
    ...state.inventory.creatureCards
  };
  starterCreatureCards.forEach((card) => {
    const definition = getCreatureCardById(card.cardId);
    if (!definition) throw new Error(`Missing starter Creature Card definition ${card.cardId}`);
    const instance = createCreatureCardInstance(definition, ownerPlayerId, creatureCards, {
      seed: card.speciesId * 1_001,
      rng: options.rng
    });
    creatureCards = {
      ...creatureCards,
      [instance.id]: instance
    };
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
      cards,
      creatureCards
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
  }, options.now);
}

function withFlags(state: MonsterRpgSaveState, flags: Record<string, boolean>, now: Date): MonsterRpgSaveState {
  return {
    ...state,
    progression: {
      ...state.progression,
      flags: {
        ...state.progression.flags,
        ...flags
      }
    },
    updatedAt: now.toISOString()
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
