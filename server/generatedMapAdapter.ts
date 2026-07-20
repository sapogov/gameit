import { findSquareGridPath, generatedMapRegistry, moveOnSquareGrid, toSquareGridMap, type Direction } from '../src/games/monster-rpg/sim';

export function getGeneratedMapForServer(mapId: string) {
  const map = generatedMapRegistry.require(mapId); const movement = toSquareGridMap(map);
  return { map, movement, move: (x: number, y: number, direction: Direction) => moveOnSquareGrid(movement, x, y, direction), findPath: (start: { x: number; y: number }, target: { x: number; y: number }) => findSquareGridPath(movement, start, target) };
}
