import { Client, Room, ServerError } from 'colyseus';
import {
  abandonDisconnectedBattle,
  BATTLE_DISCONNECT_GRACE_MS,
  CURRENT_BALANCE_VERSION,
  choosePlayerBattleAttack,
  createBattleRoomState,
  createGuardBattleRoomState,
  createTrainerBattleRoomState,
  getBattleAttackFatigueCost,
  markBattleDisconnected,
  resumeDisconnectedBattle,
  runFromBattle,
  switchPlayerBattleCreature,
  toBattleResult,
  type BattleAttackIntentMessage,
  type BattleRoomState,
  type CreatureAttackRecord,
  type JoinBattleOptions
} from '../../src/games/monster-rpg/sim';
import { activateTrainerBattleClaim, getBattleClaim, markBattleClaimResolved } from '../battleRegistry';
import { verifyGuestCredential } from '../auth/guestCredentials';
import { authorityEnabled, guestCredentialConfig, guestCredentialTtlSeconds, playerAuthority } from '../authority/runtime';
import {
  BattleAttackSchema,
  BattleCreatureSchema,
  BattleLogEntrySchema,
  BattleParticipantSchema,
  BattleStateSchema,
  BattleStatsSchema
} from '../schema/BattleState';

export class BattleRoom extends Room {
  maxClients = 1;
  private battleState!: BattleRoomState;
  private battleToken = '';
  private playerId = '';
  private trainerActivated = false;
  private publishedResult = false;

  onCreate(options?: Partial<JoinBattleOptions>) {
    if (!authorityEnabled) throw new ServerError(503, JSON.stringify({ code: 'AUTHORITY_MAINTENANCE' }));
    assertBalanceVersion(options?.balanceVersion);
    const battleId = typeof options?.battleId === 'string' ? options.battleId : '';
    const battleToken = typeof options?.battleToken === 'string' ? options.battleToken : '';
    const claim = getBattleClaim(battleId, battleToken);

    if (!claim) {
      throw new ServerError(400, 'Invalid battle token');
    }

    this.battleToken = battleToken;
    this.playerId = claim.playerProfile.playerId;
    this.battleState = claim.battleKind === 'trainer' && claim.trainerId && claim.playerParty
      ? createTrainerBattleRoomState({ battleId: claim.battleId, trainerId: claim.trainerId, playerProfile: claim.playerProfile, playerParty: claim.playerParty })
      : claim.battleKind === 'guard-theft' && claim.guardCreature && claim.farmId
        ? createGuardBattleRoomState({
            battleId: claim.battleId,
            farmId: claim.farmId,
            playerProfile: claim.playerProfile,
            playerCreature: claim.playerCreature,
            guardCreature: claim.guardCreature
          })
        : claim.battleKind === 'wild' ? createBattleRoomState({
            battleId: claim.battleId,
            encounterId: claim.encounterId,
            playerProfile: claim.playerProfile,
            playerCreature: claim.playerCreature,
            wildSpeciesId: claim.wildSpeciesId,
            zoneId: claim.zoneId
          }) : (() => { throw new ServerError(400, 'Unsupported battle claim'); })();
    const stateSchema = toBattleStateSchema(this.battleState);
    stateSchema.balanceVersion = CURRENT_BALANCE_VERSION;
    this.setState(stateSchema);

    this.onMessage('chooseAttack', (client, payload: BattleAttackIntentMessage) => {
      this.handleChooseAttack(client, payload);
    });
    this.onMessage('run', (client) => {
      this.handleRun(client);
    });
    this.onMessage('switchCreature', (client, payload: { creatureId?: unknown; expectedTurn?: unknown }) => {
      if (!this.isAuthorized(client)) return;
      const result = switchPlayerBattleCreature(this.battleState, typeof payload?.creatureId === 'string' ? payload.creatureId : '', typeof payload?.expectedTurn === 'number' ? payload.expectedTurn : -1);
      if (!result.ok) client.send('battleActionRejected', { reason: result.reason });
      else this.syncBattleState(result.state);
    });
  }

  async onJoin(client: Client, options?: JoinBattleOptions) {
    assertBalanceVersion(options?.balanceVersion);
    if (
      options?.battleToken !== this.battleToken ||
      authenticateBattleJoin(options?.credential)?.sub !== this.playerId ||
      options?.battleId !== this.battleState.battleId
    ) {
      throw new ServerError(403, 'Spectating disabled');
    }

    if (this.battleState.battleKind === 'trainer' && !this.trainerActivated) {
      if (!await activateTrainerBattleClaimWithCompensation(this.playerId, this.battleState.battleId)) {
        throw new ServerError(403, 'Trainer battle is unavailable');
      }
      this.trainerActivated = true;
    }

    if (this.battleState.status === 'disconnected-grace') {
      this.syncBattleState(resumeDisconnectedBattle(this.battleState));
    }

    console.log(`[battle:${this.battleState.battleId}] join ${client.sessionId}`);
  }

  async onLeave(client: Client) {
    console.log(`[battle:${this.battleState.battleId}] leave ${client.sessionId}`);
    if (this.battleState.status !== 'active') return;

    this.syncBattleState(markBattleDisconnected(this.battleState));

    try {
      await this.allowReconnection(client, BATTLE_DISCONNECT_GRACE_MS / 1000);
      if (isDisconnectedGrace(this.battleState)) {
        this.syncBattleState(resumeDisconnectedBattle(this.battleState));
      }
    } catch {
      if (!isDisconnectedGrace(this.battleState)) return;
      const abandoned = abandonDisconnectedBattle(this.battleState);
      this.syncBattleState(abandoned);
      const result = toBattleResult(abandoned);
      if (result) {
        await this.publishResult(result);
      }
    }
  }

  private handleChooseAttack(client: Client, payload: BattleAttackIntentMessage) {
    if (!this.isAuthorized(client)) return;
    const attackId = typeof payload?.attackId === 'string' ? payload.attackId : '';
    const result = choosePlayerBattleAttack(this.battleState, attackId);

    if (!result.ok) {
      client.send('battleActionRejected', { reason: result.reason });
      return;
    }

    this.syncBattleState(result.state);
    if (result.result) {
      void this.publishResult(result.result);
    }
  }

  private handleRun(client: Client) {
    if (!this.isAuthorized(client)) return;
    const result = runFromBattle(this.battleState);
    if (!result.ok) {
      client.send('battleActionRejected', { reason: result.reason });
      return;
    }

    this.syncBattleState(result.state);
    if (result.result) {
      void this.publishResult(result.result);
    }
  }

  private isAuthorized(client: Client): boolean {
    return this.clients.some((candidate) => candidate.sessionId === client.sessionId);
  }

  private syncBattleState(state: BattleRoomState) {
    this.battleState = state;
    copyBattleStateToSchema(state, this.state as BattleStateSchema);
  }

  private async publishResult(result: ReturnType<typeof toBattleResult> extends infer Result ? Exclude<Result, null> : never) {
    if (this.publishedResult) return;
    if (this.battleState.battleKind === 'trainer') {
      const claim = getBattleClaim(this.battleState.battleId, this.battleToken);
      if (!claim?.trainerId || !this.trainerActivated) return;
      const snapshot = await playerAuthority.settleTrainerBattle({ principal: { sub: this.playerId }, trainerId: claim.trainerId, result });
      if (!snapshot) return;
    }
    this.publishedResult = true;
    markBattleClaimResolved(result);
    this.broadcast('battleResult', result);
  }
}

type TrainerBattleActivationDependencies = Pick<typeof playerAuthority, 'activateTrainerBattle' | 'cancelActiveTrainerBattle'> & {
  activateTrainerBattleClaim: (battleId: string) => boolean;
};

export async function activateTrainerBattleClaimWithCompensation(playerId: string, battleId: string, dependencies: TrainerBattleActivationDependencies = {
  activateTrainerBattle: playerAuthority.activateTrainerBattle.bind(playerAuthority),
  cancelActiveTrainerBattle: playerAuthority.cancelActiveTrainerBattle.bind(playerAuthority),
  activateTrainerBattleClaim
}): Promise<boolean> {
  const activated = await dependencies.activateTrainerBattle({ sub: playerId }, battleId);
  if (!activated) return false;
  let claimActivated = false;
  try { claimActivated = dependencies.activateTrainerBattleClaim(battleId); } catch { claimActivated = false; }
  if (claimActivated) return true;
  await dependencies.cancelActiveTrainerBattle({ sub: playerId }, battleId);
  return false;
}

export function authenticateBattleJoin(credential: unknown, now = Date.now(), ttlSeconds = guestCredentialTtlSeconds) {
  return verifyGuestCredential(credential, guestCredentialConfig, now, ttlSeconds);
}

export function assertBalanceVersion(clientBalanceVersion: unknown): asserts clientBalanceVersion is number {
  if (clientBalanceVersion !== CURRENT_BALANCE_VERSION) {
    throw new ServerError(409, JSON.stringify({ code: 'BALANCE_VERSION_MISMATCH', serverBalanceVersion: CURRENT_BALANCE_VERSION, clientBalanceVersion: typeof clientBalanceVersion === 'number' ? clientBalanceVersion : null }));
  }
}

function isDisconnectedGrace(state: BattleRoomState): boolean {
  return state.status === 'disconnected-grace';
}

function toBattleStateSchema(state: BattleRoomState): BattleStateSchema {
  const schema = new BattleStateSchema();
  copyBattleStateToSchema(state, schema);
  return schema;
}

function copyBattleStateToSchema(state: BattleRoomState, schema: BattleStateSchema): void {
  schema.battleId = state.battleId;
  schema.encounterId = state.encounterId;
  schema.battleKind = state.battleKind;
  schema.wildSpeciesId = state.wildSpeciesId;
  schema.status = state.status;
  schema.turn = state.turn;
  schema.canRun = state.canRun;
  schema.runAttempts = state.runAttempts;
  schema.player = toParticipantSchema(state.player);
  schema.enemy = toParticipantSchema(state.enemy);
  schema.lastLog.clear();
  state.lastLog.forEach((entry) => {
    const log = new BattleLogEntrySchema();
    log.id = entry.id;
    log.message = entry.message;
    schema.lastLog.push(log);
  });
  schema.validPlayerAttackIds.clear();
  state.validPlayerAttackIds.forEach((attackId) => schema.validPlayerAttackIds.push(attackId));
  schema.rewardGranted = state.rewardGranted;
  schema.disconnectGraceUntil = state.disconnectGraceUntil ?? '';
  schema.phase = state.phase ?? '';
  schema.remainingTrainerSwitches = state.remainingTrainerSwitches ?? 0;
  schema.trainerId = state.trainerId ?? '';
  schema.playerActiveCreatureId = state.playerActiveCreatureId ?? '';
  schema.trainerActiveCreatureId = state.trainerActiveCreatureId ?? '';
  schema.playerParty.clear();
  (state.playerParty ?? [state.player.activeCreature]).forEach((creature) => schema.playerParty.push(toCreatureSchema(creature)));
  schema.trainerParty.clear();
  (state.trainerParty ?? [state.enemy.activeCreature]).forEach((creature) => schema.trainerParty.push(toCreatureSchema(creature)));
}

function toParticipantSchema(participant: BattleRoomState['player']): BattleParticipantSchema {
  const schema = new BattleParticipantSchema();
  schema.kind = participant.kind;
  schema.playerId = participant.playerId;
  schema.name = participant.name;
  schema.activeCreature = toCreatureSchema(participant.activeCreature);
  return schema;
}

function toCreatureSchema(creature: BattleRoomState['player']['activeCreature']): BattleCreatureSchema {
  const schema = new BattleCreatureSchema();
  schema.id = creature.id;
  schema.ownerPlayerId = creature.ownerPlayerId;
  schema.speciesId = creature.speciesId;
  schema.level = creature.level;
  schema.stats = new BattleStatsSchema();
  schema.stats.hp = creature.stats.hp;
  schema.stats.attack = creature.stats.attack;
  schema.stats.defense = creature.stats.defense;
  schema.stats.speed = creature.stats.speed;
  schema.stats.stamina = creature.stats.stamina;
  schema.attacks.clear();
  creature.attacks.forEach((attack) => schema.attacks.push(toAttackSchema(attack)));
  schema.hp = creature.hp;
  schema.maxHp = creature.maxHp;
  schema.fatigue = creature.fatigue;
  schema.maxFatigue = creature.maxFatigue;
  schema.fainted = creature.fainted;
  return schema;
}

function toAttackSchema(attack: CreatureAttackRecord): BattleAttackSchema {
  const schema = new BattleAttackSchema();
  schema.id = attack.id;
  schema.name = attack.name;
  schema.type = attack.type;
  schema.power = attack.power;
  schema.statFocus = attack.statFocus;
  schema.fatigueCost = getBattleAttackFatigueCost(attack);
  return schema;
}
