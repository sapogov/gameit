import { expect, test } from 'vitest';
import { ITEM_DEFINITIONS, validateItemCatalog } from './items';

test('catalog has fourteen unique valid definitions', () => {
  expect(ITEM_DEFINITIONS).toHaveLength(14);
  expect(ITEM_DEFINITIONS.map((item) => [item.id, item.name, item.category, item.rarity, item.buyPrice, item.sellPrice, item.effect, item.maxStack, item.discardable])).toEqual([
    ['mending-sprig', 'Mending Sprig', 'healing', 'common', 30, 12, 'restore 15 HP', 99, true],
    ['hearty-draught', 'Hearty Draught', 'healing', 'uncommon', 90, 36, 'restore 50% max HP', 99, true],
    ['fullbloom-elixir', 'Fullbloom Elixir', 'healing', 'rare', 250, 100, 'full heal', 99, true],
    ['wakeleaf', 'Wakeleaf', 'revive', 'uncommon', 120, 48, 'revive 5-10 HP', 99, true],
    ['lifespring-elixir', 'Lifespring Elixir', 'full-revive', 'double-rare', 600, 240, 'revive full HP', 99, true],
    ['second-wind-tea', 'Second-Wind Tea', 'fatigue-recovery', 'common', 35, 14, 'remove 30 Fatigue', 99, true],
    ['clearhead-tonic', 'Clearhead Tonic', 'fatigue-recovery', 'uncommon', 100, 40, 'remove all Fatigue', 99, true],
    ['fangbrew', 'Fangbrew', 'creature-buff', 'uncommon', 140, 56, '+20% outgoing Attack damage until Battle end', 99, true],
    ['ironbark-tonic', 'Ironbark Tonic', 'creature-buff', 'uncommon', 140, 56, '20% incoming damage reduction until Battle end', 99, true],
    ['quickstep-fizz', 'Quickstep Fizz', 'creature-buff', 'uncommon', 140, 56, '20% shorter action cooldowns until Battle end', 99, true],
    ['rallybrew', 'Rallybrew', 'party-buff', 'rare', 400, 160, '+10% offense/defense/tempo until Battle end', 99, true],
    ['worn-key', 'Worn Key', 'consumable-key', 'common', 75, 30, 'strength 1', 99, true],
    ['runed-key', 'Runed Key', 'consumable-key', 'rare', 350, 140, 'strength 2', 99, true],
    ['crown-key', 'Crown Key', 'consumable-key', 'ultra-rare', 1200, 480, 'strength 3', 99, true]
  ]);
  expect(validateItemCatalog()).toEqual([]);
});

test('catalog validation rejects every canonical definition field mutation', () => {
  const fields = ['id', 'name', 'category', 'rarity', 'buyPrice', 'sellPrice', 'effect', 'maxStack', 'discardable'] as const;
  for (const field of fields) {
    const mutated = ITEM_DEFINITIONS.map((item) => ({ ...item }));
    mutated[0][field] = (field === 'discardable' ? false : `changed-${field}`) as never;
    expect(validateItemCatalog(mutated)).not.toEqual([]);
  }
});
