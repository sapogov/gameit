import type { Direction, GameMap, WorldPosition } from './types';
import { canEnterTile } from './maps';
import type { SquareGridMapAdapter } from './generatedMapSchema';

const steps: Array<{ direction: Direction; dx: number; dy: number }> = [
  { direction: 'north', dx: 0, dy: -1 },
  { direction: 'east', dx: 1, dy: 0 },
  { direction: 'south', dx: 0, dy: 1 },
  { direction: 'west', dx: -1, dy: 0 }
];

type PathOptions = {
  isBlocked?: (x: number, y: number) => boolean;
};

export function findWalkPath(
  map: GameMap,
  start: WorldPosition,
  targetX: number,
  targetY: number,
  options: PathOptions = {}
): Direction[] | null {
  if (start.mapId !== map.id) return null;
  if (!Number.isInteger(targetX) || !Number.isInteger(targetY)) return null;
  if (!canStandOnTile(map, targetX, targetY, options)) return null;
  if (start.x === targetX && start.y === targetY) return [];

  const queue: Array<{ x: number; y: number; directions: Direction[] }> = [
    { x: start.x, y: start.y, directions: [] }
  ];
  const visited = new Set<string>([positionKey(start.x, start.y)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    for (const step of steps) {
      const nextX = current.x + step.dx;
      const nextY = current.y + step.dy;
      const key = positionKey(nextX, nextY);

      if (visited.has(key)) continue;
      if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height) continue;
      if (!canStandOnTile(map, nextX, nextY, options)) continue;

      const directions = [...current.directions, step.direction];
      if (nextX === targetX && nextY === targetY) return directions;

      visited.add(key);
      queue.push({ x: nextX, y: nextY, directions });
    }
  }

  return null;
}

export function findWalkPathToInteractionDistance(
  map: GameMap,
  start: WorldPosition,
  targetX: number,
  targetY: number,
  targetWidth = 1,
  targetHeight = 1,
  options: PathOptions = {}
): Direction[] | null {
  if (start.mapId !== map.id) return null;

  targetWidth = Math.max(1, targetWidth);
  targetHeight = Math.max(1, targetHeight);
  let bestPath: Direction[] | null = null;

  for (let y = targetY; y < targetY + targetHeight; y += 1) {
    for (let x = targetX; x < targetX + targetWidth; x += 1) {
      for (const step of steps) {
        const standX = x - step.dx;
        const standY = y - step.dy;
        const previousX = standX - step.dx;
        const previousY = standY - step.dy;

        if (standX >= targetX && standX < targetX + targetWidth && standY >= targetY && standY < targetY + targetHeight) {
          continue;
        }
        if (!canStandOnTile(map, standX, standY, options)) continue;

        if (start.x === standX && start.y === standY && start.facing === step.direction) {
          return [];
        }

        if (!canStandOnTile(map, previousX, previousY, options)) continue;

        const path = findWalkPath(map, start, previousX, previousY, options);
        if (!path) continue;

        const candidatePath = [...path, step.direction];
        if (!bestPath || candidatePath.length < bestPath.length) {
          bestPath = candidatePath;
        }
      }
    }
  }

  return bestPath;
}

function canStandOnTile(map: GameMap, x: number, y: number, options: PathOptions): boolean {
  return canEnterTile(map, x, y) && !(options.isBlocked?.(x, y) ?? false);
}

function positionKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function findSquareGridPath(grid: SquareGridMapAdapter, start: { x: number; y: number }, target: { x: number; y: number }): Direction[] | null {
  if (grid.isBlocked(start.x, start.y) || grid.isBlocked(target.x, target.y)) return null;
  const queue = [{ ...start, path: [] as Direction[] }]; const visited = new Set([positionKey(start.x, start.y)]);
  while (queue.length) { const current = queue.shift()!; if (current.x === target.x && current.y === target.y) return current.path;
    for (const step of steps) { const x = current.x + step.dx; const y = current.y + step.dy; const key = positionKey(x, y); if (visited.has(key) || grid.isBlocked(x, y)) continue; visited.add(key); queue.push({ x, y, path: [...current.path, step.direction] }); }
  }
  return null;
}
