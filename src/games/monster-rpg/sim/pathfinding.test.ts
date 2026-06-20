import { describe, expect, it } from 'vitest';
import { getGameMap } from './maps';
import { movePlayer } from './movement';
import { findWalkPath, findWalkPathToInteractionDistance } from './pathfinding';
import { createInitialSave, createPlayerProfile } from './saveState';
import { canTargetEncounter } from './wildEncounters';
import type { WorldPosition } from './types';

describe('tap-to-walk pathfinding', () => {
  it('returns a grid path to walkable map tiles', () => {
    const map = getGameMap('home-village');
    const start = map.spawn;
    const path = findWalkPath(map, start, start.x - 2, start.y);

    expect(path).toEqual(['west', 'west']);
  });

  it('rejects blocked tiles and map boundaries', () => {
    const map = getGameMap('world-map');
    const start: WorldPosition = { mapId: 'world-map', x: 61, y: 3, facing: 'south' };

    expect(findWalkPath(map, start, 62, 3)).toBeNull();
    expect(findWalkPath(map, start, -1, 3)).toBeNull();
  });

  it('allows tap paths onto transition tiles for the movement system to resolve', () => {
    const map = getGameMap('home-village');
    const start: WorldPosition = { mapId: 'home-village', x: 28, y: 10, facing: 'east' };

    expect(findWalkPath(map, start, 29, 10)).toEqual(['east']);
  });

  it('paths to interaction distance without stepping onto the Creature tile', () => {
    const map = getGameMap('home-village');
    const start: WorldPosition = { mapId: 'home-village', x: 28, y: 10, facing: 'west' };
    const save = {
      ...createInitialSave(createPlayerProfile('Path Test', 'scout')),
      mapId: start.mapId,
      position: start
    };
    const path = findWalkPathToInteractionDistance(map, start, 25, 10);
    const finalState = path?.reduce(
      (state, direction) => movePlayer(state, { type: 'move', direction }, map).state,
      save
    );

    expect(path).not.toBeNull();
    expect(`${finalState?.position.x},${finalState?.position.y}`).not.toBe('25,10');
    expect(canTargetEncounter(finalState!.position, { mapId: 'home-village', x: 25, y: 10 })).toBe(true);
  });
});
