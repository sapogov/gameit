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
  wildSpeciesId: number;
  zoneId?: string;
  createdAt: number;
  expiresAt: number;
  result?: BattleResolution;
}

const battleClaims = new Map<string, BattleClaim>();
const battleResultListeners = new Map<string, Set<(result: BattleResolution) => void>>();

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
  battleClaims.delete(battleId);
  battleResultListeners.delete(battleId);
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
    if (claim.expiresAt <= now) battleClaims.delete(battleId);
  });
}
