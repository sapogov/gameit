export type Direction = 'north' | 'east' | 'south' | 'west';

export type AvatarId = 'scout' | 'ranger' | 'keeper';

export type MultiplayerStatus = 'connecting' | 'online' | 'offline';

export type RoomPlayerId = string;

export type CreatureLabelMode = 'icon-only' | 'icon-plus-name';

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

export type CreatureRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical';
export type CardRarity = CreatureRarity;
export type CardType = 'creature' | 'farm' | 'material' | 'buff';
export type CardBuffType = 'battle' | 'drop-chance';

export type CreatureType =
  | 'verdant'
  | 'ember'
  | 'tide'
  | 'stone'
  | 'gale'
  | 'spark'
  | 'shade'
  | 'lumen'
  | 'frost'
  | 'mystic'
  | 'toxin'
  | 'metal';

export type AttackPoolId =
  | 'basic'
  | 'starter-balanced'
  | 'starter-guard'
  | 'starter-quick'
  | 'verdant-bite'
  | 'ember-claw'
  | 'tide-splash'
  | 'stone-guard'
  | 'gale-peck'
  | 'spark-jolt'
  | 'shade-prowl'
  | 'lumen-pulse'
  | 'frost-nip'
  | 'mystic-focus'
  | 'toxin-sting'
  | 'metal-tackle'
  | 'rare-burst'
  | 'legendary-aura'
  | 'mythic-surge';

export interface BaseStatTendencies {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  stamina: number;
}

export type CreatureStatKey = keyof BaseStatTendencies;

export interface CreatureAttackRecord {
  id: string;
  name: string;
  type: CreatureType;
  power: number;
  statFocus: CreatureStatKey;
}

export interface CreatureSpeciesRecord {
  id: number;
  slug: string;
  displayName: string;
  rarity: CreatureRarity;
  type: CreatureType;
  baseStats: BaseStatTendencies;
  attackPoolIds: AttackPoolId[];
  mvpStatus: 'polished' | 'placeholder';
}

export interface SaveStack {
  id: string;
  ownerPlayerId: string;
  quantity: number;
}

export type CreationRequirementScope = {
  rarity?: CreatureRarity;
  type?: CreatureType;
  speciesId?: number;
};

export interface CreationRequirement {
  materialId: string;
  quantity: number;
  scope?: CreationRequirementScope;
}

export interface CreatureCardInstance {
  id: string;
  ownerPlayerId: string;
  cardDefinitionId: string;
  speciesId: number;
  rarity: CardRarity;
  stats: BaseStatTendencies;
  knownAttacks: [CreatureAttackRecord, CreatureAttackRecord];
}

export type EggOrigin = 'card' | 'direct-drop';

export interface EggSaveRecord {
  id: string;
  ownerPlayerId: string;
  speciesId: number;
  rarity: CreatureRarity;
  origin: EggOrigin;
  requirements: CreationRequirement[];
  createdAt: string;
  stats?: BaseStatTendencies;
  inheritedAttacks?: [CreatureAttackRecord, CreatureAttackRecord];
}

export interface InventorySaveContainer {
  ownerPlayerId: string;
  currencies: Record<string, number>;
  items: Record<string, SaveStack>;
  cards: Record<string, SaveStack>;
  creatureCards: Record<string, CreatureCardInstance>;
  eggs: Record<string, EggSaveRecord>;
}

export interface CreatureSaveRecord {
  id: string;
  ownerPlayerId: string;
  speciesId: number;
  level: number;
  experience: number;
  stats: BaseStatTendencies;
  attacks: CreatureAttackRecord[];
  hp: number;
  maxHp: number;
  fainted: boolean;
  cooldowns: Record<string, string>;
}

export type BattleParticipantKind = 'player' | 'enemy';

export type BattleStatus = 'active' | 'player-won' | 'player-lost' | 'ran' | 'disconnected-grace' | 'abandoned';

export interface BattleCreatureState {
  id: string;
  ownerPlayerId: string;
  speciesId: number;
  level: number;
  stats: BaseStatTendencies;
  attacks: CreatureAttackRecord[];
  hp: number;
  maxHp: number;
  fatigue: number;
  maxFatigue: number;
  fainted: boolean;
}

export interface BattleParticipantState {
  kind: BattleParticipantKind;
  playerId: string;
  name: string;
  activeCreature: BattleCreatureState;
}

export interface BattleTurnLogEntry {
  id: string;
  message: string;
}

export interface BattleRoomState {
  battleId: string;
  encounterId: string;
  wildSpeciesId: number;
  status: BattleStatus;
  turn: number;
  canRun: boolean;
  runAttempts: number;
  player: BattleParticipantState;
  enemy: BattleParticipantState;
  lastLog: BattleTurnLogEntry[];
  validPlayerAttackIds: string[];
  rewardGranted: boolean;
  rewards?: BattleRewardBundle;
  disconnectGraceUntil?: string;
}

export interface BattleMaterialReward {
  materialId: string;
  quantity: number;
}

export interface BattleRewardBundle {
  seed: number;
  magicDust: number;
  playerExperience: number;
  battlingCreatureExperience: number;
  activePartyExperience: number;
  packSeed?: number;
  directDropEggSpeciesId?: number;
  materials: BattleMaterialReward[];
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

export interface FarmPosition {
  mapId: VillageId;
  x: number;
  y: number;
}

export interface FarmSaveRecord {
  id: string;
  ownerPlayerId: string;
  farmType: string;
  resourceId: string;
  level: number;
  mapId: VillageId;
  position: FarmPosition;
  productionRatePerMinute: number;
  storageCap: number;
  storedResources: Record<string, number>;
  lastProductionAt: string;
  collectCooldownUntil?: string;
  theftCooldowns: Record<string, string>;
}

export interface FarmSaveContainer {
  ownerPlayerId: string;
  farms: Record<string, FarmSaveRecord>;
}

export type JournalSpeciesState = 'silhouette' | 'discovered';

export type JournalSpeciesViewState = 'unseen' | JournalSpeciesState;

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
  activeCardBuffs?: Partial<Record<CardBuffType, string>>;
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
  | { type: 'claimWildEncounter'; playerId: string; encounterId: string }
  | { type: 'statePatch'; state: LocationRoomState }
  | { type: 'locationTransition'; toMapId: MapId; spawn: WorldPosition; transitionId: string }
  | { type: 'joinBattle'; playerId: string; battleId: string }
  | { type: 'chooseBattleAttack'; playerId: string; battleId: string; attackId: string };

export interface LocationPlayerState {
  profile: PlayerProfile;
  position: WorldPosition;
  connected: boolean;
  inBattle: boolean;
  battleId?: string;
}

export type WildEncounterStatus = 'available' | 'claimed';

export type WildEncounterOutcome = 'defeated' | 'lost' | 'ran';

export interface WildEncounterState {
  id: string;
  zoneId: string;
  mapId: MapId;
  speciesId: number;
  x: number;
  y: number;
  status: WildEncounterStatus;
  claimedByPlayerId?: string;
  respawnAt?: string;
}

export interface ClaimWildEncounterMessage {
  encounterId: string;
  activeCreature?: CreatureSaveRecord;
}

export interface ResolveWildEncounterMessage {
  encounterId: string;
  outcome: WildEncounterOutcome;
  battleId?: string;
  battleToken?: string;
}

export interface WildEncounterClaimedMessage {
  encounterId: string;
  speciesId: number;
  battleId: string;
  battleToken: string;
}

export interface BattleAttackIntentMessage {
  attackId: string;
}

export interface JoinBattleOptions {
  battleId: string;
  battleToken: string;
  profile: PlayerProfile;
}

export interface BattleResultMessage {
  battleId: string;
  encounterId: string;
  outcome: WildEncounterOutcome;
  playerCreatureId: string;
  playerCreatureHp: number;
  playerCreatureFainted: boolean;
  rewardGranted: boolean;
  rewards?: BattleRewardBundle;
}

export interface LocationRoomState {
  mapId: MapId;
  mapName: string;
  mapKind: MapKind;
  players: Record<RoomPlayerId, LocationPlayerState>;
  encounters: Record<string, WildEncounterState>;
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
  blockedBy?: TileType | 'bounds' | 'onboarding';
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
