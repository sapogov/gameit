import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { bootGame, type MonsterRpgGameRuntime } from './client';
import type { LocationTransitionMessage, MultiplayerConnection } from './network';
import {
  clearProgress,
  createInitialSave,
  createPlayerProfile,
  getGameMap,
  loadProfile,
  loadSave,
  movePlayer,
  saveProgress,
  type AvatarId,
  type InputAction,
  type LocationRoomState,
  type MonsterRpgSaveState,
  type MultiplayerStatus,
  type MovementResult
} from './sim';
import { CharacterCreator } from './ui/CharacterCreator';
import { GameHud } from './ui/GameHud';
import { MobileDpad } from './ui/MobileDpad';

function getInitialState(): MonsterRpgSaveState | null {
  const saved = loadSave();
  if (saved) return saved;

  const profile = loadProfile();
  return profile ? createInitialSave(profile) : null;
}

export function MonsterRpgGame() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<MonsterRpgGameRuntime | null>(null);
  const connectionRef = useRef<MultiplayerConnection | null>(null);
  const moveSequenceRef = useRef(0);
  const multiplayerStatusRef = useRef<MultiplayerStatus>('offline');
  const pendingTransitionRef = useRef<LocationTransitionMessage | null>(null);
  const [saveState, setSaveState] = useState<MonsterRpgSaveState | null>(getInitialState);
  const [lastMove, setLastMove] = useState<MovementResult | null>(null);
  const [roomState, setRoomState] = useState<LocationRoomState | null>(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState<MultiplayerStatus>('offline');

  const updateMultiplayerStatus = useCallback((status: MultiplayerStatus) => {
    multiplayerStatusRef.current = status;
    setMultiplayerStatus(status);
  }, []);

  const handleAction = useCallback((action: InputAction) => {
    if (action.type === 'move' && connectionRef.current && multiplayerStatusRef.current === 'online') {
      moveSequenceRef.current += 1;
      connectionRef.current.sendMoveIntent({
        direction: action.direction,
        sequence: moveSequenceRef.current
      });
      return;
    }

    setSaveState((current) => {
      if (!current) return current;

      const result = movePlayer(current, action, getGameMap(current.mapId));
      setLastMove(result);
      saveProgress(result.state);
      return result.state;
    });
  }, []);

  const handleCreateProfile = (name: string, avatar: AvatarId) => {
    const profile = createPlayerProfile(name, avatar);
    const initialSave = createInitialSave(profile);
    saveProgress(initialSave);
    setLastMove(null);
    setSaveState(initialSave);
  };

  const handleReset = () => {
    connectionRef.current?.leave();
    connectionRef.current = null;
    pendingTransitionRef.current = null;
    runtimeRef.current?.destroy();
    runtimeRef.current = null;
    clearProgress();
    setLastMove(null);
    setRoomState(null);
    updateMultiplayerStatus('offline');
    setSaveState(null);
  };

  useEffect(() => {
    if (!saveState || !canvasHostRef.current || runtimeRef.current) return;

    runtimeRef.current = bootGame(canvasHostRef.current, {
      initialState: saveState,
      onAction: handleAction
    });

    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [handleAction, saveState?.profile.id]);

  useEffect(() => {
    if (!saveState) return;
    runtimeRef.current?.setSaveState(saveState);
  }, [saveState]);

  useEffect(() => {
    runtimeRef.current?.setRoomState(roomState);
  }, [roomState]);

  useEffect(() => {
    if (!saveState) return;

    let cancelled = false;
    let activeConnection: MultiplayerConnection | null = null;
    const connectState = saveState;
    const pendingTransition =
      pendingTransitionRef.current?.toMapId === connectState.mapId ? pendingTransitionRef.current : null;
    updateMultiplayerStatus('connecting');

    async function connect() {
      try {
        const { connectToLocation } = await import('./network');
        const connection = await connectToLocation(
          connectState.mapId,
          {
            mapId: connectState.mapId,
            profile: connectState.profile,
            transitionId: pendingTransition?.transitionId
          },
          {
            onRoomState: (nextRoomState) => {
              if (cancelled) return;

              setRoomState(nextRoomState);
              const localPlayerId = nextRoomState.localPlayerId;
              const localPlayer = localPlayerId ? nextRoomState.players[localPlayerId] : undefined;
              if (!localPlayer) return;

              setSaveState((current) => {
                if (!current) return current;

                const nextSave: MonsterRpgSaveState = {
                  ...current,
                  profile: localPlayer.profile,
                  mapId: nextRoomState.mapId,
                  position: localPlayer.position,
                  updatedAt: new Date().toISOString()
                };
                saveProgress(nextSave);
                return nextSave;
              });
            },
            onTransition: (transition) => {
              if (cancelled) return;

              pendingTransitionRef.current = transition;
              const previousConnection = activeConnection;
              previousConnection?.leave({ silent: true });
              activeConnection = null;
              if (connectionRef.current === previousConnection) {
                connectionRef.current = null;
              }
              setRoomState(null);
              updateMultiplayerStatus('connecting');

              setSaveState((current) => {
                if (!current) return current;

                const nextSave: MonsterRpgSaveState = {
                  ...current,
                  mapId: transition.toMapId,
                  position: transition.spawn,
                  updatedAt: new Date().toISOString()
                };
                setLastMove({
                  state: nextSave,
                  moved: true,
                  blocked: false,
                  transition
                });
                saveProgress(nextSave);
                return nextSave;
              });
            },
            onStatus: (status) => {
              if (!cancelled) {
                updateMultiplayerStatus(status);
              }
            }
          }
        );

        if (cancelled) {
          connection.leave();
          return;
        }

        activeConnection = connection;
        connectionRef.current = connection;
        if (pendingTransitionRef.current?.transitionId === pendingTransition?.transitionId) {
          pendingTransitionRef.current = null;
        }
        updateMultiplayerStatus('online');
      } catch (error) {
        if (cancelled) return;
        console.warn('[monster-rpg] multiplayer unavailable, using offline local mode', error);
        connectionRef.current = null;
        setRoomState(null);
        updateMultiplayerStatus('offline');
      }
    }

    connect();

    return () => {
      cancelled = true;
      activeConnection?.leave({ silent: true });
      if (connectionRef.current === activeConnection) {
        connectionRef.current = null;
      }
      updateMultiplayerStatus('offline');
    };
  }, [saveState?.profile.id, saveState?.mapId, updateMultiplayerStatus]);

  if (!saveState) {
    return <CharacterCreator onCreate={handleCreateProfile} />;
  }

  const activeMap = getGameMap(saveState.mapId);

  return (
    <main className="monster-game-shell" aria-label="GameIt Monsters">
      <div className="monster-game-stage">
        <div className="monster-canvas-host" ref={canvasHostRef} />
        <GameHud
          lastMove={lastMove}
          mapKind={activeMap.kind}
          mapName={roomState?.mapName ?? activeMap.name}
          multiplayerStatus={multiplayerStatus}
          playerCount={roomState ? Object.keys(roomState.players).length : 1}
          saveState={saveState}
          onReset={handleReset}
        />
        <MobileDpad onAction={handleAction} />
      </div>
      <Link className="monster-back-link" to="/">
        Back to Home
      </Link>
    </main>
  );
}
