import type { JournalSpeciesViewState, MonsterRpgSaveState } from './types';
import { getSpeciesById } from './speciesCatalog';

export function getJournalSpeciesViewState(state: MonsterRpgSaveState, speciesId: number): JournalSpeciesViewState {
  return state.journal.species[String(speciesId)] ?? 'unseen';
}

export function recordWildCreatureSeen(state: MonsterRpgSaveState, speciesId: number): MonsterRpgSaveState {
  assertKnownSpecies(speciesId);
  const key = String(speciesId);
  if (state.journal.species[key]) return state;

  return withJournalSpeciesState(state, speciesId, 'silhouette');
}

export function recordCreatureDiscovered(state: MonsterRpgSaveState, speciesId: number): MonsterRpgSaveState {
  assertKnownSpecies(speciesId);
  if (getJournalSpeciesViewState(state, speciesId) === 'discovered') return state;

  return withJournalSpeciesState(state, speciesId, 'discovered');
}

function withJournalSpeciesState(
  state: MonsterRpgSaveState,
  speciesId: number,
  journalState: 'silhouette' | 'discovered'
): MonsterRpgSaveState {
  return {
    ...state,
    journal: {
      ...state.journal,
      species: {
        ...state.journal.species,
        [String(speciesId)]: journalState
      }
    },
    updatedAt: new Date().toISOString()
  };
}

function assertKnownSpecies(speciesId: number): void {
  if (!getSpeciesById(speciesId)) {
    throw new Error(`Unknown creature species ${speciesId}`);
  }
}
