import type { Game } from '../types';

export const defaultGames: Game[] = [
  {
    id: 'neon-revenant',
    title: 'Neon Revenant',
    description: 'Master kinetic combat in a glowing cyber arena.',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    route: '/game/neon-revenant',
    modes: ['Arcade', 'Ranked'],
    enabled: true
  },
  {
    id: 'void-runner',
    title: 'Void Runner',
    description: 'Race through star lanes and dodge collapsing sectors.',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    route: '/game/void-runner',
    modes: ['Time Attack', 'Casual'],
    enabled: true
  },
  {
    id: 'mana-breach',
    title: 'Mana Breach',
    description: 'Deck combat with fast rounds and brutal counters.',
    cover: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=80',
    route: '/game/mana-breach',
    modes: ['Arcade', 'Ranked'],
    enabled: true
  },
  {
    id: 'circuit-breaker',
    title: 'Circuit Breaker',
    description: 'Hack puzzle boards under strict time pressure.',
    cover: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=80',
    route: '/game/circuit-breaker',
    modes: ['Casual', 'Time Attack'],
    enabled: true
  },
  {
    id: 'sky-siege',
    title: 'Sky Siege',
    description: 'Airship skirmishes with upgrade-driven builds.',
    cover: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80',
    route: '/game/sky-siege',
    modes: ['Arcade', 'Ranked'],
    enabled: true
  },
  {
    id: 'pixel-gauntlet',
    title: 'Pixel Gauntlet',
    description: 'Retro platform trials designed for speedrunners.',
    cover: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?auto=format&fit=crop&w=900&q=80',
    route: '/game/pixel-gauntlet',
    modes: ['Time Attack', 'Casual'],
    enabled: true
  },
  {
    id: 'rift-defender',
    title: 'Rift Defender',
    description: 'Protect energy cores against escalating swarms.',
    cover: 'https://images.unsplash.com/photo-1472457974886-0ebcd59440cc?auto=format&fit=crop&w=900&q=80',
    route: '/game/rift-defender',
    modes: ['Arcade', 'Casual'],
    enabled: true
  },
  {
    id: 'nova-arena',
    title: 'Nova Arena',
    description: 'Arena shooter with loadout-based progression.',
    cover: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80',
    route: '/game/nova-arena',
    modes: ['Ranked', 'Arcade'],
    enabled: true
  }
];
