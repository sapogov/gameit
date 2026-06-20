import type { CardBuffType, CardRarity, CreatureSaveRecord, MonsterRpgSaveState, SaveStack } from './types';
import { getSpeciesById } from './speciesCatalog';

export const CARD_PACK_SIZE = 5;
export const cardRarities = ['common', 'uncommon', 'rare', 'legendary', 'mythical'] as const;
export const cardTypes = ['creature', 'farm', 'material', 'buff'] as const;
export const cardBuffTypes = ['battle', 'drop-chance'] as const;

export const CARD_PACK_RARITY_TIERS: readonly CardRarity[] = ['common', 'uncommon', 'rare'];

export const MAGIC_DUST_CURRENCY_ID = 'magicDust';
export const STARTER_FARM_CARD_ID = 'farm-card:magic-dust-farm';

export const STARTER_CREATURE_CARD_IDS = [
  'creature-card:spriglet',
  'creature-card:bramblet',
  'creature-card:dashkit'
] as const;

export interface CardDefinitionBase {
  id: string;
  type: 'creature' | 'farm' | 'material' | 'buff';
  rarity: CardRarity;
  name: string;
  description: string;
  actionHint: string;
  packWeight: number;
}

export interface CreatureCardDefinition extends CardDefinitionBase {
  type: 'creature';
  speciesId: number;
}

export interface FarmCardDefinition extends CardDefinitionBase {
  type: 'farm';
  farmType: string;
}

export interface MaterialCardDefinition extends CardDefinitionBase {
  type: 'material';
  materialId: string;
  materialAmount: number;
}

export interface BuffCardDefinition extends CardDefinitionBase {
  type: 'buff';
  buffType: CardBuffType;
}

export type CardDefinition = CreatureCardDefinition | FarmCardDefinition | MaterialCardDefinition | BuffCardDefinition;

export type CardActionResultReason =
  | 'missing-card'
  | 'unknown-card'
  | 'wrong-card-type'
  | 'invalid-species'
  | 'buff-slot-occupied'
  | 'farm-type-locked';

export interface CardActionResult {
  ok: boolean;
  reason?: CardActionResultReason;
  state: MonsterRpgSaveState;
}

export interface PackOpenTraceCard {
  cardId: string;
  type: CardDefinition['type'];
  rarity: CardRarity;
}

export interface PackOpenTrace {
  openedAt: string;
  cards: PackOpenTraceCard[];
  countsByRarity: Record<CardRarity, number>;
  seed?: number;
}

export interface OpenPackResult {
  ok: true;
  state: MonsterRpgSaveState;
  trace: PackOpenTrace;
}

const CARD_CATALOG = [
  {
    id: 'creature-card:spriglet',
    type: 'creature',
    rarity: 'common',
    speciesId: 1,
    name: 'Spriglet Creature Card',
    description: 'Convert through Village Elder into a Spriglet.',
    actionHint: 'Use Village Elder',
    packWeight: 34
  },
  {
    id: 'creature-card:bramblet',
    type: 'creature',
    rarity: 'common',
    speciesId: 2,
    name: 'Bramblet Creature Card',
    description: 'Convert through Village Elder into a Bramblet.',
    actionHint: 'Use Village Elder',
    packWeight: 34
  },
  {
    id: 'creature-card:dashkit',
    type: 'creature',
    rarity: 'common',
    speciesId: 3,
    name: 'Dashkit Creature Card',
    description: 'Convert through Village Elder into a Dashkit.',
    actionHint: 'Use Village Elder',
    packWeight: 34
  },
  {
    id: STARTER_FARM_CARD_ID,
    type: 'farm',
    rarity: 'uncommon',
    farmType: 'magic-dust',
    name: 'Magic Dust Farm Card',
    description: 'Build through Village Elder as a farm.',
    actionHint: 'Use Village Elder',
    packWeight: 28
  },
  {
    id: 'material-card:charcoal-bundle',
    type: 'material',
    rarity: 'common',
    materialId: MAGIC_DUST_CURRENCY_ID,
    materialAmount: 2,
    name: 'Charcoal Bundle',
    description: 'Activate to gain 2 Magic Dust.',
    actionHint: 'Activate',
    packWeight: 27
  },
  {
    id: 'material-card:iron-shard',
    type: 'material',
    rarity: 'uncommon',
    materialId: MAGIC_DUST_CURRENCY_ID,
    materialAmount: 4,
    name: 'Iron Shard Packet',
    description: 'Activate to gain 4 Magic Dust.',
    actionHint: 'Activate',
    packWeight: 18
  },
  {
    id: 'material-card:ether-bloom',
    type: 'material',
    rarity: 'rare',
    materialId: MAGIC_DUST_CURRENCY_ID,
    materialAmount: 8,
    name: 'Ether Bloom',
    description: 'Activate to gain 8 Magic Dust.',
    actionHint: 'Activate',
    packWeight: 9
  },
  {
    id: 'buff-card:battle-rush',
    type: 'buff',
    rarity: 'uncommon',
    buffType: 'battle',
    name: 'Battle Rush Card',
    description: 'Activate to reserve a Battle buff slot.',
    actionHint: 'Activate',
    packWeight: 7
  },
  {
    id: 'buff-card:drop-luck',
    type: 'buff',
    rarity: 'rare',
    buffType: 'drop-chance',
    name: 'Drop-Luck Banner',
    description: 'Activate to reserve a Drop-Chance buff slot.',
    actionHint: 'Activate',
    packWeight: 5
  }
] as const satisfies readonly CardDefinition[];

const catalogById = new Map<string, CardDefinition>(CARD_CATALOG.map((card) => [card.id, card]));

export function getCardDefinition(id: string): CardDefinition | undefined {
  return catalogById.get(id);
}

export function getCardCatalog(): readonly CardDefinition[] {
  return CARD_CATALOG;
}

export function getMaterialCardById(id: string): MaterialCardDefinition | undefined {
  const definition = getCardDefinition(id);
  return definition?.type === 'material' ? definition : undefined;
}

export function getBuffCardById(id: string): BuffCardDefinition | undefined {
  const definition = getCardDefinition(id);
  return definition?.type === 'buff' ? definition : undefined;
}

export function getCreatureCardById(id: string): CreatureCardDefinition | undefined {
  const definition = getCardDefinition(id);
  return definition?.type === 'creature' ? definition : undefined;
}

export function getFarmCardById(id: string): FarmCardDefinition | undefined {
  const definition = getCardDefinition(id);
  return definition?.type === 'farm' ? definition : undefined;
}

export function openPack(state: MonsterRpgSaveState, options?: { seed?: number; rng?: () => number }): OpenPackResult {
  const rng = options?.rng ?? createRng(options?.seed);
  const now = new Date().toISOString();

  let cards = state.inventory.cards;
  const cardEntries: PackOpenTraceCard[] = [];
  const countsByRarity = createEmptyRarityCounts();

  for (let index = 0; index < CARD_PACK_SIZE; index += 1) {
    const card = pickPackCard(rng);
    cards = withCardStack(cards, card.id, state.profile.playerId, 1);
    cardEntries.push({
      cardId: card.id,
      type: card.type,
      rarity: card.rarity
    });
    countsByRarity[card.rarity] += 1;
  }

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards
      },
      updatedAt: now
    },
    trace: {
      openedAt: now,
      seed: options?.seed,
      cards: cardEntries,
      countsByRarity
    }
  };
}

export function activateMaterialCard(state: MonsterRpgSaveState, cardId: string): CardActionResult {
  const definition = getMaterialCardById(cardId);
  if (!definition) return { ok: false, reason: 'unknown-card', state };

  const currentStack = state.inventory.cards[cardId];
  if (!currentStack || currentStack.quantity < 1) {
    return { ok: false, reason: 'missing-card', state };
  }

  const withCard = consumeCard(state.inventory.cards, cardId, state.profile.playerId);
  const nextState = {
    ...state,
    inventory: {
      ...state.inventory,
      cards: withCard,
      currencies: {
        ...state.inventory.currencies,
        [definition.materialId]: (state.inventory.currencies[definition.materialId] ?? 0) + definition.materialAmount
      }
    },
    updatedAt: new Date().toISOString()
  };

  return { ok: true, state: nextState };
}

export function activateBuffCard(state: MonsterRpgSaveState, cardId: string): CardActionResult {
  const definition = getBuffCardById(cardId);
  if (!definition) return { ok: false, reason: 'unknown-card', state };

  const currentStack = state.inventory.cards[cardId];
  if (!currentStack || currentStack.quantity < 1) {
    return { ok: false, reason: 'missing-card', state };
  }

  const activeBuffs = {
    ...state.progression.activeCardBuffs
  };

  if (activeBuffs[definition.buffType]) {
    return {
      ok: false,
      reason: 'buff-slot-occupied',
      state
    };
  }

  const withCard = consumeCard(state.inventory.cards, cardId, state.profile.playerId);

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards: withCard
      },
      progression: {
        ...state.progression,
        activeCardBuffs: {
          ...activeBuffs,
          [definition.buffType]: cardId
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function activateCreatureCardViaElder(state: MonsterRpgSaveState, cardId: string): CardActionResult {
  const definition = getCreatureCardById(cardId);
  if (!definition) return { ok: false, reason: 'wrong-card-type', state };

  const currentStack = state.inventory.cards[cardId];
  if (!currentStack || currentStack.quantity < 1) {
    return { ok: false, reason: 'missing-card', state };
  }

  const species = getSpeciesById(definition.speciesId);
  if (!species) {
    return { ok: false, reason: 'invalid-species', state };
  }

  const creatureId = createCreatureId(state.creatures.creatures);
  const creatureRecord: CreatureSaveRecord = {
    id: creatureId,
    ownerPlayerId: state.profile.playerId,
    speciesId: species.id,
    level: 1,
    experience: 0,
    hp: species.baseStats.hp,
    maxHp: species.baseStats.hp,
    fainted: false,
    cooldowns: {}
  };

  const withCard = consumeCard(state.inventory.cards, cardId, state.profile.playerId);

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards: withCard,

      },
      creatures: {
        ...state.creatures,
        activePartyCreatureIds: [...state.creatures.activePartyCreatureIds, creatureId],
        creatures: {
          ...state.creatures.creatures,
          [creatureId]: creatureRecord
        }
      },
      journal: {
        ...state.journal,
        species: {
          ...state.journal.species,
          [String(definition.speciesId)]: 'discovered'
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function buildFarmCardViaElder(state: MonsterRpgSaveState, cardId: string): CardActionResult {
  const definition = getFarmCardById(cardId);
  if (!definition) return { ok: false, reason: 'wrong-card-type', state };

  const currentStack = state.inventory.cards[cardId];
  if (!currentStack || currentStack.quantity < 1) {
    return { ok: false, reason: 'missing-card', state };
  }

  const farmTypeAlreadyOwned = Object.values(state.farms.farms).some((farm) => farm.farmType === definition.farmType);
  if (farmTypeAlreadyOwned) {
    return { ok: false, reason: 'farm-type-locked', state };
  }

  const farmId = `farm-${cardId}`;
  const withCard = consumeCard(state.inventory.cards, cardId, state.profile.playerId);

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards: withCard
      },
      farms: {
        ...state.farms,
        farms: {
          ...state.farms.farms,
          [farmId]: {
            id: farmId,
            ownerPlayerId: state.profile.playerId,
            farmType: definition.farmType,
            level: 1,
            storedResources: {
              [MAGIC_DUST_CURRENCY_ID]: 0
            },
            theftCooldowns: {}
          }
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

function createEmptyRarityCounts(): Record<CardRarity, number> {
  return {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 0,
    mythical: 0
  };
}

function pickPackCard(rng: () => number): CardDefinition {
  const totalWeight = CARD_CATALOG.reduce((sum, card) => sum + card.packWeight, 0);
  let cursor = rng() * totalWeight;

  for (const card of CARD_CATALOG) {
    cursor -= card.packWeight;
    if (cursor <= 0) return card;
  }

  return CARD_CATALOG[CARD_CATALOG.length - 1];
}

function createCreatureId(creatures: Record<string, any>): string {
  let next = 1;
  while (creatures[`card-creature-${next}`]) {
    next += 1;
  }

  return `card-creature-${next}`;
}

function createRng(seed: number = Date.now()): () => number {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(value, 1_664_525) + 1_013_904_223;
    return (value >>> 0) / 0x1_0000_0000;
  };
}

function withCardStack(
  stacks: Record<string, SaveStack>,
  cardId: string,
  ownerPlayerId: string,
  quantity: number
): Record<string, SaveStack> {
  return {
    ...stacks,
    [cardId]: {
      id: cardId,
      ownerPlayerId,
      quantity: (stacks[cardId]?.quantity ?? 0) + quantity
    }
  };
}

function consumeCard(stacks: Record<string, SaveStack>, cardId: string, ownerPlayerId: string): Record<string, SaveStack> {
  const current = stacks[cardId];
  if (!current) return stacks;

  const nextQuantity = current.quantity - 1;
  const nextStacks: Record<string, SaveStack> = {
    ...stacks
  };

  if (nextQuantity <= 0) {
    delete nextStacks[cardId];
  } else {
    nextStacks[cardId] = {
      ...current,
      ownerPlayerId: current.ownerPlayerId ?? ownerPlayerId,
      quantity: nextQuantity
    };
  }

  return nextStacks;
}
