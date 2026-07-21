import { describe, expect, test } from 'vitest';
import { growthEventHash, isValidAggregate, isValidLedgerTransition, ProcessLocalPlayerAuthorityRepository, validateLedger, type GrowthAuditEvent, type PlayerAggregate } from './playerRepository';
import { createInitialSave, createPlayerProfile } from '../../src/games/monster-rpg/sim';

const genesis = '0'.repeat(64);
function event(overrides: Partial<GrowthAuditEvent> = {}): GrowthAuditEvent {
  const base = { v: 1 as const, kind: 'level-up' as const, playerId: 'player-1', creatureId: 'creature-1', grantId: 'battle:b1:creature:creature-1:level:2', model: 'deterministic-default' as const, balanceVersion: 1, levelFrom: 1, levelTo: 2, deltas: { hp: 2, attack: 1, defense: 1, speed: 1, stamina: 1 }, aggregateRevision: 3, createdAt: '2026-07-21T00:00:00.000Z', previousHash: genesis };
  const candidate = { ...base, ...overrides } as GrowthAuditEvent;
  return { ...candidate, eventHash: growthEventHash(candidate) };
}
function aggregateWithEvent(record = event()): PlayerAggregate {
  const profile = createPlayerProfile('A', 'scout'); profile.playerId = 'player-1';
  const save = createInitialSave(profile, { now: new Date('2026-07-21T00:00:00.000Z') });
  const basis = { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 };
  const stats = { hp: basis.hp + record.deltas.hp, attack: basis.attack + record.deltas.attack, defense: basis.defense + record.deltas.defense, speed: basis.speed + record.deltas.speed, stamina: basis.stamina + record.deltas.stamina };
  save.creatures = { ...save.creatures, activePartyCreatureIds: ['creature-1'], creatures: { 'creature-1': { id: 'creature-1', ownerPlayerId: 'player-1', speciesId: 1, level: record.levelTo, experience: 100, stats, attacks: [], hp: stats.hp, maxHp: stats.hp, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default', basis: { level: record.levelFrom, stats: basis }, events: [record] } } } };
  return { playerId: 'player-1', revision: Math.max(3, record.aggregateRevision), rosterRevision: 0, save, intentReceipts: {}, grantReceipts: {}, progressionEvents: [record], activeGrowthStartIndex: 0, locationMovementReceipts: {} };
}
function emptyAggregate(): PlayerAggregate {
  const profile = createPlayerProfile('A', 'scout'); profile.playerId = 'player-1';
  return { playerId: 'player-1', revision: 0, rosterRevision: 0, save: createInitialSave(profile, { now: new Date('2026-07-21T00:00:00.000Z') }), intentReceipts: {}, grantReceipts: {}, progressionEvents: [], activeGrowthStartIndex: 0, locationMovementReceipts: {} };
}

describe('growth audit ledger', () => {
  test('has a stable SHA-256 golden vector', () => {
    expect(event().eventHash).toBe('a32a8e78a9bc36c45a8cda253e487f4640caf512c92d7e858db89320744f5b95');
    expect(validateLedger([event({ createdAt: '2026-07-21T00:00:00Z' })], 'player-1', 3)).toBe(false);
  });

  test('rejects altered primitives, forged hashes, broken links, reordering, and truncation', () => {
    const first = event();
    const second = event({ grantId: 'battle:b2:creature:creature-1:level:3', levelFrom: 2, levelTo: 3, aggregateRevision: 4, previousHash: first.eventHash });
    expect(validateLedger([first, second], 'player-1', 4)).toBe(true);
    expect(validateLedger([{ ...first, deltas: { ...first.deltas, hp: 3 } }, second], 'player-1', 4)).toBe(false);
    expect(validateLedger([{ ...first, eventHash: 'f'.repeat(64) }, second], 'player-1', 4)).toBe(false);
    expect(validateLedger([first, { ...second, previousHash: genesis }], 'player-1', 4)).toBe(false);
    expect(validateLedger([second, first], 'player-1', 4)).toBe(false);
    const aggregate = { playerId: 'player-1', revision: 4, rosterRevision: 0, save: { creatures: { creatures: {} } }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [first, second], activeGrowthStartIndex: 0, locationMovementReceipts: {} } as unknown as PlayerAggregate;
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
      intentReceipts: {}, grantReceipts: {}, progressionEvents: events, activeGrowthStartIndex: 0, locationMovementReceipts: {}
    }) as unknown as PlayerAggregate;
    const orphan = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: {} } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0, locationMovementReceipts: {}
    } as unknown as PlayerAggregate;
    const duplicate = {
      playerId: 'player-1', revision: 3, rosterRevision: 0,
      save: { creatures: { creatures: { 'creature-1': { statGrowth: { events: [first] } }, 'creature-2': { statGrowth: { events: [first] } } } } },
      intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0, locationMovementReceipts: {}
    } as unknown as PlayerAggregate;
    expect(isValidAggregate(orphan)).toBe(false);
    expect(isValidAggregate(duplicate)).toBe(false);
    expect(isValidAggregate(aggregate([first], []))).toBe(false);
    expect(isValidAggregate(aggregate([first], [first, first]))).toBe(false);
  });

  test('rejects a valid but divergent replacement for an old ledger prefix', () => {
    const first = event();
    const divergent = event({ grantId: 'battle:other:creature:creature-1:level:2' });
    expect(isValidAggregate(aggregateWithEvent(divergent))).toBe(true);
    expect(isValidLedgerTransition(aggregateWithEvent(first), { ...aggregateWithEvent(divergent), revision: 4 })).toBe(false);
  });

  test('replays the active ledger into exact persisted creature terminal state', () => {
    const valid = aggregateWithEvent(); expect(isValidAggregate(valid)).toBe(true);
    const mutate = (change: (creature: (typeof valid.save.creatures.creatures)[string]) => void) => { const candidate = structuredClone(valid); change(candidate.save.creatures.creatures['creature-1']); return candidate; };
    expect(isValidAggregate(mutate((creature) => { creature.statGrowth!.model = 'rarity-weighted-random'; }))).toBe(true);
    expect(isValidAggregate(mutate((creature) => { delete (creature.statGrowth as unknown as Record<string, unknown>).model; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { (creature.statGrowth as unknown as Record<string, unknown>).model = 'randomized'; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { (creature.statGrowth as unknown as Record<string, unknown>).model = 'rebalance'; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.level += 1; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.stats.attack += 1; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.maxHp += 1; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.hp = creature.maxHp + 1; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.hp = 1; creature.fainted = false; }))).toBe(true);
    expect(isValidAggregate(mutate((creature) => { creature.hp = 0; creature.fainted = true; }))).toBe(true);
    expect(isValidAggregate(mutate((creature) => { creature.hp = 0; creature.fainted = false; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.hp = 1; creature.fainted = true; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { delete creature.statGrowth; }))).toBe(false);
    expect(isValidAggregate(mutate((creature) => { creature.statGrowth!.basis.stats.attack = Number.MAX_SAFE_INTEGER; }))).toBe(false);
    const reset = structuredClone(valid); reset.activeGrowthStartIndex = reset.progressionEvents.length; reset.save = createInitialSave(structuredClone(valid.save.profile), { now: new Date('2026-07-22T00:00:00.000Z') });
    expect(isValidAggregate(reset)).toBe(true);
  });

  test('validates and monotonically advances internal location movement receipts', () => {
    const empty = emptyAggregate(); expect(isValidAggregate(empty)).toBe(true);
    const withReceipt = { ...empty, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 1 } } };
    expect(isValidAggregate(withReceipt)).toBe(true);
    expect(isValidAggregate({ ...empty, locationMovementReceipts: { '': { roomId: 'room-1', mapId: 'home-village', lastSequence: 1 } } })).toBe(false);
    expect(isValidAggregate({ ...empty, locationMovementReceipts: { session: { roomId: '', mapId: 'home-village', lastSequence: 1 } } })).toBe(false);
    expect(isValidAggregate({ ...empty, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 0 } } })).toBe(false);
    const extraReceiptKey = { ...empty, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 1, extra: true } } } as unknown as PlayerAggregate;
    expect(isValidAggregate(extraReceiptKey)).toBe(false);
    expect(isValidLedgerTransition(empty, { ...withReceipt, revision: 1 })).toBe(true);
    expect(isValidLedgerTransition(withReceipt, { ...withReceipt, revision: 1, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 2 } } })).toBe(true);
    expect(isValidLedgerTransition(withReceipt, { ...withReceipt, revision: 1, locationMovementReceipts: {} })).toBe(false);
    expect(isValidLedgerTransition(withReceipt, { ...withReceipt, revision: 1, locationMovementReceipts: { session: { roomId: 'other', mapId: 'home-village', lastSequence: 2 } } })).toBe(false);
    expect(isValidLedgerTransition(withReceipt, { ...withReceipt, revision: 1, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 3 } } })).toBe(false);
    expect(isValidLedgerTransition(withReceipt, { ...withReceipt, revision: 1, locationMovementReceipts: { session: { roomId: 'room-1', mapId: 'home-village', lastSequence: 2 }, second: { roomId: 'room-1', mapId: 'home-village', lastSequence: 1 } } })).toBe(false);
  });

  test('accepts only a full canonical fresh save when reset advances the cursor', () => {
    const first = event(); const profile = createPlayerProfile('A', 'scout'); profile.playerId = 'player-1';
    const previousSave = createInitialSave(profile, { now: new Date('2026-07-21T00:00:00.000Z') });
    previousSave.creatures = { ...previousSave.creatures, activePartyCreatureIds: ['creature-1'], creatures: {
      'creature-1': { id: 'creature-1', ownerPlayerId: 'player-1', speciesId: 1, level: 2, experience: 100, stats: { hp: 22, attack: 11, defense: 11, speed: 11, stamina: 11 }, attacks: [], hp: 22, maxHp: 22, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 } }, events: [first] } }
    } };
    const previous = { playerId: 'player-1', revision: 3, rosterRevision: 0, save: previousSave, intentReceipts: {}, grantReceipts: {}, progressionEvents: [first], activeGrowthStartIndex: 0, locationMovementReceipts: {} };
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
    const initial = { playerId: 'player-1', revision: 0, rosterRevision: 0, save: { creatures: { creatures: {} }, activePartyCreatureIds: [] }, intentReceipts: {}, grantReceipts: {}, progressionEvents: [], activeGrowthStartIndex: 0, locationMovementReceipts: {} } as unknown as PlayerAggregate;
    await repository.createIfAbsent(initial);
    const next = { ...initial, revision: 1 };
    const results = await Promise.all([repository.compareExchange('player-1', 0, next), repository.compareExchange('player-1', 0, next)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.read('player-1'))?.revision).toBe(1);
  });

  test('permits only the canonical trainer battle lock lifecycle', () => {
    const initial = emptyAggregate();
    const reserved = { ...initial, revision: 1, activeBattle: { battleId: 'battle-1', kind: 'trainer' as const, trainerId: 'route-scout-1', mapId: 'tracer-world-route', locationRoomId: 'location-1', phase: 'reserved' as const, reservedAt: '2026-07-21T00:00:00.000Z' } };
    const active = { ...reserved, revision: 2, activeBattle: { ...reserved.activeBattle, phase: 'active' as const } };
    const released = { ...initial, revision: 2 };
    const settled = { ...initial, revision: 3, grantReceipts: { 'battle-1': 3 } };
    expect(isValidLedgerTransition(initial, reserved)).toBe(true);
    expect(isValidLedgerTransition(reserved, active)).toBe(true);
    expect(isValidLedgerTransition(reserved, released)).toBe(true);
    const cancelled = { ...initial, revision: 3 };
    expect(isValidLedgerTransition(active, settled)).toBe(true);
    expect(isValidLedgerTransition(active, cancelled)).toBe(true);
    expect(isValidLedgerTransition(active, { ...cancelled, save: { ...cancelled.save, profile: { ...cancelled.save.profile, name: 'Mutated' } } })).toBe(false);
    expect(isValidLedgerTransition(reserved, { ...reserved, revision: 2, activeBattle: { ...reserved.activeBattle, battleId: 'replacement' } })).toBe(false);
    expect(isValidAggregate({ ...reserved, activeBattle: { ...reserved.activeBattle, reservedAt: '2026-07-21T00:00:00Z' } })).toBe(false);
  });
});
