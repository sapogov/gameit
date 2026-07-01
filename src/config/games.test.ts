import { describe, expect, it } from 'vitest';
import { gameRegistry, getFeaturedGame } from './games';
import { getPortalImageAsset, getPortalImageSrc } from './portalAssets';

describe('portal game registry', () => {
  it('declares display metadata and local asset keys for every game', () => {
    expect(gameRegistry.length).toBeGreaterThan(0);

    for (const game of gameRegistry) {
      expect(game.genre).toBeTruthy();
      expect(game.status).toMatch(/^(playable|coming-soon)$/);
      expect(game.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(game.assets.cover).toBeTruthy();
      expect(game.assets.hero).toBeTruthy();
      expect(getPortalImageSrc(game.assets.cover, 'cover')).toMatch(/^\/assets\/portal\//);
      expect(getPortalImageSrc(game.assets.hero, 'hero')).toMatch(/^\/assets\/portal\//);
    }
  });

  it('selects a deterministic playable featured game', () => {
    expect(getFeaturedGame(gameRegistry)).toMatchObject({
      id: 'gameit-monsters',
      status: 'playable',
      featured: true,
    });
  });

  it('falls back to the first playable game when no featured playable game exists', () => {
    const [first, second] = gameRegistry;
    const featured = getFeaturedGame([
      { ...first, featured: false },
      { ...second, featured: false },
    ]);

    expect(featured.id).toBe(first.id);
  });
});

describe('portal image assets', () => {
  it('resolves known asset keys', () => {
    expect(getPortalImageAsset('portal-cover-gameit-monsters', 'cover')).toMatchObject({
      key: 'portal-cover-gameit-monsters',
      role: 'cover',
      src: '/assets/portal/gameit-monsters-cover.svg',
    });
  });

  it('uses role-specific fallbacks for missing asset keys', () => {
    expect(getPortalImageAsset('missing-cover', 'cover')).toMatchObject({
      key: 'portal-cover-fallback',
      role: 'cover',
    });
    expect(getPortalImageAsset('missing-hero', 'hero')).toMatchObject({
      key: 'portal-hero-fallback',
      role: 'hero',
    });
    expect(getPortalImageAsset('toString', 'cover')).toMatchObject({
      key: 'portal-cover-fallback',
      role: 'cover',
    });
  });
});
