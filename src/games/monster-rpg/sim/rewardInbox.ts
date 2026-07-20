import { addItem, ITEM_INVENTORY_SLOT_LIMIT, type ItemInventory } from './inventory';
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
  claimedSourceIds: Record<string, true>;
}

export const createRewardInbox = (ownerPlayerId: string): RewardInbox => ({
  ownerPlayerId,
  bundles: {},
  claimedSourceIds: {}
});

export function enqueueReward(inbox: RewardInbox, bundle: RewardBundle): { ok: true; inbox: RewardInbox } | { ok: false; reason: 'duplicate-source' | 'inbox-full' | 'invalid-bundle' | 'not-owner' } {
  if (!bundle || typeof bundle !== 'object') return { ok: false, reason: 'invalid-bundle' };
  if (bundle.ownerPlayerId !== inbox.ownerPlayerId) return { ok: false, reason: 'not-owner' };
  if (!isValidRewardBundle(bundle, bundle.sourceId, inbox.ownerPlayerId)) return { ok: false, reason: 'invalid-bundle' };
  if (!isRecord(inbox.bundles) || !isRecord(inbox.claimedSourceIds)) return { ok: false, reason: 'invalid-bundle' };
  if (hasOwnRecordKey(inbox.bundles, bundle.sourceId) || hasOwnRecordKey(inbox.claimedSourceIds, bundle.sourceId)) return { ok: false, reason: 'duplicate-source' };
  if (Object.keys(inbox.bundles).length >= REWARD_INBOX_LIMIT) return { ok: false, reason: 'inbox-full' };

  const storedBundle: RewardBundle = { ...bundle, items: bundle.items.map((item) => ({ ...item })) };
  return {
    ok: true,
    inbox: {
      ...inbox,
      bundles: { ...inbox.bundles, [bundle.sourceId]: storedBundle },
      claimedSourceIds: { ...inbox.claimedSourceIds }
    }
  };
}

export function claimReward(inbox: RewardInbox, inventory: ItemInventory, ownerPlayerId: string, sourceId: string): { ok: true; inbox: RewardInbox; inventory: ItemInventory } | { ok: false; reason: 'missing-bundle' | 'not-owner' | 'capacity'; requiredSlots?: number } {
  if (ownerPlayerId !== inbox.ownerPlayerId) return { ok: false, reason: 'not-owner' };
  if (!isRecord(inbox.bundles) || !isRecord(inbox.claimedSourceIds)) return { ok: false, reason: 'missing-bundle' };
  if (!isValidRewardSourceId(sourceId) || !hasOwnRecordKey(inbox.bundles, sourceId)) return { ok: false, reason: 'missing-bundle' };
  if (hasOwnRecordKey(inbox.claimedSourceIds, sourceId)) return { ok: false, reason: 'missing-bundle' };
  const bundle = inbox.bundles[sourceId];
  if (!bundle || typeof bundle !== 'object') return { ok: false, reason: 'missing-bundle' };
  if (bundle.ownerPlayerId !== inbox.ownerPlayerId) return { ok: false, reason: 'not-owner' };
  if (!isValidRewardBundle(bundle, sourceId, inbox.ownerPlayerId)) return { ok: false, reason: 'missing-bundle' };

  let preview = inventory;
  for (const item of bundle.items) {
    const result = addItem(preview, item.itemId, item.quantity);
    if (!result.ok) {
      const freeSlots = Math.max(0, ITEM_INVENTORY_SLOT_LIMIT - Object.keys(inventory.stacks).length);
      return { ok: false, reason: 'capacity', requiredSlots: Math.max(1, requiredBundleSlots(inventory, bundle) - freeSlots) };
    }
    preview = result.inventory;
  }

  const bundles = { ...inbox.bundles };
  delete bundles[sourceId];
  return {
    ok: true,
    inventory: preview,
    inbox: { ...inbox, bundles, claimedSourceIds: { ...inbox.claimedSourceIds, [sourceId]: true } }
  };
}

export function isValidRewardSourceId(sourceId: unknown): sourceId is string {
  return typeof sourceId === 'string' && sourceId.length > 0 && !Object.prototype.hasOwnProperty.call(Object.prototype, sourceId);
}

export function isValidRewardBundle(value: unknown, sourceId: string, ownerPlayerId: string): value is RewardBundle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const bundle = value as Partial<RewardBundle>;
  return (
    isValidRewardSourceId(sourceId) &&
    bundle.sourceId === sourceId &&
    bundle.ownerPlayerId === ownerPlayerId &&
    isIsoTimestamp(bundle.createdAt) &&
    Array.isArray(bundle.items) &&
    bundle.items.length > 0 &&
    bundle.items.every((item) => Boolean(item && typeof item === 'object' && isItemId(item.itemId) && Number.isSafeInteger(item.quantity) && item.quantity > 0))
  );
}

function hasOwnRecordKey(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
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
