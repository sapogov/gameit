import { createHash } from 'node:crypto';
import { isAuthenticatedTransferFresh, signAuthenticatedTransfer, verifyAuthenticatedTransfer, type AuthenticatedTransferEnvelope } from './authenticatedTransfer';
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
import { clone, growthEventHash, isValidAggregate, validateLedger, type ActiveTrainerBattle, type GrowthAuditEvent, type PlayerAggregate, type PlayerAuthorityRepository } from './playerRepository';
import { CURRENT_BALANCE_VERSION, type Direction } from '../../src/games/monster-rpg/sim';
import { generatedMapRegistry } from '../../src/games/monster-rpg/sim';
import { getTrainerDefinition } from '../../src/games/monster-rpg/sim/trainers';

export interface Principal { sub: string }
export interface FrozenParty { playerId: string; rosterRevision: number; creatures: readonly Readonly<CreatureSaveRecord>[] }
export type AuthenticatedSaveExport = AuthenticatedTransferEnvelope;
export type AuthenticatedImportResult = { ok: true; snapshot: AuthoritySnapshot } | { ok: false; code: 'INVALID_TRANSFER' | 'CROSS_PRINCIPAL' | 'ALREADY_INITIALIZED' | 'REPLAYED_OR_STALE' | 'INVALID_LEGACY_SAVE' };
export interface AuthorityMutationContext { readonly transactionAt: Date; readonly rng: () => number }

export class PlayerAuthority {
  private readonly battlePresenceListeners = new Set<(playerId: string, activeBattle: ActiveTrainerBattle | undefined, snapshot: AuthoritySnapshot) => void>();
  constructor(private readonly repository: PlayerAuthorityRepository, private readonly now: () => Date, private readonly transferKeys: GuestCredentialConfig | undefined, private readonly rng: () => number) {}
  async snapshot(principal: Principal): Promise<AuthoritySnapshot | null> { const aggregate = await this.repository.read(principal.sub); return aggregate && snapshot(aggregate); }
  async findFarm(farmId: string) { return this.repository.findFarm(farmId); }
  async bootstrapProfile(principal: Principal, input: { name: string; avatar: AvatarId }): Promise<AuthoritySnapshot> {
    const profile = createPlayerProfile(input.name, input.avatar);
    profile.playerId = principal.sub;
    const context = this.mutationContext();
    const aggregate = await this.repository.createIfAbsent(emptyAggregate(principal.sub, createInitialSave(profile, simulationContext(context))));
    return snapshot(aggregate);
  }
  async importLegacySave(principal: Principal, payload: string): Promise<{ ok: true; snapshot: AuthoritySnapshot } | { ok: false; code: 'ALREADY_INITIALIZED' | 'INVALID_LEGACY_SAVE' }> {
    if (await this.repository.read(principal.sub)) return { ok: false, code: 'ALREADY_INITIALIZED' };
    const parsed = importSavePayload(payload);
    if (!parsed.ok || Object.values(parsed.ok ? parsed.state.creatures.creatures : {}).some((creature) => creature.statGrowth?.events.length)) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    const save = rebindSave(parsed.state, principal.sub);
    const context = this.mutationContext();
    const aggregate = await this.repository.createIfAbsent({ ...emptyAggregate(principal.sub, save), legacyImportReceipt: { payloadHash: hash(payload), importedAt: context.transactionAt.toISOString() } });
    return aggregate.legacyImportReceipt?.payloadHash === hash(payload) ? { ok: true, snapshot: snapshot(aggregate) } : { ok: false, code: 'ALREADY_INITIALIZED' };
  }
  async execute(principal: Principal, command: SaveCommand): Promise<SaveCommandResult> {
    const aggregate = await this.repository.read(principal.sub);
    if (!aggregate) return { status: 'rejected', code: 'AUTHORITY_REQUIRED' };
    if (aggregate.activeBattle) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(aggregate) };
    const payloadHash = hash(JSON.stringify(command.intent)); const prior = aggregate.intentReceipts[command.intentId];
    if (prior) return prior.payloadHash === payloadHash ? { status: 'duplicate', snapshot: snapshot(aggregate) } : { status: 'rejected', code: 'INTENT_REUSED', snapshot: snapshot(aggregate) };
    if (command.expectedRevision !== aggregate.revision) return { status: 'rejected', code: 'STALE_REVISION', snapshot: snapshot(aggregate) };
    const context = this.mutationContext();
    const nextSave = command.intent.type === 'resetProgress' && command.intent.confirmed === true
      ? rebindSave(createInitialSave(aggregate.save.profile, simulationContext(context)), principal.sub)
      : reduce(aggregate.save, command.intent, context);
    if (!nextSave) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(aggregate) };
    const reset = command.intent.type === 'resetProgress' && command.intent.confirmed === true;
    const next: PlayerAggregate = { ...aggregate, revision: aggregate.revision + 1, rosterRevision: reset ? aggregate.rosterRevision + 1 : rosterChanged(aggregate.save, nextSave) ? aggregate.rosterRevision + 1 : aggregate.rosterRevision, activeGrowthStartIndex: reset ? aggregate.progressionEvents.length : aggregate.activeGrowthStartIndex, save: nextSave, intentReceipts: { ...aggregate.intentReceipts, [command.intentId]: { payloadHash, revision: aggregate.revision + 1 } } };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return { status: 'rejected', code: 'STALE_REVISION', snapshot: snapshot((await this.repository.read(principal.sub))!) };
    return { status: 'applied', snapshot: snapshot(next) };
  }
  /** Canonical location mutation seam; receipt and move/no-op commit together. */
  async applyMovement(input: { principal: Principal; direction: Direction; roomId: string; mapId: string; sessionId: string; sequence: number }): Promise<{ status: 'applied'; snapshot: AuthoritySnapshot; transition?: { toMapId: string; spawn: unknown } } | { status: 'rejected' }> {
    if (!input.principal.sub || !input.roomId || !input.mapId || !input.sessionId || !Number.isSafeInteger(input.sequence) || input.sequence < 1) return { status: 'rejected' };
    let mutationContext: AuthorityMutationContext | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const aggregate = await this.repository.read(input.principal.sub);
      if (!aggregate || aggregate.save.mapId !== input.mapId || aggregate.save.position.mapId !== input.mapId) return { status: 'rejected' };
      if (aggregate.activeBattle) return { status: 'rejected' };
      const receipt = aggregate.locationMovementReceipts[input.sessionId];
      if (receipt && (receipt.roomId !== input.roomId || receipt.mapId !== input.mapId || input.sequence !== receipt.lastSequence + 1)) return { status: 'rejected' };
      if (!receipt && input.sequence !== 1) return { status: 'rejected' };
      mutationContext ??= this.mutationContext();
      const transition = movementTransition(aggregate, input.direction, mutationContext);
      const blockedByTrainer = transition.moved && isBlockedByUnclearedTrainer(transition.state, input.mapId);
      const nextSave = blockedByTrainer
        ? { ...aggregate.save, position: { ...aggregate.save.position, facing: input.direction }, updatedAt: mutationContext.transactionAt.toISOString() }
        : transition.state;
      const next: PlayerAggregate = {
        ...aggregate,
        revision: aggregate.revision + 1,
        save: nextSave,
        locationMovementReceipts: { ...aggregate.locationMovementReceipts, [input.sessionId]: { roomId: input.roomId, mapId: input.mapId, lastSequence: input.sequence } }
      };
      if (await this.repository.compareExchange(input.principal.sub, aggregate.revision, next)) return { status: 'applied', snapshot: snapshot(next), ...(!blockedByTrainer && transition.transition ? { transition: transition.transition } : {}) };
    }
    return { status: 'rejected' };
  }
  /** Location-only settlement: canonical account state, never room or client coordinates, authorizes theft. */
  async settleUnguardedFarmTheft(input: { principal: Principal; intentId: string; expectedRevision: number; roomMapId: string; farmId: string }): Promise<SaveCommandResult> {
    const attacker = await this.repository.read(input.principal.sub);
    if (!attacker) return { status: 'rejected', code: 'AUTHORITY_REQUIRED' };
    const payloadHash = hash(JSON.stringify({ type: 'locationFarmTheft', farmId: input.farmId, roomMapId: input.roomMapId }));
    const prior = attacker.intentReceipts[input.intentId];
    if (prior) return prior.payloadHash === payloadHash ? { status: 'duplicate', snapshot: snapshot(attacker) } : { status: 'rejected', code: 'INTENT_REUSED', snapshot: snapshot(attacker) };
    if (input.expectedRevision !== attacker.revision) return { status: 'rejected', code: 'STALE_REVISION', snapshot: snapshot(attacker) };
    const found = await this.repository.findFarm(input.farmId);
    if (!found || found.playerId === input.principal.sub) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const owner = await this.repository.read(found.playerId);
    if (!owner) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const farm = owner.save.farms.farms[input.farmId];
    if (!farm || farm.ownerPlayerId !== owner.playerId || farm.guardCreatureId || attacker.save.mapId !== input.roomMapId || attacker.save.position.mapId !== input.roomMapId || farm.mapId !== input.roomMapId || farm.position.mapId !== input.roomMapId) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const simulated = clone(attacker.save);
    simulated.farms = { ...simulated.farms, farms: { ...simulated.farms.farms, [farm.id]: clone(farm) } };
    const context = this.mutationContext();
    const theft = attemptFacingFarmTheft(simulated, context.transactionAt, simulationContext(context));
    if (!theft.ok) return { status: 'rejected', code: 'REJECTED', snapshot: snapshot(attacker) };
    const { [farm.id]: _foreignFarm, ...attackerFarms } = theft.state.farms.farms;
    const attackerSave = { ...theft.state, position: attacker.save.position, farms: { ...theft.state.farms, farms: attackerFarms } };
    const attackerNext: PlayerAggregate = {
      ...attacker, revision: attacker.revision + 1, rosterRevision: rosterChanged(attacker.save, attackerSave) ? attacker.rosterRevision + 1 : attacker.rosterRevision,
      save: attackerSave, intentReceipts: { ...attacker.intentReceipts, [input.intentId]: { payloadHash, revision: attacker.revision + 1 } }
    };
    const ownerSave = { ...owner.save, farms: { ...owner.save.farms, farms: { ...owner.save.farms.farms, [farm.id]: theft.farm } } };
    const ownerNext: PlayerAggregate = { ...owner, revision: owner.revision + 1, save: ownerSave };
    if (!await this.repository.compareExchangeMany([{ playerId: attacker.playerId, expectedRevision: attacker.revision, next: attackerNext }, { playerId: owner.playerId, expectedRevision: owner.revision, next: ownerNext }])) {
      const current = await this.repository.read(input.principal.sub);
      return { status: 'rejected', code: 'STALE_REVISION', ...(current ? { snapshot: snapshot(current) } : {}) };
    }
    return { status: 'applied', snapshot: snapshot(attackerNext) };
  }
  async exportAuthenticatedSave(principal: Principal): Promise<AuthenticatedSaveExport | null> {
    const aggregate = await this.repository.read(principal.sub); if (!aggregate) return null;
    if (!this.transferKeys) throw new Error('Authenticated transfer keys are required');
    return signAuthenticatedTransfer({ playerId: principal.sub, revision: aggregate.revision, rosterRevision: aggregate.rosterRevision, issuedAt: this.now().getTime(), payload: JSON.stringify({ type: 'authority-save-v2', save: aggregate.save, progressionEvents: aggregate.progressionEvents, activeGrowthStartIndex: aggregate.activeGrowthStartIndex }) }, this.transferKeys);
  }
  async importAuthenticatedSave(principal: Principal, rawEnvelope: unknown): Promise<AuthenticatedImportResult> {
    if (!this.transferKeys) throw new Error('Authenticated transfer keys are required');
    const envelope = verifyAuthenticatedTransfer(rawEnvelope, this.transferKeys);
    if (!envelope) return { ok: false, code: 'INVALID_TRANSFER' };
    const now = this.now().getTime();
    if (!isAuthenticatedTransferFresh(envelope, now)) return { ok: false, code: 'INVALID_TRANSFER' };
    if (envelope.playerId !== principal.sub) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const existing = await this.repository.read(principal.sub);
    if (existing) return { ok: false, code: existing.revision >= envelope.revision ? 'REPLAYED_OR_STALE' : 'ALREADY_INITIALIZED' };
    let projected: unknown;
    try { projected = JSON.parse(envelope.payload); } catch { return { ok: false, code: 'INVALID_LEGACY_SAVE' }; }
    const rawActiveGrowthStartIndex = isRecord(projected) ? projected.activeGrowthStartIndex : undefined;
    if (!isRecord(projected) || projected.type !== 'authority-save-v2' || !isRecord(projected.save) || !Array.isArray(projected.progressionEvents) || (rawActiveGrowthStartIndex !== undefined && (typeof rawActiveGrowthStartIndex !== 'number' || !Number.isSafeInteger(rawActiveGrowthStartIndex) || rawActiveGrowthStartIndex < 0 || rawActiveGrowthStartIndex > projected.progressionEvents.length))) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    if (!validateAuthenticatedOwnershipProjection(projected.save, envelope.playerId)) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const parsed = importSavePayload(JSON.stringify(projected.save));
    if (!parsed.ok) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    if (!validateAuthenticatedSaveOwnership(parsed.state, envelope.playerId)) return { ok: false, code: 'CROSS_PRINCIPAL' };
    const events = projected.progressionEvents as GrowthAuditEvent[];
    if (!validateLedger(events, principal.sub) || hasUnsealedGrowth(parsed.state, events)) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    const activeGrowthStartIndex = rawActiveGrowthStartIndex ?? 0;
    const candidate: PlayerAggregate = { ...emptyAggregate(principal.sub, clone(parsed.state)), progressionEvents: events, activeGrowthStartIndex, revision: envelope.revision, rosterRevision: envelope.rosterRevision };
    if (!isValidAggregate(candidate)) return { ok: false, code: 'INVALID_LEGACY_SAVE' };
    const created = await this.repository.createIfAbsentWithResult(candidate);
    return created.created ? { ok: true, snapshot: snapshot(created.aggregate) } : { ok: false, code: 'ALREADY_INITIALIZED' };
  }
  /** Alias kept explicit so callers do not confuse this with unsigned legacy import. */
  async importAuthenticatedExport(principal: Principal, envelope: unknown) { return this.importAuthenticatedSave(principal, envelope); }
  async reserveTrainerBattle(input: { principal: Principal; battleId: string; objectId: string; mapId: string; locationRoomId: string; presentedCreatureIds: readonly string[]; expectedRosterRevision: number }): Promise<{ snapshot: AuthoritySnapshot; frozenParty: FrozenParty; profile: MonsterRpgSaveState['profile']; trainerId: string } | null> {
    const aggregate = await this.repository.read(input.principal.sub);
    const map = generatedMapRegistry.get(input.mapId);
    const object = map?.objects.find((candidate) => candidate.id === input.objectId);
    if (!aggregate || aggregate.activeBattle || !map || !object || object.kind !== 'trainer' || !getTrainerDefinition(object.trainerDefinitionId)
      || aggregate.save.mapId !== input.mapId || aggregate.save.position.mapId !== input.mapId || !isFacingGeneratedObject(aggregate.save.position, object.geometry, map.tileSize)
      || aggregate.rosterRevision !== input.expectedRosterRevision || !input.battleId.trim() || !input.locationRoomId.trim()) return null;
    const ids = aggregate.save.creatures.activePartyCreatureIds;
    if (!ids.length || ids.length !== input.presentedCreatureIds.length || !ids.every((id, index) => id === input.presentedCreatureIds[index])) return null;
    const creatures = ids.map((id) => aggregate.save.creatures.creatures[id]);
    if (creatures.some((creature) => !creature || creature.ownerPlayerId !== input.principal.sub || creature.fainted || creature.hp <= 0)) return null;
    const activeBattle: ActiveTrainerBattle = { battleId: input.battleId, kind: 'trainer', trainerId: object.trainerDefinitionId, mapId: input.mapId, locationRoomId: input.locationRoomId, phase: 'reserved', reservedAt: this.now().toISOString() };
    const next = { ...aggregate, revision: aggregate.revision + 1, activeBattle };
    if (!await this.repository.compareExchange(input.principal.sub, aggregate.revision, next)) return null;
    const frozenParty = deepFreeze({ playerId: input.principal.sub, rosterRevision: aggregate.rosterRevision, creatures: clone(creatures) }) as FrozenParty;
    const nextSnapshot = snapshot(next); this.emitBattlePresence(input.principal.sub, activeBattle, nextSnapshot);
    return { snapshot: nextSnapshot, frozenParty, profile: clone(aggregate.save.profile), trainerId: activeBattle.trainerId };
  }
  async activateTrainerBattle(principal: Principal, battleId: string): Promise<AuthoritySnapshot | null> {
    const aggregate = await this.repository.read(principal.sub); const lock = aggregate?.activeBattle;
    if (!aggregate || !lock || lock.phase !== 'reserved' || lock.battleId !== battleId) return null;
    const activeBattle: ActiveTrainerBattle = { ...lock, phase: 'active' }; const next = { ...aggregate, revision: aggregate.revision + 1, activeBattle };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return null;
    const nextSnapshot = snapshot(next); this.emitBattlePresence(principal.sub, activeBattle, nextSnapshot); return nextSnapshot;
  }
  async releaseReservedTrainerBattle(principal: Principal, battleId: string): Promise<boolean> {
    const aggregate = await this.repository.read(principal.sub); const lock = aggregate?.activeBattle;
    if (!aggregate || !lock || lock.phase !== 'reserved' || lock.battleId !== battleId) return false;
    const { activeBattle: _lock, ...withoutLock } = aggregate; const next: PlayerAggregate = { ...withoutLock, revision: aggregate.revision + 1 };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return false;
    this.emitBattlePresence(principal.sub, undefined, snapshot(next)); return true;
  }
  /** Compensates a failed registry activation without recording battle settlement. */
  async cancelActiveTrainerBattle(principal: Principal, battleId: string): Promise<boolean> {
    const aggregate = await this.repository.read(principal.sub); const lock = aggregate?.activeBattle;
    if (!aggregate || !lock || lock.phase !== 'active' || lock.battleId !== battleId) return false;
    const { activeBattle: _lock, ...withoutLock } = aggregate; const next: PlayerAggregate = { ...withoutLock, revision: aggregate.revision + 1 };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return false;
    this.emitBattlePresence(principal.sub, undefined, snapshot(next)); return true;
  }
  async locationPresence(principal: Principal): Promise<{ snapshot: AuthoritySnapshot; activeBattle: ActiveTrainerBattle | undefined } | null> {
    const aggregate = await this.repository.read(principal.sub); return aggregate ? { snapshot: snapshot(aggregate), activeBattle: clone(aggregate.activeBattle) } : null;
  }
  onBattlePresenceChanged(listener: (playerId: string, activeBattle: ActiveTrainerBattle | undefined, snapshot: AuthoritySnapshot) => void): () => void {
    this.battlePresenceListeners.add(listener); return () => { this.battlePresenceListeners.delete(listener); };
  }
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
    return this.settleBattleOnce(principal, result);
  }
  /** Trainer clear, party outcomes, rewards, growth and battle receipt share one CAS. */
  async settleTrainerBattle(input: { principal: Principal; trainerId: string; result: BattleResolution }): Promise<AuthoritySnapshot | null> {
    const trainer = getTrainerDefinition(input.trainerId);
    if (!trainer) return null;
    let context: AuthorityMutationContext | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const aggregate = await this.repository.read(input.principal.sub);
      if (!aggregate) return null;
      if (aggregate.grantReceipts[input.result.battleId] !== undefined) return snapshot(aggregate);
      if (!aggregate.activeBattle || aggregate.activeBattle.phase !== 'active' || aggregate.activeBattle.battleId !== input.result.battleId || aggregate.activeBattle.trainerId !== input.trainerId) return null;
      context ??= this.mutationContext();
      const clearFlag = trainerClearFlag(trainer.trainerId);
      const firstClear = input.result.outcome === 'defeated' && !aggregate.save.progression.flags[clearFlag];
      const rewards = firstClear ? {
        seed: 0, magicDust: trainer.reward.magicDust, clinks: 0, playerExperience: trainer.reward.playerXp,
        battlingCreatureExperience: trainer.reward.creatureXp, activePartyExperience: trainer.reward.creatureXp, materials: []
      } : undefined;
      const settled = applyBattleRewardsToSave(aggregate.save, { ...input.result, rewardGranted: firstClear, rewards }, simulationContext(context));
      const flaggedSave = firstClear ? { ...settled.state, progression: { ...settled.state.progression, flags: { ...settled.state.progression.flags, [clearFlag]: true } } } : settled.state;
      const sealed = sealGrowthEvents(aggregate, flaggedSave, input.result.battleId, aggregate.revision + 1, context.transactionAt);
      const { activeBattle: _lock, ...withoutLock } = aggregate;
      const next: PlayerAggregate = { ...withoutLock, revision: aggregate.revision + 1, rosterRevision: rosterChanged(aggregate.save, sealed.save) ? aggregate.rosterRevision + 1 : aggregate.rosterRevision, save: sealed.save, grantReceipts: { ...aggregate.grantReceipts, [input.result.battleId]: aggregate.revision + 1 }, progressionEvents: sealed.events };
      if (await this.repository.compareExchange(input.principal.sub, aggregate.revision, next)) {
        const nextSnapshot = snapshot(next); this.emitBattlePresence(input.principal.sub, undefined, nextSnapshot); return nextSnapshot;
      }
      const current = await this.repository.read(input.principal.sub);
      if (!current || current.revision === aggregate.revision) return null;
    }
    return null;
  }
  private async settleBattleOnce(principal: Principal, result: BattleResolution, priorContext?: AuthorityMutationContext): Promise<AuthoritySnapshot | null> {
    const aggregate = await this.repository.read(principal.sub);
    if (!aggregate) return null;
    if (aggregate.grantReceipts[result.battleId] !== undefined) return snapshot(aggregate);
    const context = priorContext ?? this.mutationContext();
    const applied = applyBattleRewardsToSave(aggregate.save, result, simulationContext(context));
    const sealed = sealGrowthEvents(aggregate, applied.state, result.battleId, aggregate.revision + 1, context.transactionAt);
    const next: PlayerAggregate = {
      ...aggregate,
      revision: aggregate.revision + 1,
      rosterRevision: rosterChanged(aggregate.save, sealed.save) ? aggregate.rosterRevision + 1 : aggregate.rosterRevision,
      save: sealed.save,
      grantReceipts: { ...aggregate.grantReceipts, [result.battleId]: aggregate.revision + 1 }
      , progressionEvents: sealed.events
    };
    if (!await this.repository.compareExchange(principal.sub, aggregate.revision, next)) return this.settleBattleOnce(principal, result, context);
    return snapshot(next);
  }
  /** Three bounded attempts absorb a concurrent save command without risking partial settlement. */
  async settleGuardedTheft(input: { attackerId: string; ownerId: string; farmId: string; guardCreatureId: string; result: BattleResolution }): Promise<boolean> {
    let context: AuthorityMutationContext | undefined;
    const mutationContext = () => context ??= this.mutationContext();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const outcome = await this.settleGuardedTheftOnce(input, mutationContext);
      if (outcome !== 'race') return outcome;
    }
    return false;
  }
  private async settleGuardedTheftOnce(input: { attackerId: string; ownerId: string; farmId: string; guardCreatureId: string; result: BattleResolution }, getMutationContext: () => AuthorityMutationContext): Promise<boolean | 'race'> {
    const attacker = await this.repository.read(input.attackerId);
    const owner = await this.repository.read(input.ownerId);
    if (!attacker || !owner) return false;
    const attackerReceipt = attacker.grantReceipts[input.result.battleId] !== undefined;
    const ownerReceipt = owner.grantReceipts[input.result.battleId] !== undefined;
    if (attackerReceipt || ownerReceipt) return attackerReceipt && ownerReceipt;
    const farm = owner.save.farms.farms[input.farmId];
    if (!farm || farm.ownerPlayerId !== owner.playerId || !farm.guardCreatureId || farm.guardCreatureId !== input.guardCreatureId) return false;
    const context = getMutationContext();
    const foreignFarmState = clone(attacker.save);
    foreignFarmState.farms = { ...foreignFarmState.farms, farms: { ...foreignFarmState.farms.farms, [farm.id]: clone(farm) } };
    const resolved = resolveGuardedFarmTheft(foreignFarmState, {
      farmId: farm.id, playerCreatureId: input.result.playerCreatureId, playerCreatureHp: input.result.playerCreatureHp,
      playerCreatureFainted: input.result.playerCreatureFainted, guardCreatureHp: input.result.opponentCreatureHp,
      visitorWon: input.result.outcome === 'defeated',
      now: context.transactionAt
    });
    if (!resolved.ok) return false;
    const resolvedAttackerSave = resolved.state;
    const { [farm.id]: _foreignFarm, ...attackerFarms } = resolvedAttackerSave.farms.farms;
    const theftSettledSave = { ...resolvedAttackerSave, farms: { ...resolvedAttackerSave.farms, farms: attackerFarms } };
    const rewarded = applyBattleRewardsToSave(theftSettledSave, input.result, simulationContext(context));
    const sealed = sealGrowthEvents(attacker, rewarded.state, input.result.battleId, attacker.revision + 1, context.transactionAt);
    const ownerFarm = resolved.farm;
    const guard = owner.save.creatures.creatures[input.guardCreatureId];
    const ownerSave = clone(owner.save);
    ownerSave.farms = { ...ownerSave.farms, farms: { ...ownerSave.farms.farms, [ownerFarm.id]: ownerFarm } };
    if (guard) ownerSave.creatures = { ...ownerSave.creatures, creatures: { ...ownerSave.creatures.creatures, [guard.id]: { ...guard, hp: Math.max(0, Math.min(guard.maxHp, input.result.opponentCreatureHp)), fainted: input.result.opponentCreatureFainted || input.result.opponentCreatureHp <= 0 } } };
    const attackerNext: PlayerAggregate = { ...attacker, revision: attacker.revision + 1, rosterRevision: rosterChanged(attacker.save, sealed.save) ? attacker.rosterRevision + 1 : attacker.rosterRevision, save: sealed.save, grantReceipts: { ...attacker.grantReceipts, [input.result.battleId]: attacker.revision + 1 }, progressionEvents: sealed.events };
    const ownerNext: PlayerAggregate = { ...owner, revision: owner.revision + 1, rosterRevision: rosterChanged(owner.save, ownerSave) ? owner.rosterRevision + 1 : owner.rosterRevision, save: ownerSave, grantReceipts: { ...owner.grantReceipts, [input.result.battleId]: owner.revision + 1 } };
    return (await this.repository.compareExchangeMany([{ playerId: attacker.playerId, expectedRevision: attacker.revision, next: attackerNext }, { playerId: owner.playerId, expectedRevision: owner.revision, next: ownerNext }])) ? true : 'race';
  }
  private mutationContext(): AuthorityMutationContext { return { transactionAt: this.now(), rng: this.rng }; }
  private emitBattlePresence(playerId: string, activeBattle: ActiveTrainerBattle | undefined, current: AuthoritySnapshot): void { this.battlePresenceListeners.forEach((listener) => listener(playerId, clone(activeBattle), current)); }
}

/** The export is an authenticated transfer envelope, not a durable backup mechanism. */
export type AuthenticatedExportEnvelope = AuthenticatedSaveExport;

function emptyAggregate(playerId: string, save: MonsterRpgSaveState): PlayerAggregate { return { playerId, revision: 0, rosterRevision: 0, save, intentReceipts: {}, grantReceipts: {}, locationMovementReceipts: {}, progressionEvents: [], activeGrowthStartIndex: 0 }; }
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
function hasUnsealedGrowth(save: MonsterRpgSaveState, events: readonly GrowthAuditEvent[]): boolean {
  const hashes = new Set(events.map((event) => event.eventHash));
  return Object.values(save.creatures.creatures).some((creature) => creature.statGrowth?.events.some((event) => !isRecord(event) || typeof event.eventHash !== 'string' || !hashes.has(event.eventHash)));
}
function sealGrowthEvents(aggregate: PlayerAggregate, save: MonsterRpgSaveState, battleId: string, revision: number, now: Date): { save: MonsterRpgSaveState; events: GrowthAuditEvent[] } {
  const events = [...aggregate.progressionEvents]; let previousHash = events.length ? events[events.length - 1].eventHash : '0'.repeat(64);
  const creatures = { ...save.creatures.creatures };
  for (const creatureId of save.creatures.activePartyCreatureIds) {
    const before = aggregate.save.creatures.creatures[creatureId]; const after = creatures[creatureId];
    if (!before || !after || !after.statGrowth) continue;
    const drafts = after.pendingGrowthEvents ?? [];
    const growth = after.statGrowth.events.slice();
    for (const draft of drafts) {
      const grantId = `battle:${battleId}:creature:${creatureId}:level:${draft.level}`;
      const base = { v: 1 as const, playerId: aggregate.playerId, creatureId, balanceVersion: CURRENT_BALANCE_VERSION, levelFrom: draft.kind === 'level-up' ? draft.level - 1 : draft.level, levelTo: draft.level, deltas: draft.deltas, aggregateRevision: revision, createdAt: now.toISOString(), previousHash };
      const event: GrowthAuditEvent = draft.kind === 'level-up'
        ? { ...base, kind: 'level-up', grantId, model: draft.model as 'deterministic-default' | 'rarity-weighted-random', eventHash: '' }
        : { ...base, kind: 'rebalance', grantId: `rebalance:${creatureId}:${CURRENT_BALANCE_VERSION}`, model: 'rebalance', targetBalanceVersion: CURRENT_BALANCE_VERSION, eventHash: '' };
      event.eventHash = growthHash(event); previousHash = event.eventHash; events.push(event);
      growth.push(event);
    }
    const { pendingGrowthEvents: _drafts, ...sealedCreature } = after;
    creatures[creatureId] = { ...sealedCreature, statGrowth: { ...after.statGrowth, events: growth } };
  }
  return { save: { ...save, creatures: { ...save.creatures, creatures } }, events };
}
function growthHash(event: import('../../src/games/monster-rpg/sim').GrowthAuditEventHashInput): string {
  const fields = [event.v, event.kind, event.playerId, event.creatureId, event.grantId, event.model, event.balanceVersion, event.levelFrom, event.levelTo, event.deltas.hp, event.deltas.attack, event.deltas.defense, event.deltas.speed, event.deltas.stamina, event.aggregateRevision, event.createdAt, event.previousHash, 'targetBalanceVersion' in event ? event.targetBalanceVersion : ''];
  return growthEventHash(event);
}
function reduce(save: MonsterRpgSaveState, intent: AuthorityIntent, context: AuthorityMutationContext): MonsterRpgSaveState | null {
  const options = simulationContext(context);
  if (intent.type === 'convertCreatureCard' && intent.starter === true) { const result = convertStarterCreatureCards(save, options); return result.ok ? result.state : null; }
  if (intent.type === 'createFarm' && intent.starter === true) { const result = buildStarterMagicDustFarm(save, options); return result.ok ? result.state : null; }
  if (intent.type === 'completeElderDialog') return completeVillageElderDialog(save, options);
  if (intent.type === 'completeOnboarding') return completeVillageElderOnboarding(save, options);
  if (intent.type === 'activateMaterialCard' && typeof intent.cardId === 'string') { const result = activateMaterialCard(save, intent.cardId, options); return result.ok ? result.state : null; }
  if (intent.type === 'activateBuffCard' && typeof intent.cardId === 'string') { const result = activateBuffCard(save, intent.cardId, options); return result.ok ? result.state : null; }
  if (intent.type === 'buildFarmCard' && typeof intent.cardId === 'string') { const result = buildFarmCardViaElder(save, intent.cardId, options); return result.ok ? result.state : null; }
  if (intent.type === 'moveCreatureToActiveParty' && typeof intent.creatureId === 'string') { const result = moveCreatureToActiveParty(save, intent.creatureId, options); return result.ok ? result.state : null; }
  if (intent.type === 'moveCreatureToStorage' && typeof intent.creatureId === 'string') { const result = moveCreatureToStorage(save, intent.creatureId, options); return result.ok ? result.state : null; }
  if (intent.type === 'healAll' && isAtVillageHospital(save)) return healAllCreaturesAtHospital(save, options);
  if (intent.type === 'revive' && typeof intent.creatureId === 'string') { const result = useReviveItem(save, intent.creatureId, options); return result.ok ? result.state : null; }
  if (intent.type === 'convertCreatureCard' && typeof intent.cardId === 'string') { const result = convertCreatureCardViaElder(save, intent.cardId, options); return result.ok ? result.state : null; }
  if (intent.type === 'hatchEgg' && typeof intent.eggId === 'string') { const result = hatchEgg(save, intent.eggId, options); return result.ok ? result.state : null; }
  if (intent.type === 'claimReward' && typeof intent.sourceId === 'string') {
    const result = claimReward(save.inventory.rewardInbox, toItemInventory(save.inventory.items), save.profile.playerId, intent.sourceId);
    return result.ok ? { ...save, inventory: { ...save.inventory, items: toSaveStacks(result.inventory, save.profile.playerId), rewardInbox: result.inbox }, updatedAt: context.transactionAt.toISOString() } : null;
  }
  if (intent.type === 'discardItem' && typeof intent.stackId === 'string' && typeof intent.quantity === 'number' && intent.confirmed === true) {
    const result = discardItem(toItemInventory(save.inventory.items), intent.stackId, intent.quantity, true);
    return result.ok ? { ...save, inventory: { ...save.inventory, items: toSaveStacks(result.inventory, save.profile.playerId) }, updatedAt: context.transactionAt.toISOString() } : null;
  }
  if (intent.type === 'stationTravel' && typeof intent.destinationId === 'string') { const result = confirmStationTravel(save, intent.destinationId, options); return result.ok ? result.state : null; }
  if (intent.type === 'upgradeFarm' && typeof intent.farmId === 'string') { const result = upgradeFarm(save, intent.farmId, context.transactionAt); return result.ok ? result.state : null; }
  if (intent.type === 'setFarmGuard' && typeof intent.farmId === 'string') {
    const result = typeof intent.creatureId === 'string' ? assignFarmGuard(save, intent.farmId, intent.creatureId, context.transactionAt) : intent.creatureId === null ? clearFarmGuard(save, intent.farmId, context.transactionAt) : null;
    return result?.ok ? result.state : null;
  }
  if (intent.type === 'collectFarm') { const result = collectFacingFarm(save, context.transactionAt); return result.ok ? result.state : null; }
  return null;
}
function movementTransition(aggregate: PlayerAggregate, direction: Direction, context: AuthorityMutationContext) {
  return movePlayer(aggregate.save, { type: 'move', direction }, getGameMap(aggregate.save.mapId), simulationContext(context));
}
function trainerClearFlag(trainerId: string) { return `trainer-clear:${trainerId}`; }
function isFacingGeneratedObject(position: MonsterRpgSaveState['position'], geometry: { x: number; y: number }, tileSize: number): boolean {
  const delta = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] } as const; const [x, y] = delta[position.facing];
  return position.x + x === Math.floor(geometry.x / tileSize) && position.y + y === Math.floor(geometry.y / tileSize);
}
function isBlockedByUnclearedTrainer(save: MonsterRpgSaveState, mapId: string): boolean {
  const map = generatedMapRegistry.get(mapId);
  if (!map) return false;
  return map.objects.some((object) => object.kind === 'trainer' && object.mode === 'progression-blocking' && !save.progression.flags[trainerClearFlag(object.trainerId)] && Math.floor(object.geometry.x / map.tileSize) === save.position.x && Math.floor(object.geometry.y / map.tileSize) === save.position.y);
}
function simulationContext(context: AuthorityMutationContext) { return { now: context.transactionAt, rng: context.rng }; }
function toItemInventory(stacks: Record<string, SaveStack>): ItemInventory {
  const next: Record<string, ItemStack> = {};
  Object.values(stacks).forEach((stack) => { const definition = getItemDefinition(stack.id); if (definition) next[stack.id] = { id: stack.id, itemId: definition.id, quantity: stack.quantity }; });
  return { stacks: next };
}
function toSaveStacks(inventory: ItemInventory, ownerPlayerId: string): Record<string, SaveStack> {
  return Object.fromEntries(Object.values(inventory.stacks).map((stack) => [stack.id, { id: stack.id, ownerPlayerId, quantity: stack.quantity }]));
}
