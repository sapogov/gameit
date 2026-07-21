import type { MonsterRpgSaveState } from '../sim';

export const AUTHORITY_PROTOCOL_VERSION = 1 as const;
export const MONSTER_RPG_GUEST_CREDENTIAL_KEY = 'gameit.monsterRpg.guestCredential';
export type AuthorityRejectCode = 'AUTHORITY_REQUIRED' | 'ROSTER_UNAVAILABLE' | 'INVALID_COMMAND' | 'STALE_REVISION' | 'INTENT_REUSED' | 'REJECTED' | 'INVALID_TRANSFER' | 'INVALID_LEGACY_SAVE' | 'CROSS_PRINCIPAL' | 'REPLAYED_OR_STALE' | 'ALREADY_INITIALIZED';
/** Closed command vocabulary. Payload fields are validated by the matching authority reducer. */
export type AuthorityIntentType =
  | 'bootstrapProfile' | 'importLegacySave' | 'openPack' | 'convertCreatureCard' | 'hatchEgg'
  | 'moveCreatureToActiveParty' | 'moveCreatureToStorage' | 'healAll' | 'revive'
  | 'createFarm' | 'collectFarm' | 'upgradeFarm' | 'setFarmGuard' | 'claimReward' | 'discardItem'
  | 'attemptFarmTheft'
  | 'stationTravel' | 'resetProfile' | 'move' | 'completeElderDialog' | 'completeOnboarding'
  | 'activateMaterialCard' | 'activateBuffCard' | 'buildFarmCard';
export type AuthorityIntent = { type: AuthorityIntentType; [key: string]: unknown };
export interface SaveCommand { intentId: string; expectedRevision: number; intent: AuthorityIntent }
export interface AuthoritySnapshot { playerId: string; revision: number; rosterRevision: number; save: MonsterRpgSaveState }
export type SaveCommandResult =
  | { status: 'applied' | 'duplicate'; snapshot: AuthoritySnapshot }
  | { status: 'rejected'; code: AuthorityRejectCode; snapshot?: AuthoritySnapshot };

export function parseSaveCommand(value: unknown): SaveCommand | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const command = value as Partial<SaveCommand>;
  const expectedRevision = command.expectedRevision;
  if (typeof command.intentId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(command.intentId) || typeof expectedRevision !== 'number' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !command.intent || typeof command.intent !== 'object' || Array.isArray(command.intent) || !intentTypes.has(command.intent.type as AuthorityIntentType)) return null;
  return command as SaveCommand;
}

const intentTypes = new Set<AuthorityIntentType>(['bootstrapProfile', 'importLegacySave', 'openPack', 'convertCreatureCard', 'hatchEgg', 'moveCreatureToActiveParty', 'moveCreatureToStorage', 'healAll', 'revive', 'createFarm', 'collectFarm', 'upgradeFarm', 'setFarmGuard', 'claimReward', 'discardItem', 'attemptFarmTheft', 'stationTravel', 'resetProfile', 'move', 'completeElderDialog', 'completeOnboarding', 'activateMaterialCard', 'activateBuffCard', 'buildFarmCard']);

export function authorityReady(status: 'created' | 'authenticated', snapshot?: AuthoritySnapshot, credential?: string) {
  return { protocolVersion: AUTHORITY_PROTOCOL_VERSION, status, ...(credential ? { credential } : {}), ...(snapshot ? { snapshot } : {}) };
}

export interface CorrelatedAuthorityRequest { requestId: string; payload?: unknown }
export interface CorrelatedAuthorityResult { requestId: string; result?: unknown; error?: AuthorityRejectCode }
export function parseCorrelatedAuthorityRequest(value: unknown): CorrelatedAuthorityRequest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const request = value as Partial<CorrelatedAuthorityRequest>;
  return typeof request.requestId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(request.requestId) ? request as CorrelatedAuthorityRequest : null;
}

/** Credentials are the only authority data retained by the browser. */
export function loadGuestCredential(): string | null {
  const value = localStorage.getItem(MONSTER_RPG_GUEST_CREDENTIAL_KEY);
  return value && /^g1\.[^.]+\.[^.]+\.[^.]+$/.test(value) ? value : null;
}

export function saveGuestCredential(credential: string): void {
  if (!/^g1\.[^.]+\.[^.]+\.[^.]+$/.test(credential)) throw new Error('Invalid guest credential');
  localStorage.setItem(MONSTER_RPG_GUEST_CREDENTIAL_KEY, credential);
}

export function clearGuestCredential(): void { localStorage.removeItem(MONSTER_RPG_GUEST_CREDENTIAL_KEY); }
