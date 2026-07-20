import { expect, test } from 'vitest';
import { createItemInventory } from './inventory';
import { claimReward, createRewardInbox, enqueueReward } from './rewardInbox';

test('claims a reward atomically and rejects replay', () => {
  const queued = enqueueReward(createRewardInbox('player'), { sourceId: 'battle:1', ownerPlayerId: 'player', items: [{ itemId: 'worn-key', quantity: 2 }], createdAt: '2026-07-20T00:00:00.000Z' });
  expect(queued.ok).toBe(true); if (!queued.ok) return;
  const claimed = claimReward(queued.inbox, createItemInventory(), 'player', 'battle:1');
  expect(claimed).toMatchObject({ ok: true }); if (!claimed.ok) return;
  expect(claimReward(claimed.inbox, claimed.inventory, 'player', 'battle:1')).toMatchObject({ ok: false, reason: 'missing-bundle' });
});

test('rejects duplicate sources and a full inbox without mutation', () => {
  const initial = createRewardInbox('player');
  const bundle = { sourceId: 'source', ownerPlayerId: 'player', items: [{ itemId: 'worn-key' as const, quantity: 1 }], createdAt: '2026-07-20T00:00:00.000Z' };
  const first = enqueueReward(initial, bundle); expect(first.ok).toBe(true); if (!first.ok) return;
  expect(enqueueReward(first.inbox, bundle)).toMatchObject({ ok: false, reason: 'duplicate-source' });
  const full = { ...initial, bundles: Object.fromEntries(Array.from({ length: 50 }, (_, index) => [`source:${index}`, { ...bundle, sourceId: `source:${index}` }])) };
  expect(enqueueReward(full, { ...bundle, sourceId: 'next' })).toMatchObject({ ok: false, reason: 'inbox-full' });
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
