export type Direction = 'north' | 'east' | 'south' | 'west';

export type AvatarId = 'scout' | 'ranger' | 'keeper';

export type MultiplayerStatus = 'connecting' | 'online' | 'offline';

export type RoomPlayerId = string;

export type VillageId =
  | 'home-village'
  | 'brookhaven-village'
  | 'cedar-grove-village'
  | 'sunfield-village'
  | 'stoneford-village'
  | 'mistfall-village'
  | 'emberwick-village'
  | 'northwatch-village';

export type BuildingType = 'shop' | 'house' | 'clinic' | 'post-office' | 'town-hall' | 'tavern';

export type InteriorMapId = `${VillageId}-${BuildingType}-interior`;

export type MapId = 'world-map' | VillageId | InteriorMapId;

export type MapKind = 'world-map' | 'village' | 'interior';

export type TileType =
  | 'grass'
  | 'field'
  | 'road'
  | 'plaza'
  | 'house'
  | 'townHall'
  | 'clinic'
  | 'shop'
  | 'postOffice'
  | 'tavern'
  | 'villageFootprint'
  | 'floor'
  | 'wall'
  | 'counter'
  | 'bed'
  | 'desk'
  | 'door'
  | 'tree'
  | 'forest'
  | 'mountain'
  | 'water'
  | 'bridge'
  | 'fence'
  | 'exit';

export interface PlayerProfile {
  schemaVersion: number;
  id: string;
  name: string;
  avatar: AvatarId;
  homeVillageId: VillageId;
}

export interface WorldPosition {
  mapId: MapId;
  x: number;
  y: number;
  facing: Direction;
}

export interface MapExit {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  toMapId: MapId;
  spawn: WorldPosition;
  label: string;
}

export interface VillageDefinition {
  id: VillageId;
  name: string;
  footprint: {
    x: number;
    y: number;
    width: 2 | 3;
    height: 2 | 3;
  };
  spawn: WorldPosition;
  returnSpawn: WorldPosition;
}

export interface BuildingDefinition {
  id: string;
  villageId: VillageId;
  type: BuildingType;
  name: string;
  entrance: {
    x: number;
    y: number;
  };
  returnSpawn: WorldPosition;
  interiorMapId: InteriorMapId;
}

export interface GameMap {
  id: MapId;
  name: string;
  kind: MapKind;
  width: number;
  height: number;
  tileSize: number;
  tiles: TileType[][];
  spawn: WorldPosition;
  exits: MapExit[];
}

export type VillageMap = GameMap;

export type InputAction =
  | { type: 'move'; direction: Direction }
  | { type: 'confirm' }
  | { type: 'cancel' }
  | { type: 'interact' }
  | { type: 'mount' }
  | { type: 'menu' };

export type NetworkEvent =
  | { type: 'joinLocation'; playerId: string; mapId: MapId }
  | { type: 'leaveLocation'; playerId: string; mapId: MapId }
  | { type: 'moveIntent'; playerId: string; direction: Direction; sequence: number }
  | { type: 'statePatch'; state: LocationRoomState }
  | { type: 'locationTransition'; toMapId: MapId; spawn: WorldPosition; transitionId: string };

export interface LocationPlayerState {
  profile: PlayerProfile;
  position: WorldPosition;
  connected: boolean;
}

export interface LocationRoomState {
  mapId: MapId;
  mapName: string;
  mapKind: MapKind;
  players: Record<RoomPlayerId, LocationPlayerState>;
  tileWidth: number;
  tileHeight: number;
  localPlayerId?: RoomPlayerId;
}

export interface MonsterRpgSaveState {
  schemaVersion: number;
  profile: PlayerProfile;
  position: WorldPosition;
  mapId: MapId;
  updatedAt: string;
}

export interface MovementResult {
  state: MonsterRpgSaveState;
  moved: boolean;
  blocked: boolean;
  blockedBy?: TileType | 'bounds';
  transition?: {
    toMapId: MapId;
    spawn: WorldPosition;
  };
}

export interface MoveIntentMessage {
  direction: Direction;
  sequence: number;
}

export interface JoinLocationOptions {
  mapId: MapId;
  profile: PlayerProfile;
  position?: WorldPosition;
  transitionId?: string;
}
