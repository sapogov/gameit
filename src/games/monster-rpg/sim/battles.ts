import type {
  BattleCreatureState,
  BattleRoomState,
  BattleStatus,
  CreatureAttackRecord,
  CreatureSaveRecord,
  MonsterRpgSaveState,
  PlayerProfile,
  WildEncounterOutcome
} from './types';
import { createRng, rollStats, selectCreatureAttacks } from './creatureLifecycle';
import { canCreatureUseRole } from './creatureParty';
import { getSpeciesById } from './speciesCatalog';

export const BATTLE_TICK_RATE = 10;
export const BATTLE_DISCONNECT_GRACE_MS = 15_000;
export const BATTLE_FATIGUE_RECOVERY_FLOOR = 4;
export const BATTLE_BASE_RUN_CHANCE = 0.5;
export const BATTLE_RUN_ATTEMPT_BONUS = 0.25;

export type BattleActionResult =
  | { ok: true; state: BattleRoomState; result?: BattleResolution }
  | { ok: false; state: BattleRoomState; reason: 'battle-ended' | 'invalid-attack' | 'fatigued' | 'run-unavailable' };

export interface BattleResolution {
  battleId: string;
  encounterId: string;
  outcome: WildEncounterOutcome;
  playerCreatureId: string;
  playerCreatureHp: number;
  playerCreatureFainted: boolean;
  rewardGranted: boolean;
}

export function getFirstBattleReadyCreature(state: MonsterRpgSaveState): CreatureSaveRecord | null {
  const creatureId = state.creatures.activePartyCreatureIds.find((id) =>
    canCreatureUseRole(state.creatures.creatures[id], 'battle')
  );
  return creatureId ? state.creatures.creatures[creatureId] ?? null : null;
}

export function createBattleRoomState({
  battleId,
  encounterId,
  playerProfile,
  playerCreature,
  wildSpeciesId,
  now = new Date()
}: {
  battleId: string;
  encounterId: string;
  playerProfile: PlayerProfile;
  playerCreature: CreatureSaveRecord;
  wildSpeciesId: number;
  now?: Date;
}): BattleRoomState {
  const enemyCreature = createWildBattleCreature(wildSpeciesId, battleId);

  return withValidAttackIds({
    battleId,
    encounterId,
    wildSpeciesId,
    status: 'active',
    turn: 1,
    canRun: true,
    runAttempts: 0,
    player: {
      kind: 'player',
      playerId: playerProfile.playerId,
      name: playerProfile.name,
      activeCreature: toBattleCreature(playerCreature)
    },
    enemy: {
      kind: 'enemy',
      playerId: 'wild',
      name: getSpeciesById(wildSpeciesId)?.displayName ?? `Species #${wildSpeciesId}`,
      activeCreature: enemyCreature
    },
    lastLog: [
      {
        id: `${now.getTime()}:start`,
        message: `A wild ${getSpeciesById(wildSpeciesId)?.displayName ?? `Species #${wildSpeciesId}`} appeared.`
      }
    ],
    validPlayerAttackIds: [],
    rewardGranted: false
  });
}

export function choosePlayerBattleAttack(
  state: BattleRoomState,
  attackId: string,
  now: Date = new Date()
): BattleActionResult {
  if (state.status !== 'active') return { ok: false, state, reason: 'battle-ended' };

  const playerAttack = state.player.activeCreature.attacks.find((attack) => attack.id === attackId);
  if (!playerAttack) return { ok: false, state, reason: 'invalid-attack' };
  if (!canUseBattleAttack(state.player.activeCreature, playerAttack)) {
    return { ok: false, state, reason: 'fatigued' };
  }

  let next = appendBattleLog(state, `${state.player.activeCreature.id} used ${playerAttack.name}.`, now);
  next = applyAttack(next, 'player', playerAttack);
  if (next.enemy.activeCreature.fainted) {
    return completeBattle(next, 'defeated', true, now);
  }

  next = advanceAfterEnemyAction(next, now);

  if (next.player.activeCreature.fainted) {
    return completeBattle(next, 'lost', false, now);
  }

  return { ok: true, state: withValidAttackIds(next) };
}

export function runFromBattle(
  state: BattleRoomState,
  now: Date = new Date(),
  rng: () => number = Math.random
): BattleActionResult {
  if (state.status !== 'active') return { ok: false, state, reason: 'battle-ended' };
  if (!state.canRun) return { ok: false, state, reason: 'run-unavailable' };

  const runChance = getBattleRunChance(state);
  if (rng() < runChance) {
    return completeBattle(appendBattleLog(state, 'You ran from battle.', now), 'ran', false, now);
  }

  let next = appendBattleLog(state, 'Could not get away.', now);
  next = advanceAfterEnemyAction({ ...next, runAttempts: next.runAttempts + 1 }, now);

  if (next.player.activeCreature.fainted) {
    return completeBattle(next, 'lost', false, now);
  }

  return { ok: true, state: withValidAttackIds(next) };
}

export function getBattleRunChance(state: BattleRoomState): number {
  if (!state.canRun || state.status !== 'active') return 0;

  const playerSpeed = Math.max(1, state.player.activeCreature.stats.speed);
  const enemySpeed = Math.max(1, state.enemy.activeCreature.stats.speed);
  const speedAdjustment = Math.max(-0.2, Math.min(0.25, (playerSpeed - enemySpeed) * 0.01));
  const attemptBonus = state.runAttempts * BATTLE_RUN_ATTEMPT_BONUS;

  return Math.max(0.15, Math.min(1, BATTLE_BASE_RUN_CHANCE + speedAdjustment + attemptBonus));
}

export function canUseBattleAttack(creature: BattleCreatureState, attack: CreatureAttackRecord): boolean {
  return !creature.fainted && creature.fatigue + getBattleAttackFatigueCost(attack) <= creature.maxFatigue;
}

export function getBattleAttackFatigueCost(attack: CreatureAttackRecord): number {
  return Math.max(8, Math.ceil(attack.power * 0.72));
}

export function getValidBattleAttackIds(creature: BattleCreatureState): string[] {
  return creature.attacks.filter((attack) => canUseBattleAttack(creature, attack)).map((attack) => attack.id);
}

export function markBattleDisconnected(state: BattleRoomState, now: Date = new Date()): BattleRoomState {
  if (state.status !== 'active') return state;
  return {
    ...state,
    status: 'disconnected-grace',
    disconnectGraceUntil: new Date(now.getTime() + BATTLE_DISCONNECT_GRACE_MS).toISOString()
  };
}

export function resumeDisconnectedBattle(state: BattleRoomState): BattleRoomState {
  if (state.status !== 'disconnected-grace') return state;
  return withValidAttackIds({
    ...state,
    status: 'active',
    disconnectGraceUntil: undefined
  });
}

export function abandonDisconnectedBattle(state: BattleRoomState, now: Date = new Date()): BattleRoomState {
  if (state.status !== 'disconnected-grace') return state;
  return {
    ...appendBattleLog(state, 'Battle abandoned after disconnect grace.', now),
    status: 'abandoned'
  };
}

export function toBattleResult(state: BattleRoomState): BattleResolution | null {
  const outcome = getOutcomeForStatus(state.status);
  if (!outcome) return null;
  return {
    battleId: state.battleId,
    encounterId: state.encounterId,
    outcome,
    playerCreatureId: state.player.activeCreature.id,
    playerCreatureHp: state.player.activeCreature.hp,
    playerCreatureFainted: state.player.activeCreature.fainted,
    rewardGranted: state.rewardGranted
  };
}

function completeBattle(
  state: BattleRoomState,
  outcome: WildEncounterOutcome,
  grantReward: boolean,
  now: Date
): { ok: true; state: BattleRoomState; result: BattleResolution } {
  const statusByOutcome: Record<WildEncounterOutcome, BattleStatus> = {
    defeated: 'player-won',
    lost: 'player-lost',
    ran: 'ran'
  };
  const next = withValidAttackIds({
    ...appendBattleLog(state, getCompletionMessage(outcome), now),
    status: statusByOutcome[outcome],
    rewardGranted: grantReward ? !state.rewardGranted : state.rewardGranted
  });

  return {
    ok: true,
    state: next,
    result: toBattleResult(next)!
  };
}

function applyAttack(state: BattleRoomState, attacker: 'player' | 'enemy', attack: CreatureAttackRecord): BattleRoomState {
  const source = attacker === 'player' ? state.player.activeCreature : state.enemy.activeCreature;
  const target = attacker === 'player' ? state.enemy.activeCreature : state.player.activeCreature;
  const damage = getBattleDamage(source, target, attack);
  const nextSource = {
    ...source,
    fatigue: Math.min(source.maxFatigue, source.fatigue + getBattleAttackFatigueCost(attack))
  };
  const nextHp = Math.max(0, target.hp - damage);
  const nextTarget = {
    ...target,
    hp: nextHp,
    fainted: nextHp === 0
  };

  if (attacker === 'player') {
    return {
      ...state,
      player: { ...state.player, activeCreature: nextSource },
      enemy: { ...state.enemy, activeCreature: nextTarget }
    };
  }

  return {
    ...state,
    player: { ...state.player, activeCreature: nextTarget },
    enemy: { ...state.enemy, activeCreature: nextSource }
  };
}

function advanceAfterEnemyAction(state: BattleRoomState, now: Date): BattleRoomState {
  let next = state;
  const enemyAttack = chooseEnemyAttack(next);
  if (enemyAttack) {
    next = appendBattleLog(next, `${next.enemy.name} used ${enemyAttack.name}.`, now);
    next = applyAttack(next, 'enemy', enemyAttack);
  } else {
    next = appendBattleLog(next, `${next.enemy.name} is too tired to attack.`, now);
  }

  return {
    ...recoverFatigue(next),
    turn: next.turn + 1
  };
}

function getBattleDamage(
  attacker: BattleCreatureState,
  defender: BattleCreatureState,
  attack: CreatureAttackRecord
): number {
  const attackStat = attack.statFocus === 'attack' ? attacker.stats.attack : Math.ceil(attacker.stats.attack * 0.72);
  const defense = Math.max(1, defender.stats.defense);
  return Math.max(1, Math.ceil(attack.power * 0.44 + attackStat * 0.5 - defense * 0.22));
}

function chooseEnemyAttack(state: BattleRoomState): CreatureAttackRecord | null {
  const valid = state.enemy.activeCreature.attacks.filter((attack) => canUseBattleAttack(state.enemy.activeCreature, attack));
  return valid.sort((a, b) => b.power - a.power || a.id.localeCompare(b.id))[0] ?? null;
}

function recoverFatigue(state: BattleRoomState): BattleRoomState {
  return {
    ...state,
    player: {
      ...state.player,
      activeCreature: recoverCreatureFatigue(state.player.activeCreature)
    },
    enemy: {
      ...state.enemy,
      activeCreature: recoverCreatureFatigue(state.enemy.activeCreature)
    }
  };
}

function recoverCreatureFatigue(creature: BattleCreatureState): BattleCreatureState {
  const recovery = Math.max(BATTLE_FATIGUE_RECOVERY_FLOOR, Math.ceil(creature.stats.stamina * 0.24));
  return {
    ...creature,
    fatigue: Math.max(0, creature.fatigue - recovery)
  };
}

function withValidAttackIds(state: BattleRoomState): BattleRoomState {
  return {
    ...state,
    validPlayerAttackIds: state.status === 'active' ? getValidBattleAttackIds(state.player.activeCreature) : []
  };
}

function appendBattleLog(state: BattleRoomState, message: string, now: Date): BattleRoomState {
  return {
    ...state,
    lastLog: [...state.lastLog.slice(-3), { id: `${now.getTime()}:${state.turn}:${state.lastLog.length}`, message }]
  };
}

function getOutcomeForStatus(status: BattleStatus): WildEncounterOutcome | null {
  if (status === 'player-won') return 'defeated';
  if (status === 'player-lost' || status === 'abandoned') return 'lost';
  if (status === 'ran') return 'ran';
  return null;
}

function getCompletionMessage(outcome: WildEncounterOutcome): string {
  if (outcome === 'defeated') return 'Wild Creature defeated.';
  if (outcome === 'lost') return 'Your Creature fainted.';
  return 'Battle ended.';
}

function toBattleCreature(creature: CreatureSaveRecord): BattleCreatureState {
  return {
    id: creature.id,
    ownerPlayerId: creature.ownerPlayerId,
    speciesId: creature.speciesId,
    level: creature.level,
    stats: { ...creature.stats },
    attacks: creature.attacks.map((attack) => ({ ...attack })),
    hp: creature.hp,
    maxHp: creature.maxHp,
    fatigue: 0,
    maxFatigue: Math.max(24, creature.stats.stamina * 2),
    fainted: creature.fainted || creature.hp <= 0
  };
}

function createWildBattleCreature(speciesId: number, battleId: string): BattleCreatureState {
  const species = getSpeciesById(speciesId) ?? getSpeciesById(1);
  if (!species) throw new Error(`Unknown wild battle species ${speciesId}`);

  const rng = createRng(hashString(`${battleId}:${species.id}`));
  const stats = rollStats(species, rng);
  const attacks = selectCreatureAttacks(species, species.rarity, stats, 4, rng);
  return {
    id: `wild-${species.slug}`,
    ownerPlayerId: 'wild',
    speciesId: species.id,
    level: 1,
    stats,
    attacks,
    hp: stats.hp,
    maxHp: stats.hp,
    fatigue: 0,
    maxFatigue: Math.max(24, stats.stamina * 2),
    fainted: false
  };
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
