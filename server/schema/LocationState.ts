import { defineTypes, MapSchema, Schema } from '@colyseus/schema';
import type { AvatarId, Direction, MapKind, MapId } from '../../src/games/monster-rpg/sim/types';

export class PlayerProfileSchema extends Schema {
  declare schemaVersion: number;
  declare id: string;
  declare name: string;
  declare avatar: AvatarId;
  declare homeVillageId: string;

  constructor() {
    super();
    this.schemaVersion = 4;
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

  constructor() {
    super();
    this.profile = new PlayerProfileSchema();
    this.position = new WorldPositionSchema();
    this.connected = true;
  }
}
defineTypes(LocationPlayerSchema, {
  profile: PlayerProfileSchema,
  position: WorldPositionSchema,
  connected: 'boolean'
});

export class LocationStateSchema extends Schema {
  declare mapId: MapId;
  declare mapName: string;
  declare mapKind: MapKind;
  declare tileWidth: number;
  declare tileHeight: number;
  declare players: MapSchema<LocationPlayerSchema>;

  constructor() {
    super();
    this.mapId = 'world-map';
    this.mapName = 'Overworld';
    this.mapKind = 'world-map';
    this.tileWidth = 16;
    this.tileHeight = 16;
    this.players = new MapSchema<LocationPlayerSchema>();
  }
}
defineTypes(LocationStateSchema, {
  mapId: 'string',
  mapName: 'string',
  mapKind: 'string',
  tileWidth: 'number',
  tileHeight: 'number',
  players: { map: LocationPlayerSchema }
});
