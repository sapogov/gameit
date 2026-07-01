import type { GameDefinition } from '../types/game';

export const gameRegistry: GameDefinition[] = [
  {
    id: 'snake',
    name: 'Snake',
    description: 'Arcade snake with powerups, modes, and progression.',
    genre: 'arcade',
    status: 'playable',
    featured: false,
    accent: '#22c55e',
    assets: {
      cover: 'portal-cover-snake',
      hero: 'portal-hero-snake',
    },
    route: '/games/snake',
  },
  {
    id: 'gameit-monsters',
    name: 'GameIt Monsters',
    description: 'Retro monster collecting with village exploration and online presence.',
    genre: 'monster-rpg',
    status: 'playable',
    featured: true,
    accent: '#95c46d',
    assets: {
      cover: 'portal-cover-gameit-monsters',
      hero: 'portal-hero-gameit-monsters',
    },
    route: '/games/gameit-monsters',
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    description: 'Coming soon',
    genre: 'arcade',
    status: 'coming-soon',
    featured: false,
    accent: '#f97316',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/flappy-bird',
  },
  {
    id: 'stickman-fight',
    name: 'Stickman Fight',
    description: 'Coming soon',
    genre: 'fighting',
    status: 'coming-soon',
    featured: false,
    accent: '#a855f7',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/stickman-fight',
  },
];

export function getFeaturedGame(games: readonly GameDefinition[] = gameRegistry): GameDefinition {
  const featuredPlayable = games.find((game) => game.featured && game.status === 'playable');
  const firstPlayable = games.find((game) => game.status === 'playable');

  return featuredPlayable ?? firstPlayable ?? games[0];
}
