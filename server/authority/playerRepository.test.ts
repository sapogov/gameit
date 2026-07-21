import { describe, expect, test } from 'vitest';
import { growthEventHash, isValidAggregate, isValidLedgerTransition, ProcessLocalPlayerAuthorityRepository, validateLedger, type GrowthAuditEvent, type PlayerAggregate } from './playerRepository';

const genesis = '0'.repeat(64);
function event(overrides: Partial<GrowthAuditEvent> = {}): GrowthAuditEvent {
  const base = { v: 1 as const, kind: 'level-up' as const, playerId: 'player-1', creatureId: 'creature-1', grantId: 'battle:b1:creature:creature-1:level:2', model: 'deterministic-default' as const, balanceVersion: 1, levelFrom: 1, levelTo: 2, deltas: { hp: 2, attack: 1, defense: 1, speed: 1, stamina: 1 }, aggregateRevision: 3, createdAt: '2026-07-21T00:00:00.000Z', previousHash: genesis };
  const candidate = { ...base, ...overrides } as GrowthAuditEvent;
  return { ...candidate, eventHash: growthEventHash(candidate) };
}

describe('growth audit ledger', () => {
  test('has a stable SHA-256 golden vector', () => {
    expect(event().eventHash).toBe('a32a8e78a9bc36c45a8cda253e487f4640caf512c92d7e858db89320744f5b95');
  });

  test('rejects altered primitives, forged hashes, broken links, reordering, and truncation', () => {
    const first = event();
    const second = event({ grantId: 'battle:b2:creature:creature-1:level:3', levelFrom: 2, levelTo: 3, aggregateRevision: 4, previousHash: first.eventHash });
    expect(validateLedger([first, second], 'player-1', 4)).toBe(true);
    expect(validateLedger([{ ...first, deltas: { ...first.deltas, hp: 3 } }, second], 'player-1', 4)).toBe(false);
    expect(validateLedger([{ ...first, eventHash: 'f'.repeat(64) }, second], 'player-1', 4)).toBe(false);
    expect(validateLedger([first, { ...second, previousHash: genesis }], 'player-1', 4)).toBe(false);
    expect(validateLedger([second, first], 'player-1', 4)).toBe(false);
    const aggregate = { playerId: 'player-1', revision: 4, rosterRevision: 0, save: { creatures: { creatures: {} } }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [first, second] } as unknown as PlayerAggregate;
    expect(isValidLedgerTransition(aggregate, { ...aggregate, revision: 5, progressionEvents: [first] })).toBe(false);
  });

  test('rejects duplicate grants and duplicate rebalance targets', () => {
    const first = event();
    const duplicateGrant = event({ previousHash: first.eventHash });
    const rebalance = event({ kind: 'rebalance', model: 'rebalance', grantId: 'rebalance:creature-1:2', targetBalanceVersion: 2, levelFrom: 2, levelTo: 2, aggregateRevision: 4, previousHash: first.eventHash });
    const duplicateTarget = event({ kind: 'rebalance', model: 'rebalance', grantId: 'rebalance:creature-1:2', targetBalanceVersion: 2, levelFrom: 2, levelTo: 2, aggregateRevision: 5, previousHash: rebalance.eventHash });
    expect(validateLedger([first, duplicateGrant], 'player-1', 4)).toBe(false);
    expect(validateLedger([first, rebalance, duplicateTarget], 'player-1', 5)).toBe(false);
  });

  test('rejects orphaned and duplicated creature history projections', () => {
    const first = event();
    const aggregate = (events: GrowthAuditEvent[], history: GrowthAuditEvent[]) => ({
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: { 'creature-1': { statGrowth: { events: history } } } } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: events
    }) as unknown as PlayerAggregate;
    const orphan = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: {} } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first]
    } as unknown as PlayerAggregate;
    const duplicate = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: { 'creature-1': { statGrowth: { events: [first] } }, 'creature-2': { statGrowth: { events: [first] } } } } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first]
    } as unknown as PlayerAggregate;
    expect(isValidAggregate(orphan)).toBe(false);
    expect(isValidAggregate(duplicate)).toBe(false);
    expect(isValidAggregate(aggregate([first], []))).toBe(false);
    expect(isValidAggregate(aggregate([first], [first, first]))).toBe(false);
  });

  test('rejects a valid but divergent replacement for an old ledger prefix', () => {
    const first = event();
    const divergent = event({ grantId: 'battle:other:creature:creature-1:level:2' });
    const aggregate = (record: GrowthAuditEvent, revision: number) => ({
      playerId: 'player-1', revision, rosterRevision: 0,
      save: { creatures: { creatures: { 'creature-1': { statGrowth: { events: [record] } } } } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [record]
    }) as unknown as PlayerAggregate;
    expect(isValidAggregate(aggregate(divergent, 4))).toBe(true);
    expect(isValidLedgerTransition(aggregate(first, 3), aggregate(divergent, 4))).toBe(false);
  });

  test('allows exactly one concurrent CAS writer for a revision', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository();
    const initial = { playerId: 'player-1', revision: 0, rosterRevision: 0, save: { creatures: { creatures: {} } }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [] } as unknown as PlayerAggregate;
    await repository.createIfAbsent(initial);
    const next = { ...initial, revision: 1 };
    const results = await Promise.all([repository.compareExchange('player-1', 0, next), repository.compareExchange('player-1', 0, next)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.read('player-1'))?.revision).toBe(1);
  });
});
