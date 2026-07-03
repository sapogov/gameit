import { describe, expect, it } from 'vitest';
import { gameRegistry } from '../config/games';
import { getPortalImageAsset } from '../config/portalAssets';
import { filterLibraryGames, formatLibraryLabel, getLibraryGenres } from './libraryCatalog';

describe('library catalog filtering', () => {
  it('returns every registered game with default filters', () => {
    expect(filterLibraryGames(gameRegistry, { genre: 'all', query: '', status: 'all' })).toEqual(gameRegistry);
  });

  it('searches player-visible game names and descriptions', () => {
    expect(filterLibraryGames(gameRegistry, { genre: 'all', query: 'retro monster', status: 'all' }).map((game) => game.id))
      .toEqual(['gameit-monsters']);
    expect(filterLibraryGames(gameRegistry, { genre: 'all', query: 'powerups', status: 'all' }).map((game) => game.id))
      .toEqual(['snake']);
  });

  it('filters by registry genre metadata', () => {
    expect(getLibraryGenres(gameRegistry)).toContain('arcade');
    expect(filterLibraryGames(gameRegistry, { genre: 'fighting', query: '', status: 'all' }).map((game) => game.id))
      .toEqual(['stickman-fight']);
    expect(formatLibraryLabel('monster-rpg')).toBe('Monster RPG');
  });

  it('separates playable and coming-soon games', () => {
    const playable = filterLibraryGames(gameRegistry, { genre: 'all', query: '', status: 'playable' });
    const comingSoon = filterLibraryGames(gameRegistry, { genre: 'all', query: '', status: 'coming-soon' });

    expect(playable.map((game) => game.id)).toEqual(['snake', 'gameit-monsters']);
    expect(comingSoon.map((game) => game.id)).toEqual([
      'flappy-bird',
      'stickman-fight',
      'void-runner',
      'mana-breach',
      'circuit-breaker',
      'frost-bite',
    ]);
  });

  it('uses local cover assets and fallbacks for catalog cards', () => {
    for (const game of gameRegistry) {
      expect(getPortalImageAsset(game.assets.cover, 'cover').src).toMatch(/^\/assets\/portal\//);
    }

    expect(getPortalImageAsset(undefined, 'cover').key).toBe('portal-cover-fallback');
  });
});
