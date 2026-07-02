import { beforeEach, describe, expect, it } from 'vitest';
import { gameRegistry } from './games';
import {
  loadGameRegistry,
  loadRegistryOverride,
  mergeRegistryOverride,
  REGISTRY_OVERRIDE_KEY,
  resetRegistryOverride,
  saveRegistryOverride,
  sanitizeRegistryOverride,
} from './registryOverride';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
});

describe('registry override', () => {
  it('merges display metadata without changing code-owned ids and routes', () => {
    const [source] = gameRegistry;
    const merged = mergeRegistryOverride(gameRegistry, {
      [source.id]: {
        name: 'Serpent Lab',
        description: 'Tuned locally',
        genre: 'arcade',
        status: 'coming-soon',
        featured: true,
        accent: '#123abc',
        coverAssetKey: 'portal-cover-fallback',
      },
    });

    expect(merged[0]).toMatchObject({
      id: source.id,
      route: source.route,
      name: 'Serpent Lab',
      description: 'Tuned locally',
      status: 'coming-soon',
      featured: true,
      accent: '#123abc',
    });
    expect(merged[0].assets.cover).toBe('portal-cover-fallback');
    expect(merged[0].assets.hero).toBe(source.assets.hero);
  });

  it('saves and loads sanitized localStorage override data', () => {
    saveRegistryOverride({
      snake: {
        name: 'Snake Deluxe',
        description: 'Local portal copy',
        genre: 'arcade',
        status: 'playable',
        featured: false,
        accent: '#22c55e',
        coverAssetKey: 'portal-cover-snake',
      },
    });

    expect(loadRegistryOverride()).toEqual({
      snake: {
        name: 'Snake Deluxe',
        description: 'Local portal copy',
        genre: 'arcade',
        status: 'playable',
        featured: false,
        accent: '#22c55e',
        coverAssetKey: 'portal-cover-snake',
      },
    });
    expect(loadGameRegistry().find((game) => game.id === 'snake')?.name).toBe('Snake Deluxe');
  });

  it('resets stored overrides', () => {
    saveRegistryOverride({ snake: { name: 'Snake Deluxe' } });
    resetRegistryOverride();

    expect(loadRegistryOverride()).toEqual({});
    expect(loadGameRegistry().find((game) => game.id === 'snake')?.name).toBe('Snake');
  });

  it('recovers source defaults when local override data is invalid', () => {
    localStorage.setItem(REGISTRY_OVERRIDE_KEY, '{bad json');

    expect(loadRegistryOverride()).toEqual({});
    expect(loadGameRegistry()).toEqual(gameRegistry);
  });

  it('ignores unknown ids, invalid fields, and non-bundled cover keys', () => {
    expect(
      sanitizeRegistryOverride({
        snake: {
          name: '  ',
          description: 'Updated copy',
          genre: 'puzzle',
          status: 'live',
          featured: 'yes',
          accent: 'red',
          coverAssetKey: 'https://example.com/cover.png',
          route: '/evil',
        },
        unknown: { name: 'Nope' },
      }),
    ).toEqual({
      snake: {
        description: 'Updated copy',
      },
    });
  });
});
