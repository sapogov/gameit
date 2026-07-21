import { createInitialSave, type BaseStatTendencies, type GrowthAuditEvent, type GrowthAuditEventHashInput, type MonsterRpgSaveState } from '../../src/games/monster-rpg/sim';
import type { FarmSaveRecord } from '../../src/games/monster-rpg/sim';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { AUDIT_BALANCE_CATALOG } from '../../src/games/monster-rpg/sim/gameBalance';

export interface IntentReceipt { payloadHash: string; revision: number }
export interface LocationMovementReceipt { roomId: string; mapId: string; lastSequence: number }
export interface ActiveTrainerBattle {
  battleId: string; kind: 'trainer'; trainerId: string; mapId: string; locationRoomId: string;
  phase: 'reserved' | 'active'; reservedAt: string; expiresAt?: string;
}
export type { GrowthAuditEvent } from '../../src/games/monster-rpg/sim';
export interface PlayerAggregate {
  playerId: string;
  revision: number;
  rosterRevision: number;
  save: MonsterRpgSaveState;
  legacyImportReceipt?: { payloadHash: string; importedAt: string };
  intentReceipts: Record<string, IntentReceipt>;
  grantReceipts: Record<string, number>;
  progressionEvents: GrowthAuditEvent[];
  activeGrowthStartIndex: number;
  locationMovementReceipts: Record<string, LocationMovementReceipt>;
  activeBattle?: ActiveTrainerBattle;
}

export interface PlayerAuthorityRepository {
  read(playerId: string): Promise<PlayerAggregate | null>;
  createIfAbsent(aggregate: PlayerAggregate): Promise<PlayerAggregate>;
  createIfAbsentWithResult(aggregate: PlayerAggregate): Promise<{ aggregate: PlayerAggregate; created: boolean }>;
  compareExchange(playerId: string, expectedRevision: number, next: PlayerAggregate): Promise<boolean>;
  compareExchangeMany(changes: readonly { playerId: string; expectedRevision: number; next: PlayerAggregate }[]): Promise<boolean>;
  findFarm(farmId: string): Promise<{ playerId: string; revision: number; farm: FarmSaveRecord } | null>;
}

/** Development-only process-local repository; not durable, multi-process, deploy-safe, or production-ready. */
export class ProcessLocalPlayerAuthorityRepository implements PlayerAuthorityRepository {
  private readonly values = new Map<string, PlayerAggregate>();
  async read(playerId: string) { return clone(this.values.get(playerId) ?? null); }
  async createIfAbsent(aggregate: PlayerAggregate) {
    if (!isValidAggregate(aggregate)) throw new Error('Invalid player aggregate');
    const existing = this.values.get(aggregate.playerId);
    if (existing) return clone(existing);
    const stored = clone(aggregate); this.values.set(aggregate.playerId, stored); return clone(stored);
  }
  async createIfAbsentWithResult(aggregate: PlayerAggregate) {
    if (!isValidAggregate(aggregate)) throw new Error('Invalid player aggregate');
    const existing = this.values.get(aggregate.playerId);
    if (existing) return { aggregate: clone(existing), created: false };
    const stored = clone(aggregate); this.values.set(aggregate.playerId, stored);
    return { aggregate: clone(stored), created: true };
  }
  async compareExchange(playerId: string, expectedRevision: number, next: PlayerAggregate) {
    const current = this.values.get(playerId);
    if (!current || current.revision !== expectedRevision || next.playerId !== playerId || !isValidLedgerTransition(current, next)) return false;
    this.values.set(playerId, clone(next)); return true;
  }
  async compareExchangeMany(changes: readonly { playerId: string; expectedRevision: number; next: PlayerAggregate }[]) {
    if (new Set(changes.map((change) => change.playerId)).size !== changes.length || !changes.every((change) => { const current = this.values.get(change.playerId); return current?.revision === change.expectedRevision && change.next.playerId === change.playerId && isValidLedgerTransition(current, change.next); })) return false;
    changes.forEach((change) => this.values.set(change.playerId, clone(change.next))); return true;
  }
  async findFarm(farmId: string) {
    for (const aggregate of this.values.values()) {
      const farm = aggregate.save.farms.farms[farmId];
      if (farm) return { playerId: aggregate.playerId, revision: aggregate.revision, farm: clone(farm) };
    }
    return null;
  }
}

export function clone<T>(value: T): T { return value === null || value === undefined ? value : structuredClone(value); }
export function isValidLedgerTransition(previous: PlayerAggregate, next: PlayerAggregate): boolean {
  if (!isValidAggregate(next) || !isValidActiveBattleTransition(previous, next) || !isValidLocationMovementReceiptTransition(previous.locationMovementReceipts, next.locationMovementReceipts)) return false;
  if (next.progressionEvents.length < previous.progressionEvents.length) return false;
  if (!previous.progressionEvents.every((event, index) => equalEvent(event, next.progressionEvents[index]))) return false;
  const appended = next.progressionEvents.slice(previous.progressionEvents.length);
  const reset = next.activeGrowthStartIndex !== previous.activeGrowthStartIndex;
  if (reset) {
    return next.activeGrowthStartIndex === previous.progressionEvents.length
      && appended.length === 0
      && next.revision === previous.revision + 1
      && next.rosterRevision === previous.rosterRevision + 1
      && isCanonicalFreshResetSave(previous.save, next.save, previous.playerId);
  }
  return next.activeGrowthStartIndex === previous.activeGrowthStartIndex && appended.every((event) => event.aggregateRevision === next.revision);
}

/** One validation boundary for imported, created, and CAS-persisted aggregates. */
export function isValidAggregate(aggregate: PlayerAggregate): boolean {
  if (!aggregate || !Number.isSafeInteger(aggregate.revision) || aggregate.revision < 0 || !Number.isSafeInteger(aggregate.rosterRevision) || aggregate.rosterRevision < 0 || !Number.isSafeInteger(aggregate.activeGrowthStartIndex) || aggregate.activeGrowthStartIndex < 0 || aggregate.activeGrowthStartIndex > aggregate.progressionEvents.length || !validateLedger(aggregate.progressionEvents, aggregate.playerId, aggregate.revision) || !isValidLocationMovementReceipts(aggregate.locationMovementReceipts) || !isValidActiveBattle(aggregate.activeBattle)) return false;
  const projected = new Map<string, GrowthAuditEvent[]>();
  for (const event of aggregate.progressionEvents.slice(aggregate.activeGrowthStartIndex)) projected.set(event.creatureId, [...(projected.get(event.creatureId) ?? []), event]);
  return Object.entries(aggregate.save.creatures.creatures).every(([creatureId, creature]) => {
    const history = creature.statGrowth?.events ?? [];
    const ledger = projected.get(creatureId) ?? [];
    return !creature.pendingGrowthEvents && history.length === ledger.length && history.every((event, index) => equalEvent(event, ledger[index])) && validateCreatureSemantics(creature, ledger);
  }) && [...projected.keys()].every((creatureId) => Boolean(aggregate.save.creatures.creatures[creatureId]));
}

export function validateLedger(events: readonly GrowthAuditEvent[], playerId: string, aggregateRevision = Number.MAX_SAFE_INTEGER): boolean {
  const grants = new Set<string>(); const rebalances = new Set<string>(); let previousHash = '0'.repeat(64); let priorRevision = 0; let priorTimestamp = -Infinity; let groupTimestamp = ''; let groupBattleId = '';
  return events.every((event) => {
    const timestamp = Date.parse(event.createdAt);
    const battleId = event.kind === 'level-up' ? battleIdFromGrant(event.grantId) : event.grantId;
    if (!isCanonicalEvent(event) || event.playerId !== playerId || event.previousHash !== previousHash || event.eventHash !== growthEventHash(event) || event.aggregateRevision > aggregateRevision || event.aggregateRevision < priorRevision || grants.has(event.grantId) || timestamp < priorTimestamp || !validEventDelta(event)) return false;
    if (event.aggregateRevision === priorRevision && events.indexOf(event) !== 0 && (event.createdAt !== groupTimestamp || battleId !== groupBattleId)) return false;
    if (event.aggregateRevision !== priorRevision) { groupTimestamp = event.createdAt; groupBattleId = battleId; }
    if (event.kind === 'rebalance') {
      const key = `${event.creatureId}:${event.targetBalanceVersion}`;
      if (event.grantId !== `rebalance:${event.creatureId}:${event.targetBalanceVersion}` || rebalances.has(key)) return false;
      rebalances.add(key);
    }
    grants.add(event.grantId); previousHash = event.eventHash; priorRevision = event.aggregateRevision; priorTimestamp = timestamp; return true;
  });
}

export function growthEventHash(event: GrowthAuditEventHashInput): string {
  // Kept in the server boundary: shared/browser modules never need Node crypto.
  const fields = [event.v, event.kind, event.playerId, event.creatureId, event.grantId, event.model, event.balanceVersion, event.levelFrom, event.levelTo, event.deltas.hp, event.deltas.attack, event.deltas.defense, event.deltas.speed, event.deltas.stamina, event.aggregateRevision, event.createdAt, event.previousHash, 'targetBalanceVersion' in event ? event.targetBalanceVersion : ''];
  return createHash('sha256').update(['gameit.monster-rpg.growth-event.v1', ...fields.map((value) => String(value))].map((value) => `${Buffer.byteLength(value, 'utf8')}:${value}`).join('')).digest('hex');
}

function isCanonicalEvent(event: unknown): event is GrowthAuditEvent {
  if (!event || typeof event !== 'object') return false;
  const value = event as GrowthAuditEvent;
  const keys = Object.keys(value).sort(); const expected = ['aggregateRevision', 'balanceVersion', 'createdAt', 'creatureId', 'deltas', 'eventHash', 'grantId', 'kind', 'levelFrom', 'levelTo', 'model', 'playerId', 'previousHash', 'targetBalanceVersion', 'v'].sort();
  if (keys.length !== expected.length - (value.kind === 'rebalance' ? 0 : 1) || !keys.every((key) => expected.includes(key)) || keys.some((key) => key === 'targetBalanceVersion') !== (value.kind === 'rebalance')) return false;
  const validKind = value.kind === 'level-up'
    ? value.model === 'deterministic-default' || value.model === 'rarity-weighted-random'
    : value.kind === 'rebalance' && value.model === 'rebalance' && Number.isSafeInteger(value.targetBalanceVersion) && value.targetBalanceVersion > 0;
  return value.v === 1 && validKind && typeof value.playerId === 'string' && value.playerId.length > 0 && typeof value.creatureId === 'string' && value.creatureId.length > 0 && typeof value.grantId === 'string' && value.grantId.length > 0 && Number.isSafeInteger(value.balanceVersion) && value.balanceVersion in AUDIT_BALANCE_CATALOG && Number.isSafeInteger(value.levelFrom) && value.levelFrom > 0 && Number.isSafeInteger(value.levelTo) && value.levelTo >= value.levelFrom && Number.isSafeInteger(value.aggregateRevision) && value.aggregateRevision > 0 && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) && new Date(Date.parse(value.createdAt)).toISOString() === value.createdAt && /^[a-f0-9]{64}$/.test(value.previousHash) && /^[a-f0-9]{64}$/.test(value.eventHash) && exactDeltaKeys(value.deltas);
}

function exactDeltaKeys(value: unknown): value is BaseStatTendencies { const keys = ['hp', 'attack', 'defense', 'speed', 'stamina']; return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key) && Number.isSafeInteger((value as Record<string, unknown>)[key])); }
function battleIdFromGrant(grantId: string): string { const match = /^battle:([^:]+):creature:([^:]+):level:(\d+)$/.exec(grantId); return match ? match[1] : ''; }
function validEventDelta(event: GrowthAuditEvent): boolean {
  const balance = AUDIT_BALANCE_CATALOG[event.balanceVersion as keyof typeof AUDIT_BALANCE_CATALOG]; if (!balance) return false;
  if (event.kind === 'level-up') return event.levelTo === event.levelFrom + 1 && battleIdFromGrant(event.grantId) !== '' && event.grantId === `battle:${battleIdFromGrant(event.grantId)}:creature:${event.creatureId}:level:${event.levelTo}` && (event.model === 'deterministic-default' ? sameDelta(event.deltas, balance.deterministicDelta) : Object.values(event.deltas).every((value) => value >= balance.randomRange.min && value <= balance.randomRange.max));
  return event.levelTo === event.levelFrom && event.targetBalanceVersion === event.balanceVersion && event.targetBalanceVersion in AUDIT_BALANCE_CATALOG;
}
function validateCreatureSemantics(creature: { level: number; stats: BaseStatTendencies; maxHp: number; hp: number; fainted: boolean; statGrowth?: { model?: unknown; basis?: { level?: number; stats?: BaseStatTendencies } } }, events: readonly GrowthAuditEvent[]): boolean {
  const basis = creature.statGrowth?.basis;
  if ((creature.statGrowth?.model !== 'deterministic-default' && creature.statGrowth?.model !== 'rarity-weighted-random') || !basis || typeof basis.level !== 'number' || !Number.isSafeInteger(basis.level) || basis.level <= 0 || !isValidPersistedStats(basis.stats) || !exactDeltaKeys(creature.stats)) return false;
  const replayed = { ...basis.stats }; const levelUps: GrowthAuditEvent[] = [];
  let replayedLevel = basis.level; let effectiveBalance = 1;
  for (const event of events) {
    if (event.kind === 'level-up') {
      if (event.levelFrom !== replayedLevel || !safeAddDelta(replayed, event.deltas)) return false;
      replayedLevel = event.levelTo;
      levelUps.push(event);
      continue;
    }
    if (event.levelFrom !== replayedLevel) return false;
    if (event.targetBalanceVersion <= effectiveBalance) return false;
    const target = { ...basis.stats };
    for (const prior of levelUps) if (!safeAddDelta(target, prior.model === 'deterministic-default' ? AUDIT_BALANCE_CATALOG[event.targetBalanceVersion as keyof typeof AUDIT_BALANCE_CATALOG].deterministicDelta : prior.deltas)) return false;
    if (!sameDelta(event.deltas, subtractDelta(target, replayed)) || !safeAddDelta(replayed, event.deltas)) return false;
    effectiveBalance = event.targetBalanceVersion;
  }
  return creature.level === replayedLevel && sameDelta(creature.stats, replayed) && creature.maxHp === replayed.hp
    && Number.isSafeInteger(creature.hp) && creature.hp >= 0 && creature.hp <= creature.maxHp && creature.fainted === (creature.hp === 0);
}
function sameDelta(left: BaseStatTendencies, right: BaseStatTendencies): boolean { return ['hp', 'attack', 'defense', 'speed', 'stamina'].every((key) => left[key as keyof BaseStatTendencies] === right[key as keyof BaseStatTendencies]); }
function safeAddDelta(target: BaseStatTendencies, delta: BaseStatTendencies): boolean { for (const key of ['hp', 'attack', 'defense', 'speed', 'stamina'] as const) { const value = target[key] + delta[key]; if (!Number.isSafeInteger(value) || value < 0 || (key === 'hp' && value === 0)) return false; target[key] = value; } return true; }
function subtractDelta(left: BaseStatTendencies, right: BaseStatTendencies): BaseStatTendencies { return { hp: left.hp - right.hp, attack: left.attack - right.attack, defense: left.defense - right.defense, speed: left.speed - right.speed, stamina: left.stamina - right.stamina }; }
function isValidPersistedStats(value: unknown): value is BaseStatTendencies { return exactDeltaKeys(value) && value.hp > 0 && Object.values(value).every((stat) => stat >= 0); }
function isValidLocationMovementReceipts(value: unknown): value is Record<string, LocationMovementReceipt> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([sessionId, receipt]) => sessionId.trim().length > 0 && isValidLocationMovementReceipt(receipt));
}
function isValidLocationMovementReceipt(value: unknown): value is LocationMovementReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const receipt = value as Record<string, unknown>; const keys = Object.keys(receipt).sort();
  return isDeepStrictEqual(keys, ['lastSequence', 'mapId', 'roomId']) && typeof receipt.roomId === 'string' && receipt.roomId.trim().length > 0 && typeof receipt.mapId === 'string' && receipt.mapId.trim().length > 0 && Number.isSafeInteger(receipt.lastSequence) && (receipt.lastSequence as number) > 0;
}
function isValidLocationMovementReceiptTransition(previous: Record<string, LocationMovementReceipt>, next: Record<string, LocationMovementReceipt>): boolean {
  let mutations = 0;
  for (const [sessionId, prior] of Object.entries(previous)) {
    const candidate = next[sessionId]; if (!candidate) return false;
    if (isDeepStrictEqual(candidate, prior)) continue;
    if (candidate.roomId !== prior.roomId || candidate.mapId !== prior.mapId || candidate.lastSequence !== prior.lastSequence + 1) return false;
    mutations += 1;
  }
  for (const [sessionId, candidate] of Object.entries(next)) if (!previous[sessionId]) { if (candidate.lastSequence !== 1) return false; mutations += 1; }
  return mutations <= 1;
}
function isValidActiveBattle(value: unknown): value is ActiveTrainerBattle | undefined {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const lock = value as Record<string, unknown>;
  const expected = ['battleId', 'kind', 'trainerId', 'mapId', 'locationRoomId', 'phase', 'reservedAt', ...(lock.expiresAt === undefined ? [] : ['expiresAt'])].sort();
  const canonicalDate = (date: unknown) => typeof date === 'string' && Number.isFinite(Date.parse(date)) && new Date(Date.parse(date)).toISOString() === date;
  return isDeepStrictEqual(Object.keys(lock).sort(), expected) && lock.kind === 'trainer' && (lock.phase === 'reserved' || lock.phase === 'active')
    && ['battleId', 'trainerId', 'mapId', 'locationRoomId'].every((key) => typeof lock[key] === 'string' && (lock[key] as string).trim().length > 0)
    && canonicalDate(lock.reservedAt) && (lock.expiresAt === undefined || canonicalDate(lock.expiresAt));
}
function sameExceptOperational(previous: PlayerAggregate, next: PlayerAggregate): boolean {
  const { revision: _pr, activeBattle: _pa, ...prior } = previous; const { revision: _nr, activeBattle: _na, ...candidate } = next;
  return isDeepStrictEqual(prior, candidate) && next.revision === previous.revision + 1;
}
function isValidActiveBattleTransition(previous: PlayerAggregate, next: PlayerAggregate): boolean {
  const before = previous.activeBattle; const after = next.activeBattle;
  if (!before && !after) return true;
  if (!before && after?.phase === 'reserved') return sameExceptOperational(previous, next);
  if (before?.phase === 'reserved' && after?.phase === 'active') return before.battleId === after.battleId && before.trainerId === after.trainerId && before.mapId === after.mapId && before.locationRoomId === after.locationRoomId && before.reservedAt === after.reservedAt && before.expiresAt === after.expiresAt && sameExceptOperational(previous, next);
  if (before?.phase === 'reserved' && !after) return sameExceptOperational(previous, next);
  // Registry activation can fail after the canonical lock is active. This exact
  // operational rollback must not look like a settled battle or mutate receipts.
  if (before?.phase === 'active' && !after && sameExceptOperational(previous, next)) return true;
  if (before?.phase === 'active' && !after) return next.revision === previous.revision + 1 && next.grantReceipts[before.battleId] === next.revision && previous.grantReceipts[before.battleId] === undefined;
  return false;
}
function isCanonicalFreshResetSave(previousSave: MonsterRpgSaveState, nextSave: MonsterRpgSaveState, playerId: string): boolean {
  if (previousSave.profile.playerId !== playerId || nextSave.profile.playerId !== playerId || !isDeepStrictEqual(nextSave.profile, previousSave.profile)) return false;
  const resetAt = new Date(nextSave.updatedAt);
  if (!Number.isFinite(resetAt.getTime()) || resetAt.toISOString() !== nextSave.updatedAt) return false;
  const expected = createInitialSave(structuredClone(previousSave.profile), { now: resetAt });
  return isDeepStrictEqual(nextSave, expected);
}

function equalEvent(left: GrowthAuditEvent, right: unknown): boolean {
  return Boolean(right) && JSON.stringify(left) === JSON.stringify(right);
}
