import { defineTypes, MapSchema, Schema } from '@colyseus/schema';
import type { AvatarId, Direction, MapKind, MapId, WildEncounterStatus } from '../../src/games/monster-rpg/sim/types';

export class PlayerProfileSchema extends Schema {
  declare schemaVersion: number;
  declare id: string;
  declare name: string;
  declare avatar: AvatarId;
  declare homeVillageId: string;

  constructor() {
    super();
    this.schemaVersion = 7;
    this.id = '';
    this.name = '';
    this.avatar = 'scout';
    this.homeVillageId = '';
  }
}
defineTypes(PlayerProfileSchema, {
  schemaVersion: 'number',
  id: 'string',
  name: 'string',
  avatar: 'string',
  homeVillageId: 'string'
});

export class WorldPositionSchema extends Schema {
  declare mapId: MapId;
  declare x: number;
  declare y: number;
  declare facing: Direction;

  constructor() {
    super();
    this.mapId = 'world-map';
    this.x = 0;
    this.y = 0;
    this.facing = 'south';
  }
}
defineTypes(WorldPositionSchema, {
  mapId: 'string',
  x: 'number',
  y: 'number',
  facing: 'string'
});

export class LocationPlayerSchema extends Schema {
  declare profile: PlayerProfileSchema;
  declare position: WorldPositionSchema;
  declare connected: boolean;
  declare inBattle: boolean;
  declare battleId: string;

  constructor() {
    super();
    this.profile = new PlayerProfileSchema();
    this.position = new WorldPositionSchema();
    this.connected = true;
    this.inBattle = false;
    this.battleId = '';
  }
}
defineTypes(LocationPlayerSchema, {
  profile: PlayerProfileSchema,
  position: WorldPositionSchema,
  connected: 'boolean',
  inBattle: 'boolean',
  battleId: 'string'
});

export class WildEncounterSchema extends Schema {
  declare id: string;
  declare zoneId: string;
  declare mapId: MapId;
  declare speciesId: number;
  declare x: number;
  declare y: number;
  declare status: WildEncounterStatus;
  declare claimedByPlayerId: string;
  declare respawnAt: string;

  constructor() {
    super();
    this.id = '';
    this.zoneId = '';
    this.mapId = 'world-map';
    this.speciesId = 1;
    this.x = 0;
    this.y = 0;
    this.status = 'available';
    this.claimedByPlayerId = '';
    this.respawnAt = '';
  }
}
defineTypes(WildEncounterSchema, {
  id: 'string',
  zoneId: 'string',
  mapId: 'string',
  speciesId: 'number',
  x: 'number',
  y: 'number',
  status: 'string',
  claimedByPlayerId: 'string',
  respawnAt: 'string'
});

export class LocationStateSchema extends Schema {
  declare balanceVersion: number;
  declare mapId: MapId;
  declare mapName: string;
  declare mapKind: MapKind;
  declare tileWidth: number;
  declare tileHeight: number;
  declare players: MapSchema<LocationPlayerSchema>;
  declare encounters: MapSchema<WildEncounterSchema>;

  constructor() {
    super();
    this.balanceVersion = 0;
    this.mapId = 'world-map';
    this.mapName = 'Overworld';
    this.mapKind = 'world-map';
    this.tileWidth = 16;
    this.tileHeight = 16;
    this.players = new MapSchema<LocationPlayerSchema>();
    this.encounters = new MapSchema<WildEncounterSchema>();
  }
}
defineTypes(LocationStateSchema, {
  balanceVersion: 'number',
  mapId: 'string',
  mapName: 'string',
  mapKind: 'string',
  tileWidth: 'number',
  tileHeight: 'number',
  players: { map: LocationPlayerSchema },
  encounters: { map: WildEncounterSchema }
});
