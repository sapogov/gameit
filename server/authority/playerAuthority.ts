import { createHash } from 'node:crypto';
import { signAuthenticatedTransfer, verifyAuthenticatedTransfer, type AuthenticatedTransferEnvelope } from './authenticatedTransfer';
import type { GuestCredentialConfig } from '../auth/guestCredentials';
import {
  createInitialSave, createPlayerProfile, importSavePayload, isAtVillageHospital, moveCreatureToActiveParty,
  moveCreatureToStorage, healAllCreaturesAtHospital, useReviveItem, type AvatarId, type CreatureSaveRecord,
  type MonsterRpgSaveState, convertCreatureCardViaElder, hatchEgg, claimReward, discardItem, confirmStationTravel,
  movePlayer, getGameMap, completeVillageElderDialog, completeVillageElderOnboarding, activateMaterialCard,
  activateBuffCard, buildFarmCardViaElder, upgradeFarm, assignFarmGuard, clearFarmGuard, collectFacingFarm, attemptFacingFarmTheft
  , convertStarterCreatureCards, buildStarterMagicDustFarm
} from '../../src/games/monster-rpg/sim';
import { applyBattleRewardsToSave, type BattleResolution } from '../../src/games/monster-rpg/sim';
import { resolveGuardedFarmTheft } from '../../src/games/monster-rpg/sim';
import { type ItemInventory, type ItemStack } from '../../src/games/monster-rpg/sim/inventory';
import { getItemDefinition } from '../../src/games/monster-rpg/sim/items';
import type { SaveStack } from '../../src/games/monster-rpg/sim';
import type { AuthorityIntent, AuthoritySnapshot, SaveCommand, SaveCommandResult } from '../../src/games/monster-rpg/network/authorityProtocol';
import { clone, type PlayerAggregate, type PlayerAuthorityRepository } from './playerRepository';

export interface Principal { sub: string }
export interface FrozenParty { playerId: string; rosterRevision: number; creatures: readonly Readonly<CreatureSaveRecord>[] }
export type AuthenticatedSaveExport = AuthenticatedTransferEnvelope;
export type AuthenticatedImportResult = { ok: true; snapshot: AuthoritySnapshot } | { ok: false; code: 'INVALID_TRANSFER' | 'CROSS_PRINCIPAL' | 'ALREADY_INITIALIZED' | 'REPLAYED_OR_STALE' | 'INVALID_LEGACY_SAVE' };

export class PlayerAuthority {
  constructor(private readonly repository: PlayerAuthorityRepository, private readonly now: () => Date = () => new Date(), private readonly transferKeys?: GuestCredentialConfig) {}
  async snapshot(principal: Principal): Promise<AuthoritySnapshot | null> { const aggregate = await this.repository.read(principal.sub); return aggregate && snapshot(aggregate); }
  async findFarm(farmId: string) { return this.repository.findFarm(farmId); }
  async bootstrapProfile(principal: Principal, input: { name: string; avatar: AvatarId }): Promise<AuthoritySnapshot> {
    const profile = createPlayerProfile(input.name, input.avatar);
    profile.playerId = principal.sub;
    const aggregate = await this.repository.createIfAbsent(emptyAggregate(principal.sub, createInitialSave(profile)));
    return snapshot(aggregate);
  }
  async importLegacySave(principal: Principal, payload: string): Promise<{ ok: true; snapshot: AuthoritySnapshot } | { ok: false; code: 'ALREADY_INITIALIZED' | 'INVALID_LEGACY_SAVE' }> {
    if (await this.repository.read(principal.sub)) return { ok: false, code: 'ALREADY_INITIALIZED' };
    const parsed = importSavePayload(payload);
    if (!parsed.ok || Object.values(parsed.ok ? parsed.state.creatures.creatures : {}).some((creature) => creature.statGrowth?.events.length)) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    const save = rebindSave(parsed.state, principal.sub);
    const aggregate = await this.repository.createIfAbsent({ ...emptyAggregate(principal.sub, save), legacyImportReceipt: { payloadHash: hash(payload), importedAt: this.now().toISOString() } });
    return aggregate.legacyImportReceipt?.payloadHash === hash(payload) ? { ok: true, snapshot: snapshot(aggregate) } : { ok: false, code: 'ALREADY_INITIALIZED' };
  }
  async execute(principal: Principal, command: SaveCommand): Promise<SaveCommandResult> {
    const aggregate = await this.repository.read(principal.sub);
    if (!aggregate) return { status: 'rejected', code: 'AUTHORITY_REQUIRED' };
    const payloadHash = hash(JSON.stringify(command.intent)); const prior = aggregate.intentReceipts[command.intentId];
    if (prior) return prior.payloadHash === payloadHash ? { status: 'duplicate', snapshot: snapshot(aggregate) } : { status: 'rejected', code: 'INTENT_REUSED', snapshot: snapshot(aggregate) };
    if (command.expectedRevision !== aggregate.revision) return { status: 'rejected', code: 'STALE_REVISION', snapshot: snapshot(aggregate) };
    if (command.intent.type === 'attemptFarmTheft' && typeof command.intent.farmId === 'string') return this.attemptFarmTheft(principal, command, aggregate, payloadHash);
    const nextSave = reduce(aggregate.save, command.intent);
    if (!nextSave) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(aggregate) };
    const next: PlayerAggregate = { ...aggregate, revision: aggregate.revision + 1, rosterRevision: rosterChanged(aggregate.save, nextSave) ? aggregate.rosterRevision + 1 : aggregate.rosterRevision, save: nextSave, intentReceipts: { ...aggregate.intentReceipts, [command.intentId]: { payloadHash, revision: aggregate.revision + 1 } } };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return { status: 'rejected', code: 'STALE_REVISION', snapshot: snapshot((await this.repository.read(principal.sub))!) };
    return { status: 'applied', snapshot: snapshot(next) };
  }
  /** The room validates proximity; this authority method owns all RNG and cross-account writes. */
  private async attemptFarmTheft(principal: Principal, command: SaveCommand, attacker: PlayerAggregate, payloadHash: string): Promise<SaveCommandResult> {
    const farmId = command.intent.farmId as string;
    const found = await this.repository.findFarm(farmId);
    if (!found || found.playerId === principal.sub) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const owner = await this.repository.read(found.playerId);
    if (!owner) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const farm = owner.save.farms.farms[farmId];
    if (!farm || farm.ownerPlayerId !== owner.playerId || farm.guardCreatureId) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const simulated = clone(attacker.save);
    simulated.position = { mapId: farm.position.mapId, x: farm.position.x - 1, y: farm.position.y, facing: 'east' };
    simulated.farms = { ...simulated.farms, farms: { ...simulated.farms.farms, [farm.id]: clone(farm) } };
    const theft = attemptFacingFarmTheft(simulated);
    if (!theft.ok) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const { [farm.id]: _foreignFarm, ...attackerFarms } = theft.state.farms.farms;
    const attackerSave = { ...theft.state, position: attacker.save.position, farms: { ...theft.state.farms, farms: attackerFarms } };
    const attackerNext: PlayerAggregate = {
      ...attacker, revision: attacker.revision + 1, rosterRevision: rosterChanged(attacker.save, attackerSave) ? attacker.rosterRevision + 1 : attacker.rosterRevision,
      save: attackerSave, intentReceipts: { ...attacker.intentReceipts, [command.intentId]: { payloadHash, revision: attacker.revision + 1 } }
    };
    const ownerSave = { ...owner.save, farms: { ...owner.save.farms, farms: { ...owner.save.farms.farms, [farm.id]: theft.farm } } };
    const ownerNext: PlayerAggregate = { ...owner, revision: owner.revision + 1, save: ownerSave };
    if (!await this.repository.compareExchangeMany([{ playerId: attacker.playerId, expectedRevision: attacker.revision, next: attackerNext }, { playerId: owner.playerId, expectedRevision: owner.revision, next: ownerNext }])) {
      const current = await this.repository.read(principal.sub);
      return { status: 'rejected', code: 'STALE_REVISION', ...(current ? { snapshot: snapshot(current) } : {}) };
    }
    return { status: 'applied', snapshot: snapshot(attackerNext) };
  }
  async exportAuthenticatedSave(principal: Principal): Promise<AuthenticatedSaveExport | null> {
    const aggregate = await this.repository.read(principal.sub); if (!aggregate) return null;
    if (!this.transferKeys) throw new Error('Authenticated transfer keys are required');
    return signAuthenticatedTransfer({ playerId: principal.sub, revision: aggregate.revision, rosterRevision: aggregate.rosterRevision, issuedAt: this.now().getTime(), payload: JSON.stringify(aggregate.save) }, this.transferKeys);
  }
  async importAuthenticatedSave(principal: Principal, rawEnvelope: unknown): Promise<AuthenticatedImportResult> {
    if (!this.transferKeys) throw new Error('Authenticated transfer keys are required');
    const envelope = verifyAuthenticatedTransfer(rawEnvelope, this.transferKeys);
    if (!envelope) return { ok: false, code: 'INVALID_TRANSFER' };
    if (envelope.playerId !== principal.sub) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const existing = await this.repository.read(principal.sub);
    if (existing) return { ok: false, code: existing.revision >= envelope.revision ? 'REPLAYED_OR_STALE' : 'ALREADY_INITIALIZED' };
    let projected: unknown;
    try { projected = JSON.parse(envelope.payload); } catch { return { ok: false, code: 'INVALID_LEGACY_SAVE' }; }
    if (!validateAuthenticatedOwnershipProjection(projected, envelope.playerId)) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const parsed = importSavePayload(envelope.payload);
    if (!parsed.ok) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    if (!validateAuthenticatedSaveOwnership(parsed.state, envelope.playerId)) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const created = await this.repository.createIfAbsentWithResult({ ...emptyAggregate(principal.sub, clone(parsed.state)), revision: envelope.revision, rosterRevision: envelope.rosterRevision });
    return created.created ? { ok: true, snapshot: snapshot(created.aggregate) } : { ok: false, code: 'ALREADY_INITIALIZED' };
  }
  /** Alias kept explicit so callers do not confuse this with unsigned legacy import. */
  async importAuthenticatedExport(principal: Principal, envelope: unknown) { return this.importAuthenticatedSave(principal, envelope); }
  async freezeReadyActiveParty(input: { principal: Principal; presentedCreatureIds: readonly string[]; expectedRosterRevision: number }): Promise<FrozenParty | null> {
    const aggregate = await this.repository.read(input.principal.sub);
    if (!aggregate || aggregate.rosterRevision !== input.expectedRosterRevision) return null;
    const ids = aggregate.save.creatures.activePartyCreatureIds;
    if (ids.length === 0 || ids.length !== input.presentedCreatureIds.length || !ids.every((id, index) => id === input.presentedCreatureIds[index])) return null;
    const creatures = ids.map((id) => aggregate.save.creatures.creatures[id]);
    if (creatures.some((creature) => !creature || creature.ownerPlayerId !== input.principal.sub || creature.fainted || creature.hp <= 0)) return null;
    return deepFreeze({ playerId: input.principal.sub, rosterRevision: aggregate.rosterRevision, creatures: clone(creatures) }) as FrozenParty;
  }
  /** Applies the simulation-produced terminal result once. Results never come from a client command. */
  async settleBattle(principal: Principal, result: BattleResolution): Promise<AuthoritySnapshot | null> {
    const aggregate = await this.repository.read(principal.sub);
    if (!aggregate) return null;
    if (aggregate.grantReceipts[result.battleId] !== undefined) return snapshot(aggregate);
    const applied = applyBattleRewardsToSave(aggregate.save, result);
    const next: PlayerAggregate = {
      ...aggregate,
      revision: aggregate.revision + 1,
      rosterRevision: rosterChanged(aggregate.save, applied.state) ? aggregate.rosterRevision + 1 : aggregate.rosterRevision,
      save: applied.state,
      grantReceipts: { ...aggregate.grantReceipts, [result.battleId]: aggregate.revision + 1 }
    };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return this.settleBattle(principal, result);
    return snapshot(next);
  }
  /** Three bounded attempts absorb a concurrent save command without risking partial settlement. */
  async settleGuardedTheft(input: { attackerId: string; ownerId: string; farmId: string; guardCreatureId: string; result: BattleResolution }): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const outcome = await this.settleGuardedTheftOnce(input);
      if (outcome !== 'race') return outcome;
    }
    return false;
  }
  private async settleGuardedTheftOnce(input: { attackerId: string; ownerId: string; farmId: string; guardCreatureId: string; result: BattleResolution }): Promise<boolean | 'race'> {
    const attacker = await this.repository.read(input.attackerId);
    const owner = await this.repository.read(input.ownerId);
    if (!attacker || !owner || attacker.grantReceipts[input.result.battleId] !== undefined) return Boolean(attacker?.grantReceipts[input.result.battleId]);
    const farm = owner.save.farms.farms[input.farmId];
    if (!farm || farm.ownerPlayerId !== owner.playerId || !farm.guardCreatureId || farm.guardCreatureId !== input.guardCreatureId) return false;
    const foreignFarmState = clone(attacker.save);
    foreignFarmState.farms = { ...foreignFarmState.farms, farms: { ...foreignFarmState.farms.farms, [farm.id]: clone(farm) } };
    const resolved = resolveGuardedFarmTheft(foreignFarmState, {
      farmId: farm.id, playerCreatureId: input.result.playerCreatureId, playerCreatureHp: input.result.playerCreatureHp,
      playerCreatureFainted: input.result.playerCreatureFainted, guardCreatureHp: input.result.opponentCreatureHp,
      visitorWon: input.result.outcome === 'defeated'
    });
    if (!resolved.ok) return false;
    const attackerSave = resolved.state;
    const { [farm.id]: _foreignFarm, ...attackerFarms } = attackerSave.farms.farms;
    attackerSave.farms = { ...attackerSave.farms, farms: attackerFarms };
    const ownerFarm = resolved.farm;
    const guard = owner.save.creatures.creatures[input.guardCreatureId];
    const ownerSave = clone(owner.save);
    ownerSave.farms = { ...ownerSave.farms, farms: { ...ownerSave.farms.farms, [ownerFarm.id]: ownerFarm } };
    if (guard) ownerSave.creatures = { ...ownerSave.creatures, creatures: { ...ownerSave.creatures.creatures, [guard.id]: { ...guard, hp: Math.max(0, Math.min(guard.maxHp, input.result.opponentCreatureHp)), fainted: input.result.opponentCreatureFainted || input.result.opponentCreatureHp <= 0 } } };
    const attackerNext: PlayerAggregate = { ...attacker, revision: attacker.revision + 1, rosterRevision: rosterChanged(attacker.save, attackerSave) ? attacker.rosterRevision + 1 : attacker.rosterRevision, save: attackerSave, grantReceipts: { ...attacker.grantReceipts, [input.result.battleId]: attacker.revision + 1 } };
    const ownerNext: PlayerAggregate = { ...owner, revision: owner.revision + 1, rosterRevision: rosterChanged(owner.save, ownerSave) ? owner.rosterRevision + 1 : owner.rosterRevision, save: ownerSave, grantReceipts: { ...owner.grantReceipts, [input.result.battleId]: owner.revision + 1 } };
    return (await this.repository.compareExchangeMany([{ playerId: attacker.playerId, expectedRevision: attacker.revision, next: attackerNext }, { playerId: owner.playerId, expectedRevision: owner.revision, next: ownerNext }])) ? true : 'race';
  }
}

/** The export is an authenticated transfer envelope, not a durable backup mechanism. */
export type AuthenticatedExportEnvelope = AuthenticatedSaveExport;

function emptyAggregate(playerId: string, save: MonsterRpgSaveState): PlayerAggregate { return { playerId, revision: 0, rosterRevision: 0, save, intentReceipts: {}, grantReceipts: {}, progressionEvents: [] }; }
function snapshot(aggregate: PlayerAggregate): AuthoritySnapshot { return { playerId: aggregate.playerId, revision: aggregate.revision, rosterRevision: aggregate.rosterRevision, save: clone(aggregate.save) }; }
function hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}
function rosterChanged(left: MonsterRpgSaveState, right: MonsterRpgSaveState) { return JSON.stringify(left.creatures) !== JSON.stringify(right.creatures); }
function rebindSave(save: MonsterRpgSaveState, playerId: string): MonsterRpgSaveState {
  const next = clone(save); next.profile.playerId = playerId;
  for (const container of [next.inventory, next.creatures, next.village, next.station, next.farms, next.journal, next.progression]) container.ownerPlayerId = playerId;
  Object.values(next.creatures.creatures).forEach((creature) => { creature.ownerPlayerId = playerId; });
  Object.values(next.inventory.items).forEach((stack) => { stack.ownerPlayerId = playerId; });
  Object.values(next.inventory.cards).forEach((stack) => { stack.ownerPlayerId = playerId; });
  Object.values(next.inventory.creatureCards).forEach((card) => { card.ownerPlayerId = playerId; });
  Object.values(next.inventory.eggs).forEach((egg) => { egg.ownerPlayerId = playerId; });
  Object.values(next.farms.farms).forEach((farm) => { farm.ownerPlayerId = playerId; });
  Object.values(next.station.discoveredDestinations).forEach((destination) => { if (destination.ownerPlayerId) destination.ownerPlayerId = playerId; });
  next.farms.theftLog = [];
  next.inventory.rewardInbox.ownerPlayerId = playerId; return next;
}
/** Authenticated recovery preserves ownership exactly; it never repairs a foreign save. */
export function validateAuthenticatedSaveOwnership(save: MonsterRpgSaveState, playerId: string): boolean {
  if (save.profile.playerId !== playerId) return false;
  if (![save.inventory, save.creatures, save.village, save.station, save.farms, save.journal, save.progression].every((value) => value.ownerPlayerId === playerId)) return false;
  return Object.values(save.creatures.creatures).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.inventory.items).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.inventory.cards).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.inventory.creatureCards).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.inventory.eggs).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.farms.farms).every((value) => value.ownerPlayerId === playerId)
    && Object.values(save.station.discoveredDestinations).every((value) => !value.ownerPlayerId || value.ownerPlayerId === playerId)
    && save.inventory.rewardInbox.ownerPlayerId === playerId;
}

/** Checks only present ownership fields so foreign ownership is classified before strict save parsing. */
export function validateAuthenticatedOwnershipProjection(value: unknown, playerId: string): boolean {
  if (!isRecord(value)) return true;
  if (!matchesPresent(value.profile, 'playerId', playerId)) return false;
  const containers = ['inventory', 'creatures', 'village', 'station', 'farms', 'journal', 'progression'] as const;
  if (!containers.every((key) => matchesPresent(value[key], 'ownerPlayerId', playerId))) return false;
  const inventory = isRecord(value.inventory) ? value.inventory : undefined;
  const creatures = isRecord(value.creatures) ? value.creatures : undefined;
  const farms = isRecord(value.farms) ? value.farms : undefined;
  const station = isRecord(value.station) ? value.station : undefined;
  if (!matchesPresent(inventory?.rewardInbox, 'ownerPlayerId', playerId)) return false;
  for (const collection of [inventory?.items, inventory?.cards, inventory?.creatureCards, inventory?.eggs, creatures?.creatures, farms?.farms, station?.discoveredDestinations]) {
    if (!isRecord(collection)) continue;
    for (const entry of Object.values(collection)) if (!matchesPresent(entry, 'ownerPlayerId', playerId)) return false;
  }
  return true;
}

function matchesPresent(value: unknown, key: string, expected: string): boolean {
  return !isRecord(value) || !Object.prototype.hasOwnProperty.call(value, key) || value[key] === expected;
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function reduce(save: MonsterRpgSaveState, intent: AuthorityIntent): MonsterRpgSaveState | null {
  if (intent.type === 'convertCreatureCard' && intent.starter === true) { const result = convertStarterCreatureCards(save); return result.ok ? result.state : null; }
  if (intent.type === 'createFarm' && intent.starter === true) { const result = buildStarterMagicDustFarm(save); return result.ok ? result.state : null; }
  if (intent.type === 'completeElderDialog') return completeVillageElderDialog(save);
  if (intent.type === 'completeOnboarding') return completeVillageElderOnboarding(save);
  if (intent.type === 'activateMaterialCard' && typeof intent.cardId === 'string') { const result = activateMaterialCard(save, intent.cardId); return result.ok ? result.state : null; }
  if (intent.type === 'activateBuffCard' && typeof intent.cardId === 'string') { const result = activateBuffCard(save, intent.cardId); return result.ok ? result.state : null; }
  if (intent.type === 'buildFarmCard' && typeof intent.cardId === 'string') { const result = buildFarmCardViaElder(save, intent.cardId); return result.ok ? result.state : null; }
  if (intent.type === 'moveCreatureToActiveParty' && typeof intent.creatureId === 'string') { const result = moveCreatureToActiveParty(save, intent.creatureId); return result.ok ? result.state : null; }
  if (intent.type === 'moveCreatureToStorage' && typeof intent.creatureId === 'string') { const result = moveCreatureToStorage(save, intent.creatureId); return result.ok ? result.state : null; }
  if (intent.type === 'healAll' && isAtVillageHospital(save)) return healAllCreaturesAtHospital(save);
  if (intent.type === 'revive' && typeof intent.creatureId === 'string') { const result = useReviveItem(save, intent.creatureId); return result.ok ? result.state : null; }
  if (intent.type === 'convertCreatureCard' && typeof intent.cardId === 'string') { const result = convertCreatureCardViaElder(save, intent.cardId); return result.ok ? result.state : null; }
  if (intent.type === 'hatchEgg' && typeof intent.eggId === 'string') { const result = hatchEgg(save, intent.eggId); return result.ok ? result.state : null; }
  if (intent.type === 'claimReward' && typeof intent.sourceId === 'string') {
    const result = claimReward(save.inventory.rewardInbox, toItemInventory(save.inventory.items), save.profile.playerId, intent.sourceId);
    return result.ok ? { ...save, inventory: { ...save.inventory, items: toSaveStacks(result.inventory, save.profile.playerId), rewardInbox: result.inbox }, updatedAt: new Date().toISOString() } : null;
  }
  if (intent.type === 'discardItem' && typeof intent.stackId === 'string' && typeof intent.quantity === 'number' && intent.confirmed === true) {
    const result = discardItem(toItemInventory(save.inventory.items), intent.stackId, intent.quantity, true);
    return result.ok ? { ...save, inventory: { ...save.inventory, items: toSaveStacks(result.inventory, save.profile.playerId) }, updatedAt: new Date().toISOString() } : null;
  }
  if (intent.type === 'stationTravel' && typeof intent.destinationId === 'string') { const result = confirmStationTravel(save, intent.destinationId); return result.ok ? result.state : null; }
  if (intent.type === 'upgradeFarm' && typeof intent.farmId === 'string') { const result = upgradeFarm(save, intent.farmId); return result.ok ? result.state : null; }
  if (intent.type === 'setFarmGuard' && typeof intent.farmId === 'string') {
    const result = typeof intent.creatureId === 'string' ? assignFarmGuard(save, intent.farmId, intent.creatureId) : intent.creatureId === null ? clearFarmGuard(save, intent.farmId) : null;
    return result?.ok ? result.state : null;
  }
  if (intent.type === 'collectFarm') { const result = collectFacingFarm(save); return result.ok ? result.state : null; }
  if (intent.type === 'move' && (intent.direction === 'north' || intent.direction === 'east' || intent.direction === 'south' || intent.direction === 'west')) {
    const result = movePlayer(save, { type: 'move', direction: intent.direction }, getGameMap(save.mapId)); return result.state;
  }
  return null;
}
function toItemInventory(stacks: Record<string, SaveStack>): ItemInventory {
  const next: Record<string, ItemStack> = {};
  Object.values(stacks).forEach((stack) => { const definition = getItemDefinition(stack.id); if (definition) next[stack.id] = { id: stack.id, itemId: definition.id, quantity: stack.quantity }; });
  return { stacks: next };
}
function toSaveStacks(inventory: ItemInventory, ownerPlayerId: string): Record<string, SaveStack> {
  return Object.fromEntries(Object.values(inventory.stacks).map((stack) => [stack.id, { id: stack.id, ownerPlayerId, quantity: stack.quantity }]));
}
