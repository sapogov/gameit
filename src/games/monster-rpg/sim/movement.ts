import type { Direction, GameMap, InputAction, MonsterRpgSaveState, MovementResult } from './types';
import { canEnterTile, getExitAt, getTileAt } from './maps';
import type { SquareGridMapAdapter } from './generatedMapSchema';

const directionDelta: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

export function moveOnSquareGrid(grid: SquareGridMapAdapter, x: number, y: number, direction: Direction) {
  const delta = directionDelta[direction]; const next = { x: x + delta.x, y: y + delta.y };
  return grid.isBlocked(next.x, next.y) ? { x, y, moved: false } : { ...next, moved: true };
}

export function movePlayer(state: MonsterRpgSaveState, action: InputAction, map: GameMap): MovementResult {
  if (action.type !== 'move') {
    return {
      state,
      moved: false,
      blocked: false
    };
  }

  const delta = directionDelta[action.direction];
  const nextX = state.position.x + delta.x;
  const nextY = state.position.y + delta.y;
  const positionWithFacing = {
    ...state.position,
    facing: action.direction
  };

  if (!canEnterTile(map, nextX, nextY)) {
    return {
      state: {
        ...state,
        position: positionWithFacing,
        updatedAt: new Date().toISOString()
      },
      moved: false,
      blocked: true,
      blockedBy: getTileAt(map, nextX, nextY) ?? 'bounds'
    };
  }

  const exit = getExitAt(map, nextX, nextY);
  const nextPosition = exit
    ? { ...exit.spawn }
    : {
        ...positionWithFacing,
        x: nextX,
        y: nextY
      };

  return {
    state: {
      ...state,
      mapId: nextPosition.mapId,
      position: nextPosition,
      updatedAt: new Date().toISOString()
    },
    moved: true,
    blocked: false,
    transition: exit
      ? {
          toMapId: exit.toMapId,
          spawn: { ...exit.spawn }
        }
      : undefined
  };
}
