import { Client, Room, ServerError } from 'colyseus';
import { randomUUID } from 'node:crypto';
import {
  WILD_ENCOUNTER_LOSS_COOLDOWN_MS,
  WILD_ENCOUNTER_RESPAWN_MS,
  canTargetEncounter,
  canEnterTile,
  canCreatureUseRole,
  createInitialSave,
  createCreatureLifecycleRng,
  createWildEncounterSpawn,
  getGameMap,
  getSpeciesById,
  getWildEncounterZonesForMap,
  isSameWorldPosition,
  isValidSpawnPosition,
  MONSTER_RPG_SCHEMA_VERSION,
  CURRENT_BALANCE_VERSION,
  GAME_BALANCE_CONFIG,
  movePlayer,
  normalizeMapId,
  rollStats,
  rollSpawnDelayMs,
  selectCreatureAttacks,
  validateGameMapRegistry,
  generatedMapRegistry,
  type BattleResolution
} from '../../src/games/monster-rpg/sim';
import type {
  AvatarId,
  ClaimGuardedFarmTheftMessage,
  ClaimWildEncounterMessage,
  CreatureSaveRecord,
  Direction,
  FarmSaveRecord,
  JoinLocationOptions,
  MapId,
  MonsterRpgSaveState,
  MoveIntentMessage,
  PlayerProfile,
  ResolveWildEncounterMessage,
  WorldPosition
} from '../../src/games/monster-rpg/sim/types';
import {
  createBattleClaim,
  createGuardBattleClaim,
  getResolvedBattleOutcome,
  onBattleClaimResolved,
  removeBattleClaim
} from '../battleRegistry';
import { LocationPlayerSchema, LocationStateSchema, WildEncounterSchema } from '../schema/LocationState';
import { getGeneratedMapForServer } from '../generatedMapAdapter';
import { verifyGuestCredential } from '../auth/guestCredentials';
import { authorityEnabled, guestCredentialConfig, guestCredentialTtlSeconds, playerAuthority } from '../authority/runtime';

const avatarIds = new Set<AvatarId>(['scout', 'ranger', 'keeper']);
const directions = new Set<Direction>(['north', 'east', 'south', 'west']);
export const TRANSITION_TOKEN_TTL_MS = GAME_BALANCE_CONFIG.maps.transitionTokenTtlMs;
const pendingTransitions = new Map<string, PendingTransition>();
const registryErrors = validateGameMapRegistry();
const generatedTown = getGeneratedMapForServer('tracer-water-town');
const generatedRoute = getGeneratedMapForServer('tracer-world-route');

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
  private battleResultCleanups = new Map<string, () => void>();
  private finalizedBattleIds = new Set<string>();
  /** Per-connection monotonic intent fence; it is never client-authoritative state. */
  private moveSequences = new Map<string, number>();

  async onCreate(options?: Partial<JoinLocationOptions>) {
    if (!authorityEnabled) throw new ServerError(503, JSON.stringify({ code: 'AUTHORITY_MAINTENANCE' }));
    assertBalanceVersion(options?.balanceVersion);
    const advertisedMapSet = generatedMapRegistry.handshake();
    if (options?.mapSetId !== advertisedMapSet.id || options?.mapSetVersion !== advertisedMapSet.version) throw new ServerError(409, 'Generated map-set version mismatch');
    const mapId = normalizeMapId(options?.mapId);
    if (!mapId) {
      throw new ServerError(400, 'Invalid map id');
    }

    const map = getGameMap(mapId);

    this.mapId = map.id;
    await this.setMetadata({ mapId: map.id });
    this.setState(new LocationStateSchema());
    this.state.balanceVersion = CURRENT_BALANCE_VERSION;
    this.state.mapId = map.id;
    this.state.mapName = map.name;
    this.state.mapKind = map.kind;
    this.state.tileWidth = map.tileSize;
    this.state.tileHeight = map.tileSize;
    const mapSet = generatedMapRegistry.handshake();
    if (!generatedTown.findPath({ x: 11, y: 29 }, { x: 11, y: 29 }) || !generatedRoute.map.exits.some((exit) => exit.toMapId === generatedTown.map.id)) throw new ServerError(500, 'Generated map registry is unavailable');
    this.state.mapSetId = mapSet.id;
    this.state.mapSetVersion = mapSet.version;
    this.spawnInitialWildEncounters();

    this.onMessage('moveIntent', (client, payload: MoveIntentMessage) => {
      this.handleMoveIntent(client, payload);
    });
    this.onMessage('claimWildEncounter', (client, payload: ClaimWildEncounterMessage) => {
      this.handleClaimWildEncounter(client, payload);
    });
    this.onMessage('claimGuardedFarmTheft', (client, payload: ClaimGuardedFarmTheftMessage) => {
      this.handleClaimGuardedFarmTheft(client, payload);
    });
    this.onMessage('attemptFarmTheft', (client, payload: unknown) => {
      void this.handleAttemptFarmTheft(client, payload);
    });
    this.onMessage('resolveWildEncounter', (client, payload: ResolveWildEncounterMessage) => {
      this.handleResolveWildEncounter(client, payload);
    });
  }

  async onJoin(client: Client, options: JoinLocationOptions) {
    assertBalanceVersion(options?.balanceVersion);
    const advertisedMapSet = generatedMapRegistry.handshake();
    if (options.mapSetId !== advertisedMapSet.id || options.mapSetVersion !== advertisedMapSet.version) {
      throw new ServerError(409, 'Generated map-set version mismatch');
    }
    const requestedMapId = normalizeMapId(options?.mapId);
    if (!requestedMapId || requestedMapId !== this.mapId) {
      throw new ServerError(400, 'Invalid map id');
    }

    const principal = authenticateLocationJoin(options?.credential);
    const canonical = await playerAuthority.snapshot({ sub: principal.sub });
    if (!canonical) throw new ServerError(403, JSON.stringify({ code: 'AUTHORITY_REQUIRED' }));
    const map = getGameMap(this.mapId);
    const player = new LocationPlayerSchema();
    const profile = canonical.save.profile;
    const position = resolveCanonicalJoinPosition(options, canonical.save.position, profile, this.mapId);

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
    player.inBattle = false;
    player.battleId = '';

    this.state.players.set(client.sessionId, player);
    this.moveSequences.set(client.sessionId, 0);
    console.log(`[location:${this.mapId}] join ${client.sessionId} ${profile.name}`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.moveSequences.delete(client.sessionId);
    console.log(`[location:${this.mapId}] leave ${client.sessionId}`);
  }

  private async handleMoveIntent(client: Client, payload: MoveIntentMessage) {
    if (!payload || !directions.has(payload.direction) || !Number.isSafeInteger(payload.sequence) || payload.sequence <= (this.moveSequences.get(client.sessionId) ?? 0)) return;

    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    if (player.inBattle) return;

    const result = await playerAuthority.applyMovement({ sub: player.profile.id }, payload.direction, { mapId: this.mapId });
    if (!result) return;
    this.moveSequences.set(client.sessionId, payload.sequence);

    if (result.transition) {
      const transitionId = createPendingTransition(player.profile.id, result.transition.toMapId as MapId, result.transition.spawn as WorldPosition);
      client.send('locationTransition', { ...result.transition, transitionId });
    }
    const position = result.snapshot.save.position;
    player.position.mapId = position.mapId; player.position.x = position.x; player.position.y = position.y; player.position.facing = position.facing;
    client.send('authoritySnapshot', result.snapshot);
  }

  private async handleClaimWildEncounter(client: Client, payload: ClaimWildEncounterMessage) {
    const encounterId = typeof payload?.encounterId === 'string' ? payload.encounterId : '';
    const encounter = this.state.encounters.get(encounterId);
    const player = this.state.players.get(client.sessionId);

    if (!encounter || !player) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'missing' });
      return;
    }

    if (player.inBattle) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'in-battle' });
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

    const frozen = await this.freezeClaimParty(client, payload?.activePartyCreatureIds, payload?.expectedRosterRevision);
    const activeCreature = frozen?.creatures[0];
    if (!activeCreature) {
      client.send('wildEncounterClaimRejected', { encounterId, reason: 'ROSTER_UNAVAILABLE' });
      return;
    }

    const battleClaim = createBattleClaim({
      encounterId: encounter.id,
      locationRoomId: this.roomId,
      mapId: this.mapId,
      playerProfile: schemaToProfile(player),
      playerCreature: activeCreature,
      wildSpeciesId: encounter.speciesId,
      zoneId: encounter.zoneId
    });
    this.battleResultCleanups.set(
      battleClaim.battleId,
      onBattleClaimResolved(battleClaim.battleId, (result) => {
        void playerAuthority.settleBattle({ sub: battleClaim.playerProfile.playerId }, result).finally(() => this.finalizeBattleResult(result));
      })
    );

    encounter.status = 'claimed';
    encounter.claimedByPlayerId = player.profile.id;
    encounter.respawnAt = new Date(Date.now() + WILD_ENCOUNTER_RESPAWN_MS).toISOString();
    player.inBattle = true;
    player.battleId = battleClaim.battleId;
    this.scheduleEncounterTimer(encounter.id, WILD_ENCOUNTER_RESPAWN_MS, () => this.respawnWildEncounter(encounter.id));
    client.send('wildEncounterClaimed', {
      encounterId: encounter.id,
      speciesId: encounter.speciesId,
      battleId: battleClaim.battleId,
      battleToken: battleClaim.battleToken
    });
  }

  private async handleClaimGuardedFarmTheft(client: Client, payload: ClaimGuardedFarmTheftMessage) {
    const player = this.state.players.get(client.sessionId);
    const farmId = typeof payload?.farmId === 'string' ? payload.farmId : '';
    const farm = await this.loadForeignFarm(client, farmId);

    if (!player || !farm) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm?.id ?? '', reason: 'missing' });
      return;
    }

    if (player.inBattle) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm.id, reason: 'in-battle' });
      return;
    }

    if (farm.ownerPlayerId === player.profile.id) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm.id, reason: 'owner-cannot-steal' });
      return;
    }

    if (farm.mapId !== this.mapId || !isFacingFarmPosition(player.position, farm)) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm.id, reason: 'range' });
      return;
    }

    const frozen = await this.freezeClaimParty(client, payload?.activePartyCreatureIds, payload?.expectedRosterRevision);
    const activeCreature = frozen?.creatures[0];
    if (!activeCreature) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm.id, reason: 'no-ready-creature' });
      return;
    }

    const owner = await playerAuthority.snapshot({ sub: farm.ownerPlayerId });
    const guardCreatureId = farm.guardCreatureId;
    const guardCreature = owner && guardCreatureId ? sanitizeGuardCreature(owner.save.creatures.creatures[guardCreatureId], farm) : null;
    if (!guardCreature) {
      client.send('guardedFarmTheftClaimRejected', { farmId: farm.id, reason: 'unguarded' });
      return;
    }

    const battleClaim = createGuardBattleClaim({
      farm,
      guardCreature,
      locationRoomId: this.roomId,
      mapId: this.mapId,
      playerProfile: schemaToProfile(player),
      playerCreature: activeCreature
    });
    this.battleResultCleanups.set(
      battleClaim.battleId,
      onBattleClaimResolved(battleClaim.battleId, (result) => {
        const ownerId = battleClaim.guardOwnerPlayerId;
        const farmId = battleClaim.farmId;
        const guardCreatureId = battleClaim.guardCreature?.id;
        const settlement = ownerId && farmId && guardCreatureId
          ? playerAuthority.settleGuardedTheft({ attackerId: battleClaim.playerProfile.playerId, ownerId, farmId, guardCreatureId, result })
          : Promise.resolve(false);
        void settlement.finally(() => this.finalizeBattleResult(result));
      })
    );

    player.inBattle = true;
    player.battleId = battleClaim.battleId;
    client.send('guardedFarmTheftClaimed', {
      farmId: farm.id,
      battleId: battleClaim.battleId,
      battleToken: battleClaim.battleToken
    });
  }

  private async handleAttemptFarmTheft(client: Client, payload: unknown) {
    const message = payload as { farmId?: unknown; intentId?: unknown; expectedRevision?: unknown } | null;
    const player = this.state.players.get(client.sessionId);
    const farmId = typeof message?.farmId === 'string' ? message.farmId : '';
    const intentId = typeof message?.intentId === 'string' ? message.intentId : '';
    const expectedRevision = typeof message?.expectedRevision === 'number' ? message.expectedRevision : -1;
    const farm = await this.loadForeignFarm(client, farmId);
    if (!player || !farm || farm.mapId !== this.mapId || !isFacingFarmPosition(player.position, farm) || farm.guardCreatureId || !/^[A-Za-z0-9_-]{1,128}$/.test(intentId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      client.send('farmTheftResult', { status: 'rejected', code: 'REJECTED' });
      return;
    }
    client.send('farmTheftResult', await playerAuthority.settleUnguardedFarmTheft({
      principal: { sub: player.profile.id },
      intentId,
      expectedRevision,
      roomMapId: this.mapId,
      farmId
    }));
  }

  private handleResolveWildEncounter(client: Client, payload: ResolveWildEncounterMessage) {
    const encounterId = typeof payload?.encounterId === 'string' ? payload.encounterId : '';
    const outcome = payload?.outcome;
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const battleId = typeof payload?.battleId === 'string' ? payload.battleId : '';
    const battleToken = typeof payload?.battleToken === 'string' ? payload.battleToken : '';
    const resolved = getResolvedBattleOutcome(battleId, battleToken, player.profile.id);
    if (!resolved || resolved.outcome !== outcome) {
      client.send('wildEncounterResolveRejected', { encounterId, reason: 'unresolved-battle' });
      return;
    }

    const encounter = this.state.encounters.get(resolved.result.encounterId);
    if (!encounter || (encounter.claimedByPlayerId && encounter.claimedByPlayerId !== player.profile.id)) return;

    this.finalizeBattleResult(resolved.result);
    if (outcome === 'lost' || outcome === 'ran') {
      client.send('wildEncounterReleased', { encounterId: encounter.id, outcome });
    }
    removeBattleClaim(battleId);
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

  private finalizeBattleResult(result: BattleResolution) {
    if (this.finalizedBattleIds.has(result.battleId)) return;

    const encounter = this.state.encounters.get(result.encounterId);
    const player = Array.from(this.state.players.values()).find((candidate) => candidate.battleId === result.battleId);
    if (!encounter) {
      if (player) {
        player.inBattle = false;
        player.battleId = '';
      }
      this.finalizedBattleIds.add(result.battleId);
      this.battleResultCleanups.get(result.battleId)?.();
      this.battleResultCleanups.delete(result.battleId);
      return;
    }

    if (result.outcome === 'lost' || result.outcome === 'ran') {
      if (player) {
        this.encounterCooldowns.set(
          getEncounterCooldownKey(player.profile.id, encounter.id),
          Date.now() + WILD_ENCOUNTER_LOSS_COOLDOWN_MS
        );
      }
      encounter.status = 'available';
      encounter.claimedByPlayerId = '';
      encounter.respawnAt = '';
      this.scheduleNaturalWildEncounterRespawn(encounter.id);
    }

    if (result.outcome === 'defeated') {
      encounter.respawnAt = new Date(Date.now() + WILD_ENCOUNTER_RESPAWN_MS).toISOString();
      this.scheduleEncounterTimer(encounter.id, WILD_ENCOUNTER_RESPAWN_MS, () => this.respawnWildEncounter(encounter.id));
    }

    if (player) {
      player.inBattle = false;
      player.battleId = '';
    }

    this.finalizedBattleIds.add(result.battleId);
    this.battleResultCleanups.get(result.battleId)?.();
    this.battleResultCleanups.delete(result.battleId);
  }

  private async freezeClaimParty(client: Client, ids: unknown, expectedRevision: unknown) {
    const player = this.state.players.get(client.sessionId);
    // Colyseus does not retain join options. The room binds the verified player id and reuses it as the sole principal.
    if (!player || !Array.isArray(ids) || !ids.every((id) => typeof id === 'string') || !Number.isSafeInteger(expectedRevision) || typeof expectedRevision !== 'number') return null;
    return playerAuthority.freezeReadyActiveParty({ principal: { sub: player.profile.id }, presentedCreatureIds: ids, expectedRosterRevision: expectedRevision });
  }

  private async loadForeignFarm(client: Client, farmId: string): Promise<FarmSaveRecord | null> {
    const player = this.state.players.get(client.sessionId);
    if (!player || !farmId) return null;
    const found = await playerAuthority.findFarm(farmId);
    return found && found.playerId !== player.profile.id ? sanitizeFarm(found.farm) : null;
  }
}

export function authenticateLocationJoin(credential: unknown, now = Date.now(), ttlSeconds = guestCredentialTtlSeconds) {
  const principal = verifyGuestCredential(credential, guestCredentialConfig, now, ttlSeconds);
  if (!principal) throw new ServerError(401, 'Invalid guest credential');
  return principal;
}

export function assertBalanceVersion(clientBalanceVersion: unknown): asserts clientBalanceVersion is number {
  if (clientBalanceVersion !== CURRENT_BALANCE_VERSION) {
    throw new ServerError(409, JSON.stringify({ code: 'BALANCE_VERSION_MISMATCH', serverBalanceVersion: CURRENT_BALANCE_VERSION, clientBalanceVersion: typeof clientBalanceVersion === 'number' ? clientBalanceVersion : null }));
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

export function resolveCanonicalJoinPosition(options: JoinLocationOptions | undefined, canonicalPosition: WorldPosition, profile: PlayerProfile, roomMapId: MapId): WorldPosition {
  if (options?.transitionId) {
    const transitionPosition = consumePendingTransition(options.transitionId, profile.playerId, roomMapId);
    if (!isSameWorldPosition(canonicalPosition, transitionPosition)) {
      throw new ServerError(409, 'Canonical transition position mismatch');
    }
    return transitionPosition;
  }

  if (canonicalPosition.mapId !== roomMapId) {
    throw new ServerError(409, 'Canonical position is bound to a different map');
  }

  const map = getGameMap(roomMapId);
  if (!canEnterTile(map, canonicalPosition.x, canonicalPosition.y)) {
    throw new ServerError(500, 'Invalid canonical position');
  }

  return { ...canonicalPosition };
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
    expiresAt: Date.now() + TRANSITION_TOKEN_TTL_MS
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

function sanitizeFarm(farm: FarmSaveRecord | undefined): FarmSaveRecord | null {
  if (!farm || typeof farm !== 'object') return null;
  if (
    typeof farm.id !== 'string' ||
    !farm.id ||
    typeof farm.ownerPlayerId !== 'string' ||
    !farm.ownerPlayerId ||
    typeof farm.farmType !== 'string' ||
    !farm.farmType ||
    typeof farm.resourceId !== 'string' ||
    !farm.resourceId ||
    typeof farm.mapId !== 'string' ||
    !farm.mapId ||
    typeof farm.position !== 'object' ||
    !farm.position ||
    typeof farm.position.x !== 'number' ||
    typeof farm.position.y !== 'number' ||
    typeof farm.guardCreatureId !== 'string' ||
    !farm.guardCreatureId
  ) {
    return null;
  }

  return {
    ...farm,
    position: { ...farm.position },
    storedResources: { ...farm.storedResources },
    theftCooldowns: { ...farm.theftCooldowns }
  };
}

export function isFacingFarmPosition(position: WorldPosition, farm: FarmSaveRecord): boolean {
  const deltaByDirection = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  } as const;
  const delta = deltaByDirection[position.facing];

  return position.mapId === farm.position.mapId && position.x + delta.x === farm.position.x && position.y + delta.y === farm.position.y;
}

function sanitizeGuardCreature(creature: CreatureSaveRecord | undefined, farm: FarmSaveRecord): CreatureSaveRecord | null {
  if (
    creature &&
    creature.id === farm.guardCreatureId &&
    creature.ownerPlayerId === farm.ownerPlayerId &&
    canCreatureUseRole(creature, 'guard')
  ) {
    return {
      ...creature,
      stats: { ...creature.stats },
      attacks: creature.attacks.slice(0, 4).map((attack) => ({ ...attack })),
      cooldowns: { ...creature.cooldowns }
    };
  }

  return null;
}

function sanitizeBattleCreature(
  creature: CreatureSaveRecord | undefined,
  ownerPlayerId: string,
  fallbackSpeciesId?: number
): CreatureSaveRecord | null {
  if (creature && creature.ownerPlayerId === ownerPlayerId && canCreatureUseRole(creature, 'battle')) {
    return {
      ...creature,
      stats: { ...creature.stats },
      attacks: creature.attacks.slice(0, 4).map((attack) => ({ ...attack })),
      cooldowns: { ...creature.cooldowns }
    };
  }

  if (creature) return null;

  if (fallbackSpeciesId === undefined) return null;

  const species = getSpeciesById(fallbackSpeciesId) ?? getSpeciesById(1);
  if (!species) return null;

  const rng = createCreatureLifecycleRng(hashString(`${ownerPlayerId}:${fallbackSpeciesId}:fallback-battle`));
  const stats = rollStats(species, rng);
  return {
    id: `guest-creature-${species.slug}`,
    ownerPlayerId,
    speciesId: species.id,
    level: 1,
    experience: 0,
    stats,
    attacks: selectCreatureAttacks(species, species.rarity, stats, 4, rng),
    hp: stats.hp,
    maxHp: stats.hp,
    fainted: false,
    cooldowns: {}
  };
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

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
