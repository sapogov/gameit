import { Client, Room } from '@colyseus/sdk';
import type {
  JoinLocationOptions,
  LocationPlayerState,
  LocationRoomState,
  MapId,
  MoveIntentMessage,
  MultiplayerStatus,
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
}

export interface MultiplayerConnection {
  sessionId: string;
  sendMoveIntent: (message: MoveIntentMessage) => void;
  leave: (options?: { silent?: boolean }) => void;
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
      connected: player.connected
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
    tileWidth: state.tileWidth,
    tileHeight: state.tileHeight,
    localPlayerId
  };
}
