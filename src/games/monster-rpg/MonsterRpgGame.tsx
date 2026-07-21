import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { bootGame, type MonsterRpgGameRuntime } from './client';
import type { AccountConnection, BattleConnection, LocationTransitionMessage, MultiplayerConnection } from './network';
import { loadGuestCredential, saveGuestCredential, type AuthoritySnapshot } from './network/authorityProtocol';
import type { AuthorityIntent } from './network/authorityProtocol';
import {
  PackOpenTrace,
  createInitialSave,
  exportSave,
  getGameMap,
  getFacingFarm,
  getFirstBattleReadyCreature,
  getCardDefinition,
  isAtVillageHospital,
  isFarmTile,
  isVillageElderDialogComplete,
  loadMonsterRpgSettings,
  loadProfile,
  loadSaveResult,
  saveMonsterRpgSettings,
  type AvatarId,
  type BattleResultMessage,
  type BattleRoomState,
  type CreatureLabelMode,
  type Direction,
  type InputAction,
  type LocationRoomState,
  type MapId,
  type MonsterRpgSaveState,
  type MultiplayerStatus,
  type MovementResult
} from './sim';
import { CharacterCreator } from './ui/CharacterCreator';
import { clearLegacyBrowserSave, importAuthenticatedRecovery, RecoveryPanel, type RecoveryState } from './recovery';
import { GameHud } from './ui/GameHud';
import {
  appendGameLogEntry,
  beginProfileGameLogSession,
  createGameLogState,
  type GameLogKind
} from './ui/gameLog';
import { MobileDpad } from './ui/MobileDpad';
import { VillageElderOnboarding } from './ui/VillageElderOnboarding';

function getInitialState(): { state: MonsterRpgSaveState | null; error: string | null } {
  const saved = loadSaveResult();
  if (!saved.ok) return { state: null, error: `Save unavailable: ${saved.reason}` };
  if (saved.state) return { state: saved.state, error: null };

  const profile = loadProfile();
  return { state: profile ? createInitialSave(profile) : null, error: null };
}

export function MonsterRpgGame() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<MonsterRpgGameRuntime | null>(null);
  const connectionRef = useRef<MultiplayerConnection | null>(null);
  const accountConnectionRef = useRef<AccountConnection | null>(null);
  const credentialRef = useRef<string | null>(loadGuestCredential());
  const authorityRevisionRef = useRef<number>(0);
  const authorityRosterRevisionRef = useRef<number>(0);
  const authorityIntentSequenceRef = useRef(0);
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
  const initialState = useRef(getInitialState());
  const recoveryPayloadRef = useRef<string | null>(null);
  const [saveState, setSaveState] = useState<MonsterRpgSaveState | null>(initialState.current.state);
  const saveStateRef = useRef<MonsterRpgSaveState | null>(saveState);
  const freeMovementUnlockedRef = useRef(saveState ? isVillageElderDialogComplete(saveState) : false);
  const [lastMove, setLastMove] = useState<MovementResult | null>(null);
  const [roomState, setRoomState] = useState<LocationRoomState | null>(null);
  const [battleState, setBattleState] = useState<BattleRoomState | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(initialState.current.error);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(initialState.current.error ? 'error' : 'idle');
  const [gameLog, setGameLog] = useState(() => createGameLogState(saveState?.profile.playerId ?? null));
  const [packTrace, setPackTrace] = useState<PackOpenTrace | null>(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState<MultiplayerStatus>('offline');
  const [settings, setSettings] = useState(loadMonsterRpgSettings);
  const [farmStatusNow, setFarmStatusNow] = useState(Date.now());
  const [pendingStationDestinationId, setPendingStationDestinationId] = useState<string | null>(null);
  const [locationMapId, setLocationMapId] = useState<MapId | null>(saveState?.mapId ?? null);

  const adoptAuthoritySnapshot = useCallback((snapshot: AuthoritySnapshot) => {
    authorityRevisionRef.current = snapshot.revision;
    authorityRosterRevisionRef.current = snapshot.rosterRevision;
    saveStateRef.current = snapshot.save;
    freeMovementUnlockedRef.current = isVillageElderDialogComplete(snapshot.save);
    setSaveState(snapshot.save);
    setLocationMapId(snapshot.save.mapId);
    setImportStatus(null);
    clearLegacyBrowserSave();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import('./network').then(({ connectToAccount }) => connectToAccount(credentialRef.current ?? undefined)).then(async (account) => {
      if (cancelled) { account.leave(); return; }
      accountConnectionRef.current = account;
      account.onSnapshot(adoptAuthoritySnapshot);
      if (account.ready.credential) {
        credentialRef.current = account.ready.credential;
        saveGuestCredential(account.ready.credential);
      }
      if (account.ready.snapshot) {
        adoptAuthoritySnapshot(account.ready.snapshot);
        return;
      }
      // A pre-authority browser save is only offered once, before this guest aggregate exists.
      const legacy = initialState.current.state;
      if (legacy) {
        // Unsigned browser state is only used for the one-time internal bootstrap path.
        const result = await account.bootstrapLegacySave(exportSave(legacy));
        if (result.status === 'applied' || result.status === 'duplicate') adoptAuthoritySnapshot(result.snapshot);
      }
    }).catch((error) => {
      if (!cancelled) setImportStatus(`Authority unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
    });
    return () => { cancelled = true; accountConnectionRef.current?.leave(); accountConnectionRef.current = null; };
  }, [adoptAuthoritySnapshot]);

  const recordGameLog = useCallback((kind: GameLogKind, message: string) => {
    setGameLog((current) => appendGameLogEntry(current, kind, message));
  }, []);

  const submitAuthorityIntent = useCallback((intent: AuthorityIntent, successMessage?: string) => {
    const account = accountConnectionRef.current;
    if (!account) { setImportStatus('Authority connection is unavailable'); return; }
    const intentId = `ui-${Date.now()}-${++authorityIntentSequenceRef.current}`;
    void account.sendCommand({ intentId, expectedRevision: authorityRevisionRef.current, intent }).then((result) => {
      if (result.status !== 'rejected') {
        adoptAuthoritySnapshot(result.snapshot);
        if (successMessage) recordGameLog('interaction', successMessage);
      } else {
        if (result.snapshot) adoptAuthoritySnapshot(result.snapshot);
        recordGameLog('system', `Command rejected: ${result.code}`);
      }
    });
  }, [adoptAuthoritySnapshot, recordGameLog]);

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
      recordGameLog('battle', 'Battle in progress');
      return;
    }

    if (action.type === 'move' && currentState) {
      const farmBlock = getFarmFootprintMoveBlock(currentState, action);
      if (farmBlock) {
        setLastMove(farmBlock);
        setPendingStationDestinationId(null);
        return;
      }
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
      const farm = getFacingFarm(currentState);
      if (farm?.ownerPlayerId === currentState.profile.playerId) {
        submitAuthorityIntent({ type: 'collectFarm' }, 'Farm resources collected');
        setLastMove(null);
        setPackTrace(null);
        return;
      }
      if (farm && multiplayerStatusRef.current === 'online' && connectionRef.current) {
        if (farm.guardCreatureId) {
          connectionRef.current.sendClaimGuardedFarmTheft({ farmId: farm.id, activePartyCreatureIds: currentState.creatures.activePartyCreatureIds, expectedRosterRevision: authorityRosterRevisionRef.current });
          recordGameLog('battle', 'Challenging farm guard');
        } else {
          connectionRef.current.sendAttemptFarmTheft({ farmId: farm.id, intentId: `farm-${Date.now()}-${++authorityIntentSequenceRef.current}`, expectedRevision: authorityRevisionRef.current });
        }
        return;
      }
    }

    if (action.type === 'interact' && connectionRef.current && multiplayerStatusRef.current === 'online') {
      const encounter = getFacingEncounter(roomState, currentState);
      if (encounter) {
        const activeCreature = currentState ? getFirstBattleReadyCreature(currentState) : null;
        if (!activeCreature) {
          recordGameLog('battle', 'No ready Creature for battle');
          return;
        }
        connectionRef.current.sendClaimWildEncounter({ encounterId: encounter.id, activePartyCreatureIds: currentState!.creatures.activePartyCreatureIds, expectedRosterRevision: authorityRosterRevisionRef.current });
        recordGameLog('battle', `Claiming wild Creature #${encounter.speciesId}`);
      } else {
        recordGameLog('battle', 'No wild Creature ahead');
      }
      return;
    }

    if (action.type === 'move') recordGameLog('system', 'Movement is unavailable while offline');
  }, [battleState?.status, roomState, submitAuthorityIntent]);

  const handleCreateProfile = (name: string, avatar: AvatarId) => {
    const account = accountConnectionRef.current;
    if (!account) { setImportStatus('Authority connection is still starting'); return; }
    void account.bootstrapProfile({ name, avatar }).then((snapshot) => {
      adoptAuthoritySnapshot(snapshot);
      setGameLog((current) => beginProfileGameLogSession(current, snapshot.save.profile.playerId));
      setLastMove(null);
    }).catch(() => setImportStatus('Could not create canonical profile'));
  };

  const handleCompleteVillageElderDialog = () => {
    submitAuthorityIntent({ type: 'completeElderDialog' }, 'Starter Pack received');
  };

  const handleConvertStarterCards = () => submitAuthorityIntent({ type: 'convertCreatureCard', starter: true }, 'Starter Creatures joined');

  const handleBuildStarterFarm = () => submitAuthorityIntent({ type: 'createFarm', starter: true }, 'Magic Dust Farm built');

  const handleFinishVillageElderOnboarding = () => {
    submitAuthorityIntent({ type: 'completeOnboarding' }, 'Onboarding complete');
  };

  const handleDiscardItem = (stackId: string, quantity: number) => { if (window.confirm(`Discard ${quantity} item${quantity === 1 ? '' : 's'}?`)) submitAuthorityIntent({ type: 'discardItem', stackId, quantity, confirmed: true }, 'Item discarded'); };

  const handleClaimReward = (sourceId: string) => submitAuthorityIntent({ type: 'claimReward', sourceId }, 'Reward claimed');

  const handleActivateCard = (cardId: string) => {
    const type = getCardDefinition(cardId)?.type;
    if (type === 'material') submitAuthorityIntent({ type: 'activateMaterialCard', cardId }, 'Material card activated');
    else if (type === 'buff') submitAuthorityIntent({ type: 'activateBuffCard', cardId }, 'Buff card activated');
    else recordGameLog('interaction', 'Unknown card action');
  };

  const handleRouteCardToElder = (cardId: string) => {
    const type = getCardDefinition(cardId)?.type;
    if (type === 'creature') submitAuthorityIntent({ type: 'convertCreatureCard', cardId }, 'Creature card routed to Elder');
    else if (type === 'farm') submitAuthorityIntent({ type: 'buildFarmCard', cardId }, 'Farm card routed to Elder');
    else recordGameLog('interaction', 'Card cannot use Village Elder action');
  };

  const handleHatchEgg = (eggId: string) => {
    setPackTrace(null);
    submitAuthorityIntent({ type: 'hatchEgg', eggId }, 'Egg hatched');
  };

  const handleHospitalHeal = () => {
    setPackTrace(null);
    submitAuthorityIntent({ type: 'healAll' }, 'Hospital full heal complete');
  };

  const handleReviveCreature = (creatureId: string) => {
    submitAuthorityIntent({ type: 'revive', creatureId }, 'Revive item used');
  };

  const handleMoveCreatureToActive = (creatureId: string) => {
    submitAuthorityIntent({ type: 'moveCreatureToActiveParty', creatureId }, 'Creature moved to active party');
  };

  const handleMoveCreatureToStorage = (creatureId: string) => {
    submitAuthorityIntent({ type: 'moveCreatureToStorage', creatureId }, 'Creature moved to storage');
  };

  const handleUpgradeFarm = (farmId: string) => {
    submitAuthorityIntent({ type: 'upgradeFarm', farmId }, 'Farm upgraded');
  };

  const handleAssignFarmGuard = (farmId: string, creatureId: string | null) => {
    submitAuthorityIntent({ type: 'setFarmGuard', farmId, creatureId }, creatureId ? 'Farm guard assigned' : 'Farm guard cleared');
  };

  const handlePrepareStationTravel = (destinationId: string) => {
    setPendingStationDestinationId(destinationId);
    recordGameLog('travel', 'Confirm station travel');
  };

  const handleCancelStationTravel = () => {
    setPendingStationDestinationId(null);
    recordGameLog('travel', 'Station travel canceled');
  };

  const handleConfirmStationTravel = (destinationId: string) => {
    setPendingStationDestinationId(null);
    submitAuthorityIntent({ type: 'stationTravel', destinationId }, 'Station travel confirmed');
  };

  const handleExportSave = async () => {
    const account = accountConnectionRef.current;
    const currentSave = saveStateRef.current;
    if (!account || !currentSave) return;
    const playerId = currentSave.profile.playerId;
    const envelope = await account.exportAuthenticatedSave();
    const blob = new Blob([envelope], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gameit-monsters-${playerId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    recordGameLog('system', 'Save exported');
  };

  const importAuthenticatedPayload = async (payload: string) => {
    const account = accountConnectionRef.current;
    if (!account) { setImportStatus('Authority connection is unavailable'); setRecoveryState('error'); return; }
    setRecoveryState('pending'); setImportStatus('Recovering authenticated progress…');
    let snapshot: AuthoritySnapshot;
    try { snapshot = await importAuthenticatedRecovery(account, payload); }
    catch (error) { const message = `Import failed: ${error instanceof Error ? error.message : 'invalid transfer'}`; setImportStatus(message); setRecoveryState('error'); recordGameLog('system', message); return; }
    adoptAuthoritySnapshot(snapshot);
    setRecoveryState('success'); setImportStatus('Authenticated progress recovered.');
    setLastMove(null);
    setRoomState(null);
    recordGameLog('system', 'Authenticated save imported');
  };

  const handleImportSave = async (file: File) => {
    try { recoveryPayloadRef.current = await file.text(); }
    catch { setImportStatus('Import failed: unable to read file'); setRecoveryState('error'); return; }
    await importAuthenticatedPayload(recoveryPayloadRef.current);
  };

  const handleReset = () => {
    if (window.confirm('Reset progress? Your profile identity and audit history will be retained.')) submitAuthorityIntent({ type: 'resetProgress', confirmed: true }, 'Progress reset');
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
    const connectMapId = locationMapId ?? connectState.mapId;
    const pendingTransition =
      pendingTransitionRef.current?.toMapId === connectMapId ? pendingTransitionRef.current : null;
    updateMultiplayerStatus('connecting');

    async function connect() {
      try {
        const { connectToLocation } = await import('./network');
        const connection = await connectToLocation(
          connectMapId,
          {
            mapId: connectMapId,
            credential: credentialRef.current ?? undefined,
            transitionId: pendingTransition?.transitionId
          },
          {
            onAuthoritySnapshot: adoptAuthoritySnapshot,
            onRoomState: (nextRoomState) => {
              if (cancelled) return;

              setRoomState(nextRoomState);
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
              setLocationMapId(transition.toMapId);
              setLastMove((current) => current && { ...current, transition, moved: true, blocked: false });
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
              recordGameLog('battle', 'Battle started');
              void connectBattleRoom(claim.battleId, claim.battleToken);
            },
            onWildEncounterClaimRejected: (message) => {
              if (!cancelled) {
                recordGameLog('battle', formatWildEncounterClaimFailure(message.reason));
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
              recordGameLog('battle', 'Guard battle started');
              void connectBattleRoom(claim.battleId, claim.battleToken);
            },
            onGuardedFarmTheftClaimRejected: (message) => {
              if (!cancelled) {
                recordGameLog('battle', formatGuardedFarmTheftClaimFailure(message.reason));
              }
            },
            onFarmTheftResult: (result) => {
              if (cancelled) return;
              if (result.status === 'rejected') {
                if (result.snapshot) adoptAuthoritySnapshot(result.snapshot);
                recordGameLog('interaction', `Theft failed: ${result.code}`);
                return;
              }
              adoptAuthoritySnapshot(result.snapshot);
              recordGameLog('interaction', 'Farm theft resolved');
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
        moveSequenceRef.current = 0;
        updateMultiplayerStatus('online');
      } catch (error) {
        if (cancelled) return;
        if (isBalanceVersionMismatch(error)) {
          connectionRef.current = null;
          setRoomState(null);
          setImportStatus('Multiplayer unavailable: game balance version mismatch');
          updateMultiplayerStatus('offline');
          return;
        }
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
  }, [locationMapId, saveState?.profile.playerId, saveState?.mapId, updateMultiplayerStatus]);

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
            credential: credentialRef.current ?? undefined
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
        if (isBalanceVersionMismatch(error)) {
          activeBattleClaimRef.current = null;
          setBattleState(null);
          setImportStatus('Battle unavailable: game balance version mismatch');
          return;
        }
        console.warn('[monster-rpg] battle room unavailable', error);
        activeBattleClaimRef.current = null;
        setBattleState(null);
        recordGameLog('battle', 'Battle unavailable');
      }
    },
    []
  );

  const applyBattleResult = useCallback((result: BattleResultMessage, battleToken: string) => {
    const claim = activeBattleClaimRef.current;
    if (!claim || claim.battleId !== result.battleId) return;
    recordGameLog('battle', formatBattleOutcome(result));

    if (claim.kind === 'wild' && claim.encounterId) {
      connectionRef.current?.sendResolveWildEncounter({
        encounterId: result.encounterId,
        outcome: result.outcome,
        battleId: result.battleId,
        battleToken
      });

    }
    activeBattleClaimRef.current = null;
    battleConnectionRef.current?.leave({ silent: true });
    battleConnectionRef.current = null;
  }, [recordGameLog]);

  if (!saveState) {
    return <main className="monster-game-shell">
      <RecoveryPanel
        canRetry={recoveryPayloadRef.current !== null}
        onImport={(file) => { void handleImportSave(file); }}
        onRetry={() => { if (recoveryPayloadRef.current) void importAuthenticatedPayload(recoveryPayloadRef.current); }}
        state={recoveryState}
        status={importStatus}
      />
      <CharacterCreator onCreate={handleCreateProfile} />
    </main>;
  }

  const activeMap = getGameMap(locationMapId ?? saveState.mapId);

  return (
    <main className="monster-game-shell" aria-label="GameIt Monsters">
      <div className="monster-game-stage">
        <div className="monster-canvas-host" ref={canvasHostRef} />
        <GameHud
          canUseHospital={isAtVillageHospital(saveState)}
          gameLog={gameLog}
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
          onDiscardItem={handleDiscardItem}
          onClaimReward={handleClaimReward}
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

function isBalanceVersionMismatch(error: unknown): error is { code: 'BALANCE_VERSION_MISMATCH' } {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === 'BALANCE_VERSION_MISMATCH');
}

const moveDeltaByDirection: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

function getFarmFootprintMoveBlock(
  state: MonsterRpgSaveState,
  action: InputAction
): MovementResult | null {
  if (action.type !== 'move') return null;

  const delta = moveDeltaByDirection[action.direction];
  const targetX = state.position.x + delta.x;
  const targetY = state.position.y + delta.y;
  const blocked = Object.values(state.farms.farms).some(
    (farm) => farm.position.mapId === state.position.mapId && isFarmTile(farm, targetX, targetY)
  );

  if (!blocked) return null;

  return {
    state: {
      ...state,
      position: {
        ...state.position,
        facing: action.direction
      },
      updatedAt: new Date().toISOString()
    },
    moved: false,
    blocked: true,
    blockedBy: 'farm'
  };
}

function formatWildEncounterClaimFailure(reason: string | undefined): string {
  if (reason === 'in-battle') return 'Already in battle';
  if (reason === 'unavailable') return 'Wild Creature already claimed';
  if (reason === 'cooldown') return 'Wild Creature cooldown active';
  if (reason === 'range') return 'Face the wild Creature first';
  if (reason === 'no-ready-creature') return 'No ready Creature for battle';
  return `Wild claim failed${reason ? `: ${reason}` : ''}`;
}

function formatGuardedFarmTheftClaimFailure(reason: string | undefined): string {
  if (reason === 'range') return 'Face the guarded farm first';
  if (reason === 'in-battle') return 'Battle already in progress';
  if (reason === 'no-ready-creature') return 'No ready Creature for guard battle';
  if (reason === 'unguarded') return 'Farm guard is inactive';
  if (reason === 'owner-cannot-steal') return 'Owners collect instead of stealing';
  return `Guard battle failed${reason ? `: ${reason}` : ''}`;
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
