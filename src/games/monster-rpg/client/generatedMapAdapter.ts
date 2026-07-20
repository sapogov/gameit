import { findSquareGridPath, generatedMapRegistry, getGameMap, moveOnSquareGrid, toSquareGridMap, type GeneratedMapId } from '../sim';

/** Phaser-facing lookup: rendering may use terrain while movement remains the shared square adapter. */
export function getGeneratedMapForClient(mapId: string) {
  const map = generatedMapRegistry.require(mapId);
  const movement = toSquareGridMap(map);
  return { map, runtimeMap: getGameMap(mapId as GeneratedMapId), movement, mapSet: generatedMapRegistry.handshake(), move: (x: number, y: number, direction: 'north' | 'east' | 'south' | 'west') => moveOnSquareGrid(movement, x, y, direction), findPath: (start: { x: number; y: number }, target: { x: number; y: number }) => findSquareGridPath(movement, start, target) };
}
