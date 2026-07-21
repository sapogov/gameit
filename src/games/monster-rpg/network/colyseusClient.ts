import { Client, Room } from '@colyseus/sdk';
import type {
  JoinLocationOptions,
  JoinBattleOptions,
  BattleAttackIntentMessage,
  BattleResultMessage,
  BattleRoomState,
  LocationPlayerState,
  LocationRoomState,
  MapId,
  MoveIntentMessage,
  MultiplayerStatus,
  ClaimWildEncounterMessage,
  ClaimGuardedFarmTheftMessage,
  GuardedFarmTheftClaimedMessage,
  ResolveWildEncounterMessage,
  WildEncounterClaimedMessage,
  WorldPosition
} from '../sim';
import { CURRENT_BALANCE_VERSION, generatedMapRegistry, getGameMap, isMapId, MONSTER_RPG_SCHEMA_VERSION } from '../sim';
import type { AuthoritySnapshot, SaveCommand, SaveCommandResult } from './authorityProtocol';

const DEFAULT_SERVER_URL = 'http://127.0.0.1:2567';
const ROOM_NAME = 'location';

export class BalanceVersionMismatchError extends Error {
  readonly code = 'BALANCE_VERSION_MISMATCH';

  constructor(readonly serverBalanceVersion: number, readonly clientBalanceVersion: unknown) {
    super(`BALANCE_VERSION_MISMATCH: server ${serverBalanceVersion}, client ${String(clientBalanceVersion)}`);
  }
}

type ColyseusRoom = Room<unknown, any>;

interface ConnectionHandlers {
  onRoomState: (state: LocationRoomState) => void;
  onStatus: (status: MultiplayerStatus) => void;
  onTransition: (transition: LocationTransitionMessage) => void;
  onWildEncounterClaimed: (message: WildEncounterClaimedMessage) => void;
  onWildEncounterClaimRejected: (message: { encounterId: string; reason: string }) => void;
  onGuardedFarmTheftClaimed: (message: GuardedFarmTheftClaimedMessage) => void;
  onGuardedFarmTheftClaimRejected: (message: { farmId: string; reason: string }) => void;
  onFarmTheftResult: (result: SaveCommandResult) => void;
}

export interface MultiplayerConnection {
  sessionId: string;
  sendMoveIntent: (message: MoveIntentMessage) => void;
  sendClaimWildEncounter: (message: ClaimWildEncounterMessage) => void;
  sendClaimGuardedFarmTheft: (message: ClaimGuardedFarmTheftMessage) => void;
  sendAttemptFarmTheft: (message: { farmId: string; intentId: string; expectedRevision: number }) => void;
  sendResolveWildEncounter: (message: ResolveWildEncounterMessage) => void;
  leave: (options?: { silent?: boolean }) => void;
}

export interface BattleConnection {
  sendAttack: (message: BattleAttackIntentMessage) => void;
  sendRun: () => void;
  leave: (options?: { silent?: boolean }) => void;
}

export interface AccountReady {
  protocolVersion: 1;
  status: 'created' | 'authenticated';
  credential?: string;
  snapshot?: AuthoritySnapshot;
}

export interface AccountConnection {
  readonly ready: AccountReady;
  sendCommand: (command: SaveCommand) => Promise<SaveCommandResult>;
  bootstrapProfile: (profile: { name: string; avatar: 'scout' | 'ranger' | 'keeper' }) => Promise<AuthoritySnapshot>;
  /** Internal first-bootstrap migration only; never expose this as a manual import UI action. */
  bootstrapLegacySave: (payload: string) => Promise<SaveCommandResult>;
  exportAuthenticatedSave: () => Promise<string>;
  importAuthenticatedSave: (payload: string) => Promise<AuthoritySnapshot>;
  leave: () => void;
}

interface BattleConnectionHandlers {
  onBattleState: (state: BattleRoomState) => void;
  onBattleResult: (result: BattleResultMessage) => void;
  onStatus: (status: MultiplayerStatus) => void;
}

export interface LocationTransitionMessage {
  toMapId: MapId;
  spawn: WorldPosition;
  transitionId: string;
}

export async function connectToLocation(
  mapId: MapId,
  options: Omit<JoinLocationOptions, 'balanceVersion' | 'mapSetId' | 'mapSetVersion'>,
  handlers: ConnectionHandlers
): Promise<MultiplayerConnection> {
  const client = new Client(getServerUrl());
  const mapSet = generatedMapRegistry.handshake();
  return connectRoomLifecycle({
    join: () => joinWithBalanceError(client, ROOM_NAME, {
      ...options,
      mapId,
      balanceVersion: CURRENT_BALANCE_VERSION,
      mapSetId: mapSet.id,
      mapSetVersion: mapSet.version
    }),
    decodeState: (room, state) => {
      assertAdvertisedBalanceVersion(state);
      assertAdvertisedMapSet(state);
      return toLocationRoomState(state, room.sessionId);
    },
    publishState: handlers.onRoomState,
    attachReadyHandlers: (room) => [
      room.onMessage('locationTransition', (transition: LocationTransitionMessage) => handlers.onTransition(transition)),
      room.onMessage('wildEncounterClaimed', (message: WildEncounterClaimedMessage) => handlers.onWildEncounterClaimed(message)),
      room.onMessage('wildEncounterClaimRejected', (message: { encounterId: string; reason: string }) => handlers.onWildEncounterClaimRejected(message)),
      room.onMessage('guardedFarmTheftClaimed', (message: GuardedFarmTheftClaimedMessage) => handlers.onGuardedFarmTheftClaimed(message)),
      room.onMessage('guardedFarmTheftClaimRejected', (message: { farmId: string; reason: string }) => handlers.onGuardedFarmTheftClaimRejected(message)),
      room.onMessage('farmTheftResult', (result: SaveCommandResult) => handlers.onFarmTheftResult(result))
    ],
    createConnection: (room, leave): MultiplayerConnection => ({
      sessionId: room.sessionId,
      sendMoveIntent: (message) => { room.send('moveIntent', message); },
      sendClaimWildEncounter: (message) => { room.send('claimWildEncounter', message); },
      sendClaimGuardedFarmTheft: (message) => { room.send('claimGuardedFarmTheft', message); },
      sendAttemptFarmTheft: (message) => { room.send('attemptFarmTheft', message); },
      sendResolveWildEncounter: (message) => { room.send('resolveWildEncounter', message); },
      leave
    }),
    onStatus: handlers.onStatus,
    roomErrorLabel: 'multiplayer room'
  });
}

/** Connects the canonical authority room before any location or battle room. */
export async function connectToAccount(credential?: string): Promise<AccountConnection> {
  const client = new Client(getServerUrl());
  const room = await client.joinOrCreate('account', credential ? { credential } : {});
  return new Promise<AccountConnection>((resolve, reject) => {
    let ready: AccountReady | undefined;
    let closed = false;
    const pending: Array<(result: SaveCommandResult) => void> = [];
    const transfers = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    let transferSequence = 0;
    const fail = (error: Error) => {
      if (closed) return;
      closed = true;
      reject(error);
      while (pending.length) pending.shift()!({ status: 'rejected', code: 'AUTHORITY_REQUIRED' });
      transfers.forEach(({ reject: rejectTransfer }) => rejectTransfer(error)); transfers.clear();
    };
    const leave = () => { if (!closed) { closed = true; void room.leave().catch(() => undefined); } };
    room.onError((code: number, message?: string) => fail(new Error(`account room error ${code}: ${message ?? 'unknown error'}`)));
    room.onLeave((code: number, reason?: string) => fail(new Error(`account room left ${code}: ${reason ?? 'unknown reason'}`)));
    room.onMessage('authorityResult', (result: SaveCommandResult) => pending.shift()?.(result));
    room.onMessage('authenticatedTransferResult', (message: { requestId?: string; result?: unknown; error?: string }) => {
      if (!message?.requestId) return;
      const pendingTransfer = transfers.get(message.requestId); if (!pendingTransfer) return;
      transfers.delete(message.requestId);
      message.error ? pendingTransfer.reject(new Error(message.error)) : pendingTransfer.resolve(message.result);
    });
    room.onMessage('authorityReady', (message: AccountReady) => {
      if (!message || message.protocolVersion !== 1 || (message.status !== 'created' && message.status !== 'authenticated')) {
        fail(new Error('Unsupported authority protocol'));
        return;
      }
      ready = message;
      resolve({
        ready,
        sendCommand(command) {
          if (closed) return Promise.resolve({ status: 'rejected', code: 'AUTHORITY_REQUIRED' });
          return new Promise((complete) => { pending.push(complete); room.send('saveCommand', command); });
        },
        bootstrapProfile(profile) {
          if (closed) return Promise.reject(new Error('account room is closed'));
          return new Promise((complete, rejectProfile) => {
            const timeout = setTimeout(() => { cleanup(); rejectProfile(new Error('Timed out bootstrapping authority profile')); }, 10_000);
            const cleanup = room.onMessage('authorityReady', (next: AccountReady) => {
              if (next.snapshot) { clearTimeout(timeout); cleanup(); complete(next.snapshot); }
            });
            room.send('bootstrapProfile', profile);
          });
        },
        exportAuthenticatedSave() {
          return transfer('exportAuthenticatedSave').then((value) => {
            if (typeof value !== 'string') throw new Error('Invalid authenticated export response');
            return value;
          });
        },
        importAuthenticatedSave(payload) {
          return transfer('importAuthenticatedSave', payload).then((value) => {
            if (!value || typeof value !== 'object') throw new Error('Invalid authenticated import response');
            return value as AuthoritySnapshot;
          });
        },
        bootstrapLegacySave(payload) {
          if (closed) return Promise.resolve({ status: 'rejected', code: 'AUTHORITY_REQUIRED' });
          return new Promise((complete) => { pending.push(complete); room.send('importLegacySave', payload); });
        },
        leave
      });
      function transfer(type: 'exportAuthenticatedSave' | 'importAuthenticatedSave', payload?: string): Promise<unknown> {
        if (closed) return Promise.reject(new Error('account room is closed'));
        const requestId = `transfer-${Date.now()}-${++transferSequence}`;
        return new Promise((resolveTransfer, rejectTransfer) => { transfers.set(requestId, { resolve: resolveTransfer, reject: rejectTransfer }); room.send(type, { requestId, ...(payload === undefined ? {} : { payload }) }); });
      }
    });
  });
}

export async function connectToBattle(
  options: Omit<JoinBattleOptions, 'balanceVersion'>,
  handlers: BattleConnectionHandlers
): Promise<BattleConnection> {
  const client = new Client(getServerUrl());
  return connectRoomLifecycle({
    join: () => joinWithBalanceError(client, 'battle', { ...options, balanceVersion: CURRENT_BALANCE_VERSION }),
    decodeState: (_room, state) => {
      assertAdvertisedBalanceVersion(state);
      return toBattleRoomState(state);
    },
    publishState: handlers.onBattleState,
    attachReadyHandlers: (room) => [
      room.onMessage('battleResult', (result: BattleResultMessage) => handlers.onBattleResult(result))
    ],
    createConnection: (room, leave): BattleConnection => ({
      sendAttack: (message) => { room.send('chooseAttack', message); },
      sendRun: () => { room.send('run'); },
      leave
    }),
    onStatus: handlers.onStatus,
    roomErrorLabel: 'battle room'
  });
}

type LifecyclePhase = 'joining' | 'awaiting-first-state' | 'ready' | 'terminal';
type LeaveConnection = (options?: { silent?: boolean }) => void;

interface RoomLifecycleOptions<TState, TConnection> {
  join: () => Promise<ColyseusRoom>;
  decodeState: (room: ColyseusRoom, state: unknown) => TState;
  publishState: (state: TState) => void;
  attachReadyHandlers: (room: ColyseusRoom) => Array<() => void>;
  createConnection: (room: ColyseusRoom, leave: LeaveConnection) => TConnection;
  onStatus: (status: MultiplayerStatus) => void;
  roomErrorLabel: string;
}

async function connectRoomLifecycle<TState, TConnection>(
  options: RoomLifecycleOptions<TState, TConnection>
): Promise<TConnection> {
  let phase: LifecyclePhase = 'joining';
  const room = await options.join();
  phase = 'awaiting-first-state';

  return new Promise<TConnection>((resolve, reject) => {
    const messageCleanups: Array<() => void> = [];
    let leaveStarted = false;

    const cleanupListeners = () => {
      room.onStateChange.remove(onStateChange);
      room.onError.remove(onError);
      room.onLeave.remove(onLeave);
      messageCleanups.splice(0).forEach((cleanup) => cleanup());
    };

    const leaveRoomOnce = () => {
      if (leaveStarted) return;
      leaveStarted = true;
      try {
        void room.leave().catch(() => undefined);
      } catch {
        // The transport may already be closed when its leave signal reaches us.
      }
    };

    const terminate = (error: Error, notifyOffline: boolean) => {
      if (phase === 'terminal') return;
      const wasReady = phase === 'ready';
      phase = 'terminal';
      cleanupListeners();
      leaveRoomOnce();
      if (wasReady) {
        if (notifyOffline) {
          try {
            options.onStatus('offline');
          } catch {
            // Lifecycle teardown must not escape through an SDK signal callback.
          }
        }
      } else {
        reject(error);
      }
    };

    const leave: LeaveConnection = (leaveOptions) => {
      terminate(new Error(`${options.roomErrorLabel} left`), !leaveOptions?.silent);
    };

    function onStateChange(state: unknown) {
      if (phase === 'terminal' || state === undefined) return;

      let decodedState: TState;
      try {
        decodedState = options.decodeState(room, state);
      } catch (error) {
        terminate(toError(error), phase === 'ready');
        return;
      }

      try {
        options.publishState(decodedState);
      } catch (error) {
        terminate(toError(error), phase === 'ready');
        return;
      }
      if (phase !== 'awaiting-first-state') return;

      try {
        messageCleanups.push(...options.attachReadyHandlers(room));
      } catch (error) {
        terminate(toError(error), false);
        return;
      }
      phase = 'ready';
      resolve(options.createConnection(room, leave));
    }

    function onError(code: number, message?: string) {
      console.warn(`[monster-rpg] ${options.roomErrorLabel} error ${code}: ${message ?? 'unknown error'}`);
      terminate(new Error(`${options.roomErrorLabel} error ${code}: ${message ?? 'unknown error'}`), phase === 'ready');
    }

    function onLeave(code: number, reason?: string) {
      terminate(new Error(`${options.roomErrorLabel} left ${code}: ${reason ?? 'unknown reason'}`), phase === 'ready');
    }

    room.onStateChange(onStateChange);
    room.onError(onError);
    room.onLeave(onLeave);
  });
}

function getServerUrl(): string {
  return import.meta.env.VITE_MONSTER_RPG_SERVER_URL || DEFAULT_SERVER_URL;
}

async function joinWithBalanceError(client: Client, roomName: string, options: object): Promise<Room<unknown, any>> {
  try {
    return await client.joinOrCreate(roomName, options);
  } catch (error) {
    const structured = error as { code?: unknown; message?: unknown; serverBalanceVersion?: unknown; clientBalanceVersion?: unknown };
    const message = typeof structured?.message === 'string' ? structured.message : String(error);
    const payload = structured.code === 'BALANCE_VERSION_MISMATCH' ? structured : parseMismatchPayload(message);
    if (payload) {
      if (typeof payload.serverBalanceVersion === 'number') {
        throw new BalanceVersionMismatchError(payload.serverBalanceVersion, payload.clientBalanceVersion);
      }
    }
    throw error;
  }
}

function parseMismatchPayload(message: string): { serverBalanceVersion?: unknown; clientBalanceVersion?: unknown } | null {
  const start = message.indexOf('{');
  const end = message.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    const payload = JSON.parse(message.slice(start, end + 1)) as { code?: unknown; serverBalanceVersion?: unknown; clientBalanceVersion?: unknown };
    return payload.code === 'BALANCE_VERSION_MISMATCH' ? payload : null;
  } catch { return null; }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function assertAdvertisedBalanceVersion(state: unknown): void {
  const version = (state as { balanceVersion?: unknown } | null)?.balanceVersion;
  if (version !== CURRENT_BALANCE_VERSION) throw new BalanceVersionMismatchError(typeof version === 'number' ? version : -1, CURRENT_BALANCE_VERSION);
}

function assertAdvertisedMapSet(state: unknown): void {
  const advertised = state as { mapSetId?: unknown; mapSetVersion?: unknown } | null;
  const expected = generatedMapRegistry.handshake();
  if (advertised?.mapSetId !== expected.id || advertised.mapSetVersion !== expected.version) {
    throw new Error('Generated map-set version mismatch');
  }
}

function toLocationRoomState(state: any, localPlayerId: string): LocationRoomState {
  const players: Record<string, LocationPlayerState> = {};
  const encounters: LocationRoomState['encounters'] = {};
  const mapId: MapId = isMapId(state.mapId) ? state.mapId : 'world-map';
  const map = getGameMap(mapId);
  state.players?.forEach((player: any, sessionId: string) => {
    players[sessionId] = {
      profile: {
        schemaVersion:
          typeof player.profile.schemaVersion === 'number' ? player.profile.schemaVersion : MONSTER_RPG_SCHEMA_VERSION,
        playerId: player.profile.id,
        name: player.profile.name,
        avatar: player.profile.avatar,
        homeVillageId: 'home-village'
      },
      position: {
        mapId: player.position.mapId,
        x: player.position.x,
        y: player.position.y,
        facing: player.position.facing
      },
      connected: player.connected,
      inBattle: Boolean(player.inBattle),
      battleId: typeof player.battleId === 'string' && player.battleId ? player.battleId : undefined
    };
  });
  state.encounters?.forEach((encounter: any, encounterId: string) => {
    encounters[encounterId] = {
      id: typeof encounter.id === 'string' && encounter.id ? encounter.id : encounterId,
      zoneId: typeof encounter.zoneId === 'string' ? encounter.zoneId : '',
      mapId: isMapId(encounter.mapId) ? encounter.mapId : mapId,
      speciesId: typeof encounter.speciesId === 'number' ? encounter.speciesId : 1,
      x: typeof encounter.x === 'number' ? encounter.x : map.spawn.x,
      y: typeof encounter.y === 'number' ? encounter.y : map.spawn.y,
      status: encounter.status === 'claimed' ? 'claimed' : 'available',
      claimedByPlayerId: typeof encounter.claimedByPlayerId === 'string' && encounter.claimedByPlayerId
        ? encounter.claimedByPlayerId
        : undefined,
      respawnAt: typeof encounter.respawnAt === 'string' && encounter.respawnAt ? encounter.respawnAt : undefined
    };
  });

  return {
    mapId,
    mapName: typeof state.mapName === 'string' && state.mapName ? state.mapName : map.name,
    mapKind:
      state.mapKind === 'world-map' || state.mapKind === 'village' || state.mapKind === 'interior'
        ? state.mapKind
        : map.kind,
    players,
    encounters,
    tileWidth: state.tileWidth,
    tileHeight: state.tileHeight,
    mapSetId: typeof state.mapSetId === 'string' ? state.mapSetId : '',
    mapSetVersion: typeof state.mapSetVersion === 'string' ? state.mapSetVersion : '',
    localPlayerId
  };
}

function toBattleRoomState(state: any): BattleRoomState {
  return {
    battleId: typeof state.battleId === 'string' ? state.battleId : '',
    encounterId: typeof state.encounterId === 'string' ? state.encounterId : '',
    wildSpeciesId: typeof state.wildSpeciesId === 'number' ? state.wildSpeciesId : 1,
    battleKind: state.battleKind === 'guard-theft' ? 'guard-theft' : 'wild',
    status: toBattleStatus(state.status),
    turn: typeof state.turn === 'number' ? state.turn : 1,
    canRun: Boolean(state.canRun),
    runAttempts: typeof state.runAttempts === 'number' ? state.runAttempts : 0,
    player: toBattleParticipant(state.player, 'player'),
    enemy: toBattleParticipant(state.enemy, 'enemy'),
    lastLog: toArray(state.lastLog).map((entry: any) => ({
      id: typeof entry.id === 'string' ? entry.id : crypto.randomUUID(),
      message: typeof entry.message === 'string' ? entry.message : ''
    })),
    validPlayerAttackIds: toArray(state.validPlayerAttackIds).filter((attackId): attackId is string => typeof attackId === 'string'),
    rewardGranted: Boolean(state.rewardGranted),
    disconnectGraceUntil:
      typeof state.disconnectGraceUntil === 'string' && state.disconnectGraceUntil ? state.disconnectGraceUntil : undefined
  };
}

function toBattleParticipant(participant: any, fallbackKind: 'player' | 'enemy'): BattleRoomState['player'] {
  return {
    kind: participant?.kind === 'enemy' ? 'enemy' : fallbackKind,
    playerId: typeof participant?.playerId === 'string' ? participant.playerId : '',
    name: typeof participant?.name === 'string' ? participant.name : fallbackKind,
    activeCreature: {
      id: typeof participant?.activeCreature?.id === 'string' ? participant.activeCreature.id : '',
      ownerPlayerId:
        typeof participant?.activeCreature?.ownerPlayerId === 'string' ? participant.activeCreature.ownerPlayerId : '',
      speciesId: typeof participant?.activeCreature?.speciesId === 'number' ? participant.activeCreature.speciesId : 1,
      level: typeof participant?.activeCreature?.level === 'number' ? participant.activeCreature.level : 1,
      stats: {
        hp: numberOrZero(participant?.activeCreature?.stats?.hp),
        attack: numberOrZero(participant?.activeCreature?.stats?.attack),
        defense: numberOrZero(participant?.activeCreature?.stats?.defense),
        speed: numberOrZero(participant?.activeCreature?.stats?.speed),
        stamina: numberOrZero(participant?.activeCreature?.stats?.stamina)
      },
      attacks: toArray(participant?.activeCreature?.attacks).map((attack: any) => ({
        id: typeof attack.id === 'string' ? attack.id : '',
        name: typeof attack.name === 'string' ? attack.name : '',
        type: typeof attack.type === 'string' ? attack.type : 'verdant',
        power: numberOrZero(attack.power),
        statFocus: typeof attack.statFocus === 'string' ? attack.statFocus : 'attack'
      })),
      hp: numberOrZero(participant?.activeCreature?.hp),
      maxHp: numberOrZero(participant?.activeCreature?.maxHp),
      fatigue: numberOrZero(participant?.activeCreature?.fatigue),
      maxFatigue: numberOrZero(participant?.activeCreature?.maxFatigue),
      fainted: Boolean(participant?.activeCreature?.fainted)
    }
  };
}

function toBattleStatus(status: unknown): BattleRoomState['status'] {
  if (
    status === 'active' ||
    status === 'player-won' ||
    status === 'player-lost' ||
    status === 'ran' ||
    status === 'disconnected-grace' ||
    status === 'abandoned'
  ) {
    return status;
  }
  return 'active';
}

function toArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value.forEach === 'function') {
    const entries: any[] = [];
    value.forEach((entry: any) => entries.push(entry));
    return entries;
  }
  return [];
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
