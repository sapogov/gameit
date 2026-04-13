import { defaultGames } from '../data/defaultGames';
import type { Game, LeaderboardEntry, LeaderboardRange } from '../types';

const GAMES_KEY = 'gameit.games';
const ENTRIES_KEY = 'gameit.entries';

const dayMs = 24 * 60 * 60 * 1000;

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function seedGames(): Game[] {
  const existing = parse<Game[]>(localStorage.getItem(GAMES_KEY), []);
  if (existing.length > 0) return existing;
  localStorage.setItem(GAMES_KEY, JSON.stringify(defaultGames));
  return defaultGames;
}

function seedEntries(games: Game[]): LeaderboardEntry[] {
  const existing = parse<LeaderboardEntry[]>(localStorage.getItem(ENTRIES_KEY), []);
  if (existing.length > 0) return existing;

  const seeded = games.flatMap((game, index) => {
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(Date.now() - (index + i) * dayMs).toISOString();
      return {
        id: `${game.id}-${i}`,
        gameId: game.id,
        playerName: `Player_${index + 1}${i}`,
        skin: ['Neon', 'Shadow', 'Classic'][i % 3],
        mode: game.modes[i % game.modes.length],
        score: 1100 - index * 23 - i * 11,
        date
      };
    });
  });

  localStorage.setItem(ENTRIES_KEY, JSON.stringify(seeded));
  return seeded;
}

export function getGames(): Game[] {
  return seedGames();
}

export function saveGame(updated: Game): void {
  const games = getGames().map((item) => (item.id === updated.id ? updated : item));
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function createGame(input: Omit<Game, 'route'>): Game {
  const game: Game = { ...input, route: `/game/${input.id}` };
  const games = [...getGames(), game];
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  return game;
}

export function getLeaderboardEntries(gameId: string, range: LeaderboardRange): LeaderboardEntry[] {
  const entries = seedEntries(getGames()).filter((entry) => entry.gameId === gameId);
  const now = Date.now();

  const filtered = entries.filter((entry) => {
    if (range === 'all') return true;
    const age = now - new Date(entry.date).getTime();
    if (range === 'day') return age <= dayMs;
    if (range === 'week') return age <= dayMs * 7;
    return age <= dayMs * 31;
  });

  return filtered.sort((a, b) => b.score - a.score);
}
