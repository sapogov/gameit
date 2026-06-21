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
import { getGameMap, isMapId, MONSTER_RPG_SCHEMA_VERSION } from '../sim';

const DEFAULT_SERVER_URL = 'http://127.0.0.1:2567';
const ROOM_NAME = 'location';

type ColyseusRoom = Room<unknown, any>;

interface ConnectionHandlers {
  onRoomState: (state: LocationRoomState) => void;
  onStatus: (status: MultiplayerStatus) => void;
  onTransition: (transition: LocationTransitionMessage) => void;
  onWildEncounterClaimed: (message: WildEncounterClaimedMessage) => void;
  onWildEncounterClaimRejected: (message: { encounterId: string; reason: string }) => void;
  onGuardedFarmTheftClaimed: (message: GuardedFarmTheftClaimedMessage) => void;
  onGuardedFarmTheftClaimRejected: (message: { farmId: string; reason: string }) => void;
}

export interface MultiplayerConnection {
  sessionId: string;
  sendMoveIntent: (message: MoveIntentMessage) => void;
  sendClaimWildEncounter: (message: ClaimWildEncounterMessage) => void;
  sendClaimGuardedFarmTheft: (message: ClaimGuardedFarmTheftMessage) => void;
  sendResolveWildEncounter: (message: ResolveWildEncounterMessage) => void;
  leave: (options?: { silent?: boolean }) => void;
}

export interface BattleConnection {
  sendAttack: (message: BattleAttackIntentMessage) => void;
  sendRun: () => void;
  leave: (options?: { silent?: boolean }) => void;
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
  options: JoinLocationOptions,
  handlers: ConnectionHandlers
): Promise<MultiplayerConnection> {
  const client = new Client(getServerUrl());
  const room = (await client.joinOrCreate(ROOM_NAME, { ...options, mapId })) as ColyseusRoom;

  const publishState = () => {
    handlers.onRoomState(toLocationRoomState(room.state, room.sessionId));
  };

  room.onStateChange(() => {
    publishState();
  });
  room.onMessage('locationTransition', (transition: LocationTransitionMessage) => {
    handlers.onTransition(transition);
  });
  room.onMessage('wildEncounterClaimed', (message: WildEncounterClaimedMessage) => {
    handlers.onWildEncounterClaimed(message);
  });
  room.onMessage('wildEncounterClaimRejected', (message: { encounterId: string; reason: string }) => {
    handlers.onWildEncounterClaimRejected(message);
  });
  room.onMessage('guardedFarmTheftClaimed', (message: GuardedFarmTheftClaimedMessage) => {
    handlers.onGuardedFarmTheftClaimed(message);
  });
  room.onMessage('guardedFarmTheftClaimRejected', (message: { farmId: string; reason: string }) => {
    handlers.onGuardedFarmTheftClaimRejected(message);
  });
  room.onError((code, message) => {
    console.warn(`[monster-rpg] multiplayer room error ${code}: ${message ?? 'unknown error'}`);
    handlers.onStatus('offline');
  });
  room.onLeave(() => {
    handlers.onStatus('offline');
  });

  publishState();

  return {
    sessionId: room.sessionId,
    sendMoveIntent: (message) => {
      room.send('moveIntent', message);
    },
    sendClaimWildEncounter: (message) => {
      room.send('claimWildEncounter', message);
    },
    sendClaimGuardedFarmTheft: (message) => {
      room.send('claimGuardedFarmTheft', message);
    },
    sendResolveWildEncounter: (message) => {
      room.send('resolveWildEncounter', message);
    },
    leave: (options) => {
      if (options?.silent) {
        room.onLeave.clear();
      }
      room.leave();
    }
  };
}

export async function connectToBattle(
  options: JoinBattleOptions,
  handlers: BattleConnectionHandlers
): Promise<BattleConnection> {
  const client = new Client(getServerUrl());
  const room = (await client.joinOrCreate('battle', options)) as ColyseusRoom;

  const publishState = () => {
    handlers.onBattleState(toBattleRoomState(room.state));
  };

  room.onStateChange(() => {
    publishState();
  });
  room.onMessage('battleResult', (result: BattleResultMessage) => {
    handlers.onBattleResult(result);
  });
  room.onError((code, message) => {
    console.warn(`[monster-rpg] battle room error ${code}: ${message ?? 'unknown error'}`);
    handlers.onStatus('offline');
  });
  room.onLeave(() => {
    handlers.onStatus('offline');
  });

  publishState();

  return {
    sendAttack: (message) => {
      room.send('chooseAttack', message);
    },
    sendRun: () => {
      room.send('run');
    },
    leave: (options) => {
      if (options?.silent) {
        room.onLeave.clear();
      }
      room.leave();
    }
  };
}

function getServerUrl(): string {
  return import.meta.env.VITE_MONSTER_RPG_SERVER_URL || DEFAULT_SERVER_URL;
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
