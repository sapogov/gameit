export type GameId = 'snake' | 'flappy-bird' | 'stickman-fight';

export interface GameDefinition {
  id: GameId;
  name: string;
  description: string;
  status: 'playable' | 'coming-soon';
  accent: string;
  route: string;
}

export interface LeaderboardEntry {
  gameId: GameId;
  playerName: string;
  skin: string;
  mode: string;
  score: number;
  levelReached?: number;
  createdAt: string;
}

export type LeaderboardRange = 'daily' | 'weekly' | 'all-time';
