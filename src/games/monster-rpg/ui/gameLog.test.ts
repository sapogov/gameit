import { describe, expect, it } from 'vitest';
import {
  appendGameLogEntry,
  beginImportedSaveGameLogSession,
  beginProfileGameLogSession,
  createGameLogState,
  formatGameLogEntry,
  GAME_LOG_LIMIT,
  initialGameLogState,
  resetProfileGameLogSession,
  type GameLogState
} from './gameLog';

describe('Game Log', () => {
  it('keeps deterministic oldest-to-newest ordering and evicts old entries at its bound', () => {
    const state = Array.from({ length: GAME_LOG_LIMIT + 2 }).reduce<GameLogState>(
      (log, _, index) => appendGameLogEntry(log, 'system', `event ${index + 1}`),
      initialGameLogState
    );

    expect(state.entries).toHaveLength(GAME_LOG_LIMIT);
    expect(state.entries.map((entry) => entry.message)).toEqual(
      Array.from({ length: GAME_LOG_LIMIT }, (_, index) => `event ${index + 3}`)
    );
    expect(state.entries[0]).toMatchObject({ id: 'game-log-3', message: 'event 3' });
    expect(state.entries.at(-1)).toMatchObject({ id: `game-log-${GAME_LOG_LIMIT + 2}`, message: `event ${GAME_LOG_LIMIT + 2}` });
  });

  it('formats each supported category and starts clean for a new local session', () => {
    const kinds = ['reward', 'battle', 'interaction', 'travel', 'system'] as const;
    const populated = kinds.reduce<GameLogState>(
      (log, kind) => appendGameLogEntry(log, kind, 'Saved detail'),
      initialGameLogState
    );

    expect(populated.entries.map(formatGameLogEntry)).toEqual([
      'Reward: Saved detail', 'Battle: Saved detail', 'Interaction: Saved detail', 'Travel: Saved detail', 'System: Saved detail'
    ]);
    expect(initialGameLogState.entries).toEqual([]);
  });

  it('uses production profile, import, and reset transitions to clear and rebind sessions', () => {
    const dirtySession = appendGameLogEntry(
      appendGameLogEntry(createGameLogState('old-player'), 'reward', 'Old reward'),
      'interaction',
      'Old interaction'
    );

    const profileSession = beginProfileGameLogSession(dirtySession, 'profile-player');
    const profileWithEntry = appendGameLogEntry(profileSession, 'interaction', 'Profile ready');
    expect(profileSession).toEqual({ sessionPlayerId: 'profile-player', nextId: 1, entries: [] });
    expect(profileWithEntry.entries).toEqual([
      { id: 'game-log-1', kind: 'interaction', message: 'Profile ready' }
    ]);

    const importSession = beginImportedSaveGameLogSession(dirtySession, 'imported-player');
    const importWithEntry = appendGameLogEntry(importSession, 'reward', 'Imported reward');
    expect(importSession).toEqual({
      sessionPlayerId: 'imported-player',
      nextId: 2,
      entries: [{ id: 'game-log-1', kind: 'system', message: 'Save imported' }]
    });
    expect(importWithEntry.entries.map((entry) => [entry.id, entry.message])).toEqual([
      ['game-log-1', 'Save imported'],
      ['game-log-2', 'Imported reward']
    ]);

    expect(resetProfileGameLogSession(dirtySession)).toEqual(initialGameLogState);
  });

  it('does not leak entries when production profile transition switches players', () => {
    const playerA = appendGameLogEntry(createGameLogState('player-a'), 'reward', 'Player A reward');
    const playerB = beginProfileGameLogSession(playerA, 'player-b');
    const playerBWithEntry = appendGameLogEntry(playerB, 'battle', 'Player B battle');

    expect(playerBWithEntry.sessionPlayerId).toBe('player-b');
    expect(playerBWithEntry.entries).toEqual([
      { id: 'game-log-1', kind: 'battle', message: 'Player B battle' }
    ]);
  });
});
