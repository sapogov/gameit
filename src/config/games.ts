import { GameDefinition } from '../types/game';

export const gameRegistry: GameDefinition[] = [
  {
    id: 'snake',
    name: 'Snake',
    description: 'Arcade snake with powerups, modes, and progression.',
    status: 'playable',
    accent: '#22c55e',
    route: '/games/snake',
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    description: 'Coming soon',
    status: 'coming-soon',
    accent: '#f97316',
    route: '/games/flappy-bird',
  },
  {
    id: 'stickman-fight',
    name: 'Stickman Fight',
    description: 'Coming soon',
    status: 'coming-soon',
    accent: '#a855f7',
    route: '/games/stickman-fight',
  },
];
