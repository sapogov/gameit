import type { GrowthAuditEvent, GrowthAuditEventHashInput, MonsterRpgSaveState } from '../../src/games/monster-rpg/sim';
import type { FarmSaveRecord } from '../../src/games/monster-rpg/sim';
import { createHash } from 'node:crypto';

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
  return next.progressionEvents.slice(previous.progressionEvents.length).every((event) => event.aggregateRevision === next.revision);
}

/** One validation boundary for imported, created, and CAS-persisted aggregates. */
export function isValidAggregate(aggregate: PlayerAggregate): boolean {
  if (!aggregate || !Number.isSafeInteger(aggregate.revision) || aggregate.revision < 0 || !Number.isSafeInteger(aggregate.rosterRevision) || aggregate.rosterRevision < 0 || !validateLedger(aggregate.progressionEvents, aggregate.playerId, aggregate.revision)) return false;
  const projected = new Map<string, GrowthAuditEvent[]>();
  for (const event of aggregate.progressionEvents) projected.set(event.creatureId, [...(projected.get(event.creatureId) ?? []), event]);
  return Object.entries(aggregate.save.creatures.creatures).every(([creatureId, creature]) => {
    const history = creature.statGrowth?.events ?? [];
    const ledger = projected.get(creatureId) ?? [];
    return !creature.pendingGrowthEvents && history.length === ledger.length && history.every((event, index) => equalEvent(event, ledger[index]));
  }) && [...projected.keys()].every((creatureId) => Boolean(aggregate.save.creatures.creatures[creatureId]));
}

export function validateLedger(events: readonly GrowthAuditEvent[], playerId: string, aggregateRevision = Number.MAX_SAFE_INTEGER): boolean {
  const grants = new Set<string>(); const rebalances = new Set<string>(); let previousHash = '0'.repeat(64); let priorRevision = 0;
  return events.every((event) => {
    if (!isCanonicalEvent(event) || event.playerId !== playerId || event.previousHash !== previousHash || event.eventHash !== growthEventHash(event) || event.aggregateRevision > aggregateRevision || event.aggregateRevision < priorRevision || grants.has(event.grantId)) return false;
    if (event.kind === 'rebalance') {
      const key = `${event.creatureId}:${event.targetBalanceVersion}`;
      if (event.grantId !== `rebalance:${event.creatureId}:${event.targetBalanceVersion}` || rebalances.has(key)) return false;
      rebalances.add(key);
    }
    grants.add(event.grantId); previousHash = event.eventHash; priorRevision = event.aggregateRevision; return true;
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
  if (!keys.every((key) => expected.includes(key)) || keys.some((key) => key === 'targetBalanceVersion') !== (value.kind === 'rebalance')) return false;
  const validKind = value.kind === 'level-up'
    ? value.model === 'deterministic-default' || value.model === 'rarity-weighted-random'
    : value.kind === 'rebalance' && value.model === 'rebalance' && Number.isSafeInteger(value.targetBalanceVersion) && value.targetBalanceVersion > 0;
  return value.v === 1 && validKind && typeof value.playerId === 'string' && typeof value.creatureId === 'string' && typeof value.grantId === 'string' && Number.isSafeInteger(value.balanceVersion) && value.balanceVersion > 0 && Number.isSafeInteger(value.levelFrom) && value.levelFrom > 0 && Number.isSafeInteger(value.levelTo) && value.levelTo >= value.levelFrom && Number.isSafeInteger(value.aggregateRevision) && value.aggregateRevision > 0 && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) && /^[a-f0-9]{64}$/.test(value.previousHash) && /^[a-f0-9]{64}$/.test(value.eventHash) && !!value.deltas && ['hp', 'attack', 'defense', 'speed', 'stamina'].every((key) => Number.isSafeInteger(value.deltas[key as keyof typeof value.deltas]));
}

function equalEvent(left: GrowthAuditEvent, right: unknown): boolean {
  return Boolean(right) && JSON.stringify(left) === JSON.stringify(right);
}
