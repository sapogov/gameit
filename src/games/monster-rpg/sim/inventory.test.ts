import { expect, test } from 'vitest';
import { addItem, createItemInventory, discardItem, ITEM_INVENTORY_SLOT_LIMIT } from './inventory';

test('fills deterministic overflow stacks and requires confirmation to discard', () => {
  const added = addItem(createItemInventory(), 'mending-sprig', 100);
  expect(added).toMatchObject({ ok: true });
  if (!added.ok) return;
  expect(Object.values(added.inventory.stacks).map((stack) => stack.quantity)).toEqual([99, 1]);
  expect(discardItem(added.inventory, 'mending-sprig:001', 1, false)).toMatchObject({ ok: false });
  expect(discardItem(added.inventory, 'mending-sprig:001', 1, true)).toMatchObject({
    ok: true,
    inventory: { stacks: { 'mending-sprig:001': { quantity: 98 }, 'mending-sprig:002': { quantity: 1 } } }
  });
});

test('rejects additions beyond the 150 occupied stack limit', () => {
  let inventory = createItemInventory();
  for (let index = 0; index < ITEM_INVENTORY_SLOT_LIMIT; index += 1) inventory = { stacks: { ...inventory.stacks, [`mending-sprig:${String(index).padStart(3, '0')}`]: { id: `mending-sprig:${String(index).padStart(3, '0')}`, itemId: 'mending-sprig', quantity: 99 } } };
  expect(addItem(inventory, 'worn-key', 1)).toMatchObject({ ok: false, reason: 'capacity' });
});

test('keeps protected or unknown item stacks when discard is requested', () => {
  const inventory = { stacks: { protected: { id: 'protected', itemId: 'unknown-item' as never, quantity: 1 } } };
  expect(discardItem(inventory, 'protected', 1, true)).toMatchObject({ ok: false, reason: 'protected-item' });
  expect(inventory.stacks.protected.quantity).toBe(1);
});
