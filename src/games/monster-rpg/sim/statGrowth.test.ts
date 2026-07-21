import { describe, expect, test } from 'vitest';
import type { CreatureSaveRecord } from './types';
import { appendStatGrowth, applyCreatureExperience, getGrowthDeltas, isValidStatGrowthState, rebalanceCreatureStats } from './statGrowth';
import { GAME_BALANCE_CONFIG } from './gameBalance';
import { getSpeciesById } from './speciesCatalog';

const creature: CreatureSaveRecord = {
  id: 'creature-1', ownerPlayerId: 'player-1', speciesId: 1, level: 1, experience: 0,
  stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 }, attacks: [], hp: 12, maxHp: 20, fainted: false, cooldowns: {},
  statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 } }, events: [] }
};

describe('Creature stat growth', () => {
  test('uses deterministic defaults reproducibly and preserves current HP after max-HP growth', () => {
    const options = { rng: () => 0.9, now: () => new Date('2026-07-20T00:00:00.000Z') };
    const first = applyCreatureExperience(creature, 100, 'common', options);
    const second = applyCreatureExperience(creature, 100, 'common', options);
    expect(first).toEqual(second);
    expect(first.stats).toEqual({ hp: 22, attack: 11, defense: 11, speed: 11, stamina: 11 });
    expect(first.maxHp).toBe(22);
    expect(first.hp).toBe(14);
    expect(first.statGrowth?.events).toHaveLength(1);
  });

  test('keeps Fainted creatures at zero HP and persists a random event exactly once', () => {
    const fainted = { ...creature, hp: 0, fainted: true };
    const grown = applyCreatureExperience(fainted, 100, 'rare', { model: 'rarity-weighted-random', rng: () => 0, now: () => new Date('2026-07-20T00:00:00.000Z') });
    expect(grown.hp).toBe(0);
    expect(grown.maxHp).toBeGreaterThan(fainted.maxHp);
    expect(applyCreatureExperience(grown, 0, 'rare')).toEqual(grown);
  });

  test('weights random growth by rarity and preserves historical deltas when model changes', () => {
    const common = getGrowthDeltas('common', 'rarity-weighted-random', () => 0);
    const rare = getGrowthDeltas('rare', 'rarity-weighted-random', () => 0);
    expect(rare.hp).toBeGreaterThan(common.hp);
    const grown = applyCreatureExperience(creature, 100, 'common', { now: () => new Date('2026-07-20T00:00:00.000Z') });
    const switched = applyCreatureExperience(grown, 100, 'common', { model: 'rarity-weighted-random', rng: () => 0, now: () => new Date('2026-07-21T00:00:00.000Z') });
    expect(switched.statGrowth?.events.map((event) => event.model)).toEqual(['deterministic-default', 'rarity-weighted-random']);
  });

  test('uses canonical Species and Creature Type tendencies while retaining lower-outcome weighting', () => {
    const species = getSpeciesById(1);
    if (!species) throw new Error('missing canonical Species');
    const preferred = getGrowthDeltas('common', 'rarity-weighted-random', () => 0, species);
    const lowerRoll = getGrowthDeltas('common', 'rarity-weighted-random', () => 0.1);
    const higherRoll = getGrowthDeltas('common', 'rarity-weighted-random', () => 0.9);
    expect(preferred.stamina).toBeGreaterThan(preferred.attack);
    expect(lowerRoll.hp).toBeLessThan(higherRoll.hp);
  });

  test('switches the selected future model without a level-up and has idempotent deterministic rebalance', () => {
    const switched = applyCreatureExperience(creature, 0, 'common', { model: 'rarity-weighted-random' });
    expect(switched.statGrowth?.model).toBe('rarity-weighted-random');
    expect(switched.stats).toEqual(creature.stats);
    const rebalanced = rebalanceCreatureStats(creature, 'common', { now: () => new Date('2026-07-20T00:00:00.000Z') });
    expect(rebalanced).toEqual(creature);
    expect(GAME_BALANCE_CONFIG.creatureStatGrowth.model).toBe('deterministic-default');
  });

  test('rejects replay-consistent forged deterministic growth', () => {
    const forgedDeltas = { hp: 100, attack: 100, defense: 100, speed: 100, stamina: 100 };
    const forgedStats = { hp: 120, attack: 110, defense: 110, speed: 110, stamina: 110 };
    const forgedAtBasis = {
      model: 'deterministic-default' as const,
      basis: creature.statGrowth!.basis,
      events: [{ id: 'growth:1', kind: 'level-up' as const, level: 1, model: 'deterministic-default' as const, deltas: forgedDeltas, createdAt: '2026-07-20T00:00:00.000Z' }]
    };
    const forgedGrowth = {
      model: 'deterministic-default' as const,
      basis: creature.statGrowth!.basis,
      events: [{ id: 'growth:2', kind: 'level-up' as const, level: 2, model: 'deterministic-default' as const, deltas: forgedDeltas, createdAt: '2026-07-20T00:00:00.000Z' }]
    };
    expect(isValidStatGrowthState(forgedAtBasis, 1, forgedStats, 120)).toBe(false);
    expect(isValidStatGrowthState(forgedGrowth, 2, forgedStats, 120)).toBe(false);
  });

  test('accepts canonical non-zero repeated rebalance events after level growth', () => {
    const grown = applyCreatureExperience(creature, 100, 'common', { now: () => new Date('2026-07-20T00:00:00.000Z') });
    const once = appendStatGrowth(grown, { id: 'rebalance:2:1', kind: 'rebalance', model: 'rebalance', level: 2, deltas: { hp: 0, attack: 2, defense: 0, speed: 0, stamina: 0 }, createdAt: '2026-07-21T00:00:00.000Z' });
    const twice = appendStatGrowth(once, { id: 'rebalance:2:2', kind: 'rebalance', model: 'rebalance', level: 2, deltas: { hp: 0, attack: -1, defense: 0, speed: 0, stamina: 0 }, createdAt: '2026-07-22T00:00:00.000Z' });
    expect(twice.stats.attack).toBe(grown.stats.attack + 1);
    expect(isValidStatGrowthState(twice.statGrowth, twice.level, twice.stats, twice.maxHp)).toBe(true);
  });
});
