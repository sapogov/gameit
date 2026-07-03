import type { PortalImageAsset, PortalImageAssetKey, PortalImageRole } from '../types/game';

export const fallbackPortalCoverAssetKey = 'portal-cover-fallback' satisfies PortalImageAssetKey;
export const fallbackPortalHeroAssetKey = 'portal-hero-fallback' satisfies PortalImageAssetKey;

const portalAssetSrc = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const portalImageAssets: Record<PortalImageAssetKey, PortalImageAsset> = {
  'portal-cover-snake': {
    key: 'portal-cover-snake',
    role: 'cover',
    src: portalAssetSrc('assets/portal/snake-cover.svg'),
    alt: 'Snake game cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-snake': {
    key: 'portal-hero-snake',
    role: 'hero',
    src: portalAssetSrc('assets/portal/snake-hero.svg'),
    alt: 'Snake game hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-gameit-monsters': {
    key: 'portal-cover-gameit-monsters',
    role: 'cover',
    src: portalAssetSrc('assets/portal/gameit-monsters-cover.svg'),
    alt: 'GameIt Monsters cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-gameit-monsters': {
    key: 'portal-hero-gameit-monsters',
    role: 'hero',
    src: portalAssetSrc('assets/portal/gameit-monsters-hero.svg'),
    alt: 'GameIt Monsters hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-flappy-bird': {
    key: 'portal-cover-flappy-bird',
    role: 'cover',
    src: portalAssetSrc('assets/portal/flappy-bird-cover.svg'),
    alt: 'Flappy Bird cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-flappy-bird': {
    key: 'portal-hero-flappy-bird',
    role: 'hero',
    src: portalAssetSrc('assets/portal/flappy-bird-hero.svg'),
    alt: 'Flappy Bird hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-stickman-fight': {
    key: 'portal-cover-stickman-fight',
    role: 'cover',
    src: portalAssetSrc('assets/portal/stickman-fight-cover.svg'),
    alt: 'Stickman Fight cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-stickman-fight': {
    key: 'portal-hero-stickman-fight',
    role: 'hero',
    src: portalAssetSrc('assets/portal/stickman-fight-hero.svg'),
    alt: 'Stickman Fight hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-coming-soon': {
    key: 'portal-cover-coming-soon',
    role: 'cover',
    src: portalAssetSrc('assets/portal/coming-soon-cover.svg'),
    alt: 'Coming soon game cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-coming-soon': {
    key: 'portal-hero-coming-soon',
    role: 'hero',
    src: portalAssetSrc('assets/portal/coming-soon-hero.svg'),
    alt: 'Coming soon game hero art',
    width: 1280,
    height: 520,
  },
  'portal-cover-fallback': {
    key: 'portal-cover-fallback',
    role: 'cover',
    src: portalAssetSrc('assets/portal/fallback-cover.svg'),
    alt: 'GameIt fallback cover art',
    width: 640,
    height: 420,
  },
  'portal-hero-fallback': {
    key: 'portal-hero-fallback',
    role: 'hero',
    src: portalAssetSrc('assets/portal/fallback-hero.svg'),
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
