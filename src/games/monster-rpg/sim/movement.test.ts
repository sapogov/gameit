import { describe, expect, it } from 'vitest';
import { getGameMap } from './maps';
import { movePlayer } from './movement';
import { createInitialSave, createPlayerProfile } from './saveState';

const now = new Date('2026-07-21T12:34:56.000Z');

function saveAt(mapId: 'world-map' | 'home-village', x: number, y: number) {
  return {
    ...createInitialSave(createPlayerProfile('Movement Clock', 'scout')),
    mapId,
    position: { mapId, x, y, facing: 'south' as const }
  };
}

describe('movement clock seam', () => {
  it('uses the supplied time for blocked, normal, and transition moves', () => {
    const blocked = movePlayer(saveAt('world-map', 61, 3), { type: 'move', direction: 'east' }, getGameMap('world-map'), { now });
    const normal = movePlayer(saveAt('home-village', 28, 10), { type: 'move', direction: 'west' }, getGameMap('home-village'), { now });
    const transition = movePlayer(saveAt('home-village', 28, 10), { type: 'move', direction: 'east' }, getGameMap('home-village'), { now });

    expect(blocked).toMatchObject({ moved: false, blocked: true, state: { updatedAt: now.toISOString() } });
    expect(normal).toMatchObject({ moved: true, blocked: false, state: { updatedAt: now.toISOString() } });
    expect(transition).toMatchObject({ moved: true, blocked: false, transition: { toMapId: 'world-map' }, state: { updatedAt: now.toISOString() } });
  });
});
