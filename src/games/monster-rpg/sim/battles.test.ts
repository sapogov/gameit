import { describe, expect, it } from 'vitest';
import {
  choosePlayerBattleAttack,
  createBattleRoomState,
  getBattleAttackFatigueCost,
  getFirstBattleReadyCreature,
  getBattleRunChance,
  runFromBattle
} from '.';
import type { CreatureSaveRecord, MonsterRpgSaveState } from './types';
import { createInitialSave, createPlayerProfile } from './saveState';

describe('battle simulation', () => {
  it('selects the first non-fainted active Creature for battle', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const fainted = createCreature(profile.playerId, 'fainted-creature', 1, 0, true);
    const ready = createCreature(profile.playerId, 'ready-creature', 2, 42, false);
    const state: MonsterRpgSaveState = {
      ...createInitialSave(profile),
      creatures: {
        ownerPlayerId: profile.playerId,
        activePartyCreatureIds: [fainted.id, ready.id],
        storedCreatureIds: [],
        creatures: {
          [fainted.id]: fainted,
          [ready.id]: ready
        }
      }
    };

    expect(getFirstBattleReadyCreature(state)?.id).toBe(ready.id);
  });

  it('resolves manual player attacks and enemy AI attacks on the server state', () => {
    const profile = createPlayerProfile('Battle Tester', 'ranger');
    const state = createBattleRoomState({
      battleId: 'battle-1',
      encounterId: 'encounter-1',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'player-creature', 1, 60, false),
      wildSpeciesId: 3,
      now: new Date('2026-06-20T12:00:00.000Z')
    });
    const attackId = state.validPlayerAttackIds[0];
    const result = choosePlayerBattleAttack(state, attackId, new Date('2026-06-20T12:00:01.000Z'));

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.turn).toBeGreaterThanOrEqual(1);
    expect(result.state.player.activeCreature.fatigue).toBeGreaterThanOrEqual(0);
    expect(result.state.enemy.activeCreature.hp).toBeLessThan(result.state.enemy.activeCreature.maxHp);
    expect(result.state.lastLog.some((entry) => entry.message.includes('used'))).toBe(true);
  });

  it('rejects repeated strong attacks when fatigue is too high', () => {
    const profile = createPlayerProfile('Battle Tester', 'keeper');
    const playerCreature = createCreature(profile.playerId, 'heavy-creature', 1, 60, false);
    const strongAttack = playerCreature.attacks[0];
    const state = createBattleRoomState({
      battleId: 'battle-fatigue',
      encounterId: 'encounter-fatigue',
      playerProfile: profile,
      playerCreature,
      wildSpeciesId: 3
    });
    const exhausted = {
      ...state,
      player: {
        ...state.player,
        activeCreature: {
          ...state.player.activeCreature,
          fatigue: state.player.activeCreature.maxFatigue - getBattleAttackFatigueCost(strongAttack) + 1
        }
      }
    };

    const result = choosePlayerBattleAttack(exhausted, strongAttack.id);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected fatigue rejection');
    expect(result.reason).toBe('fatigued');
  });

  it('lets a failed run attempt keep the wild battle active for another action', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-fail',
      encounterId: 'encounter-run-fail',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0.99);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result).toBeUndefined();
    expect(result.state.status).toBe('active');
    expect(result.state.runAttempts).toBe(1);
    expect(result.state.turn).toBe(2);
    expect(result.state.player.activeCreature.hp).toBeLessThan(state.player.activeCreature.hp);
    expect(result.state.lastLog.some((entry) => entry.message.includes('Could not get away'))).toBe(true);
  });

  it('increases run chance after failed attempts so the player can retry', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-retry',
      encounterId: 'encounter-run-retry',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });

    const failed = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0.99);

    expect(failed.ok).toBe(true);
    if (!failed.ok) throw new Error(failed.reason);
    expect(getBattleRunChance(failed.state)).toBeGreaterThan(getBattleRunChance(state));

    const retried = runFromBattle(failed.state, new Date('2026-06-20T12:00:02.000Z'), () => 0);
    expect(retried.ok).toBe(true);
    if (!retried.ok) throw new Error(retried.reason);
    expect(retried.result?.outcome).toBe('ran');
  });

  it('marks successful run away as resolved without granting rewards', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run',
      encounterId: 'encounter-run',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    if (!result.result) throw new Error('expected run result');
    expect(result.result.outcome).toBe('ran');
    expect(result.result.rewardGranted).toBe(false);
  });

  it('rejects running when the battle type does not support escape', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = {
      ...createBattleRoomState({
        battleId: 'battle-no-run',
        encounterId: 'encounter-no-run',
        playerProfile: profile,
        playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
        wildSpeciesId: 3
      }),
      canRun: false
    };

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected run rejection');
    expect(result.reason).toBe('run-unavailable');
  });
});

function createCreature(
  ownerPlayerId: string,
  id: string,
  speciesId: number,
  hp: number,
  fainted: boolean
): CreatureSaveRecord {
  return {
    id,
    ownerPlayerId,
    speciesId,
    level: 1,
    experience: 0,
    stats: {
      hp: 60,
      attack: 28,
      defense: 14,
      speed: 18,
      stamina: 16
    },
    attacks: [
      {
        id: 'heavy-hit',
        name: 'Heavy Hit',
        type: 'verdant',
        power: 32,
        statFocus: 'attack'
      },
      {
        id: 'quick-jab',
        name: 'Quick Jab',
        type: 'verdant',
        power: 12,
        statFocus: 'speed'
      }
    ],
    hp,
    maxHp: 60,
    fainted,
    cooldowns: {}
  };
}
