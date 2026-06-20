import { randomUUID } from 'node:crypto';
import type {
  BattleResolution,
  BattleRoomState,
  CreatureSaveRecord,
  MapId,
  PlayerProfile,
  WildEncounterOutcome
} from '../src/games/monster-rpg/sim';

const BATTLE_CLAIM_TTL_MS = 5 * 60_000;

export interface BattleClaim {
  battleId: string;
  battleToken: string;
  encounterId: string;
  locationRoomId: string;
  mapId: MapId;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
  wildSpeciesId: number;
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
  wildSpeciesId
}: {
  encounterId: string;
  locationRoomId: string;
  mapId: MapId;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
  wildSpeciesId: number;
}): BattleClaim {
  cleanupExpiredBattleClaims();
  const battleId = `battle:${encounterId}:${playerProfile.playerId}:${Date.now()}`;
  const claim: BattleClaim = {
    battleId,
    battleToken: randomUUID(),
    encounterId,
    locationRoomId,
    mapId,
    playerProfile,
    playerCreature,
    wildSpeciesId,
    createdAt: Date.now(),
    expiresAt: Date.now() + BATTLE_CLAIM_TTL_MS
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
  'battleId' | 'encounterId' | 'wildSpeciesId'
> {
  return {
    battleId: claim.battleId,
    encounterId: claim.encounterId,
    wildSpeciesId: claim.wildSpeciesId
  };
}

function cleanupExpiredBattleClaims(): void {
  const now = Date.now();
  battleClaims.forEach((claim, battleId) => {
    if (claim.expiresAt <= now) battleClaims.delete(battleId);
  });
}
