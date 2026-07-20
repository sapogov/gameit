import { addItem, type ItemInventory } from './inventory';
import { getItemDefinition, isItemId, type ItemId } from './items';

export const REWARD_INBOX_LIMIT = 50;

export interface RewardBundle {
  sourceId: string;
  ownerPlayerId: string;
  items: readonly { itemId: ItemId; quantity: number }[];
  createdAt: string;
}

export interface RewardInbox {
  ownerPlayerId: string;
  bundles: Record<string, RewardBundle>;
}

export const createRewardInbox = (ownerPlayerId: string): RewardInbox => ({ ownerPlayerId, bundles: {} });

export function enqueueReward(inbox: RewardInbox, bundle: RewardBundle): { ok: true; inbox: RewardInbox } | { ok: false; reason: 'duplicate-source' | 'inbox-full' | 'invalid-bundle' | 'not-owner' } {
  if (bundle.ownerPlayerId !== inbox.ownerPlayerId) return { ok: false, reason: 'not-owner' };
  if (isPrototypeSourceId(bundle.sourceId)) return { ok: false, reason: 'invalid-bundle' };
  if (hasOwnBundle(inbox.bundles, bundle.sourceId)) return { ok: false, reason: 'duplicate-source' };
  if (Object.keys(inbox.bundles).length >= REWARD_INBOX_LIMIT) return { ok: false, reason: 'inbox-full' };
  if (!bundle.items.length || !bundle.items.every((item) => isItemId(item.itemId) && Number.isSafeInteger(item.quantity) && item.quantity > 0)) return { ok: false, reason: 'invalid-bundle' };

  const storedBundle: RewardBundle = { ...bundle, items: bundle.items.map((item) => ({ ...item })) };
  return { ok: true, inbox: { ...inbox, bundles: { ...inbox.bundles, [bundle.sourceId]: storedBundle } } };
}

export function claimReward(inbox: RewardInbox, inventory: ItemInventory, ownerPlayerId: string, sourceId: string): { ok: true; inbox: RewardInbox; inventory: ItemInventory } | { ok: false; reason: 'missing-bundle' | 'not-owner' | 'capacity'; requiredSlots?: number } {
  if (ownerPlayerId !== inbox.ownerPlayerId) return { ok: false, reason: 'not-owner' };
  if (isPrototypeSourceId(sourceId) || !hasOwnBundle(inbox.bundles, sourceId)) return { ok: false, reason: 'missing-bundle' };
  const bundle = inbox.bundles[sourceId];

  let preview = inventory;
  for (const item of bundle.items) {
    const result = addItem(preview, item.itemId, item.quantity);
    if (!result.ok) return { ok: false, reason: 'capacity', requiredSlots: requiredBundleSlots(inventory, bundle) };
    preview = result.inventory;
  }

  const bundles = { ...inbox.bundles };
  delete bundles[sourceId];
  return { ok: true, inventory: preview, inbox: { ...inbox, bundles } };
}

function hasOwnBundle(bundles: Record<string, RewardBundle>, sourceId: string): boolean {
  return Object.prototype.hasOwnProperty.call(bundles, sourceId);
}

function isPrototypeSourceId(sourceId: string): boolean {
  return Object.prototype.hasOwnProperty.call(Object.prototype, sourceId);
}

function requiredBundleSlots(inventory: ItemInventory, bundle: RewardBundle): number {
  const quantities = new Map<ItemId, number>();
  for (const item of bundle.items) quantities.set(item.itemId, (quantities.get(item.itemId) ?? 0) + item.quantity);

  let requiredSlots = 0;
  for (const [itemId, quantity] of quantities) {
    const definition = getItemDefinition(itemId);
    if (!definition) continue;
    const availableInExistingStacks = Object.values(inventory.stacks)
      .filter((stack) => stack.itemId === itemId)
      .reduce((total, stack) => total + Math.max(0, definition.maxStack - stack.quantity), 0);
    requiredSlots += Math.max(0, Math.ceil((quantity - availableInExistingStacks) / definition.maxStack));
  }
  return requiredSlots;
}
