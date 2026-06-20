import { Client, Room, ServerError } from 'colyseus';
import { randomUUID } from 'node:crypto';
import {
  canEnterTile,
  getGameMap,
  isSameWorldPosition,
  isValidSpawnPosition,
  MONSTER_RPG_SCHEMA_VERSION,
  movePlayer,
  normalizeMapId,
  validateGameMapRegistry
} from '../../src/games/monster-rpg/sim';
import type {
  AvatarId,
  Direction,
  JoinLocationOptions,
  MapId,
  MonsterRpgSaveState,
  MoveIntentMessage,
  PlayerProfile,
  WorldPosition
} from '../../src/games/monster-rpg/sim/types';
import { LocationPlayerSchema, LocationStateSchema } from '../schema/LocationState';

const avatarIds = new Set<AvatarId>(['scout', 'ranger', 'keeper']);
const directions = new Set<Direction>(['north', 'east', 'south', 'west']);
const transitionTokenTtlMs = 15_000;
const pendingTransitions = new Map<string, PendingTransition>();
const registryErrors = validateGameMapRegistry();

interface PendingTransition {
  profileId: string;
  toMapId: MapId;
  spawn: WorldPosition;
  expiresAt: number;
}

if (registryErrors.length > 0) {
  throw new Error(`Invalid Monster RPG map registry:\n${registryErrors.join('\n')}`);
}

export class LocationRoom extends Room<{ state: LocationStateSchema; metadata: { mapId: MapId } }> {
  maxClients = 8;
  private mapId: MapId = 'world-map';

  async onCreate(options?: Partial<JoinLocationOptions>) {
    const mapId = normalizeMapId(options?.mapId);
    if (!mapId) {
      throw new ServerError(400, 'Invalid map id');
    }

    const map = getGameMap(mapId);

    this.mapId = map.id;
    await this.setMetadata({ mapId: map.id });
    this.setState(new LocationStateSchema());
    this.state.mapId = map.id;
    this.state.mapName = map.name;
    this.state.mapKind = map.kind;
    this.state.tileWidth = map.tileSize;
    this.state.tileHeight = map.tileSize;

    this.onMessage('moveIntent', (client, payload: MoveIntentMessage) => {
      this.handleMoveIntent(client, payload);
    });
  }

  onJoin(client: Client, options: JoinLocationOptions) {
    const requestedMapId = normalizeMapId(options?.mapId);
    if (!requestedMapId || requestedMapId !== this.mapId) {
      throw new ServerError(400, 'Invalid map id');
    }

    const map = getGameMap(this.mapId);
    const player = new LocationPlayerSchema();
    const profile = sanitizeProfile(options?.profile);
    const position = resolveJoinPosition(options, profile, this.mapId);

    player.profile.id = profile.id;
    player.profile.schemaVersion = profile.schemaVersion;
    player.profile.name = profile.name;
    player.profile.avatar = profile.avatar;
    player.profile.homeVillageId = profile.homeVillageId;
    player.position.mapId = position.mapId;
    player.position.x = position.x;
    player.position.y = position.y;
    player.position.facing = position.facing;
    player.connected = true;

    this.state.players.set(client.sessionId, player);
    console.log(`[location:${this.mapId}] join ${client.sessionId} ${profile.name}`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`[location:${this.mapId}] leave ${client.sessionId}`);
  }

  private handleMoveIntent(client: Client, payload: MoveIntentMessage) {
    if (!payload || !directions.has(payload.direction)) return;

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const map = getGameMap(this.mapId);
    const profile = schemaToProfile(player);
    const state: MonsterRpgSaveState = {
      schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
      profile,
      mapId: map.id,
      position: {
        mapId: player.position.mapId,
        x: player.position.x,
        y: player.position.y,
        facing: player.position.facing
      },
      updatedAt: new Date().toISOString()
    };
    const result = movePlayer(state, { type: 'move', direction: payload.direction }, map);

    if (result.transition) {
      const transitionId = createPendingTransition(profile.id, result.transition.toMapId, result.transition.spawn);
      client.send('locationTransition', { ...result.transition, transitionId });
      return;
    }

    player.position.mapId = result.state.position.mapId;
    player.position.x = result.state.position.x;
    player.position.y = result.state.position.y;
    player.position.facing = result.state.position.facing;
  }
}

function sanitizeProfile(profile?: PlayerProfile): PlayerProfile {
  const fallbackName = 'Player';
  const rawName = typeof profile?.name === 'string' ? profile.name.trim() : fallbackName;
  const name = rawName.replace(/\s+/g, ' ').slice(0, 18) || fallbackName;
  const avatar = profile?.avatar && avatarIds.has(profile.avatar) ? profile.avatar : 'scout';

  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    id: typeof profile?.id === 'string' && profile.id ? profile.id.slice(0, 80) : `guest-${Date.now()}`,
    name,
    avatar,
    homeVillageId: 'home-village'
  };
}

function resolveJoinPosition(options: JoinLocationOptions | undefined, profile: PlayerProfile, roomMapId: MapId): WorldPosition {
  const map = getGameMap(roomMapId);

  if (options?.transitionId) {
    return consumePendingTransition(options.transitionId, profile.id, roomMapId);
  }

  if (options?.position && !isSameWorldPosition(options.position, map.spawn)) {
    throw new ServerError(400, 'Invalid spawn position');
  }

  if (!isValidSpawnPosition(roomMapId, map.spawn) || !canEnterTile(map, map.spawn.x, map.spawn.y)) {
    throw new ServerError(500, 'Invalid room spawn');
  }

  return { ...map.spawn };
}

function schemaToProfile(player: LocationPlayerSchema): PlayerProfile {
  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    id: player.profile.id,
    name: player.profile.name,
    avatar: player.profile.avatar,
    homeVillageId: 'home-village'
  };
}

function createPendingTransition(profileId: string, toMapId: MapId, spawn: WorldPosition): string {
  cleanupExpiredTransitions();

  if (!isValidSpawnPosition(toMapId, spawn)) {
    throw new ServerError(500, 'Invalid transition spawn');
  }

  const transitionId = randomUUID();
  pendingTransitions.set(transitionId, {
    profileId,
    toMapId,
    spawn: { ...spawn },
    expiresAt: Date.now() + transitionTokenTtlMs
  });
  return transitionId;
}

function consumePendingTransition(transitionId: string, profileId: string, roomMapId: MapId): WorldPosition {
  cleanupExpiredTransitions();

  const pending = pendingTransitions.get(transitionId);
  if (!pending || pending.profileId !== profileId || pending.toMapId !== roomMapId) {
    throw new ServerError(400, 'Invalid transition token');
  }

  pendingTransitions.delete(transitionId);
  return { ...pending.spawn };
}

function cleanupExpiredTransitions(): void {
  const now = Date.now();
  pendingTransitions.forEach((transition, id) => {
    if (transition.expiresAt <= now) pendingTransitions.delete(id);
  });
}
