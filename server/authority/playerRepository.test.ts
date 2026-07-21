import { describe, expect, test } from 'vitest';
import { growthEventHash, isValidAggregate, isValidLedgerTransition, ProcessLocalPlayerAuthorityRepository, validateLedger, type GrowthAuditEvent, type PlayerAggregate } from './playerRepository';
import { createInitialSave, createPlayerProfile } from '../../src/games/monster-rpg/sim';

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
    const aggregate = { playerId: 'player-1', revision: 4, rosterRevision: 0, save: { creatures: { creatures: {} } }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [first, second], activeGrowthStartIndex: 0 } as unknown as PlayerAggregate;
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
      intentReceipts: {}, grantReceipts: {}, progressionEvents: events, activeGrowthStartIndex: 0
    }) as unknown as PlayerAggregate;
    const orphan = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: {} } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0
    } as unknown as PlayerAggregate;
    const duplicate = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: { 'creature-1': { statGrowth: { events: [first] } }, 'creature-2': { statGrowth: { events: [first] } } } } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0
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
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [record], activeGrowthStartIndex: 0
    }) as unknown as PlayerAggregate;
    expect(isValidAggregate(aggregate(divergent, 4))).toBe(true);
    expect(isValidLedgerTransition(aggregate(first, 3), aggregate(divergent, 4))).toBe(false);
  });

  test('accepts only a full canonical fresh save when reset advances the cursor', () => {
    const first = event(); const profile = createPlayerProfile('A', 'scout'); profile.playerId = 'player-1';
    const previousSave = createInitialSave(profile, { now: new Date('2026-07-21T00:00:00.000Z') });
    previousSave.creatures = { ...previousSave.creatures, activePartyCreatureIds: ['creature-1'], creatures: {
      'creature-1': { id: 'creature-1', ownerPlayerId: 'player-1', speciesId: 1, level: 2, experience: 100, stats: { hp: 22, attack: 11, defense: 11, speed: 11, stamina: 11 }, attacks: [], hp: 22, maxHp: 22, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 } }, events: [first] } }
    } };
    const previous = { playerId: 'player-1', revision: 3, rosterRevision: 0, save: previousSave, intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0 };
    const canonicalSave = createInitialSave(structuredClone(previousSave.profile), { now: new Date('2026-07-22T00:00:00.000Z') });
    const reset = { ...previous, revision: 4, rosterRevision: 1, activeGrowthStartIndex: 1, save: canonicalSave };
    expect(isValidLedgerTransition(previous, reset)).toBe(true);
    const mutated = (mutate: (save: typeof canonicalSave) => void) => { const save = structuredClone(canonicalSave); mutate(save); return { ...reset, save }; };
    expect(isValidLedgerTransition(previous, mutated((save) => { save.inventory.currencies.magicDust = 1; }))).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { save.farms.farms.extra = { id: 'extra' } as never; }))).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { save.progression.ownerPlayerId = 'other'; }))).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { save.profile.name = 'B'; }))).toBe(false);
    expect(isValidLedgerTransition({ ...previous, playerId: 'other' }, reset)).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { save.updatedAt = 'not-a-date'; }))).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { save.updatedAt = '2026-07-22T00:00:00Z'; }))).toBe(false);
    expect(isValidLedgerTransition(previous, mutated((save) => { (save as unknown as Record<string, unknown>).extra = true; }))).toBe(false);
  });

  test('allows exactly one concurrent CAS writer for a revision', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository();
    const initial = { playerId: 'player-1', revision: 0, rosterRevision: 0, save: { creatures: { creatures: {} }, activePartyCreatureIds: [] }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [], activeGrowthStartIndex: 0 } as unknown as PlayerAggregate;
    await repository.createIfAbsent(initial);
    const next = { ...initial, revision: 1 };
    const results = await Promise.all([repository.compareExchange('player-1', 0, next), repository.compareExchange('player-1', 0, next)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.read('player-1'))?.revision).toBe(1);
  });
});
