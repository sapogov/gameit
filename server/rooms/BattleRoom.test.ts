import { describe, expect, test, vi } from 'vitest';
import { activateTrainerBattleClaimWithCompensation, BattleRoom } from './BattleRoom';
import { createBattleRoomState, createPlayerProfile, createTrainerBattleRoomState, type BattleRoomState, type CreatureSaveRecord } from '../../src/games/monster-rpg/sim';

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

describe('trainer switch settlement', () => {
  test('publishes a terminal result produced by switching creatures', () => {
    const profile = createPlayerProfile('Switch Tester', 'scout');
    const faintedActive = battleCreature(profile.playerId, 'fainted-active', 0, true);
    const incoming = battleCreature(profile.playerId, 'last-incoming', 1, false);
    const seeded = createTrainerBattleRoomState({ battleId: 'terminal-switch', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [faintedActive, incoming] });
    const active = seeded.playerParty!.find((candidate) => candidate.id === faintedActive.id)!;
    const room = {
      battleState: { ...seeded, player: { ...seeded.player, activeCreature: active }, playerActiveCreatureId: active.id, playerParty: seeded.playerParty!.map((candidate) => candidate.id === active.id ? { ...candidate, hp: 0, fainted: true } : candidate) },
      isAuthorized: vi.fn(() => true),
      syncBattleState: vi.fn(),
      publishResult: vi.fn(async () => undefined)
    };
    const handle = (BattleRoom.prototype as unknown as { handleSwitchCreature(client: unknown, payload: unknown): void }).handleSwitchCreature;

    handle.call(room, { send: vi.fn() }, { creatureId: incoming.id, expectedTurn: seeded.turn });

    expect(room.syncBattleState).toHaveBeenCalledWith(expect.objectContaining({ status: 'player-lost' }));
    expect(room.publishResult).toHaveBeenCalledWith(expect.objectContaining({ battleId: 'terminal-switch', outcome: 'lost', playerCreatureId: incoming.id }));
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

function battleCreature(ownerPlayerId: string, id: string, hp: number, fainted: boolean): CreatureSaveRecord {
  return {
    ...creature(ownerPlayerId), id, speciesId: id === 'fainted-active' ? 1 : 2, hp, maxHp: 60, fainted,
    stats: { hp: 60, attack: 28, defense: 14, speed: 18, stamina: 16 },
    attacks: [{ id: 'heavy-hit', name: 'Heavy Hit', type: 'verdant', power: 32, statFocus: 'attack' }],
    statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 60, attack: 28, defense: 14, speed: 18, stamina: 16 } }, events: [] }
  };
}
