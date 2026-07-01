export type GameId = 'snake' | 'gameit-monsters' | 'flappy-bird' | 'stickman-fight';
export type GameStatus = 'playable' | 'coming-soon';
export type GameGenre = 'arcade' | 'monster-rpg' | 'platformer' | 'fighting';
export type PortalImageRole = 'cover' | 'hero';
export type PortalImageAssetKey =
  | 'portal-cover-snake'
  | 'portal-hero-snake'
  | 'portal-cover-gameit-monsters'
  | 'portal-hero-gameit-monsters'
  | 'portal-cover-coming-soon'
  | 'portal-hero-coming-soon'
  | 'portal-cover-fallback'
  | 'portal-hero-fallback';

export interface PortalImageAsset {
  key: PortalImageAssetKey;
  role: PortalImageRole;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  description: string;
  genre: GameGenre;
  status: GameStatus;
  featured: boolean;
  accent: string;
  assets: {
    cover: PortalImageAssetKey;
    hero: PortalImageAssetKey;
  };
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
