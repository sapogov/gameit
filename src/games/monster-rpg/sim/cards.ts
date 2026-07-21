import type { CardBuffType, CardRarity, CardRewardSource, MonsterRpgSaveState, SaveStack } from './types';
import { createCreatureCardInstance, convertCreatureCardViaElder, MAGIC_DUST_MATERIAL_ID } from './creatureLifecycle';
import { createFarmSaveRecord } from './farms';
import { GAME_BALANCE_CONFIG } from './gameBalance';

export interface CardMutationOptions {
  now?: Date;
  rng?: () => number;
  seed?: number;
}

export const CARD_PACK_SIZE = GAME_BALANCE_CONFIG.chests.cardPackSize;
export const cardRarities = ['common', 'uncommon', 'rare', 'legendary', 'mythical'] as const;
export const cardTypes = ['creature', 'farm', 'material', 'buff'] as const;
export const cardBuffTypes = ['battle', 'drop-chance'] as const;

export const CARD_PACK_RARITY_TIERS: readonly CardRarity[] = ['common', 'uncommon', 'rare'];

export const MAGIC_DUST_CURRENCY_ID = MAGIC_DUST_MATERIAL_ID;
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
  instanceId?: string;
  type: CardDefinition['type'];
  rarity: CardRarity;
}

export interface PackOpenTrace {
  openedAt: string;
  cards: PackOpenTraceCard[];
  countsByRarity: Record<CardRarity, number>;
  seed?: number;
  rewardTableId: string;
}

export interface OpenPackResult {
  ok: true;
  state: MonsterRpgSaveState;
  trace: PackOpenTrace;
}

export interface CardRewardTableEntry {
  cardId: string;
  weight: number;
}

export interface CardRewardTable {
  id: string;
  sources: readonly CardRewardSource[];
  entries: readonly CardRewardTableEntry[];
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
    id: 'creature-card:duskleaf',
    type: 'creature',
    rarity: 'uncommon',
    speciesId: 15,
    name: 'Duskleaf Creature Card',
    description: 'Use through Village Elder to prepare a Duskleaf Egg with inherited attacks.',
    actionHint: 'Use Village Elder',
    packWeight: 14
  },
  {
    id: 'creature-card:runebuck',
    type: 'creature',
    rarity: 'rare',
    speciesId: 20,
    name: 'Runebuck Creature Card',
    description: 'Use through Village Elder to prepare a Runebuck Egg with inherited attacks.',
    actionHint: 'Use Village Elder',
    packWeight: 6
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

export const STANDARD_CARD_PACK_REWARD_TABLE_ID = 'card-pack:standard';

const CARD_REWARD_TABLES = [
  {
    id: STANDARD_CARD_PACK_REWARD_TABLE_ID,
    sources: ['quest', 'level', 'monster-drop', 'special-building', 'manual-pack'],
    entries: CARD_CATALOG.map((card) => ({
      cardId: card.id,
      weight: card.packWeight
    }))
  }
] as const satisfies readonly CardRewardTable[];

const rewardTableById = new Map<string, CardRewardTable>(CARD_REWARD_TABLES.map((table) => [table.id, table]));

export function getCardDefinition(id: string): CardDefinition | undefined {
  return catalogById.get(id);
}

export function getCardCatalog(): readonly CardDefinition[] {
  return CARD_CATALOG;
}

export function getCardRewardTables(): readonly CardRewardTable[] {
  return CARD_REWARD_TABLES;
}

export function getCardRewardTable(id: string): CardRewardTable | undefined {
  return rewardTableById.get(id);
}

export function getCardRewardTableForSource(source: CardRewardSource): CardRewardTable {
  return CARD_REWARD_TABLES.find((table) => table.sources.includes(source)) ?? CARD_REWARD_TABLES[0];
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

export function openPack(
  state: MonsterRpgSaveState,
  options?: CardMutationOptions & { rewardTable?: CardRewardTable }
): OpenPackResult {
  const now = options?.now ?? new Date();
  const rng = options?.rng ?? createRng(options?.seed ?? now.getTime());
  const timestamp = now.toISOString();
  const rewardTable = options?.rewardTable ?? getCardRewardTableForSource('manual-pack');

  let cards = state.inventory.cards;
  let creatureCards = state.inventory.creatureCards;
  const cardEntries: PackOpenTraceCard[] = [];
  const countsByRarity = createEmptyRarityCounts();

  for (let index = 0; index < CARD_PACK_SIZE; index += 1) {
    const card = drawCardFromRewardTable(rewardTable, rng);
    if (card.type === 'creature') {
      const instance = createCreatureCardInstance(card, state.profile.playerId, creatureCards, { rng });
      creatureCards = {
        ...creatureCards,
        [instance.id]: instance
      };
      cardEntries.push({
        cardId: card.id,
        instanceId: instance.id,
        type: card.type,
        rarity: card.rarity
      });
    } else {
      cards = withCardStack(cards, card.id, state.profile.playerId, 1);
      cardEntries.push({
        cardId: card.id,
        type: card.type,
        rarity: card.rarity
      });
    }
    countsByRarity[card.rarity] += 1;
  }

  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        cards,
        creatureCards
      },
      updatedAt: timestamp
    },
    trace: {
      openedAt: timestamp,
      seed: options?.seed,
      rewardTableId: rewardTable.id,
      cards: cardEntries,
      countsByRarity
    }
  };
}

export function activateMaterialCard(state: MonsterRpgSaveState, cardId: string, options?: CardMutationOptions): CardActionResult {
  const definition = getMaterialCardById(cardId);
  if (!definition) return { ok: false, reason: 'unknown-card', state };

  const currentStack = state.inventory.cards[cardId];
  if (!currentStack || currentStack.quantity < 1) {
    return { ok: false, reason: 'missing-card', state };
  }

  const now = options?.now ?? new Date();
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
    updatedAt: now.toISOString()
  };

  return { ok: true, state: nextState };
}

export function activateBuffCard(state: MonsterRpgSaveState, cardId: string, options?: CardMutationOptions): CardActionResult {
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

  const now = options?.now ?? new Date();
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
      updatedAt: now.toISOString()
    }
  };
}

export function activateCreatureCardViaElder(state: MonsterRpgSaveState, cardId: string, options?: CardMutationOptions) {
  const now = options?.now ?? new Date();
  return convertCreatureCardViaElder(state, cardId, { ...options, now });
}

export function buildFarmCardViaElder(state: MonsterRpgSaveState, cardId: string, options?: CardMutationOptions): CardActionResult {
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

  const now = options?.now ?? new Date();
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
          [farmId]: createFarmSaveRecord({
            id: farmId,
            ownerPlayerId: state.profile.playerId,
            farmType: definition.farmType,
            villageId: state.profile.homeVillageId,
            now
          })
        }
      },
      updatedAt: now.toISOString()
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

export function drawCardFromRewardTable(table: CardRewardTable, rng: () => number): CardDefinition {
  const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rng() * totalWeight;

  for (const entry of table.entries) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      const card = getCardDefinition(entry.cardId);
      if (!card) throw new Error(`Unknown card reward table entry: ${entry.cardId}`);
      return card;
    }
  }

  const fallback = getCardDefinition(table.entries[table.entries.length - 1]?.cardId);
  if (!fallback) throw new Error(`Card reward table has no valid entries: ${table.id}`);
  return fallback;
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
