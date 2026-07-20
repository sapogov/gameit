import { expect, test } from 'vitest';
import { createItemInventory } from './inventory';
import { claimReward, createRewardInbox, enqueueReward } from './rewardInbox';

test('claims a reward atomically and rejects replay', () => {
  const queued = enqueueReward(createRewardInbox('player'), { sourceId: 'battle:1', ownerPlayerId: 'player', items: [{ itemId: 'worn-key', quantity: 2 }], createdAt: '2026-07-20T00:00:00.000Z' });
  expect(queued.ok).toBe(true); if (!queued.ok) return;
  const claimed = claimReward(queued.inbox, createItemInventory(), 'player', 'battle:1');
  expect(claimed).toMatchObject({ ok: true }); if (!claimed.ok) return;
  expect(claimed.inbox.claimedSourceIds).toEqual({ 'battle:1': true });
  const claimedBeforeReplay = JSON.stringify(claimed);
  expect(claimReward(claimed.inbox, claimed.inventory, 'player', 'battle:1')).toMatchObject({ ok: false, reason: 'missing-bundle' });
  expect(enqueueReward(claimed.inbox, { sourceId: 'battle:1', ownerPlayerId: 'player', items: [{ itemId: 'worn-key', quantity: 2 }], createdAt: '2026-07-20T00:00:00.000Z' })).toEqual({ ok: false, reason: 'duplicate-source' });
  expect(JSON.stringify(claimed)).toBe(claimedBeforeReplay);
});

test('rejects duplicate sources and a full inbox without mutation', () => {
  const initial = createRewardInbox('player');
  const bundle = { sourceId: 'source', ownerPlayerId: 'player', items: [{ itemId: 'worn-key' as const, quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' };
  const first = enqueueReward(initial, bundle); expect(first.ok).toBe(true); if (!first.ok) return;
  expect(enqueueReward(first.inbox, bundle)).toMatchObject({ ok: false, reason: 'duplicate-source' });
  const full = { ...initial, bundles: Object.fromEntries(Array.from({ length: 50 }, (_, index) => [`source:${index}`, { ...bundle, sourceId: `source:${index}` }])) };
  expect(enqueueReward(full, { ...bundle, sourceId: 'next' })).toMatchObject({ ok: false, reason: 'inbox-full' });
});

test('rejects prototype source IDs and ignores inherited bundle aliases without mutation', () => {
  const initial = createRewardInbox('player');
  const bundle = { sourceId: 'toString', ownerPlayerId: 'player', items: [{ itemId: 'worn-key' as const, quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' };
  const inventory = createItemInventory();
  const inboxBefore = JSON.stringify(initial);
  const inventoryBefore = JSON.stringify(inventory);

  expect(() => enqueueReward(initial, bundle)).not.toThrow();
  expect(enqueueReward(initial, bundle)).toEqual({ ok: false, reason: 'invalid-bundle' });
  expect(enqueueReward(initial, { ...bundle, sourceId: '__proto__' })).toEqual({ ok: false, reason: 'invalid-bundle' });
  expect(() => claimReward(initial, inventory, 'player', 'toString')).not.toThrow();
  expect(claimReward(initial, inventory, 'player', 'toString')).toEqual({ ok: false, reason: 'missing-bundle' });

  const inheritedInbox = { ...initial, bundles: Object.create({ inherited: { ...bundle, sourceId: 'inherited' } }) };
  expect(claimReward(inheritedInbox, inventory, 'player', 'inherited')).toEqual({ ok: false, reason: 'missing-bundle' });
  expect(JSON.stringify(initial)).toBe(inboxBefore);
  expect(JSON.stringify(inventory)).toBe(inventoryBefore);
});

test('rejects owner mismatch and preserves every input when capacity prevents a claim', () => {
  const queued = enqueueReward(createRewardInbox('player'), { sourceId: 'overflow', ownerPlayerId: 'player', items: [{ itemId: 'worn-key', quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' });
  expect(queued.ok).toBe(true); if (!queued.ok) return;
  expect(claimReward(queued.inbox, createItemInventory(), 'other', 'overflow')).toMatchObject({ ok: false, reason: 'not-owner' });
  const fullInventory = { stacks: Object.fromEntries(Array.from({ length: 150 }, (_, index) => [`mending-sprig:${index}`, { id: `mending-sprig:${index}`, itemId: 'mending-sprig' as const, quantity: 99 }])) };
  const inboxBefore = JSON.stringify(queued.inbox); const inventoryBefore = JSON.stringify(fullInventory);
  expect(claimReward(queued.inbox, fullInventory, 'player', 'overflow')).toMatchObject({ ok: false, reason: 'capacity', requiredSlots: 1 });
  expect(JSON.stringify(queued.inbox)).toBe(inboxBefore); expect(JSON.stringify(fullInventory)).toBe(inventoryBefore);
});

test('reports bundle-wide additional slots across items and partial stacks', () => {
  const queued = enqueueReward(createRewardInbox('player'), {
    sourceId: 'multi-item-overflow',
    ownerPlayerId: 'player',
    items: [
      { itemId: 'mending-sprig', quantity: 101 },
      { itemId: 'worn-key', quantity: 100 },
      { itemId: 'mending-sprig', quantity: 97 }
    ],
    createdAt: '2026-07-20T00:00:00.000Z'
  });
  expect(queued.ok).toBe(true); if (!queued.ok) return;
  const inventory = {
    stacks: {
      partial: { id: 'partial', itemId: 'mending-sprig' as const, quantity: 98 },
      ...Object.fromEntries(Array.from({ length: 149 }, (_, index) => [`full:${index}`, { id: `full:${index}`, itemId: 'clearhead-tonic' as const, quantity: 99 }]))
    }
  };
  const before = JSON.stringify(inventory);
  expect(claimReward(queued.inbox, inventory, 'player', 'multi-item-overflow')).toMatchObject({ ok: false, reason: 'capacity', requiredSlots: 4 });
  expect(JSON.stringify(inventory)).toBe(before);
});

test('reports only the additional slot deficit after current free slots', () => {
  const queued = enqueueReward(createRewardInbox('player'), {
    sourceId: 'two-slots',
    ownerPlayerId: 'player',
    items: [{ itemId: 'worn-key', quantity: 100 }],
    createdAt: '2026-07-20T00:00:00.000Z'
  });
  expect(queued.ok).toBe(true); if (!queued.ok) return;
  const inventory = { stacks: Object.fromEntries(Array.from({ length: 149 }, (_, index) => [`full:${index}`, { id: `full:${index}`, itemId: 'mending-sprig' as const, quantity: 99 }])) };
  expect(claimReward(queued.inbox, inventory, 'player', 'two-slots')).toMatchObject({ ok: false, reason: 'capacity', requiredSlots: 1 });
});

test('rejects malformed delivery and stored bundles without throwing or mutation', () => {
  const initial = createRewardInbox('player');
  const invalidDate = { sourceId: 'bad-date', ownerPlayerId: 'player', items: [{ itemId: 'worn-key' as const, quantity: 1 }], createdAt: 'July 20' };
  expect(() => enqueueReward(initial, null as never)).not.toThrow();
  expect(enqueueReward(initial, null as never)).toEqual({ ok: false, reason: 'invalid-bundle' });
  expect(enqueueReward(initial, invalidDate)).toEqual({ ok: false, reason: 'invalid-bundle' });

  const malformed = {
    ...initial,
    bundles: { broken: { ...invalidDate, sourceId: 'broken', createdAt: '2026-07-20T00:00:00.000Z', ownerPlayerId: 'other' } }
  };
  const inventory = createItemInventory();
  const before = JSON.stringify(malformed);
  expect(() => claimReward(malformed, inventory, 'player', 'broken')).not.toThrow();
  expect(claimReward(malformed, inventory, 'player', 'broken')).toEqual({ ok: false, reason: 'not-owner' });
  expect(JSON.stringify(malformed)).toBe(before);
  expect(inventory).toEqual(createItemInventory());
});
