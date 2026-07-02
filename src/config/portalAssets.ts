import type { PortalImageAsset, PortalImageAssetKey, PortalImageRole } from '../types/game';

export const fallbackPortalCoverAssetKey = 'portal-cover-fallback' satisfies PortalImageAssetKey;
export const fallbackPortalHeroAssetKey = 'portal-hero-fallback' satisfies PortalImageAssetKey;

export const portalImageAssets: Record<PortalImageAssetKey, PortalImageAsset> = {
  'portal-cover-snake': {
    key: 'portal-cover-snake',
    role: 'cover',
    src: '/assets/portal/snake-cover.svg',
    alt: 'Snake game cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-snake': {
    key: 'portal-hero-snake',
    role: 'hero',
    src: '/assets/portal/snake-hero.svg',
    alt: 'Snake game hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-gameit-monsters': {
    key: 'portal-cover-gameit-monsters',
    role: 'cover',
    src: '/assets/portal/gameit-monsters-cover.svg',
    alt: 'GameIt Monsters cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-gameit-monsters': {
    key: 'portal-hero-gameit-monsters',
    role: 'hero',
    src: '/assets/portal/gameit-monsters-hero.svg',
    alt: 'GameIt Monsters hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-coming-soon': {
    key: 'portal-cover-coming-soon',
    role: 'cover',
    src: '/assets/portal/coming-soon-cover.svg',
    alt: 'Coming soon game cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-coming-soon': {
    key: 'portal-hero-coming-soon',
    role: 'hero',
    src: '/assets/portal/coming-soon-hero.svg',
    alt: 'Coming soon game hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-fallback': {
    key: 'portal-cover-fallback',
    role: 'cover',
    src: '/assets/portal/fallback-cover.svg',
    alt: 'GameIt fallback cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-fallback': {
    key: 'portal-hero-fallback',
    role: 'hero',
    src: '/assets/portal/fallback-hero.svg',
    alt: 'GameIt fallback hero art',
    width: 1280,
    height: 520,
  },
};

export const portalCoverAssetKeys = Object.values(portalImageAssets)
  .filter((asset) => asset.role === 'cover')
  .map((asset) => asset.key);

export function getPortalImageAsset(key: string | undefined, role: PortalImageRole = 'cover'): PortalImageAsset {
  if (key && Object.hasOwn(portalImageAssets, key)) return portalImageAssets[key as PortalImageAssetKey];

  return portalImageAssets[role === 'hero' ? fallbackPortalHeroAssetKey : fallbackPortalCoverAssetKey];
}

export function getPortalImageSrc(key: string | undefined, role: PortalImageRole = 'cover'): string {
  return getPortalImageAsset(key, role).src;
}
