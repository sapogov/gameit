import { randomUUID } from 'node:crypto';
import type {
  BattleResolution,
  BattleKind,
  BattleRoomState,
  CreatureSaveRecord,
  FarmSaveRecord,
  MapId,
  PlayerProfile,
  WildEncounterOutcome
} from '../src/games/monster-rpg/sim';

const BATTLE_CLAIM_TTL_MS = 5 * 60_000;

export interface BattleClaim {
  battleKind: BattleKind;
  battleId: string;
  battleToken: string;
  encounterId: string;
  farmId?: string;
  locationRoomId: string;
  mapId: MapId;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
  guardCreature?: CreatureSaveRecord;
  guardOwnerPlayerId?: string;
  wildSpeciesId: number;
  zoneId?: string;
  trainerId?: string;
  playerParty?: CreatureSaveRecord[];
  createdAt: number;
  expiresAt: number;
  result?: BattleResolution;
  trainerClaimPhase?: 'pending' | 'active';
  releaseReservedTrainerBattle?: () => Promise<boolean>;
}

export interface PreparedTrainerBattleClaim {
  battleId: string;
  battleToken: string;
  createdAt: number;
}

/** Allocates opaque credentials before the authority reservation, but does not expose or register them. */
export function prepareTrainerBattleClaim(): PreparedTrainerBattleClaim {
  cleanupExpiredBattleClaims();
  const now = Date.now();
  return { battleId: `battle:trainer:${randomUUID()}`, battleToken: randomUUID(), createdAt: now };
}

/** Registers only an already-reserved canonical trainer battle. */
export function registerTrainerBattleClaim({ prepared, trainerId, locationRoomId, mapId, playerProfile, playerParty, releaseReservedTrainerBattle }: {
  prepared: PreparedTrainerBattleClaim; trainerId: string; locationRoomId: string; mapId: MapId; playerProfile: PlayerProfile; playerParty: readonly CreatureSaveRecord[];
  releaseReservedTrainerBattle: () => Promise<boolean>;
}): BattleClaim {
  cleanupExpiredBattleClaims();
  const now = Date.now();
  const first = playerParty[0];
  if (!first) throw new Error('Trainer battle requires a ready party');
  const claim: BattleClaim = {
    battleKind: 'trainer', battleId: prepared.battleId, battleToken: prepared.battleToken,
    encounterId: `trainer:${trainerId}`, trainerId, locationRoomId, mapId, playerProfile,
    playerCreature: cloneCreature(first), playerParty: playerParty.map(cloneCreature), wildSpeciesId: first.speciesId, createdAt: now, expiresAt: now + BATTLE_CLAIM_TTL_MS,
    trainerClaimPhase: 'pending', releaseReservedTrainerBattle
  };
  battleClaims.set(claim.battleId, claim);
  schedulePendingTrainerExpiry(claim);
  return claim;
}

export function activateTrainerBattleClaim(battleId: string): boolean {
  const claim = battleClaims.get(battleId);
  if (!claim || claim.battleKind !== 'trainer' || claim.trainerClaimPhase !== 'pending') return false;
  clearPendingTrainerExpiry(battleId);
  claim.trainerClaimPhase = 'active';
  claim.releaseReservedTrainerBattle = undefined;
  return true;
}

const battleClaims = new Map<string, BattleClaim>();
const battleResultListeners = new Map<string, Set<(result: BattleResolution) => void>>();
const pendingTrainerExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function createBattleClaim({
  encounterId,
  locationRoomId,
  mapId,
  playerProfile,
  playerCreature,
  wildSpeciesId,
  zoneId
}: {
  encounterId: string;
  locationRoomId: string;
  mapId: MapId;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
  wildSpeciesId: number;
  zoneId: string;
}): BattleClaim {
  cleanupExpiredBattleClaims();
  const battleId = `battle:${encounterId}:${playerProfile.playerId}:${Date.now()}`;
  const claim: BattleClaim = {
    battleKind: 'wild',
    battleId,
    battleToken: randomUUID(),
    encounterId,
    locationRoomId,
    mapId,
    playerProfile,
    playerCreature,
    wildSpeciesId,
    zoneId,
    createdAt: Date.now(),
    expiresAt: Date.now() + BATTLE_CLAIM_TTL_MS
  };
  battleClaims.set(battleId, claim);
  return claim;
}

export function createGuardBattleClaim({
  farm,
  guardCreature,
  locationRoomId,
  mapId,
  playerProfile,
  playerCreature
}: {
  farm: FarmSaveRecord;
  guardCreature: CreatureSaveRecord;
  locationRoomId: string;
  mapId: MapId;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
}): BattleClaim {
  cleanupExpiredBattleClaims();
  const encounterId = `guard-theft:${farm.id}`;
  const battleId = `battle:${encounterId}:${playerProfile.playerId}:${Date.now()}`;
  const now = Date.now();
  const claim: BattleClaim = {
    battleKind: 'guard-theft',
    battleId,
    battleToken: randomUUID(),
    encounterId,
    farmId: farm.id,
    locationRoomId,
    mapId,
    playerProfile,
    playerCreature,
    guardCreature,
    guardOwnerPlayerId: farm.ownerPlayerId,
    wildSpeciesId: guardCreature.speciesId,
    createdAt: now,
    expiresAt: now + BATTLE_CLAIM_TTL_MS
  };
  battleClaims.set(battleId, claim);
  return claim;
}

export function getBattleClaim(battleId: string, battleToken: string): BattleClaim | null {
  cleanupExpiredBattleClaims();
  const claim = battleClaims.get(battleId);
  if (!claim || claim.battleToken !== battleToken) return null;
  return claim;
}

export function markBattleClaimResolved(result: BattleResolution): void {
  const claim = battleClaims.get(result.battleId);
  if (!claim) return;
  clearPendingTrainerExpiry(result.battleId);
  claim.result = result;
  claim.expiresAt = Date.now() + BATTLE_CLAIM_TTL_MS;
  battleResultListeners.get(result.battleId)?.forEach((listener) => listener(result));
}

export function getResolvedBattleOutcome(
  battleId: string,
  battleToken: string,
  playerId: string
): { outcome: WildEncounterOutcome; result: BattleResolution } | null {
  const claim = getBattleClaim(battleId, battleToken);
  if (!claim || claim.playerProfile.playerId !== playerId || !claim.result) return null;
  return {
    outcome: claim.result.outcome,
    result: claim.result
  };
}

export function removeBattleClaim(battleId: string): void {
  const claim = battleClaims.get(battleId);
  clearPendingTrainerExpiry(battleId);
  battleClaims.delete(battleId);
  battleResultListeners.delete(battleId);
  releasePendingTrainerReservation(claim);
}

export function onBattleClaimResolved(battleId: string, listener: (result: BattleResolution) => void): () => void {
  const listeners = battleResultListeners.get(battleId) ?? new Set<(result: BattleResolution) => void>();
  listeners.add(listener);
  battleResultListeners.set(battleId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) battleResultListeners.delete(battleId);
  };
}

export function getBattleStateSeed(claim: BattleClaim): Pick<
  BattleRoomState,
  'battleId' | 'encounterId' | 'wildSpeciesId' | 'zoneId'
> {
  return {
    battleId: claim.battleId,
    encounterId: claim.encounterId,
    wildSpeciesId: claim.wildSpeciesId,
    zoneId: claim.zoneId
  };
}

function cleanupExpiredBattleClaims(): void {
  const now = Date.now();
  battleClaims.forEach((claim, battleId) => {
    if (claim.expiresAt <= now) {
      clearPendingTrainerExpiry(battleId);
      battleClaims.delete(battleId);
      battleResultListeners.delete(battleId);
      releasePendingTrainerReservation(claim);
    }
  });
}

function schedulePendingTrainerExpiry(claim: BattleClaim): void {
  const timer = setTimeout(() => {
    const current = battleClaims.get(claim.battleId);
    if (current !== claim || current.trainerClaimPhase !== 'pending') return;
    clearPendingTrainerExpiry(claim.battleId);
    battleClaims.delete(claim.battleId);
    battleResultListeners.delete(claim.battleId);
    releasePendingTrainerReservation(claim);
  }, Math.max(0, claim.expiresAt - Date.now()));
  pendingTrainerExpiryTimers.set(claim.battleId, timer);
  (timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.();
}

function clearPendingTrainerExpiry(battleId: string): void {
  const timer = pendingTrainerExpiryTimers.get(battleId);
  if (timer === undefined) return;
  clearTimeout(timer);
  pendingTrainerExpiryTimers.delete(battleId);
}

function releasePendingTrainerReservation(claim: BattleClaim | undefined): void {
  if (claim?.trainerClaimPhase !== 'pending') return;
  const release = claim.releaseReservedTrainerBattle;
  claim.releaseReservedTrainerBattle = undefined;
  void release?.();
}

function cloneCreature(creature: CreatureSaveRecord): CreatureSaveRecord {
  return { ...creature, stats: { ...creature.stats }, attacks: creature.attacks.map((attack) => ({ ...attack })), cooldowns: { ...creature.cooldowns } };
}
