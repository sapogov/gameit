import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { bootGame, type MonsterRpgGameRuntime } from './client';
import type { BattleConnection, LocationTransitionMessage, MultiplayerConnection } from './network';
import {
  clearProgress,
  PackOpenTrace,
  applyBattleRewardsToSave,
  assignFarmGuard,
  attemptFacingFarmTheft,
  buildStarterMagicDustFarm,
  activateBuffCard,
  activateCreatureCardViaElder,
  activateMaterialCard,
  clearFarmGuard,
  collectFacingFarm,
  completeVillageElderDialog,
  completeVillageElderOnboarding,
  confirmStationTravel,
  createInitialSave,
  createPlayerProfile,
  convertStarterCreatureCards,
  discoverCurrentStationDestination,
  buildFarmCardViaElder,
  exportSave,
  getGameMap,
  getFacingFarm,
  getFirstBattleReadyCreature,
  getCardDefinition,
  healAllCreaturesAtHospital,
  hatchEgg,
  openPack,
  importSavePayload,
  isAtVillageHospital,
  isVillageElderDialogComplete,
  loadMonsterRpgSettings,
  loadProfile,
  loadSave,
  movePlayer,
  moveCreatureToActiveParty,
  moveCreatureToStorage,
  recordWildCreatureSeen,
  resolveGuardedFarmTheft,
  saveMonsterRpgSettings,
  saveProgress,
  upgradeFarm,
  useReviveItem,
  type AvatarId,
  type BattleResultMessage,
  type BattleRoomState,
  type CreatureLabelMode,
  type InputAction,
  type LocationRoomState,
  type MonsterRpgSaveState,
  type MultiplayerStatus,
  type MovementResult
} from './sim';
import { CharacterCreator } from './ui/CharacterCreator';
import { GameHud } from './ui/GameHud';
import { MobileDpad } from './ui/MobileDpad';
import { VillageElderOnboarding } from './ui/VillageElderOnboarding';

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
  const battleConnectionRef = useRef<BattleConnection | null>(null);
  const activeBattleClaimRef = useRef<{
    kind: 'wild' | 'guard-theft';
    battleId: string;
    battleToken: string;
    encounterId?: string;
    farmId?: string;
    speciesId?: number;
  } | null>(null);
  const moveSequenceRef = useRef(0);
  const multiplayerStatusRef = useRef<MultiplayerStatus>('offline');
  const pendingTransitionRef = useRef<LocationTransitionMessage | null>(null);
  const [saveState, setSaveState] = useState<MonsterRpgSaveState | null>(getInitialState);
  const saveStateRef = useRef<MonsterRpgSaveState | null>(saveState);
  const freeMovementUnlockedRef = useRef(saveState ? isVillageElderDialogComplete(saveState) : false);
  const [lastMove, setLastMove] = useState<MovementResult | null>(null);
  const [roomState, setRoomState] = useState<LocationRoomState | null>(null);
  const [battleState, setBattleState] = useState<BattleRoomState | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [packTrace, setPackTrace] = useState<PackOpenTrace | null>(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState<MultiplayerStatus>('offline');
  const [settings, setSettings] = useState(loadMonsterRpgSettings);
  const [farmStatusNow, setFarmStatusNow] = useState(Date.now());
  const [pendingStationDestinationId, setPendingStationDestinationId] = useState<string | null>(null);

  const updateMultiplayerStatus = useCallback((status: MultiplayerStatus) => {
    multiplayerStatusRef.current = status;
    setMultiplayerStatus(status);
  }, []);

  const handleAction = useCallback((action: InputAction) => {
    const currentState = saveStateRef.current;
    if (action.type === 'move' && currentState && !freeMovementUnlockedRef.current) {
      setLastMove({
        state: currentState,
        moved: false,
        blocked: true,
        blockedBy: 'onboarding'
      });
      return;
    }

    if (action.type === 'move' && battleState?.status === 'active') {
      setImportStatus('Battle in progress');
      return;
    }

    if (action.type === 'move' && connectionRef.current && multiplayerStatusRef.current === 'online') {
      moveSequenceRef.current += 1;
      connectionRef.current.sendMoveIntent({
        direction: action.direction,
        sequence: moveSequenceRef.current
      });
      return;
    }

    if (action.type === 'interact' && currentState) {
      const collection = collectFacingFarm(currentState);
      if (collection.ok) {
        saveProgress(collection.state);
        saveStateRef.current = collection.state;
        setSaveState(collection.state);
        setLastMove(null);
        setPackTrace(null);
        setImportStatus(`Collected ${collection.collectedQuantity} Magic Dust`);
        return;
      }

      if (collection.reason === 'empty' || collection.reason === 'not-owner') {
        if (collection.reason === 'not-owner') {
          const theft = attemptFacingFarmTheft(currentState);
          if (theft.ok) {
            saveProgress(theft.state);
            saveStateRef.current = theft.state;
            setSaveState(theft.state);
            setLastMove(null);
            setPackTrace(null);
            setImportStatus(formatFarmTheftAttempt(theft));
            return;
          }
          if (theft.reason === 'guarded' && multiplayerStatusRef.current === 'online' && connectionRef.current) {
            const farm = theft.farm ?? getFacingFarm(currentState);
            const activeCreature = getFirstBattleReadyCreature(currentState);
            const guardCreature = farm?.guardCreatureId ? currentState.creatures.creatures[farm.guardCreatureId] : undefined;
            if (!farm || !activeCreature || !guardCreature) {
              setImportStatus(!activeCreature ? 'No ready Creature for guard battle' : 'Farm guard data unavailable');
              return;
            }
            connectionRef.current.sendClaimGuardedFarmTheft({ farm, activeCreature, guardCreature });
            setImportStatus('Challenging farm guard');
            return;
          }
          setImportStatus(formatFarmTheftFailure(theft.reason, theft));
          return;
        }
        setImportStatus(formatFarmCollectionFailure(collection.reason));
        return;
      }
    }

    if (action.type === 'interact' && connectionRef.current && multiplayerStatusRef.current === 'online') {
      const encounter = getFacingEncounter(roomState, currentState);
      if (encounter) {
        const activeCreature = currentState ? getFirstBattleReadyCreature(currentState) : null;
        if (!activeCreature) {
          setImportStatus('No ready Creature for battle');
          return;
        }
        connectionRef.current.sendClaimWildEncounter({ encounterId: encounter.id, activeCreature });
        setImportStatus(`Claiming wild Creature #${encounter.speciesId}`);
      } else {
        setImportStatus('No wild Creature ahead');
      }
      return;
    }

    setSaveState((current) => {
      if (!current) return current;

      const result = movePlayer(current, action, getGameMap(current.mapId));
      const discoveredState = discoverCurrentStationDestination(result.state);
      const nextResult = discoveredState === result.state ? result : { ...result, state: discoveredState };
      setLastMove(nextResult);
      saveProgress(discoveredState);
      saveStateRef.current = discoveredState;
      setPendingStationDestinationId(null);
      return discoveredState;
    });
  }, [battleState?.status, roomState]);

  const handleCreateProfile = (name: string, avatar: AvatarId) => {
    const profile = createPlayerProfile(name, avatar);
    const initialSave = createInitialSave(profile);
    saveProgress(initialSave);
    setImportStatus(null);
    setLastMove(null);
    setSaveState(initialSave);
  };

  const persistOnboardingUpdate = (updater: (current: MonsterRpgSaveState) => MonsterRpgSaveState) => {
    setSaveState((current) => {
      if (!current) return current;

      const nextState = updater(current);
      saveProgress(nextState);
      saveStateRef.current = nextState;
      freeMovementUnlockedRef.current = isVillageElderDialogComplete(nextState);
      setLastMove(null);
      return nextState;
    });
  };

  const handleCompleteVillageElderDialog = () => {
    setImportStatus('Starter Pack received');
    persistOnboardingUpdate(completeVillageElderDialog);
  };

  const handleConvertStarterCards = () => {
    setSaveState((current) => {
      if (!current) return current;

      const result = convertStarterCreatureCards(current);
      if (!result.ok) {
        setImportStatus(formatStarterConversionFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      freeMovementUnlockedRef.current = isVillageElderDialogComplete(result.state);
      setImportStatus('Starter Creatures joined');
      setLastMove(null);
      return result.state;
    });
  };

  const handleBuildStarterFarm = () => {
    setSaveState((current) => {
      if (!current) return current;

      const result = buildStarterMagicDustFarm(current);
      if (!result.ok) {
        setImportStatus(formatStarterFarmFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      freeMovementUnlockedRef.current = isVillageElderDialogComplete(result.state);
      setImportStatus('Magic Dust Farm built');
      setLastMove(null);
      return result.state;
    });
  };

  const handleFinishVillageElderOnboarding = () => {
    setImportStatus('Onboarding complete');
    persistOnboardingUpdate(completeVillageElderOnboarding);
  };

  const handleOpenPack = () => {
    if (!saveStateRef.current) return;
    const result = openPack(saveStateRef.current, { seed: Date.now() });
    setPackTrace(result.trace);
    saveProgress(result.state);
    saveStateRef.current = result.state;
    setLastMove(null);
    setImportStatus(`Pack opened (${result.trace.cards.length})`);
    setSaveState(result.state);
  };

  const handleActivateCard = (cardId: string) => {
    setSaveState((current) => {
      if (!current) return current;
      const definition = getCardDefinition(cardId);

      if (definition?.type === 'material') {
        const result = activateMaterialCard(current, cardId);
        if (!result.ok) {
          setImportStatus(formatCardFailure(result.reason));
          return current;
        }
        saveProgress(result.state);
        saveStateRef.current = result.state;
        setLastMove(null);
        setPackTrace(null);
        setImportStatus('Material card activated');
        return result.state;
      }

      if (definition?.type === 'buff') {
        const result = activateBuffCard(current, cardId);
        if (!result.ok) {
          setImportStatus(formatCardFailure(result.reason));
          return current;
        }
        saveProgress(result.state);
        saveStateRef.current = result.state;
        setLastMove(null);
        setPackTrace(null);
        setImportStatus('Buff card activated');
        return result.state;
      }

      setImportStatus('Unknown card action');
      return current;
    });
  };

  const handleRouteCardToElder = (cardId: string) => {
    setSaveState((current) => {
      if (!current) return current;
      const definition = getCardDefinition(cardId);

      if (current.inventory.creatureCards[cardId] || definition?.type === 'creature') {
        const result = activateCreatureCardViaElder(current, cardId);
        if (!result.ok) {
          setImportStatus(formatCardFailure(result.reason));
          return current;
        }
        saveProgress(result.state);
        saveStateRef.current = result.state;
        setLastMove(null);
        setPackTrace(null);
        setImportStatus('Creature card routed to Elder');
        return result.state;
      }

      if (definition?.type === 'farm') {
        const result = buildFarmCardViaElder(current, cardId);
        if (!result.ok) {
          setImportStatus(formatCardFailure(result.reason));
          return current;
        }
        saveProgress(result.state);
        saveStateRef.current = result.state;
        setLastMove(null);
        setPackTrace(null);
        setImportStatus('Farm card routed to Elder');
        return result.state;
      }

      setImportStatus('Card cannot use Village Elder action');
      return current;
    });
  };

  const handleHatchEgg = (eggId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = hatchEgg(current, eggId);
      if (!result.ok) {
        setImportStatus(formatCardFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus('Egg hatched');
      return result.state;
    });
  };

  const handleHospitalHeal = () => {
    setSaveState((current) => {
      if (!current) return current;
      if (!isAtVillageHospital(current)) {
        setImportStatus(formatCreaturePartyFailure('not-at-hospital'));
        return current;
      }

      const result = healAllCreaturesAtHospital(current);
      saveProgress(result);
      saveStateRef.current = result;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus('Hospital full heal complete');
      return result;
    });
  };

  const handleReviveCreature = (creatureId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = useReviveItem(current, creatureId);
      if (!result.ok) {
        setImportStatus(formatCreaturePartyFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus('Revive item used');
      return result.state;
    });
  };

  const handleMoveCreatureToActive = (creatureId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = moveCreatureToActiveParty(current, creatureId);
      if (!result.ok) {
        setImportStatus(formatCreaturePartyFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus('Creature moved to active party');
      return result.state;
    });
  };

  const handleMoveCreatureToStorage = (creatureId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = moveCreatureToStorage(current, creatureId);
      if (!result.ok) {
        setImportStatus(formatCreaturePartyFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus('Creature moved to storage');
      return result.state;
    });
  };

  const handleUpgradeFarm = (farmId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = upgradeFarm(current, farmId);
      if (!result.ok) {
        setImportStatus(formatFarmUpgradeFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus(`Farm upgraded to level ${result.farm.level}`);
      return result.state;
    });
  };

  const handleAssignFarmGuard = (farmId: string, creatureId: string | null) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = creatureId ? assignFarmGuard(current, farmId, creatureId) : clearFarmGuard(current, farmId);
      if (!result.ok) {
        setImportStatus(formatFarmGuardFailure(result.reason));
        return current;
      }

      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove(null);
      setPackTrace(null);
      setImportStatus(creatureId ? 'Farm guard assigned' : 'Farm guard cleared');
      return result.state;
    });
  };

  const handlePrepareStationTravel = (destinationId: string) => {
    setPendingStationDestinationId(destinationId);
    setImportStatus('Confirm station travel');
  };

  const handleCancelStationTravel = () => {
    setPendingStationDestinationId(null);
    setImportStatus('Station travel canceled');
  };

  const handleConfirmStationTravel = (destinationId: string) => {
    setSaveState((current) => {
      if (!current) return current;

      const result = confirmStationTravel(current, destinationId);
      if (!result.ok) {
        setImportStatus(formatStationTravelFailure(result.reason, result));
        return current;
      }

      connectionRef.current?.leave({ silent: true });
      battleConnectionRef.current?.leave({ silent: true });
      connectionRef.current = null;
      battleConnectionRef.current = null;
      activeBattleClaimRef.current = null;
      pendingTransitionRef.current = null;
      setRoomState(null);
      setBattleState(null);
      updateMultiplayerStatus('offline');
      saveProgress(result.state);
      saveStateRef.current = result.state;
      setLastMove({
        state: result.state,
        moved: true,
        blocked: false,
        transition: {
          toMapId: result.destination.mapId,
          spawn: result.destination.spawn
        }
      });
      setPackTrace(null);
      setPendingStationDestinationId(null);
      setImportStatus(`Station travel to ${result.destination.displayName}: paid ${result.costPaid} Magic Dust`);
      return result.state;
    });
  };

  const handleExportSave = () => {
    if (!saveState) return;

    const blob = new Blob([exportSave(saveState)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gameit-monsters-${saveState.profile.playerId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setImportStatus('Save exported');
  };

  const handleImportSave = async (file: File) => {
    const payload = await file.text();
    const result = importSavePayload(payload);

    if (!result.ok) {
      setImportStatus(`Import failed: ${formatImportFailure(result.reason)}`);
      return;
    }

    connectionRef.current?.leave();
    battleConnectionRef.current?.leave();
    connectionRef.current = null;
    battleConnectionRef.current = null;
    activeBattleClaimRef.current = null;
    pendingTransitionRef.current = null;
    saveProgress(result.state);
    setLastMove(null);
    setRoomState(null);
    updateMultiplayerStatus('offline');
    setSaveState(result.state);
    setImportStatus('Save imported');
  };

  const handleReset = () => {
    connectionRef.current?.leave();
    battleConnectionRef.current?.leave();
    connectionRef.current = null;
    battleConnectionRef.current = null;
    activeBattleClaimRef.current = null;
    pendingTransitionRef.current = null;
    runtimeRef.current?.destroy();
    runtimeRef.current = null;
    clearProgress();
    setImportStatus(null);
    setLastMove(null);
    setRoomState(null);
    setBattleState(null);
    updateMultiplayerStatus('offline');
    setSaveState(null);
  };

  const handleBattleAttack = (attackId: string) => {
    battleConnectionRef.current?.sendAttack({ attackId });
  };

  const handleRunBattle = () => {
    battleConnectionRef.current?.sendRun();
  };

  const handleCreatureLabelModeChange = (creatureLabelMode: CreatureLabelMode) => {
    setSettings((current) => {
      const next = { ...current, creatureLabelMode };
      saveMonsterRpgSettings(next);
      return next;
    });
  };

  useEffect(() => {
    saveStateRef.current = saveState;
    freeMovementUnlockedRef.current = saveState ? isVillageElderDialogComplete(saveState) : false;
  }, [saveState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFarmStatusNow(Date.now());
    }, 10_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!saveState || !canvasHostRef.current || runtimeRef.current) return;

    runtimeRef.current = bootGame(canvasHostRef.current, {
      creatureLabelMode: settings.creatureLabelMode,
      initialState: saveState,
      onAction: handleAction
    });

    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [handleAction, saveState?.profile.playerId]);

  useEffect(() => {
    runtimeRef.current?.setCreatureLabelMode(settings.creatureLabelMode);
  }, [settings.creatureLabelMode]);

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

                const nextSave = discoverCurrentStationDestination({
                  ...current,
                  profile: localPlayer.profile,
                  mapId: nextRoomState.mapId,
                  position: localPlayer.position,
                  updatedAt: new Date().toISOString()
                });
                saveProgress(nextSave);
                saveStateRef.current = nextSave;
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

                const nextSave = discoverCurrentStationDestination({
                  ...current,
                  mapId: transition.toMapId,
                  position: transition.spawn,
                  updatedAt: new Date().toISOString()
                });
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
            onWildEncounterClaimed: (claim) => {
              if (cancelled) return;

              activeBattleClaimRef.current = {
                kind: 'wild',
                battleId: claim.battleId,
                battleToken: claim.battleToken,
                encounterId: claim.encounterId,
                speciesId: claim.speciesId
              };
              setImportStatus('Battle started');
              void connectBattleRoom(claim.battleId, claim.battleToken);
            },
            onWildEncounterClaimRejected: (message) => {
              if (!cancelled) {
                setImportStatus(formatWildEncounterClaimFailure(message.reason));
              }
            },
            onGuardedFarmTheftClaimed: (claim) => {
              if (cancelled) return;

              activeBattleClaimRef.current = {
                kind: 'guard-theft',
                battleId: claim.battleId,
                battleToken: claim.battleToken,
                farmId: claim.farmId
              };
              setImportStatus('Guard battle started');
              void connectBattleRoom(claim.battleId, claim.battleToken);
            },
            onGuardedFarmTheftClaimRejected: (message) => {
              if (!cancelled) {
                setImportStatus(formatGuardedFarmTheftClaimFailure(message.reason));
              }
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
  }, [saveState?.profile.playerId, saveState?.mapId, updateMultiplayerStatus]);

  const connectBattleRoom = useCallback(
    async (battleId: string, battleToken: string) => {
      const currentState = saveStateRef.current;
      if (!currentState) return;

      battleConnectionRef.current?.leave({ silent: true });
      battleConnectionRef.current = null;

      try {
        const { connectToBattle } = await import('./network');
        const connection = await connectToBattle(
          {
            battleId,
            battleToken,
            profile: currentState.profile
          },
          {
            onBattleState: (nextBattleState) => {
              setBattleState(nextBattleState);
            },
            onBattleResult: (result) => {
              applyBattleResult(result, battleToken);
            },
            onStatus: (status) => {
              if (status === 'offline') {
                battleConnectionRef.current = null;
              }
            }
          }
        );
        battleConnectionRef.current = connection;
      } catch (error) {
        console.warn('[monster-rpg] battle room unavailable', error);
        activeBattleClaimRef.current = null;
        setBattleState(null);
        setImportStatus('Battle unavailable');
      }
    },
    []
  );

  const applyBattleResult = useCallback((result: BattleResultMessage, battleToken: string) => {
    const claim = activeBattleClaimRef.current;
    if (!claim || claim.battleId !== result.battleId) return;

    if (claim.kind === 'wild' && claim.encounterId && claim.speciesId !== undefined) {
      connectionRef.current?.sendResolveWildEncounter({
        encounterId: result.encounterId,
        outcome: result.outcome,
        battleId: result.battleId,
        battleToken
      });

      setSaveState((current) => {
        if (!current) return current;
        const applied = applyBattleRewardsToSave(recordWildCreatureSeen(current, claim.speciesId!), result);
        const nextState = applied.state;
        if (applied.packTrace) setPackTrace(applied.packTrace);
        else if (applied.levelRewardPackTraces.length > 0) setPackTrace(applied.levelRewardPackTraces[0]);
        saveProgress(nextState);
        saveStateRef.current = nextState;
        return nextState;
      });

      setImportStatus(formatBattleOutcome(result));
    } else if (claim.kind === 'guard-theft' && claim.farmId) {
      setSaveState((current) => {
        if (!current) return current;
        const guardBattle = resolveGuardedFarmTheft(current, {
          farmId: claim.farmId!,
          guardCreatureHp: result.outcome === 'defeated' ? 0 : undefined,
          playerCreatureFainted: result.playerCreatureFainted,
          playerCreatureHp: result.playerCreatureHp,
          playerCreatureId: result.playerCreatureId,
          visitorWon: result.outcome === 'defeated'
        });
        if (!guardBattle.ok) {
          setImportStatus(formatFarmTheftFailure(guardBattle.reason, guardBattle));
          return current;
        }

        saveProgress(guardBattle.state);
        saveStateRef.current = guardBattle.state;
        setPackTrace(null);
        setImportStatus(formatFarmTheftAttempt(guardBattle));
        return guardBattle.state;
      });
    }
    activeBattleClaimRef.current = null;
    battleConnectionRef.current?.leave({ silent: true });
    battleConnectionRef.current = null;
  }, []);

  if (!saveState) {
    return <CharacterCreator onCreate={handleCreateProfile} />;
  }

  const activeMap = getGameMap(saveState.mapId);

  return (
    <main className="monster-game-shell" aria-label="GameIt Monsters">
      <div className="monster-game-stage">
        <div className="monster-canvas-host" ref={canvasHostRef} />
        <GameHud
          canUseHospital={isAtVillageHospital(saveState)}
          importStatus={importStatus}
          lastMove={lastMove}
          mapKind={activeMap.kind}
          mapName={roomState?.mapName ?? activeMap.name}
          multiplayerStatus={multiplayerStatus}
          playerCount={roomState ? Object.keys(roomState.players).length : 1}
          saveState={saveState}
          farmStatusNow={farmStatusNow}
          creatureLabelMode={settings.creatureLabelMode}
          packOpenTrace={packTrace}
          battleState={battleState}
          onExport={handleExportSave}
          onImport={handleImportSave}
          onOpenPack={handleOpenPack}
          onActivateCard={handleActivateCard}
          onRouteCardToElder={handleRouteCardToElder}
          onHatchEgg={handleHatchEgg}
          onHospitalHeal={handleHospitalHeal}
          onMoveCreatureToActive={handleMoveCreatureToActive}
          onMoveCreatureToStorage={handleMoveCreatureToStorage}
          onUpgradeFarm={handleUpgradeFarm}
          onAssignFarmGuard={handleAssignFarmGuard}
          onCreatureLabelModeChange={handleCreatureLabelModeChange}
          onBattleAttack={handleBattleAttack}
          onRunBattle={handleRunBattle}
          onReviveCreature={handleReviveCreature}
          pendingStationDestinationId={pendingStationDestinationId}
          onPrepareStationTravel={handlePrepareStationTravel}
          onCancelStationTravel={handleCancelStationTravel}
          onConfirmStationTravel={handleConfirmStationTravel}
          onReset={handleReset}
        />
        <VillageElderOnboarding
          saveState={saveState}
          onBuildFarm={handleBuildStarterFarm}
          onCompleteDialog={handleCompleteVillageElderDialog}
          onConvertCreatures={handleConvertStarterCards}
          onFinish={handleFinishVillageElderOnboarding}
        />
        <MobileDpad onAction={handleAction} />
      </div>
      <Link className="monster-back-link" to="/">
        Back to Home
      </Link>
    </main>
  );
}

function formatImportFailure(reason: 'invalid-json' | 'unsupported-schema' | 'invalid-save'): string {
  if (reason === 'invalid-json') return 'bad JSON';
  if (reason === 'unsupported-schema') return 'unsupported version';
  return 'invalid save';
}

function formatStarterConversionFailure(reason: 'already-converted' | 'missing-card' | 'missing-magic-dust'): string {
  if (reason === 'already-converted') return 'Starter Creatures already converted';
  if (reason === 'missing-card') return 'Missing starter Creature Cards';
  return 'Not enough Magic Dust';
}

function formatStarterFarmFailure(reason: 'already-built' | 'missing-card'): string {
  if (reason === 'already-built') return 'Magic Dust Farm already built';
  return 'Missing Magic Dust Farm Card';
}

function formatCardFailure(reason: string | undefined): string {
  if (reason === 'missing-card') return 'Card not available';
  if (reason === 'buff-slot-occupied') return 'Buff slot already active';
  if (reason === 'farm-type-locked') return 'Farm type already built';
  if (reason === 'wrong-card-type') return 'Card cannot use this action';
  if (reason === 'invalid-species') return 'Card points to unknown species';
  if (reason === 'missing-material') return 'Not enough Magic Dust';
  if (reason === 'missing-egg') return 'Egg not available';
  return `Card action failed${reason ? `: ${reason}` : ''}`;
}

function formatCreaturePartyFailure(reason: string | undefined): string {
  if (reason === 'missing-creature') return 'Creature not found';
  if (reason === 'party-full') return 'Active party is full';
  if (reason === 'already-active') return 'Creature already active';
  if (reason === 'already-stored') return 'Creature already stored';
  if (reason === 'missing-item') return 'No Revive item';
  if (reason === 'not-fainted') return 'Creature is not Fainted';
  if (reason === 'not-at-hospital') return 'Visit a Village Hospital first';
  return `Creature action failed${reason ? `: ${reason}` : ''}`;
}

function formatWildEncounterClaimFailure(reason: string | undefined): string {
  if (reason === 'in-battle') return 'Already in battle';
  if (reason === 'unavailable') return 'Wild Creature already claimed';
  if (reason === 'cooldown') return 'Wild Creature cooldown active';
  if (reason === 'range') return 'Face the wild Creature first';
  if (reason === 'no-ready-creature') return 'No ready Creature for battle';
  return `Wild claim failed${reason ? `: ${reason}` : ''}`;
}

function formatFarmCollectionFailure(reason: string | undefined): string {
  if (reason === 'empty') return 'Farm storage empty';
  if (reason === 'not-owner') return 'Only the village owner can collect';
  return `Farm collection failed${reason ? `: ${reason}` : ''}`;
}

function formatFarmTheftAttempt(result: { outcome: 'success' | 'failed'; stolenQuantity: number; costPaid: number }): string {
  if (result.outcome === 'success') {
    return `Theft succeeded: stole ${result.stolenQuantity} Magic Dust, paid ${result.costPaid}`;
  }
  return `Theft failed: paid ${result.costPaid} Magic Dust`;
}

function formatFarmTheftFailure(
  reason: string | undefined,
  result?: { cooldownUntil?: string; costRequired?: number }
): string {
  if (reason === 'cooldown' && result?.cooldownUntil) {
    return `Theft cooldown until ${new Date(result.cooldownUntil).toLocaleTimeString()}`;
  }
  if (reason === 'guarded') return 'Farm has an active guard';
  if (reason === 'empty') return 'Nothing stored to steal';
  if (reason === 'missing-magic-dust') return `Need ${result?.costRequired ?? 1} Magic Dust to attempt theft`;
  if (reason === 'owner-cannot-steal') return 'Owners collect instead of stealing';
  return `Theft failed${reason ? `: ${reason}` : ''}`;
}

function formatGuardedFarmTheftClaimFailure(reason: string | undefined): string {
  if (reason === 'range') return 'Face the guarded farm first';
  if (reason === 'in-battle') return 'Battle already in progress';
  if (reason === 'no-ready-creature') return 'No ready Creature for guard battle';
  if (reason === 'unguarded') return 'Farm guard is inactive';
  if (reason === 'owner-cannot-steal') return 'Owners collect instead of stealing';
  return `Guard battle failed${reason ? `: ${reason}` : ''}`;
}

function formatFarmUpgradeFailure(reason: string | undefined): string {
  if (reason === 'missing-farm') return 'Farm not found';
  if (reason === 'not-owner') return 'Only the village owner can upgrade';
  if (reason === 'max-level') return 'Farm is max level';
  if (reason === 'missing-card') return 'Need matching Farm Card';
  if (reason === 'missing-material') return 'Not enough Magic Dust';
  return `Farm upgrade failed${reason ? `: ${reason}` : ''}`;
}

function formatFarmGuardFailure(reason: string | undefined): string {
  if (reason === 'missing-farm') return 'Farm not found';
  if (reason === 'not-owner') return 'Only the village owner can assign guards';
  if (reason === 'missing-creature') return 'Creature not found';
  if (reason === 'creature-fainted') return 'Fainted Creatures cannot guard';
  return `Farm guard failed${reason ? `: ${reason}` : ''}`;
}

function formatStationTravelFailure(
  reason: string | undefined,
  result?: { costRequired?: number; destination?: { displayName: string } }
): string {
  if (reason === 'already-there') return 'Already at that station destination';
  if (reason === 'missing-destination') return 'Station destination not discovered';
  if (reason === 'unsafe-spawn') return 'Station destination spawn unavailable';
  if (reason === 'missing-magic-dust') return `Need ${result?.costRequired ?? 0} Magic Dust for station travel`;
  return `Station travel failed${reason ? `: ${reason}` : ''}`;
}

function formatBattleOutcome(result: BattleResultMessage): string {
  if (result.outcome === 'defeated') {
    const rewards = result.rewards;
    if (!rewards) return 'Battle won';
    const drops = [
      `${rewards.magicDust} Magic Dust`,
      `${rewards.playerExperience} player XP`,
      `${rewards.battlingCreatureExperience} Creature XP`,
      rewards.packSeed !== undefined ? 'Pack' : null,
      rewards.directDropEggSpeciesId !== undefined ? 'Egg' : null
    ].filter(Boolean);
    return `Battle won - ${drops.join(', ')}`;
  }
  if (result.outcome === 'lost') return 'Battle lost';
  return 'Ran from battle';
}

function getFacingEncounter(roomState: LocationRoomState | null, saveState: MonsterRpgSaveState | null) {
  if (!roomState || !saveState) return null;

  const deltaByDirection = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  } as const;
  const delta = deltaByDirection[saveState.position.facing];
  const targetX = saveState.position.x + delta.x;
  const targetY = saveState.position.y + delta.y;

  return (
    Object.values(roomState.encounters).find(
      (encounter) =>
        encounter.status === 'available' &&
        encounter.mapId === saveState.mapId &&
        encounter.x === targetX &&
        encounter.y === targetY
    ) ?? null
  );
}
