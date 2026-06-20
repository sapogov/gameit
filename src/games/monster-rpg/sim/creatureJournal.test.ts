import { describe, expect, test } from 'vitest';
import {
  createInitialSave,
  createPlayerProfile,
  getJournalSpeciesViewState,
  recordCreatureDiscovered,
  recordWildCreatureSeen
} from './index';

describe('Creature Journal progression', () => {
  test('unseen species become silhouette-only after a wild battle sighting', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    const updated = recordWildCreatureSeen(save, 1);

    expect(getJournalSpeciesViewState(save, 1)).toBe('unseen');
    expect(getJournalSpeciesViewState(updated, 1)).toBe('silhouette');
    expect(updated.journal.species['1']).toBe('silhouette');
  });

  test('receiving a card or hatching a direct-drop egg marks species discovered', () => {
    const save = createInitialSave(createPlayerProfile('Vera', 'keeper'));
    const seen = recordWildCreatureSeen(save, 20);
    const discovered = recordCreatureDiscovered(seen, 20);

    expect(getJournalSpeciesViewState(discovered, 20)).toBe('discovered');
    expect(recordWildCreatureSeen(discovered, 20)).toBe(discovered);
  });

  test('unknown species references are rejected at the simulation boundary', () => {
    const save = createInitialSave(createPlayerProfile('Paz', 'ranger'));

    expect(() => recordWildCreatureSeen(save, 999)).toThrow('Unknown creature species 999');
    expect(() => recordCreatureDiscovered(save, 999)).toThrow('Unknown creature species 999');
  });
});
