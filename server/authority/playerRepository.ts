import { createInitialSave, type BaseStatTendencies, type GrowthAuditEvent, type GrowthAuditEventHashInput, type MonsterRpgSaveState } from '../../src/games/monster-rpg/sim';
import type { FarmSaveRecord } from '../../src/games/monster-rpg/sim';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { AUDIT_BALANCE_CATALOG } from '../../src/games/monster-rpg/sim/gameBalance';

export interface IntentReceipt { payloadHash: string; revision: number }
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
  if (!isValidAggregate(next)) return false;
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
  if (!aggregate || !Number.isSafeInteger(aggregate.revision) || aggregate.revision < 0 || !Number.isSafeInteger(aggregate.rosterRevision) || aggregate.rosterRevision < 0 || !Number.isSafeInteger(aggregate.activeGrowthStartIndex) || aggregate.activeGrowthStartIndex < 0 || aggregate.activeGrowthStartIndex > aggregate.progressionEvents.length || !validateLedger(aggregate.progressionEvents, aggregate.playerId, aggregate.revision)) return false;
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
  return value.v === 1 && validKind && typeof value.playerId === 'string' && value.playerId.length > 0 && typeof value.creatureId === 'string' && value.creatureId.length > 0 && typeof value.grantId === 'string' && value.grantId.length > 0 && Number.isSafeInteger(value.balanceVersion) && value.balanceVersion in AUDIT_BALANCE_CATALOG && Number.isSafeInteger(value.levelFrom) && value.levelFrom > 0 && Number.isSafeInteger(value.levelTo) && value.levelTo >= value.levelFrom && Number.isSafeInteger(value.aggregateRevision) && value.aggregateRevision > 0 && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) && /^[a-f0-9]{64}$/.test(value.previousHash) && /^[a-f0-9]{64}$/.test(value.eventHash) && exactDeltaKeys(value.deltas);
}

function exactDeltaKeys(value: unknown): value is BaseStatTendencies { const keys = ['hp', 'attack', 'defense', 'speed', 'stamina']; return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key) && Number.isSafeInteger((value as Record<string, unknown>)[key])); }
function battleIdFromGrant(grantId: string): string { const match = /^battle:([^:]+):creature:([^:]+):level:(\d+)$/.exec(grantId); return match ? match[1] : ''; }
function validEventDelta(event: GrowthAuditEvent): boolean {
  const balance = AUDIT_BALANCE_CATALOG[event.balanceVersion as keyof typeof AUDIT_BALANCE_CATALOG]; if (!balance) return false;
  if (event.kind === 'level-up') return event.levelTo === event.levelFrom + 1 && battleIdFromGrant(event.grantId) !== '' && event.grantId === `battle:${battleIdFromGrant(event.grantId)}:creature:${event.creatureId}:level:${event.levelTo}` && (event.model === 'deterministic-default' ? sameDelta(event.deltas, balance.deterministicDelta) : Object.values(event.deltas).every((value) => value >= balance.randomRange.min && value <= balance.randomRange.max));
  return event.levelTo === event.levelFrom && event.targetBalanceVersion === event.balanceVersion && event.targetBalanceVersion in AUDIT_BALANCE_CATALOG;
}
function validateCreatureSemantics(creature: { statGrowth?: { basis?: { level?: number; stats?: BaseStatTendencies } }; stats: BaseStatTendencies }, events: readonly GrowthAuditEvent[]): boolean {
  if (!creature.statGrowth) return events.length === 0;
  const basis = creature.statGrowth.basis?.stats;
  const replayable = basis && exactDeltaKeys(basis);
  const recorded = replayable ? { ...basis } : undefined;
  const target = replayable ? { ...basis } : undefined;
  const levelUps: GrowthAuditEvent[] = [];
  let previousLevel: number | undefined = creature.statGrowth.basis?.level; let effectiveBalance = 1;
  for (const event of events) {
    if (event.kind === 'level-up') {
      if (previousLevel !== undefined && event.levelFrom !== previousLevel) return false;
      previousLevel = event.levelTo;
      if (recorded && target) {
        addDelta(recorded, event.deltas);
        addDelta(target, event.model === 'deterministic-default' ? AUDIT_BALANCE_CATALOG[effectiveBalance as keyof typeof AUDIT_BALANCE_CATALOG].deterministicDelta : event.deltas);
      }
      levelUps.push(event);
      continue;
    }
    if (previousLevel !== undefined && event.levelFrom !== previousLevel) return false;
    if (event.targetBalanceVersion <= effectiveBalance) return false;
    if (recorded && target && !sameDelta(event.deltas, subtractDelta(target, recorded))) return false;
    if (recorded) addDelta(recorded, event.deltas);
    effectiveBalance = event.targetBalanceVersion;
    if (target) {
      Object.assign(target, basis);
      for (const prior of levelUps) addDelta(target, prior.model === 'deterministic-default' ? AUDIT_BALANCE_CATALOG[effectiveBalance as keyof typeof AUDIT_BALANCE_CATALOG].deterministicDelta : prior.deltas);
    }
  }
  return true;
}
function sameDelta(left: BaseStatTendencies, right: BaseStatTendencies): boolean { return ['hp', 'attack', 'defense', 'speed', 'stamina'].every((key) => left[key as keyof BaseStatTendencies] === right[key as keyof BaseStatTendencies]); }
function addDelta(target: BaseStatTendencies, delta: BaseStatTendencies): void { for (const key of ['hp', 'attack', 'defense', 'speed', 'stamina'] as const) target[key] += delta[key]; }
function subtractDelta(left: BaseStatTendencies, right: BaseStatTendencies): BaseStatTendencies { return { hp: left.hp - right.hp, attack: left.attack - right.attack, defense: left.defense - right.defense, speed: left.speed - right.speed, stamina: left.stamina - right.stamina }; }
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
