import type { Direction, GameMap, MapId, WorldPosition } from './types';
import { canEnterTile, getGameMap } from './maps';
import { gen1SpeciesCatalog } from './speciesCatalog';

export const WILD_ENCOUNTER_MIN_SPAWN_INTERVAL_MS = 90_000;
export const WILD_ENCOUNTER_MAX_SPAWN_INTERVAL_MS = 120_000;
export const WILD_ENCOUNTER_RESPAWN_MS = 30_000;
export const WILD_ENCOUNTER_LOSS_COOLDOWN_MS = 30_000;

export interface WildEncounterZone {
  id: string;
  mapId: MapId;
  x: number;
  y: number;
  width: number;
  height: number;
  speciesIds: number[];
}

export interface WildEncounterSpawn {
  id: string;
  zoneId: string;
  mapId: MapId;
  speciesId: number;
  x: number;
  y: number;
}

export type EncounterRng = () => number;

const worldEncounterZones: WildEncounterZone[] = [
  zone('world-north-fields', 'world-map', 10, 8, 36, 24, [1, 3, 7, 10, 11, 15]),
  zone('world-east-ridge', 'world-map', 74, 12, 42, 30, [5, 9, 11, 16, 20, 21]),
  zone('world-south-marsh', 'world-map', 28, 60, 52, 24, [2, 6, 8, 12, 17, 19, 22])
];

export function getWildEncounterZonesForMap(mapId: MapId): WildEncounterZone[] {
  const map = getGameMap(mapId);
  if (map.kind === 'interior') return [];
  if (map.id === 'world-map') return worldEncounterZones;

  return [
    zone(`${map.id}-wild-edge`, map.id, 1, 1, Math.max(1, map.width - 2), Math.max(1, map.height - 2), [
      1,
      3,
      4,
      6,
      10,
      14,
      18
    ])
  ];
}

export function rollSpawnDelayMs(rng: EncounterRng = Math.random): number {
  const span = WILD_ENCOUNTER_MAX_SPAWN_INTERVAL_MS - WILD_ENCOUNTER_MIN_SPAWN_INTERVAL_MS;
  return WILD_ENCOUNTER_MIN_SPAWN_INTERVAL_MS + Math.floor(clamp01(rng()) * (span + 1));
}

export function createWildEncounterSpawn(zone: WildEncounterZone, rng: EncounterRng = Math.random): WildEncounterSpawn {
  const map = getGameMap(zone.mapId);
  const candidates = getWalkableZoneTiles(map, zone);
  const position = candidates[Math.floor(clamp01(rng()) * candidates.length)] ?? { x: map.spawn.x, y: map.spawn.y };
  const speciesIds = zone.speciesIds.filter((speciesId) => gen1SpeciesCatalog.some((species) => species.id === speciesId));
  const speciesId = speciesIds[Math.floor(clamp01(rng()) * speciesIds.length)] ?? 1;

  return {
    id: `${zone.id}:encounter`,
    zoneId: zone.id,
    mapId: zone.mapId,
    speciesId,
    x: position.x,
    y: position.y
  };
}

export function isPositionInsideEncounterZone(zone: WildEncounterZone, x: number, y: number): boolean {
  return x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height;
}

export function getFacingTile(position: WorldPosition): { x: number; y: number } {
  const deltaByDirection: Record<Direction, { x: number; y: number }> = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  };
  const delta = deltaByDirection[position.facing];
  return { x: position.x + delta.x, y: position.y + delta.y };
}

export function canTargetEncounter(position: WorldPosition, encounter: { mapId: MapId; x: number; y: number }): boolean {
  if (position.mapId !== encounter.mapId) return false;
  const target = getFacingTile(position);
  return target.x === encounter.x && target.y === encounter.y;
}

function getWalkableZoneTiles(map: GameMap, zone: WildEncounterZone): Array<{ x: number; y: number }> {
  const tiles: Array<{ x: number; y: number }> = [];

  for (let y = zone.y; y < zone.y + zone.height; y += 1) {
    for (let x = zone.x; x < zone.x + zone.width; x += 1) {
      if (canEnterTile(map, x, y)) {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

function zone(
  id: string,
  mapId: MapId,
  x: number,
  y: number,
  width: number,
  height: number,
  speciesIds: number[]
): WildEncounterZone {
  return { id, mapId, x, y, width, height, speciesIds };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 0.999_999);
}
