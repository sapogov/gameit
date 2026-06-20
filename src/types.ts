export type Theme = 'dark' | 'light';

export type Mode = 'Arcade' | 'Ranked' | 'Time Attack' | 'Casual';

export interface Game {
  id: string;
  title: string;
  description: string;
  cover: string;
  route: string;
  modes: Mode[];
  enabled: boolean;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  skin: string;
  mode: Mode;
  score: number;
  date: string;
}

export type LeaderboardRange = 'day' | 'week' | 'month' | 'all';
