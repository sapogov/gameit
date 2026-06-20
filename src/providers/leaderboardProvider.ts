import { LeaderboardEntry, GameId, LeaderboardRange } from '../types/game';
import { readLocal, writeLocal } from '../lib/storage';

export interface LeaderboardProvider {
  listByGame(gameId: GameId, range: LeaderboardRange): LeaderboardEntry[];
  addEntry(entry: LeaderboardEntry): void;
}

const KEY = 'gameit.leaderboards.v1';

const withinRange = (iso: string, range: LeaderboardRange): boolean => {
  if (range === 'all-time') return true;
  const now = new Date();
  const created = new Date(iso);
  const diff = now.getTime() - created.getTime();
  const day = 1000 * 60 * 60 * 24;
  return range === 'daily' ? diff <= day : diff <= day * 7;
};

export class LocalStorageLeaderboardProvider implements LeaderboardProvider {
  listByGame(gameId: GameId, range: LeaderboardRange) {
    return readLocal<LeaderboardEntry[]>(KEY, [])
      .filter((entry) => entry.gameId === gameId && withinRange(entry.createdAt, range))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  addEntry(entry: LeaderboardEntry) {
    const current = readLocal<LeaderboardEntry[]>(KEY, []);
    current.push(entry);
    writeLocal(KEY, current);
  }
}

export class RemoteLeaderboardProviderStub implements LeaderboardProvider {
  listByGame() {
    return [];
  }
  addEntry() {
    console.info('TODO: remote leaderboard provider integration');
  }
}
