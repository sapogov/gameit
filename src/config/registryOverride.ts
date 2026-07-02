import { gameRegistry } from './games';
import { portalCoverAssetKeys } from './portalAssets';
import type { GameDefinition, GameGenre, GameId, GameStatus, PortalImageAssetKey } from '../types/game';

export const REGISTRY_OVERRIDE_KEY = 'gameit.portal.registryOverride.v1';

export const registryGenres = ['arcade', 'monster-rpg', 'platformer', 'fighting'] satisfies GameGenre[];
export const registryStatuses = ['playable', 'coming-soon'] satisfies GameStatus[];

export interface RegistryOverrideEntry {
  name?: string;
  description?: string;
  genre?: GameGenre;
  status?: GameStatus;
  featured?: boolean;
  accent?: string;
  coverAssetKey?: PortalImageAssetKey;
}

export type RegistryOverride = Partial<Record<GameId, RegistryOverrideEntry>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isKnownValue = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && allowed.includes(value as T);

const isAccent = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const optionalText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function sanitizeRegistryOverride(
  candidate: unknown,
  defaults: readonly GameDefinition[] = gameRegistry,
): RegistryOverride {
  if (!isRecord(candidate)) return {};

  const knownIds = new Set(defaults.map((game) => game.id));
  const sanitized: RegistryOverride = {};

  for (const [id, rawEntry] of Object.entries(candidate)) {
    if (!knownIds.has(id as GameId) || !isRecord(rawEntry)) continue;

    const entry: RegistryOverrideEntry = {};
    const name = optionalText(rawEntry.name);
    const description = optionalText(rawEntry.description);

    if (name) entry.name = name;
    if (description) entry.description = description;
    if (isKnownValue(rawEntry.genre, registryGenres)) entry.genre = rawEntry.genre;
    if (isKnownValue(rawEntry.status, registryStatuses)) entry.status = rawEntry.status;
    if (typeof rawEntry.featured === 'boolean') entry.featured = rawEntry.featured;
    if (isAccent(rawEntry.accent)) entry.accent = rawEntry.accent;
    if (isKnownValue(rawEntry.coverAssetKey, portalCoverAssetKeys)) entry.coverAssetKey = rawEntry.coverAssetKey;

    if (Object.keys(entry).length > 0) sanitized[id as GameId] = entry;
  }

  return sanitized;
}

export function mergeRegistryOverride(
  defaults: readonly GameDefinition[] = gameRegistry,
  override: RegistryOverride = {},
): GameDefinition[] {
  return defaults.map((game) => {
    const entry = override[game.id];
    if (!entry) return game;

    return {
      ...game,
      name: entry.name ?? game.name,
      description: entry.description ?? game.description,
      genre: entry.genre ?? game.genre,
      status: entry.status ?? game.status,
      featured: entry.featured ?? game.featured,
      accent: entry.accent ?? game.accent,
      assets: {
        ...game.assets,
        cover: entry.coverAssetKey ?? game.assets.cover,
      },
    };
  });
}

export function loadRegistryOverride(defaults: readonly GameDefinition[] = gameRegistry): RegistryOverride {
  try {
    const raw = localStorage.getItem(REGISTRY_OVERRIDE_KEY);
    return raw ? sanitizeRegistryOverride(JSON.parse(raw), defaults) : {};
  } catch {
    return {};
  }
}

export function saveRegistryOverride(override: RegistryOverride, defaults: readonly GameDefinition[] = gameRegistry) {
  localStorage.setItem(REGISTRY_OVERRIDE_KEY, JSON.stringify(sanitizeRegistryOverride(override, defaults)));
}

export function resetRegistryOverride() {
  localStorage.removeItem(REGISTRY_OVERRIDE_KEY);
}

export function loadGameRegistry(defaults: readonly GameDefinition[] = gameRegistry): GameDefinition[] {
  return mergeRegistryOverride(defaults, loadRegistryOverride(defaults));
}
