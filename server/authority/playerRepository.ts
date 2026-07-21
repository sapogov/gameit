import type { MonsterRpgSaveState } from '../../src/games/monster-rpg/sim';
import type { FarmSaveRecord } from '../../src/games/monster-rpg/sim';

export interface IntentReceipt { payloadHash: string; revision: number }
export interface PlayerAggregate {
  playerId: string;
  revision: number;
  rosterRevision: number;
  save: MonsterRpgSaveState;
  legacyImportReceipt?: { payloadHash: string; importedAt: string };
  intentReceipts: Record<string, IntentReceipt>;
  grantReceipts: Record<string, number>;
  progressionEvents: unknown[];
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
    const existing = this.values.get(aggregate.playerId);
    if (existing) return clone(existing);
    const stored = clone(aggregate); this.values.set(aggregate.playerId, stored); return clone(stored);
  }
  async createIfAbsentWithResult(aggregate: PlayerAggregate) {
    const existing = this.values.get(aggregate.playerId);
    if (existing) return { aggregate: clone(existing), created: false };
    const stored = clone(aggregate); this.values.set(aggregate.playerId, stored);
    return { aggregate: clone(stored), created: true };
  }
  async compareExchange(playerId: string, expectedRevision: number, next: PlayerAggregate) {
    const current = this.values.get(playerId);
    if (!current || current.revision !== expectedRevision || next.playerId !== playerId) return false;
    this.values.set(playerId, clone(next)); return true;
  }
  async compareExchangeMany(changes: readonly { playerId: string; expectedRevision: number; next: PlayerAggregate }[]) {
    if (new Set(changes.map((change) => change.playerId)).size !== changes.length || !changes.every((change) => this.values.get(change.playerId)?.revision === change.expectedRevision && change.next.playerId === change.playerId)) return false;
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
