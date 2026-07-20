import type {
  BuildingDefinition,
  BuildingType,
  GameMap,
  InteriorMapId,
  MapExit,
  MapId,
  TileType,
  VillageDefinition,
  VillageId,
  WorldPosition
} from './types';
import { generatedMapRegistry } from './generatedMapSet';

const WORLD_TILE_SIZE = 16;
const LOCAL_TILE_SIZE = 24;
const WORLD_WIDTH = 128;
const WORLD_HEIGHT = 96;

const villageNames: Record<VillageId, string> = {
  'home-village': 'Home Village',
  'brookhaven-village': 'Brookhaven',
  'cedar-grove-village': 'Cedar Grove',
  'sunfield-village': 'Sunfield',
  'stoneford-village': 'Stoneford',
  'mistfall-village': 'Mistfall',
  'emberwick-village': 'Emberwick',
  'northwatch-village': 'Northwatch'
};

const buildingNames: Record<BuildingType, string> = {
  shop: 'Shop',
  house: 'House',
  clinic: 'Clinic',
  'post-office': 'Post Office',
  'town-hall': 'Town Hall',
  tavern: 'Tavern'
};

const buildingTiles: Record<BuildingType, TileType> = {
  shop: 'shop',
  house: 'house',
  clinic: 'clinic',
  'post-office': 'postOffice',
  'town-hall': 'townHall',
  tavern: 'tavern'
};

export const villageDefinitions: VillageDefinition[] = [
  createVillageDefinition('home-village', 18, 46, 3, 3),
  createVillageDefinition('brookhaven-village', 94, 42, 3, 3),
  createVillageDefinition('cedar-grove-village', 28, 18, 2, 2),
  createVillageDefinition('sunfield-village', 58, 20, 2, 2),
  createVillageDefinition('stoneford-village', 102, 20, 2, 2),
  createVillageDefinition('mistfall-village', 42, 72, 2, 2),
  createVillageDefinition('emberwick-village', 78, 70, 2, 2),
  createVillageDefinition('northwatch-village', 112, 72, 2, 2)
];

export const buildingDefinitions: BuildingDefinition[] = villageDefinitions.flatMap((village, villageIndex) =>
  createBuildingDefinitions(village, villageIndex)
);

export const worldMap: GameMap = createWorldMap();

const villageMaps = Object.fromEntries(villageDefinitions.map((village, index) => [village.id, createVillageMap(village, index)])) as Record<
  VillageId,
  GameMap
>;

const interiorMaps = Object.fromEntries(
  buildingDefinitions.map((building) => [building.interiorMapId, createInteriorMap(building)])
) as Record<InteriorMapId, GameMap>;

const generatedMaps = Object.fromEntries(generatedMapRegistry.mapSet.maps.map((map) => {
  const spawnObject = map.triggers.find((trigger) => trigger.spawnKey === 'entrance') ?? map.triggers[0];
  const spawn = { mapId: map.id as MapId, x: Math.floor((spawnObject?.geometry.x ?? 0) / map.tileSize), y: Math.floor((spawnObject?.geometry.y ?? 0) / map.tileSize), facing: spawnObject?.facing ?? 'south' };
  const tiles = map.blocked.map((row) => row.map((blocked) => blocked ? 'wall' : map.id === 'tracer-world-route' ? 'road' : 'grass')) as TileType[][];
  const exits: MapExit[] = map.exits.map((exit) => ({ id: exit.id, x: exit.x, y: exit.y, toMapId: exit.toMapId as MapId, spawn: { mapId: exit.toMapId as MapId, x: exit.toX, y: exit.toY, facing: 'south' }, label: exit.id }));
  return [map.id, { id: map.id as MapId, name: map.name, kind: map.id === 'tracer-world-route' ? 'world-map' : 'village', width: map.width, height: map.height, tileSize: map.tileSize, tiles, spawn, exits } satisfies GameMap];
})) as Record<'tracer-water-town' | 'tracer-world-route', GameMap>;

export const homeVillageMap = villageMaps['home-village'];
export const brookhavenVillageMap = villageMaps['brookhaven-village'];

export const gameMaps = {
  'world-map': worldMap,
  ...villageMaps,
  ...interiorMaps
  , ...generatedMaps
} as Record<MapId, GameMap>;

export const walkableTiles = new Set<TileType>([
  'grass',
  'field',
  'road',
  'plaza',
  'bridge',
  'exit',
  'villageFootprint',
  'floor',
  'door'
]);

export function getGameMap(mapId: MapId): GameMap {
  return gameMaps[mapId];
}

export function getMapById(mapId: string): GameMap | undefined {
  return isMapId(mapId) ? gameMaps[mapId] : undefined;
}

export function isMapId(mapId: string): mapId is MapId {
  return Object.prototype.hasOwnProperty.call(gameMaps, mapId);
}

export function normalizeMapId(mapId: string | undefined): MapId | undefined {
  return mapId && isMapId(mapId) ? mapId : undefined;
}

export function getTileAt(map: GameMap, x: number, y: number): TileType | undefined {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return undefined;
  return map.tiles[y]?.[x];
}

export function canEnterTile(map: GameMap, x: number, y: number): boolean {
  const tile = getTileAt(map, x, y);
  return tile ? walkableTiles.has(tile) : false;
}

export function getAllowedSpawnsForMap(mapId: MapId): WorldPosition[] {
  const map = getGameMap(mapId);
  const spawns = [{ ...map.spawn }];

  Object.values(gameMaps).forEach((candidateMap) => {
    candidateMap.exits.forEach((exit) => {
      if (exit.toMapId === mapId) {
        spawns.push({ ...exit.spawn });
      }
    });
  });

  return spawns;
}

export function isSameWorldPosition(left: WorldPosition, right: WorldPosition): boolean {
  return (
    left.mapId === right.mapId &&
    left.x === right.x &&
    left.y === right.y &&
    left.facing === right.facing
  );
}

export function isValidSpawnPosition(mapId: MapId, position: WorldPosition | undefined): position is WorldPosition {
  if (!position || position.mapId !== mapId || !Number.isInteger(position.x) || !Number.isInteger(position.y)) {
    return false;
  }

  if (!['north', 'east', 'south', 'west'].includes(position.facing)) return false;

  const map = getGameMap(mapId);
  return canEnterTile(map, position.x, position.y) && getAllowedSpawnsForMap(mapId).some((spawn) => isSameWorldPosition(spawn, position));
}

export function validateGameMapRegistry(): string[] {
  const errors: string[] = [];

  Object.entries(gameMaps).forEach(([id, map]) => {
    if (id !== map.id) errors.push(`${id}: map id mismatch ${map.id}`);
    if (map.tiles.length !== map.height) errors.push(`${map.id}: tile height mismatch`);
    if (!isValidSpawnPosition(map.id, map.spawn)) errors.push(`${map.id}: invalid primary spawn`);

    map.tiles.forEach((row, y) => {
      if (row.length !== map.width) errors.push(`${map.id}: row ${y} width mismatch`);
    });

    map.exits.forEach((exit) => {
      const target = getMapById(exit.toMapId);
      const width = exit.width ?? 1;
      const height = exit.height ?? 1;

      if (!target) errors.push(`${map.id}/${exit.id}: invalid target map ${exit.toMapId}`);
      if (exit.x < 0 || exit.y < 0 || exit.x + width > map.width || exit.y + height > map.height) {
        errors.push(`${map.id}/${exit.id}: exit footprint out of bounds`);
      }

      for (let y = exit.y; y < exit.y + height; y += 1) {
        for (let x = exit.x; x < exit.x + width; x += 1) {
          if (!canEnterTile(map, x, y)) errors.push(`${map.id}/${exit.id}: blocked exit tile ${x},${y}`);
        }
      }

      if (!isValidSpawnPosition(exit.toMapId, exit.spawn)) {
        errors.push(`${map.id}/${exit.id}: invalid target spawn`);
      }
    });
  });

  villageDefinitions.forEach((village) => {
    const worldExit = worldMap.exits.find((exit) => exit.toMapId === village.id);
    if (!worldExit) errors.push(`${village.id}: missing world footprint exit`);

    for (let y = village.footprint.y; y < village.footprint.y + village.footprint.height; y += 1) {
      for (let x = village.footprint.x; x < village.footprint.x + village.footprint.width; x += 1) {
        if (getTileAt(worldMap, x, y) !== 'villageFootprint') {
          errors.push(`${village.id}: missing footprint tile ${x},${y}`);
        }
      }
    }

    if (!isValidSpawnPosition('world-map', village.returnSpawn)) {
      errors.push(`${village.id}: invalid overworld return spawn`);
    }
  });

  buildingDefinitions.forEach((building) => {
    const villageMap = getGameMap(building.villageId);
    const interiorMap = getGameMap(building.interiorMapId);

    if (getTileAt(villageMap, building.entrance.x, building.entrance.y) !== 'door') {
      errors.push(`${building.id}: entrance is not a door tile`);
    }

    if (!isValidSpawnPosition(building.villageId, building.returnSpawn)) {
      errors.push(`${building.id}: invalid outside return spawn`);
    }

    const exit = interiorMap.exits.find((candidate) => candidate.toMapId === building.villageId);
    if (!exit || !isSameWorldPosition(exit.spawn, building.returnSpawn)) {
      errors.push(`${building.id}: interior exit does not return to outside door spawn`);
    }
  });

  return errors;
}

export function getExitAt(map: GameMap, x: number, y: number): MapExit | undefined {
  return map.exits.find((exit) => {
    const width = exit.width ?? 1;
    const height = exit.height ?? 1;
    return x >= exit.x && x < exit.x + width && y >= exit.y && y < exit.y + height;
  });
}

export function getVillageDefinition(villageId: VillageId): VillageDefinition {
  const village = villageDefinitions.find((definition) => definition.id === villageId);
  if (!village) throw new Error(`Unknown village "${villageId}"`);
  return village;
}

export function getBuildingDefinition(interiorMapId: InteriorMapId): BuildingDefinition {
  const building = buildingDefinitions.find((definition) => definition.interiorMapId === interiorMapId);
  if (!building) throw new Error(`Unknown interior "${interiorMapId}"`);
  return building;
}

function getVillageEntrySpawn(village: VillageDefinition): WorldPosition {
  if (village.id === 'home-village') {
    return {
      mapId: village.id,
      x: 28,
      y: 10,
      facing: 'west'
    };
  }

  return { ...village.spawn };
}

function createVillageDefinition(
  id: VillageId,
  x: number,
  y: number,
  width: 2 | 3,
  height: 2 | 3
): VillageDefinition {
  const isHomeVillage = id === 'home-village';

  return {
    id,
    name: villageNames[id],
    footprint: { x, y, width, height },
    spawn: {
      mapId: id,
      x: isHomeVillage ? 13 : 14,
      y: isHomeVillage ? 5 : 16,
      facing: isHomeVillage ? 'south' : 'north'
    },
    returnSpawn: {
      mapId: 'world-map',
      x: isHomeVillage ? x + width : x + Math.floor(width / 2),
      y: isHomeVillage ? y + Math.floor(height / 2) : y + height,
      facing: isHomeVillage ? 'east' : 'south'
    }
  };
}

function createBuildingDefinitions(village: VillageDefinition, villageIndex: number): BuildingDefinition[] {
  const placements: Array<{ type: BuildingType; x: number; y: number }> = [
    { type: 'house', x: 3, y: 3 },
    { type: 'town-hall', x: 12, y: 2 },
    { type: 'clinic', x: 21, y: 3 },
    { type: 'shop', x: 4, y: 11 },
    { type: 'post-office', x: 12, y: 11 },
    { type: 'tavern', x: 21, y: 11 }
  ];

  const shiftedPlacements = placements.map((placement, index) => ({
    ...placement,
    x: placement.x + ((villageIndex + index) % 2),
    y: placement.y + (villageIndex % 2 === 0 ? 0 : 1)
  }));

  return shiftedPlacements.map((placement) => {
    const entrance = { x: placement.x + 1, y: placement.y + 2 };
    return {
      id: `${village.id}-${placement.type}`,
      villageId: village.id,
      type: placement.type,
      name: `${village.name} ${buildingNames[placement.type]}`,
      entrance,
      returnSpawn: {
        mapId: village.id,
        x: entrance.x,
        y: entrance.y + 1,
        facing: 'south'
      },
      interiorMapId: getInteriorMapId(village.id, placement.type)
    };
  });
}

function createWorldMap(): GameMap {
  const tiles = Array.from({ length: WORLD_HEIGHT }, (_, y) =>
    Array.from({ length: WORLD_WIDTH }, (_, x): TileType => {
      if (x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1) return 'mountain';
      if (x >= 8 && x <= 20 && y >= 8 && y <= 25) return 'forest';
      if (x >= 86 && x <= 120 && y >= 8 && y <= 28) return 'mountain';
      if (x >= 4 && x <= 26 && y >= 68 && y <= 90) return 'forest';
      if (x >= 62 && x <= 66 && y >= 2 && y <= 92) return 'water';
      if (x >= 72 && x <= 100 && y >= 64 && y <= 86) return 'field';
      if (x >= 35 && x <= 52 && y >= 16 && y <= 30) return 'field';
      return 'grass';
    })
  );

  const hub = { x: 62, y: 48 };
  setRoad(tiles, hub.x, hub.y);
  villageDefinitions.forEach((village) => {
    const center = {
      x: village.footprint.x + Math.floor(village.footprint.width / 2),
      y: village.footprint.y + Math.floor(village.footprint.height / 2)
    };
    drawRoad(tiles, hub.x, hub.y, center.x, center.y);
    setRoad(tiles, village.returnSpawn.x, village.returnSpawn.y);
  });

  villageDefinitions.forEach((village) => {
    for (let y = village.footprint.y; y < village.footprint.y + village.footprint.height; y += 1) {
      for (let x = village.footprint.x; x < village.footprint.x + village.footprint.width; x += 1) {
        tiles[y][x] = 'villageFootprint';
      }
    }
  });

  return {
    id: 'world-map',
    name: 'Overworld',
    kind: 'world-map',
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    tileSize: WORLD_TILE_SIZE,
    tiles,
    spawn: { mapId: 'world-map', x: 20, y: 50, facing: 'south' },
    exits: villageDefinitions.map((village): MapExit => ({
      id: `${village.id}-footprint`,
      x: village.footprint.x,
      y: village.footprint.y,
      width: village.footprint.width,
      height: village.footprint.height,
      toMapId: village.id,
      spawn: getVillageEntrySpawn(village),
      label: village.name
    }))
  };
}

function createVillageMap(village: VillageDefinition, villageIndex: number): GameMap {
  const width = 30;
  const height = 22;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x): TileType => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'tree';
      if ((x + y + villageIndex) % 17 === 0 && y > 2 && y < height - 3) return 'field';
      return 'grass';
    })
  );

  const centerX = 14;
  const centerY = 10;
  for (let x = 1; x < width - 1; x += 1) setRoad(tiles, x, centerY);
  for (let y = 1; y < height - 1; y += 1) setRoad(tiles, centerX, y);

  fillRect(tiles, centerX - 2, centerY - 2, 5, 5, 'plaza');

  const buildings = buildingDefinitions.filter((building) => building.villageId === village.id);
  buildings.forEach((building) => {
    drawRoad(tiles, building.returnSpawn.x, building.returnSpawn.y, centerX, centerY);
    setRoad(tiles, building.returnSpawn.x, building.returnSpawn.y);
  });

  buildings.forEach((building) => {
    const tile = buildingTiles[building.type];
    fillRect(tiles, building.entrance.x - 1, building.entrance.y - 2, 3, 3, tile);
    tiles[building.entrance.y][building.entrance.x] = 'door';
    setRoad(tiles, building.returnSpawn.x, building.returnSpawn.y);
  });

  const isHomeVillage = village.id === 'home-village';
  const exitX = isHomeVillage ? width - 1 : centerX;
  const exitY = isHomeVillage ? centerY : height - 1;
  tiles[exitY][exitX] = 'exit';
  if (isHomeVillage) {
    tiles[exitY][exitX - 1] = 'road';
  } else {
    tiles[exitY - 1][exitX] = 'road';
  }

  return {
    id: village.id,
    name: village.name,
    kind: 'village',
    width,
    height,
    tileSize: LOCAL_TILE_SIZE,
    tiles,
    spawn: { ...village.spawn },
    exits: [
      {
        id: `${village.id}-to-world`,
        x: exitX,
        y: exitY,
        toMapId: 'world-map',
        spawn: { ...village.returnSpawn },
        label: 'Overworld'
      },
      ...buildings.map((building): MapExit => ({
        id: `${building.id}-door`,
        x: building.entrance.x,
        y: building.entrance.y,
        toMapId: building.interiorMapId,
        spawn: createInteriorSpawn(building.interiorMapId),
        label: building.name
      }))
    ]
  };
}

function createInteriorMap(building: BuildingDefinition): GameMap {
  const width = 12;
  const height = 10;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x): TileType => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'wall';
      return 'floor';
    })
  );

  applyInteriorTemplate(tiles, building.type);
  tiles[height - 1][5] = 'door';
  tiles[height - 2][5] = 'floor';

  return {
    id: building.interiorMapId,
    name: building.name,
    kind: 'interior',
    width,
    height,
    tileSize: LOCAL_TILE_SIZE,
    tiles,
    spawn: createInteriorSpawn(building.interiorMapId),
    exits: [
      {
        id: `${building.id}-exit`,
        x: 5,
        y: height - 1,
        toMapId: building.villageId,
        spawn: { ...building.returnSpawn },
        label: building.name.replace(`${villageNames[building.villageId]} `, '')
      }
    ]
  };
}

function createInteriorSpawn(mapId: InteriorMapId): WorldPosition {
  return {
    mapId,
    x: 5,
    y: 7,
    facing: 'north'
  };
}

function applyInteriorTemplate(tiles: TileType[][], type: BuildingType): void {
  if (type === 'shop') {
    fillRect(tiles, 2, 2, 8, 1, 'counter');
    fillRect(tiles, 2, 4, 2, 1, 'desk');
    return;
  }

  if (type === 'house') {
    fillRect(tiles, 2, 2, 2, 2, 'bed');
    fillRect(tiles, 7, 3, 2, 1, 'desk');
    return;
  }

  if (type === 'clinic') {
    fillRect(tiles, 2, 2, 2, 2, 'bed');
    fillRect(tiles, 7, 2, 2, 2, 'bed');
    tiles[5][8] = 'desk';
    return;
  }

  if (type === 'post-office') {
    fillRect(tiles, 2, 2, 8, 1, 'counter');
    tiles[4][3] = 'desk';
    tiles[4][7] = 'desk';
    return;
  }

  if (type === 'town-hall') {
    fillRect(tiles, 2, 2, 8, 1, 'counter');
    fillRect(tiles, 4, 5, 4, 1, 'desk');
    return;
  }

  fillRect(tiles, 2, 2, 8, 1, 'counter');
  fillRect(tiles, 2, 5, 2, 1, 'desk');
  fillRect(tiles, 7, 5, 2, 1, 'desk');
}

function drawRoad(tiles: TileType[][], fromX: number, fromY: number, toX: number, toY: number): void {
  const stepX = fromX <= toX ? 1 : -1;
  for (let x = fromX; x !== toX + stepX; x += stepX) setRoad(tiles, x, fromY);

  const stepY = fromY <= toY ? 1 : -1;
  for (let y = fromY; y !== toY + stepY; y += stepY) setRoad(tiles, toX, y);
}

function setRoad(tiles: TileType[][], x: number, y: number): void {
  if (!tiles[y]?.[x]) return;
  tiles[y][x] = tiles[y][x] === 'water' ? 'bridge' : 'road';
}

function fillRect(tiles: TileType[][], x: number, y: number, width: number, height: number, tile: TileType): void {
  for (let tileY = y; tileY < y + height; tileY += 1) {
    for (let tileX = x; tileX < x + width; tileX += 1) {
      if (tiles[tileY]?.[tileX]) tiles[tileY][tileX] = tile;
    }
  }
}

function getInteriorMapId(villageId: VillageId, type: BuildingType): InteriorMapId {
  return `${villageId}-${type}-interior` as InteriorMapId;
}
