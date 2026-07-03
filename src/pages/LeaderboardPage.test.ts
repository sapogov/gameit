import { describe, expect, it, vi } from 'vitest';
import { gameRegistry } from '../config/games';
import { type LeaderboardEntry, type LeaderboardRange, type GameId } from '../types/game';
import { buildLeaderboardViewModel } from './LeaderboardPage';

const entriesByRange: Record<GameId, Partial<Record<LeaderboardRange, LeaderboardEntry[]>>> = {
  snake: {
    daily: [
      {
        gameId: 'snake',
        playerName: 'Nami',
        skin: 'Glow',
        mode: 'classic',
        score: 310,
        levelReached: 7,
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    ],
    weekly: [],
    'all-time': [
      {
        gameId: 'snake',
        playerName: 'Nami',
        skin: 'Glow',
        mode: 'classic',
        score: 310,
        levelReached: 7,
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    ],
  },
  'gameit-monsters': {
    weekly: [
      {
        gameId: 'gameit-monsters',
        playerName: 'Milo',
        skin: 'Default',
        mode: 'party',
        score: 120,
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    ],
  },
  'flappy-bird': {},
  'stickman-fight': {},
  'void-runner': {},
  'mana-breach': {},
  'circuit-breaker': {},
  'frost-bite': {},
};

const createProvider = () => {
  return {
    listByGame: vi.fn((gameId: GameId, range: LeaderboardRange) => entriesByRange[gameId]?.[range] ?? []),
    addEntry: vi.fn(),
  };
};


describe('leaderboard view model', () => {
  it('queries the selected game and range from the provider', () => {
    const provider = createProvider();

    const snakeDaily = buildLeaderboardViewModel({
      provider,
      games: gameRegistry,
      selectedGameId: 'snake',
      selectedRange: 'daily',
    });

    const monsterWeekly = buildLeaderboardViewModel({
      provider,
      games: gameRegistry,
      selectedGameId: 'gameit-monsters',
      selectedRange: 'weekly',
    });

    expect(provider.listByGame).toHaveBeenCalledTimes(2);
    expect(provider.listByGame).toHaveBeenCalledWith('snake', 'daily');
    expect(provider.listByGame).toHaveBeenNthCalledWith(2, 'gameit-monsters', 'weekly');
    expect(snakeDaily.gameName).toBe('Snake');
    expect(monsterWeekly.gameName).toBe('GameIt Monsters');
    expect(monsterWeekly.rows[0].rank).toBe(1);
  });

  it('returns clear empty-state copy when no rows exist', () => {
    const provider = createProvider();
    const emptyWeekly = buildLeaderboardViewModel({
      provider,
      games: gameRegistry,
      selectedGameId: 'snake',
      selectedRange: 'weekly',
    });

    expect(emptyWeekly.isEmpty).toBe(true);
    expect(emptyWeekly.rangeLabel).toBe('Weekly');
    expect(emptyWeekly.emptyStateMessage).toBe('No Weekly scores for Snake yet.');
  });
});
