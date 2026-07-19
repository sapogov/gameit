import { beforeEach, describe, expect, test, vi } from 'vitest';

const { joinOrCreate } = vi.hoisted(() => ({ joinOrCreate: vi.fn() }));

vi.mock('@colyseus/sdk', () => ({
  Client: class {
    joinOrCreate = joinOrCreate;
  },
  Room: class {}
}));

import { BalanceVersionMismatchError, connectToBattle, connectToLocation } from './colyseusClient';

type StateHandler = (state: unknown) => void;
type ErrorHandler = (code: number, message?: string) => void;
type LeaveHandler = (code: number, reason?: string) => void;

function createSignal<T extends (...args: any[]) => void>() {
  const handlers = new Set<T>();
  const signal = Object.assign(
    (handler: T) => { handlers.add(handler); },
    { remove: vi.fn((handler: T) => { handlers.delete(handler); }) }
  );
  return { signal, emit: (...args: Parameters<T>) => [...handlers].forEach((handler) => handler(...args)), count: () => handlers.size };
}

class FakeRoom {
  state: unknown = undefined;
  sessionId = 'local-player';
  private stateSignal = createSignal<StateHandler>();
  private errorSignal = createSignal<ErrorHandler>();
  private leaveSignal = createSignal<LeaveHandler>();
  private messageHandlers = new Map<string, Set<(message: unknown) => void>>();

  onStateChange = this.stateSignal.signal;
  onError = this.errorSignal.signal;
  onLeave = this.leaveSignal.signal;
  send = vi.fn();
  leave = vi.fn(async () => 1000);
  onMessage = vi.fn((type: string, handler: (message: unknown) => void) => {
    const handlers = this.messageHandlers.get(type) ?? new Set();
    handlers.add(handler);
    this.messageHandlers.set(type, handlers);
    return vi.fn(() => { handlers.delete(handler); });
  });

  publishDecodedState(state: unknown) {
    this.state = state;
    this.stateSignal.emit(state);
  }

  emitError(code = 500, message = 'room error') { this.errorSignal.emit(code, message); }
  emitLeave(code = 1006, reason = 'room left') { this.leaveSignal.emit(code, reason); }
  lifecycleListenerCount() { return this.stateSignal.count() + this.errorSignal.count() + this.leaveSignal.count(); }
  messageListenerCount() { return [...this.messageHandlers.values()].reduce((count, handlers) => count + handlers.size, 0); }
}

const profile = {
  playerId: 'player-1',
  name: 'Player',
  avatar: 'scout' as const,
  schemaVersion: 1,
  homeVillageId: 'home-village' as const
};

function locationHarness() {
  const onState = vi.fn();
  const onStatus = vi.fn();
  return {
    onState,
    onStatus,
    connect: () => connectToLocation('world-map', { mapId: 'world-map', profile }, {
      onRoomState: onState,
      onStatus,
      onTransition: vi.fn(),
      onWildEncounterClaimed: vi.fn(),
      onWildEncounterClaimRejected: vi.fn(),
      onGuardedFarmTheftClaimed: vi.fn(),
      onGuardedFarmTheftClaimRejected: vi.fn()
    }),
    decodedState: { balanceVersion: 1, mapId: 'world-map', players: new Map(), encounters: new Map() },
    readyMessageCount: 5
  };
}

function battleHarness() {
  const onState = vi.fn();
  const onStatus = vi.fn();
  return {
    onState,
    onStatus,
    connect: () => connectToBattle({ battleId: 'battle-1', battleToken: 'token', profile }, {
      onBattleState: onState,
      onBattleResult: vi.fn(),
      onStatus
    }),
    decodedState: { balanceVersion: 1 },
    readyMessageCount: 1
  };
}

beforeEach(() => {
  joinOrCreate.mockReset();
});

describe.each([
  ['location', locationHarness],
  ['battle', battleHarness]
] as const)('%s adapter lifecycle', (_name, createHarness) => {
  test('waits for the first SDK state packet instead of validating the unhydrated state placeholder', async () => {
    const room = new FakeRoom();
    room.state = { balanceVersion: 0 };
    const harness = createHarness();
    joinOrCreate.mockResolvedValue(room);

    let settled = false;
    const connectionPromise = harness.connect().then((connection) => {
      settled = true;
      return connection;
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(harness.onState).not.toHaveBeenCalled();
    expect(harness.onStatus).not.toHaveBeenCalled();
    expect(room.leave).not.toHaveBeenCalled();

    room.publishDecodedState(harness.decodedState);
    await expect(connectionPromise).resolves.toBeDefined();
    expect(harness.onState).toHaveBeenCalledTimes(1);
    expect(room.leave).not.toHaveBeenCalled();
  });

  test('stays pending without callbacks or message listeners until decoded v1 is published', async () => {
    const room = new FakeRoom();
    const harness = createHarness();
    const order: string[] = [];
    harness.onState.mockImplementation(() => { order.push('published'); });
    joinOrCreate.mockResolvedValue(room);

    let settled = false;
    const connectionPromise = harness.connect().then((connection) => {
      settled = true;
      order.push('resolved');
      return connection;
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(harness.onState).not.toHaveBeenCalled();
    expect(harness.onStatus).not.toHaveBeenCalled();
    expect(room.messageListenerCount()).toBe(0);

    room.publishDecodedState(harness.decodedState);
    await expect(connectionPromise).resolves.toBeDefined();
    expect(order).toEqual(['published', 'resolved']);
    expect(room.messageListenerCount()).toBe(harness.readyMessageCount);
  });

  test.each([0, undefined, 2])('rejects decoded balance version %s without throwing from the signal', async (balanceVersion) => {
    const room = new FakeRoom();
    const harness = createHarness();
    joinOrCreate.mockResolvedValue(room);
    const connectionPromise = harness.connect();
    await Promise.resolve();
    await Promise.resolve();

    expect(() => room.publishDecodedState({ ...harness.decodedState, balanceVersion })).not.toThrow();
    await expect(connectionPromise).rejects.toBeInstanceOf(BalanceVersionMismatchError);
    expect(harness.onState).not.toHaveBeenCalled();
    expect(harness.onStatus).not.toHaveBeenCalled();
    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(room.lifecycleListenerCount()).toBe(0);
    expect(room.messageListenerCount()).toBe(0);
  });

  test.each(['error', 'leave'] as const)('rejects once when the room emits %s before first state', async (event) => {
    const room = new FakeRoom();
    const harness = createHarness();
    joinOrCreate.mockResolvedValue(room);
    const connectionPromise = harness.connect();
    await Promise.resolve();
    await Promise.resolve();

    if (event === 'error') {
      room.emitError();
    } else {
      room.leave.mockImplementationOnce(() => { throw new Error('already closed'); });
      expect(() => room.emitLeave()).not.toThrow();
    }
    room.emitError();
    room.emitLeave();

    await expect(connectionPromise).rejects.toThrow();
    expect(harness.onStatus).not.toHaveBeenCalled();
    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(room.lifecycleListenerCount()).toBe(0);
  });

  test('rejects with the caller error when first-state publication throws', async () => {
    const room = new FakeRoom();
    const harness = createHarness();
    const publicationError = new Error('state callback failed');
    harness.onState.mockImplementation(() => { throw publicationError; });
    joinOrCreate.mockResolvedValue(room);
    const connectionPromise = harness.connect();
    await Promise.resolve();
    await Promise.resolve();

    expect(() => room.publishDecodedState(harness.decodedState)).not.toThrow();
    room.emitError();
    room.emitLeave();

    await expect(connectionPromise).rejects.toBe(publicationError);
    expect(harness.onStatus).not.toHaveBeenCalled();
    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(room.lifecycleListenerCount()).toBe(0);
    expect(room.messageListenerCount()).toBe(0);
  });

  test('tears down once and reports offline once for an incompatible post-ready state', async () => {
    const room = new FakeRoom();
    const harness = createHarness();
    joinOrCreate.mockResolvedValue(room);
    const connectionPromise = harness.connect();
    await Promise.resolve();
    await Promise.resolve();
    room.publishDecodedState(harness.decodedState);
    await connectionPromise;

    expect(() => room.publishDecodedState({ ...harness.decodedState, balanceVersion: undefined })).not.toThrow();
    room.emitError();
    room.emitLeave();

    expect(harness.onState).toHaveBeenCalledTimes(1);
    expect(harness.onStatus).toHaveBeenCalledTimes(1);
    expect(harness.onStatus).toHaveBeenCalledWith('offline');
    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(room.lifecycleListenerCount()).toBe(0);
    expect(room.messageListenerCount()).toBe(0);
  });

  test('contains post-ready publication and offline callback exceptions while tearing down once', async () => {
    const room = new FakeRoom();
    const harness = createHarness();
    harness.onState
      .mockImplementationOnce(() => undefined)
      .mockImplementation(() => { throw new Error('state callback failed'); });
    harness.onStatus.mockImplementation(() => { throw new Error('status callback failed'); });
    joinOrCreate.mockResolvedValue(room);
    const connectionPromise = harness.connect();
    await Promise.resolve();
    await Promise.resolve();
    room.publishDecodedState(harness.decodedState);
    await expect(connectionPromise).resolves.toBeDefined();

    expect(() => room.publishDecodedState(harness.decodedState)).not.toThrow();
    expect(() => room.emitError()).not.toThrow();
    expect(() => room.emitLeave()).not.toThrow();

    expect(harness.onState).toHaveBeenCalledTimes(2);
    expect(harness.onStatus).toHaveBeenCalledTimes(1);
    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(room.lifecycleListenerCount()).toBe(0);
    expect(room.messageListenerCount()).toBe(0);
  });
});
