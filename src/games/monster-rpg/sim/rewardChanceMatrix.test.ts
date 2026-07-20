import { describe, expect, test, vi } from 'vitest';
import { applyRewardChanceEntryOverrides, rollRewardChanceMatrix, type RewardChanceEntry } from './rewardChanceMatrix';

const context = { zoneId: 'north', enemyRarity: 'common' as const, speciesId: 3, outcome: 'defeated' as const };
const entries: readonly RewardChanceEntry[] = [
  { id: 'guaranteed', chance: 1, quantity: [6, 8], reward: 'clinks', boostable: false },
  { id: 'bonus', chance: 0.4, quantity: [5, 10], reward: 'clinks', constraints: { outcome: 'defeated' }, boostable: true }
];

describe('reward chance matrix', () => {
  test('rolls independent inclusive entries in stable order and caps boosts at certainty', () => {
    const rolls = rollRewardChanceMatrix(entries, context, { rng: sequence([0.999, 0]), boostMultiplier: 10 });
    expect(rolls).toEqual([{ entryId: 'guaranteed', reward: 'clinks', quantity: 8 }, { entryId: 'bonus', reward: 'clinks', quantity: 5 }]);
  });

  test('does not consume a chance roll for literal certainty', () => {
    const rng = vi.fn(() => 0.999);
    expect(rollRewardChanceMatrix([entries[0]], context, { rng })).toEqual([
      { entryId: 'guaranteed', reward: 'clinks', quantity: 8 }
    ]);
    expect(rng).toHaveBeenCalledTimes(1);
  });

  test('matches scalar and array constraints against authoritative context', () => {
    const constrained = {
      ...entries[0],
      constraints: {
        zoneId: ['south', 'north'],
        enemyRarity: ['rare', 'common'] as const,
        speciesId: [2, 3],
        outcome: ['ran', 'defeated'] as const
      }
    };
    expect(rollRewardChanceMatrix([constrained], context, { rng: () => 0 })).toHaveLength(1);
    expect(rollRewardChanceMatrix([{ ...constrained, constraints: { zoneId: ['south'] } }], context, { rng: () => 0 })).toEqual([]);
  });

  test('uses an exact exclusive 40 percent chance boundary without extra RNG calls', () => {
    const below = vi.fn(sequence([0.399_999, 0]));
    const boundary = vi.fn(() => 0.4);

    expect(rollRewardChanceMatrix([entries[1]], context, { rng: below })).toHaveLength(1);
    expect(below).toHaveBeenCalledTimes(2);
    expect(rollRewardChanceMatrix([entries[1]], context, { rng: boundary })).toEqual([]);
    expect(boundary).toHaveBeenCalledTimes(1);
  });

  test('does not boost entries without explicit opt-in and fails closed on missing authority context', () => {
    expect(rollRewardChanceMatrix([{ ...entries[0], chance: 0.4 }], context, { rng: () => 0.5, boostMultiplier: 10 })).toEqual([]);
    expect(rollRewardChanceMatrix(entries, undefined, { rng: () => 0 })).toEqual([]);
    expect(rollRewardChanceMatrix(entries, { ...context, zoneId: '' }, { rng: () => 0 })).toEqual([]);
    expect(() => rollRewardChanceMatrix([{ ...entries[0], constraints: { unknown: undefined } as any }], context, { rng: () => 0 })).toThrow('Invalid reward chance constraints');
  });

  test('normalizes invalid and out-of-range RNG values deterministically', () => {
    expect(rollRewardChanceMatrix([{ ...entries[0], quantity: [0, 1] }], context, { rng: () => Number.NaN })).toEqual([
      { entryId: 'guaranteed', reward: 'clinks', quantity: 0 }
    ]);
    expect(rollRewardChanceMatrix([{ ...entries[0], quantity: [0, 1] }], context, { rng: () => 2 })).toEqual([
      { entryId: 'guaranteed', reward: 'clinks', quantity: 1 }
    ]);
  });

  test('rejects duplicate or invalid matrices before making any RNG calls', () => {
    const rng = vi.fn(() => 0);
    expect(() => rollRewardChanceMatrix([entries[0], entries[0]], context, { rng })).toThrow('Duplicate reward chance entry');
    expect(() => rollRewardChanceMatrix([{ ...entries[0], quantity: [2, 1] }], context, { rng })).toThrow('Invalid reward chance entry');
    expect(rng).not.toHaveBeenCalled();
  });

  test('replaces matching IDs in place and appends new overrides', () => {
    expect(applyRewardChanceEntryOverrides(entries, [{ ...entries[0], chance: 0.5 }, { id: 'extra', chance: 1, quantity: [1, 1], reward: 'dust' }]).map((entry) => entry.id)).toEqual(['guaranteed', 'bonus', 'extra']);
  });
});

function sequence(values: number[]): () => number { let index = 0; return () => values[index++] ?? 0; }
