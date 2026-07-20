export const ITEM_CATALOG = [
  ['mending-sprig', 'Mending Sprig', 'healing', 'common', 30, 'restore 15 HP'],
  ['hearty-draught', 'Hearty Draught', 'healing', 'uncommon', 90, 'restore 50% max HP'],
  ['fullbloom-elixir', 'Fullbloom Elixir', 'healing', 'rare', 250, 'full heal'],
  ['wakeleaf', 'Wakeleaf', 'revive', 'uncommon', 120, 'revive 5-10 HP'],
  ['lifespring-elixir', 'Lifespring Elixir', 'full-revive', 'double-rare', 600, 'revive full HP'],
  ['second-wind-tea', 'Second-Wind Tea', 'fatigue-recovery', 'common', 35, 'remove 30 Fatigue'],
  ['clearhead-tonic', 'Clearhead Tonic', 'fatigue-recovery', 'uncommon', 100, 'remove all Fatigue'],
  ['fangbrew', 'Fangbrew', 'creature-buff', 'uncommon', 140, '+20% outgoing Attack damage until Battle end'],
  ['ironbark-tonic', 'Ironbark Tonic', 'creature-buff', 'uncommon', 140, '20% incoming damage reduction until Battle end'],
  ['quickstep-fizz', 'Quickstep Fizz', 'creature-buff', 'uncommon', 140, '20% shorter action cooldowns until Battle end'],
  ['rallybrew', 'Rallybrew', 'party-buff', 'rare', 400, '+10% offense/defense/tempo until Battle end'],
  ['worn-key', 'Worn Key', 'consumable-key', 'common', 75, 'strength 1'],
  ['runed-key', 'Runed Key', 'consumable-key', 'rare', 350, 'strength 2'],
  ['crown-key', 'Crown Key', 'consumable-key', 'ultra-rare', 1200, 'strength 3']
] as const;

export type ItemId = (typeof ITEM_CATALOG)[number][0];
export type ItemDefinition = { id: ItemId; name: string; category: string; rarity: string; buyPrice: number; sellPrice: number; effect: string; maxStack: number; discardable: boolean };
export const ITEM_DEFINITIONS: readonly ItemDefinition[] = Object.freeze(ITEM_CATALOG.map(([id, name, category, rarity, buyPrice, effect]) => Object.freeze({ id, name, category, rarity, buyPrice, sellPrice: Math.floor(buyPrice * 0.4), effect, maxStack: 99, discardable: true })));
export const itemById = new Map<ItemId, ItemDefinition>(ITEM_DEFINITIONS.map((item) => [item.id, item]));
export function getItemDefinition(id: string): ItemDefinition | undefined { return itemById.get(id as ItemId); }
export function isItemId(id: unknown): id is ItemId { return typeof id === 'string' && itemById.has(id as ItemId); }
export function validateItemCatalog(items: readonly ItemDefinition[] = ITEM_DEFINITIONS): string[] {
  if (items.length !== 14) return ['catalog must contain exactly 14 items'];
  const ids = new Set(items.map((item) => item.id));
  return ids.size === items.length && items.every((item) => Number.isSafeInteger(item.buyPrice) && item.buyPrice > 0 && Number.isSafeInteger(item.maxStack) && item.maxStack > 0) ? [] : ['catalog ids and numeric values must be valid'];
}
