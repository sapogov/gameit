import { describe, expect, test, vi } from 'vitest';
import { activateTrainerBattleClaimWithCompensation, BattleRoom } from './BattleRoom';
import { createBattleRoomState, createPlayerProfile, type BattleRoomState, type CreatureSaveRecord } from '../../src/games/monster-rpg/sim';

type BattleLeaveHarness = {
  battleState: BattleRoomState;
  allowReconnection: ReturnType<typeof vi.fn>;
  syncBattleState: ReturnType<typeof vi.fn>;
  publishResult: ReturnType<typeof vi.fn>;
};

describe('BattleRoom reconnection lifecycle', () => {
  test('restores an active authoritative state when Colyseus accepts reconnection', async () => {
    const room = leaveHarness(Promise.resolve());

    await BattleRoom.prototype.onLeave.call(room as never, { sessionId: 'reconnected-player' } as never);

    expect(room.battleState.status).toBe('active');
    expect(room.battleState.disconnectGraceUntil).toBeUndefined();
    expect(room.syncBattleState).toHaveBeenCalledTimes(2);
    expect(room.publishResult).not.toHaveBeenCalled();
  });

  test('abandons and publishes when the reconnection grace period expires', async () => {
    const room = leaveHarness(Promise.reject(new Error('reconnection timed out')));

    await BattleRoom.prototype.onLeave.call(room as never, { sessionId: 'timed-out-player' } as never);

    expect(room.battleState.status).toBe('abandoned');
    expect(room.publishResult).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'lost' }));
  });

  test('does not overwrite a terminal state if a stale grace timer rejects', async () => {
    let rejectReconnection!: (reason?: unknown) => void;
    const room = leaveHarness(new Promise<void>((_resolve, reject) => {
      rejectReconnection = reject;
    }));
    const leaving = BattleRoom.prototype.onLeave.call(room as never, { sessionId: 'stale-grace-player' } as never);

    await Promise.resolve();
    room.battleState = { ...room.battleState, status: 'ran' };
    rejectReconnection(new Error('stale timer'));
    await leaving;

    expect(room.battleState.status).toBe('ran');
    expect(room.publishResult).not.toHaveBeenCalled();
  });
});

describe('trainer claim activation compensation', () => {
  test.each(['registry rejection', 'expired registry claim'])('clears the exact canonical active lock when %s follows activation', async () => {
    const activate = vi.fn().mockResolvedValue({});
    const cancel = vi.fn().mockResolvedValue(true);
    const registry = vi.fn().mockReturnValue(false);

    await expect(activateTrainerBattleClaimWithCompensation('player-1', 'battle-1', { activateTrainerBattle: activate, cancelActiveTrainerBattle: cancel, activateTrainerBattleClaim: registry })).resolves.toBe(false);

    expect(activate).toHaveBeenCalledWith({ sub: 'player-1' }, 'battle-1');
    expect(registry).toHaveBeenCalledWith('battle-1');
    expect(cancel).toHaveBeenCalledWith({ sub: 'player-1' }, 'battle-1');
  });
});

function leaveHarness(reconnection: Promise<void>) {
  const profile = createPlayerProfile('Reconnect Tester', 'scout');
  const room: BattleLeaveHarness = {
    battleState: createBattleRoomState({
      battleId: 'reconnect-battle',
      encounterId: 'reconnect-encounter',
      playerProfile: profile,
      playerCreature: creature(profile.playerId),
      wildSpeciesId: 1,
      zoneId: 'home-village'
    }) as BattleRoomState,
    allowReconnection: vi.fn(() => reconnection),
    syncBattleState: vi.fn((state: BattleRoomState) => {
      room.battleState = state;
    }),
    publishResult: vi.fn(async () => undefined)
  };
  return room;
}

function creature(ownerPlayerId: string): CreatureSaveRecord {
  return {
    id: 'reconnect-creature', ownerPlayerId, speciesId: 1, level: 1, experience: 0,
    stats: { hp: 20, attack: 10, defense: 10, speed: 10, stamina: 10 }, attacks: [], hp: 20, maxHp: 20, fainted: false, cooldowns: {}
  };
}
