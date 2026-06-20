import { Client, Room, ServerError } from 'colyseus';
import { randomUUID } from 'node:crypto';
import {
  WILD_ENCOUNTER_LOSS_COOLDOWN_MS,
  WILD_ENCOUNTER_RESPAWN_MS,
  canTargetEncounter,
  canEnterTile,
  createInitialSave,
  createWildEncounterSpawn,
  getGameMap,
  getWildEncounterZonesForMap,
  isSameWorldPosition,
  isValidSpawnPosition,
  MONSTER_RPG_SCHEMA_VERSION,
  movePlayer,
  normalizeMapId,
  rollSpawnDelayMs,
  validateGameMapRegistry
} from '../../src/games/monster-rpg/sim';
import type {
  AvatarId,
  ClaimWildEncounterMessage,
  Direction,
  JoinLocationOptions,
  MapId,
  MonsterRpgSaveState,
  MoveIntentMessage,
  PlayerProfile,
  ResolveWildEncounterMessage,
  WorldPosition
} from '../../src/games/monster-rpg/sim/types';
import { LocationPlayerSchema, LocationStateSchema, WildEncounterSchema } from '../schema/LocationState';

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
  private encounterCooldowns = new Map<string, number>();
  private encounterTimerVersions = new Map<string, number>();

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
    this.spawnInitialWildEncounters();

    this.onMessage('moveIntent', (client, payload: MoveIntentMessage) => {
      this.handleMoveIntent(client, payload);
    });
    this.onMessage('claimWildEncounter', (client, payload: ClaimWildEncounterMessage) => {
      this.handleClaimWildEncounter(client, payload);
    });
    this.onMessage('resolveWildEncounter', (client, payload: ResolveWildEncounterMessage) => {
      this.handleResolveWildEncounter(client, payload);
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

    player.profile.id = profile.playerId;
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
      ...createInitialSave(profile),
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
      const transitionId = createPendingTransition(profile.playerId, result.transition.toMapId, result.transition.spawn);
      client.send('locationTransition', { ...result.transition, transitionId });
      return;
    }

    player.position.mapId = result.state.position.mapId;
    player.position.x = result.state.position.x;
    player.position.y = result.state.position.y;
    player.position.facing = result.state.position.facing;
  }

  private handleClaimWildEncounter(client: Client, payload: ClaimWildEncounterMessage) {
    const encounterId = typeof payload?.encounterId === 'string' ? payload.encounterId : '';
    const encounter = this.state.encounters.get(encounterId);
    const player = this.state.players.get(client.sessionId);

    if (!encounter || !player) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'missing' });
      return;
    }

    if (encounter.status !== 'available') {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'unavailable' });
      return;
    }

    const cooldownKey = getEncounterCooldownKey(player.profile.id, encounter.id);
    const cooldownUntil = this.encounterCooldowns.get(cooldownKey) ?? 0;
    if (cooldownUntil > Date.now()) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'cooldown' });
      return;
    }

    if (!canTargetEncounter(player.position, encounter)) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'range' });
      return;
    }

    encounter.status = 'claimed';
    encounter.claimedByPlayerId = player.profile.id;
    encounter.respawnAt = new Date(Date.now() + WILD_ENCOUNTER_RESPAWN_MS).toISOString();
    this.scheduleEncounterTimer(encounter.id, WILD_ENCOUNTER_RESPAWN_MS, () => this.respawnWildEncounter(encounter.id));
    client.send('wildEncounterClaimed', {
      encounterId: encounter.id,
      speciesId: encounter.speciesId,
      battleToken: `${encounter.id}:${client.sessionId}:${Date.now()}`
    });
  }

  private handleResolveWildEncounter(client: Client, payload: ResolveWildEncounterMessage) {
    const encounterId = typeof payload?.encounterId === 'string' ? payload.encounterId : '';
    const outcome = payload?.outcome;
    const encounter = this.state.encounters.get(encounterId);
    const player = this.state.players.get(client.sessionId);

    if (!encounter || !player || encounter.claimedByPlayerId !== player.profile.id) return;

    if (outcome === 'lost' || outcome === 'ran') {
      this.encounterCooldowns.set(
        getEncounterCooldownKey(player.profile.id, encounter.id),
        Date.now() + WILD_ENCOUNTER_LOSS_COOLDOWN_MS
      );
      encounter.status = 'available';
      encounter.claimedByPlayerId = '';
      encounter.respawnAt = '';
      this.scheduleNaturalWildEncounterRespawn(encounter.id);
      client.send('wildEncounterReleased', { encounterId: encounter.id, outcome });
      return;
    }

    if (outcome === 'defeated') {
      encounter.respawnAt = new Date(Date.now() + WILD_ENCOUNTER_RESPAWN_MS).toISOString();
      this.scheduleEncounterTimer(encounter.id, WILD_ENCOUNTER_RESPAWN_MS, () => this.respawnWildEncounter(encounter.id));
    }
  }

  private spawnInitialWildEncounters() {
    getWildEncounterZonesForMap(this.mapId).forEach((zone, index) => {
      const spawn = createWildEncounterSpawn(zone, createDeterministicRng(`${this.mapId}:${zone.id}:${index}`));
      const encounter = new WildEncounterSchema();
      encounter.id = spawn.id;
      encounter.zoneId = spawn.zoneId;
      encounter.mapId = spawn.mapId;
      encounter.speciesId = spawn.speciesId;
      encounter.x = spawn.x;
      encounter.y = spawn.y;
      encounter.status = 'available';
      this.state.encounters.set(encounter.id, encounter);
      this.scheduleNaturalWildEncounterRespawn(encounter.id);
    });
  }

  private respawnWildEncounter(encounterId: string) {
    const encounter = this.state.encounters.get(encounterId);
    if (!encounter || encounter.status === 'available') return;

    this.rerollWildEncounter(encounter);
    this.scheduleNaturalWildEncounterRespawn(encounter.id);
  }

  private rerollWildEncounter(encounter: WildEncounterSchema) {
    const zone = getWildEncounterZonesForMap(this.mapId).find((candidate) => candidate.id === encounter.zoneId);
    if (!zone) return;

    const spawn = createWildEncounterSpawn(zone);
    encounter.speciesId = spawn.speciesId;
    encounter.x = spawn.x;
    encounter.y = spawn.y;
    encounter.status = 'available';
    encounter.claimedByPlayerId = '';
    encounter.respawnAt = '';
  }

  private scheduleNaturalWildEncounterRespawn(encounterId: string) {
    const encounter = this.state.encounters.get(encounterId);
    if (!encounter || encounter.status !== 'available') return;

    const delayMs = rollSpawnDelayMs();
    encounter.respawnAt = new Date(Date.now() + delayMs).toISOString();
    this.scheduleEncounterTimer(encounterId, delayMs, () => {
      const current = this.state.encounters.get(encounterId);
      if (!current || current.status !== 'available') return;

      this.rerollWildEncounter(current);
      this.scheduleNaturalWildEncounterRespawn(encounterId);
    });
  }

  private scheduleEncounterTimer(encounterId: string, delayMs: number, callback: () => void) {
    const version = (this.encounterTimerVersions.get(encounterId) ?? 0) + 1;
    this.encounterTimerVersions.set(encounterId, version);
    this.clock.setTimeout(() => {
      if (this.encounterTimerVersions.get(encounterId) !== version) return;
      callback();
    }, delayMs);
  }
}

function sanitizeProfile(profile?: PlayerProfile): PlayerProfile {
  const fallbackName = 'Player';
  const rawName = typeof profile?.name === 'string' ? profile.name.trim() : fallbackName;
  const name = rawName.replace(/\s+/g, ' ').slice(0, 18) || fallbackName;
  const avatar = profile?.avatar && avatarIds.has(profile.avatar) ? profile.avatar : 'scout';

  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    playerId:
      typeof profile?.playerId === 'string' && profile.playerId ? profile.playerId.slice(0, 80) : `guest-${Date.now()}`,
    name,
    avatar,
    homeVillageId: 'home-village'
  };
}

function resolveJoinPosition(options: JoinLocationOptions | undefined, profile: PlayerProfile, roomMapId: MapId): WorldPosition {
  const map = getGameMap(roomMapId);

  if (options?.transitionId) {
    return consumePendingTransition(options.transitionId, profile.playerId, roomMapId);
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
    playerId: player.profile.id,
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

function getEncounterCooldownKey(playerId: string, encounterId: string): string {
  return `${playerId}:${encounterId}`;
}

function createDeterministicRng(seed: string): () => number {
  let hash = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
