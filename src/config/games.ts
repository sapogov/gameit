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
    description: 'One-button sky sprint through shifting neon gates.',
    genre: 'platformer',
    status: 'coming-soon',
    featured: false,
    accent: '#f97316',
    assets: {
      cover: 'portal-cover-flappy-bird',
      hero: 'portal-hero-flappy-bird',
    },
    route: '/games/flappy-bird',
  },
  {
    id: 'stickman-fight',
    name: 'Stickman Fight',
    description: 'Fast arena duels with sharp silhouettes and impact-heavy rounds.',
    genre: 'fighting',
    status: 'coming-soon',
    featured: false,
    accent: '#a855f7',
    assets: {
      cover: 'portal-cover-stickman-fight',
      hero: 'portal-hero-stickman-fight',
    },
    route: '/games/stickman-fight',
  },
  {
    id: 'void-runner',
    name: 'Void Runner',
    description: 'Dash across neon lanes while the level folds around you.',
    genre: 'platformer',
    status: 'coming-soon',
    featured: false,
    accent: '#06b6d4',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/void-runner',
  },
  {
    id: 'mana-breach',
    name: 'Mana Breach',
    description: 'Build a tiny deck and break spell shields in quick rounds.',
    genre: 'arcade',
    status: 'coming-soon',
    featured: false,
    accent: '#ec4899',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/mana-breach',
  },
  {
    id: 'circuit-breaker',
    name: 'Circuit Breaker',
    description: 'Route power, dodge locks, and solve compact logic boards.',
    genre: 'arcade',
    status: 'coming-soon',
    featured: false,
    accent: '#6366f1',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/circuit-breaker',
  },
  {
    id: 'frost-bite',
    name: 'Frost Bite',
    description: 'Survive a frozen route with supplies, timing, and nerve.',
    genre: 'platformer',
    status: 'coming-soon',
    featured: false,
    accent: '#38bdf8',
    assets: {
      cover: 'portal-cover-coming-soon',
      hero: 'portal-hero-coming-soon',
    },
    route: '/games/frost-bite',
  },
];

export function getFeaturedGame(games: readonly GameDefinition[] = gameRegistry): GameDefinition {
  const featuredPlayable = games.find((game) => game.featured && game.status === 'playable');
  const firstPlayable = games.find((game) => game.status === 'playable');

  return featuredPlayable ?? firstPlayable ?? games[0];
}
