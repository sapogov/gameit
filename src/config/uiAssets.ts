export interface SpriteRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Keep these values centralized so updating crop regions is one-file change.
 */
export const logoSpriteSheet = {
  src: '/assets/logos.png',
  sheetWidth: 1536,
  sheetHeight: 1024,
  logos: [
    { x: 100, y: 65, width: 630, height: 395 },
    { x: 830, y: 65, width: 625, height: 385 },
    { x: 100, y: 550, width: 630, height: 400 },
    { x: 830, y: 570, width: 650, height: 380 },
  ] satisfies SpriteRegion[],
};

export const uiSpriteSheet = {
  src: '/assets/assets.png',
  sheetWidth: 1024,
  sheetHeight: 1664,
  /** Generated defaults; tweak as you iterate on final art mapping. */
  primaryButton: { x: 20, y: 300, width: 250, height: 85 },
  panelFrame: { x: 500, y: 575, width: 380, height: 280 },
  modalFrame: { x: 570, y: 380, width: 350, height: 135 },
};
