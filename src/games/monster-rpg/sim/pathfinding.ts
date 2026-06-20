import type { Direction, GameMap, WorldPosition } from './types';
import { canEnterTile } from './maps';

const steps: Array<{ direction: Direction; dx: number; dy: number }> = [
  { direction: 'north', dx: 0, dy: -1 },
  { direction: 'east', dx: 1, dy: 0 },
  { direction: 'south', dx: 0, dy: 1 },
  { direction: 'west', dx: -1, dy: 0 }
];

export function findWalkPath(map: GameMap, start: WorldPosition, targetX: number, targetY: number): Direction[] | null {
  if (start.mapId !== map.id) return null;
  if (!Number.isInteger(targetX) || !Number.isInteger(targetY)) return null;
  if (!canEnterTile(map, targetX, targetY)) return null;
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
      if (!canEnterTile(map, nextX, nextY)) continue;

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
  targetY: number
): Direction[] | null {
  if (start.mapId !== map.id) return null;

  for (const step of steps) {
    const standX = targetX - step.dx;
    const standY = targetY - step.dy;
    const previousX = targetX - step.dx * 2;
    const previousY = targetY - step.dy * 2;

    if (!canEnterTile(map, standX, standY)) continue;

    if (start.x === standX && start.y === standY && start.facing === step.direction) {
      return [];
    }

    if (!canEnterTile(map, previousX, previousY)) continue;

    const path = findWalkPath(map, start, previousX, previousY);
    if (!path) continue;

    return [...path, step.direction];
  }

  return null;
}

function positionKey(x: number, y: number): string {
  return `${x},${y}`;
}
