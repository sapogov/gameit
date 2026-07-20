import { getItemDefinition, type ItemId } from './items';
export const ITEM_INVENTORY_SLOT_LIMIT = 150;
export interface ItemStack { id: string; itemId: ItemId; quantity: number }
export interface ItemInventory { stacks: Record<string, ItemStack> }
export type InventoryResult = { ok: true; inventory: ItemInventory; added?: number } | { ok: false; reason: 'invalid-item' | 'invalid-quantity' | 'insufficient-items' | 'protected-item' | 'capacity'; requiredSlots?: number };
export const createItemInventory = (): ItemInventory => ({ stacks: {} });
export function requiredAdditionalSlots(inventory: ItemInventory, itemId: ItemId, quantity: number): number {
  const definition = getItemDefinition(itemId); if (!definition || !Number.isSafeInteger(quantity) || quantity <= 0) return Number.POSITIVE_INFINITY;
  let remaining = quantity;
  Object.values(inventory.stacks).filter((stack) => stack.itemId === itemId).sort((a,b) => a.id.localeCompare(b.id)).forEach((stack) => { remaining -= Math.max(0, definition.maxStack - stack.quantity); });
  return Math.max(0, Math.ceil(remaining / definition.maxStack));
}
export function addItem(inventory: ItemInventory, itemId: ItemId, quantity: number): InventoryResult {
  const definition = getItemDefinition(itemId); if (!definition) return { ok: false, reason: 'invalid-item' }; if (!Number.isSafeInteger(quantity) || quantity <= 0) return { ok: false, reason: 'invalid-quantity' };
  const requiredSlots = requiredAdditionalSlots(inventory, itemId, quantity); if (Object.keys(inventory.stacks).length + requiredSlots > ITEM_INVENTORY_SLOT_LIMIT) return { ok: false, reason: 'capacity', requiredSlots };
  let remaining = quantity; const stacks = { ...inventory.stacks };
  Object.values(stacks).filter((stack) => stack.itemId === itemId).sort((a,b) => a.id.localeCompare(b.id)).forEach((stack) => { const added = Math.min(remaining, definition.maxStack - stack.quantity); if (added) { stacks[stack.id] = { ...stack, quantity: stack.quantity + added }; remaining -= added; } });
  for (let index = 1; remaining > 0; index += 1) { const id = `${itemId}:${String(index).padStart(3, '0')}`; if (stacks[id]) continue; const added = Math.min(remaining, definition.maxStack); stacks[id] = { id, itemId, quantity: added }; remaining -= added; }
  return { ok: true, inventory: { stacks }, added: quantity };
}
export function discardItem(inventory: ItemInventory, stackId: string, quantity: number, confirmed: boolean): InventoryResult {
  const stack = inventory.stacks[stackId]; if (!stack) return { ok: false, reason: 'insufficient-items' }; const definition = getItemDefinition(stack.itemId); if (!definition || !definition.discardable) return { ok: false, reason: 'protected-item' }; if (!confirmed || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > stack.quantity) return { ok: false, reason: 'insufficient-items' };
  const stacks = { ...inventory.stacks }; if (quantity === stack.quantity) delete stacks[stackId]; else stacks[stackId] = { ...stack, quantity: stack.quantity - quantity }; return { ok: true, inventory: { stacks } };
}
