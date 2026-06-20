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
  playerId: string;
  name: string;
  avatar: AvatarId;
  homeVillageId: VillageId;
}

export interface SaveStack {
  id: string;
  ownerPlayerId: string;
  quantity: number;
}

export interface InventorySaveContainer {
  ownerPlayerId: string;
  currencies: Record<string, number>;
  items: Record<string, SaveStack>;
  cards: Record<string, SaveStack>;
}

export interface CreatureSaveRecord {
  id: string;
  ownerPlayerId: string;
  speciesId: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  fainted: boolean;
  cooldowns: Record<string, string>;
}

export interface CreatureSaveContainer {
  ownerPlayerId: string;
  activePartyCreatureIds: string[];
  storedCreatureIds: string[];
  creatures: Record<string, CreatureSaveRecord>;
}

export interface VillageSaveContainer {
  id: VillageId;
  ownerPlayerId: string;
  level: number;
  discoveredVillageIds: VillageId[];
}

export interface FarmSaveRecord {
  id: string;
  ownerPlayerId: string;
  farmType: string;
  level: number;
  storedResources: Record<string, number>;
  collectCooldownUntil?: string;
  theftCooldowns: Record<string, string>;
}

export interface FarmSaveContainer {
  ownerPlayerId: string;
  farms: Record<string, FarmSaveRecord>;
}

export type JournalSpeciesState = 'fought' | 'discovered';

export interface JournalSaveContainer {
  ownerPlayerId: string;
  species: Record<string, JournalSpeciesState>;
}

export interface ProgressionSaveContainer {
  ownerPlayerId: string;
  playerLevel: number;
  playerExperience: number;
  flags: Record<string, boolean>;
  completedQuestIds: string[];
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
  inventory: InventorySaveContainer;
  creatures: CreatureSaveContainer;
  village: VillageSaveContainer;
  farms: FarmSaveContainer;
  journal: JournalSaveContainer;
  progression: ProgressionSaveContainer;
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
