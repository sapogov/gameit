import { strict as assert } from 'node:assert';
import { Client, Room } from '@colyseus/sdk';
import { matchMaker, Server } from 'colyseus';
import { BattleRoom } from '../server/rooms/BattleRoom';
import { AccountRoom } from '../server/rooms/AccountRoom';
import { LocationRoom } from '../server/rooms/LocationRoom';
import { issueGuestCredential } from '../server/auth/guestCredentials';
import { authorityRepository, guestCredentialConfig, playerAuthority } from '../server/authority/runtime';
import type { AuthorityIntent, AuthoritySnapshot } from '../src/games/monster-rpg/network/authorityProtocol';
import {
  buildingDefinitions,
  canEnterTile,
  createInitialSave,
  CURRENT_BALANCE_VERSION,
  getGameMap,
  generatedMapRegistry,
  getVillageDefinition,
  loadProfile,
  loadSave,
  MONSTER_RPG_PROFILE_KEY,
  MONSTER_RPG_SCHEMA_VERSION,
  MONSTER_RPG_SAVE_KEY,
  movePlayer,
  GEN_1_SPECIES_COUNT,
  gen1SpeciesCatalog,
  getJournalSpeciesViewState,
  recordCreatureDiscovered,
  recordWildCreatureSeen,
  findWalkPath,
  findWalkPathToInteractionDistance,
  GAME_BALANCE_CONFIG,
  validateSpeciesCatalog,
  type CreatureSaveRecord,
  type MonsterRpgSaveState,
  type PlayerProfile
} from '../src/games/monster-rpg/sim';
import type { Direction, MapId, MoveIntentMessage, WorldPosition } from '../src/games/monster-rpg/sim/types';

const storage = createMemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true
});

const sdkMoveSequencesBySessionId = new Map<string, number>();
const canonicalPlayersByProfileId = new Map<string, CanonicalPlayer>();

interface CanonicalPlayer {
  credential: string;
  principal: { sub: string };
  snapshot: AuthoritySnapshot;
}

void runChecks().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

async function runChecks(): Promise<void> {
  checkSaveReset();
  checkInitialSaveStartsInHomeVillage();
  checkHomeVillageEastGateExit();
  checkOverworldVillageEntry();
  checkBuildingEntryAndExit();
  checkBlockedMovement();
  checkTapToWalkPathing();
  checkGen1SpeciesCatalog();
  checkCreatureJournalStates();
  await checkSdkMultiplayerFlow();
  console.log('monster-rpg phase 4 sim and SDK checks passed');
}

function checkSaveReset(): void {
  storage.setItem(
    MONSTER_RPG_PROFILE_KEY,
    JSON.stringify({
      id: 'phase-3-profile',
      name: 'Old Save',
      avatar: 'scout',
      homeVillageId: 'home-village'
    })
  );
  storage.setItem(
    MONSTER_RPG_SAVE_KEY,
    JSON.stringify({
      profile: { id: 'phase-3-profile', name: 'Old Save', avatar: 'scout', homeVillageId: 'home-village' },
      mapId: 'greenway-route',
      position: { mapId: 'greenway-route', x: 1, y: 9, facing: 'east' },
      updatedAt: new Date().toISOString()
    })
  );

  assert.deepEqual(loadSave(), { ok: false, reason: 'invalid-save' });
  assert.equal(loadProfile(), null);
  assert.notEqual(storage.getItem(MONSTER_RPG_SAVE_KEY), null);
  assert.equal(storage.getItem(MONSTER_RPG_PROFILE_KEY), null);
}

function checkInitialSaveStartsInHomeVillage(): void {
  const save = createInitialSave(createProfile('initial-save'));

  assert.equal(save.mapId, 'home-village');
  assert.deepEqual(save.position, getGameMap('home-village').spawn);
}

function checkOverworldVillageEntry(): void {
  const state = createState('world-map', 17, 47, 'east');
  const result = movePlayer(state, { type: 'move', direction: 'east' }, getGameMap('world-map'));

  assert.equal(result.moved, true);
  assert.equal(result.blocked, false);
  assert.equal(result.transition?.toMapId, 'home-village');
  assert.equal(result.state.mapId, 'home-village');
  assert.deepEqual(result.state.position, {
    mapId: 'home-village',
    x: 28,
    y: 10,
    facing: 'west'
  });
}

function checkHomeVillageEastGateExit(): void {
  const homeVillage = getGameMap('home-village');
  const homeVillageDefinition = getVillageDefinition('home-village');
  const state = createState('home-village', 28, 10, 'east');
  const result = movePlayer(state, { type: 'move', direction: 'east' }, homeVillage);

  assert.equal(result.moved, true);
  assert.equal(result.blocked, false);
  assert.equal(result.transition?.toMapId, 'world-map');
  assert.deepEqual(result.state.position, homeVillageDefinition.returnSpawn);
}

function checkBuildingEntryAndExit(): void {
  const homeBuildings = buildingDefinitions.filter((building) => building.villageId === 'home-village');
  const checkedTypes = new Set<string>();

  homeBuildings.forEach((building) => {
    checkedTypes.add(building.type);

    const villageMap = getGameMap('home-village');
    const enterState = createState(building.villageId, building.returnSpawn.x, building.returnSpawn.y, 'north');
    const entered = movePlayer(enterState, { type: 'move', direction: 'north' }, villageMap);

    assert.equal(entered.transition?.toMapId, building.interiorMapId);
    assert.equal(entered.state.mapId, building.interiorMapId);

    const interiorMap = getGameMap(building.interiorMapId);
    const nearDoor = movePlayer(entered.state, { type: 'move', direction: 'south' }, interiorMap);
    const exited = movePlayer(nearDoor.state, { type: 'move', direction: 'south' }, interiorMap);

    assert.equal(exited.transition?.toMapId, 'home-village');
    assert.equal(exited.state.mapId, 'home-village');
    assert.deepEqual(exited.state.position, building.returnSpawn);
  });

  assert.deepEqual([...checkedTypes].sort(), ['clinic', 'house', 'post-office', 'shop', 'tavern', 'town-hall']);
}

function checkBlockedMovement(): void {
  const state = createState('world-map', 61, 3, 'south');
  const result = movePlayer(state, { type: 'move', direction: 'east' }, getGameMap('world-map'));

  assert.equal(result.moved, false);
  assert.equal(result.blocked, true);
  assert.equal(result.blockedBy, 'water');
  assert.equal(result.state.position.x, 61);
  assert.equal(result.state.position.y, 3);
  assert.equal(result.state.position.facing, 'east');
}

function checkTapToWalkPathing(): void {
  const homeVillage = getGameMap('home-village');
  const homeStart = createState('home-village', 28, 10, 'east').position;
  assert.deepEqual(findWalkPath(homeVillage, homeStart, 29, 10), ['east']);

  const worldMap = getGameMap('world-map');
  const worldStart = createState('world-map', 61, 3, 'south').position;
  assert.equal(findWalkPath(worldMap, worldStart, 62, 3), null);
  assert.equal(findWalkPath(worldMap, worldStart, -1, 3), null);

  const encounterPath = findWalkPathToInteractionDistance(homeVillage, homeStart, 25, 10);
  assert.ok(encounterPath, 'tap path should stop at interaction distance for visible Creatures');
}

function checkGen1SpeciesCatalog(): void {
  assert.equal(gen1SpeciesCatalog.length, GEN_1_SPECIES_COUNT);
  assert.deepEqual(validateSpeciesCatalog(), []);
}

function checkCreatureJournalStates(): void {
  const save = createInitialSave(createProfile('journal-checker'));
  const seen = recordWildCreatureSeen(save, 1);
  const discovered = recordCreatureDiscovered(seen, 1);

  assert.equal(getJournalSpeciesViewState(save, 1), 'unseen');
  assert.equal(getJournalSpeciesViewState(seen, 1), 'silhouette');
  assert.equal(getJournalSpeciesViewState(discovered, 1), 'discovered');
  assert.equal(recordWildCreatureSeen(discovered, 1), discovered);
}

async function checkSdkMultiplayerFlow(): Promise<void> {
  const port = 26_700 + Math.floor(Math.random() * 200);
  const server = new Server({ greet: false });
  server.define('account', AccountRoom);
  server.define('location', LocationRoom).filterBy(['mapId']);
  server.define('battle', BattleRoom).filterBy(['battleId']);
  await server.listen(port, '127.0.0.1');

  try {
    const endpoint = `ws://127.0.0.1:${port}`;
    await checkBalanceCompatibility(endpoint);
    await checkTwoClientsShareWorldMap(endpoint);
    await checkWorldToVillageRoomHandoff(endpoint);
    await checkTwoClientsShareBuildingInterior(endpoint);
    await checkSharedWildEncounterClaimFlow(endpoint);
    await checkInvalidMapIdRejected(endpoint);
    await checkBlockedTerrainRejectedOnline(endpoint);
    await checkGeneratedMapSdkFlow(endpoint);
    await checkTrainerBattleSdkFlow(endpoint);
  } finally {
    await server.gracefullyShutdown(false);
  }
}

async function checkBalanceCompatibility(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  const room = await joinLocation(client, 'world-map', createProfile('balance-control'));
  assert.equal(room.state.balanceVersion, CURRENT_BALANCE_VERSION);
  const playerCount = getPlayerCount(room);
  for (const version of [0, undefined, CURRENT_BALANCE_VERSION + 1]) {
    const locationCredential = await credentialFor(createProfile(`location-${String(version)}`));
    await assertBalanceReject(() => client.joinOrCreate('location', { mapId: 'world-map', credential: locationCredential, ...generatedMapIdentity(), ...(version === undefined ? {} : { balanceVersion: version }) }), version);
    assert.equal(getPlayerCount(room), playerCount);
    const battleCredential = await credentialFor(createProfile(`battle-${String(version)}`));
    await assertBalanceReject(() => client.joinOrCreate('battle', { battleId: 'missing', battleToken: 'missing', credential: battleCredential, ...(version === undefined ? {} : { balanceVersion: version }) }), version);
    assert.equal((await matchMaker.query({ name: 'battle' })).length, 0, 'rejected battle version must not create a room');
  }
  await leaveRoom(room);
}

async function assertBalanceReject(join: () => Promise<unknown>, clientBalanceVersion: number | undefined): Promise<void> {
  try { await join(); } catch (error) {
    const candidate = error as { code?: unknown; message?: unknown };
    assert.equal(candidate.code, 409);
    assert.equal(candidate.message, JSON.stringify({ code: 'BALANCE_VERSION_MISMATCH', serverBalanceVersion: CURRENT_BALANCE_VERSION, clientBalanceVersion: clientBalanceVersion ?? null }));
    return;
  }
  assert.fail('expected balance version rejection');
}

async function checkTwoClientsShareWorldMap(endpoint: string): Promise<void> {
  const clientA = new Client(endpoint);
  const clientB = new Client(endpoint);
  const roomA = await joinLocation(clientA, 'world-map', createProfile('world-a'));
  const roomB = await joinLocation(clientB, 'world-map', createProfile('world-b'));

  await waitFor(() => getPlayerCount(roomA) === 2 && getPlayerCount(roomB) === 2, 'two clients share world-map');

  await leaveRoom(roomA);
  await leaveRoom(roomB);
}

async function checkWorldToVillageRoomHandoff(endpoint: string): Promise<void> {
  const clientA = new Client(endpoint);
  const clientB = new Client(endpoint);
  const profileA = createProfile('world-to-village-a');
  const roomA = await joinLocation(clientA, 'world-map', profileA);
  const roomB = await joinLocation(clientB, 'world-map', createProfile('world-to-village-b'));

  await sendMoves(roomA, ['north']);
  const transition = await sendMoveForTransition(roomA, 'north');
  assert.equal(transition.toMapId, 'home-village');

  await leaveRoom(roomA);
  const villageRoom = await joinLocation(clientA, transition.toMapId, profileA, transition.transitionId);

  await waitFor(() => getPlayerCount(roomB) === 1, 'transitioning player leaves world room');
  assert.equal(villageRoom.state.mapId, 'home-village');
  await sendFirstValidMove(villageRoom);

  await leaveRoom(villageRoom);
  await leaveRoom(roomB);
}

async function checkTwoClientsShareBuildingInterior(endpoint: string): Promise<void> {
  const clientA = new Client(endpoint);
  const clientB = new Client(endpoint);
  const profileA = createProfile('interior-a');
  const profileB = createProfile('interior-b');
  const roomA = await joinLocation(clientA, 'home-village', profileA);
  const roomB = await joinLocation(clientB, 'home-village', profileB);

  const transitionA = await enterHomeVillageShop(roomA);
  await leaveRoom(roomA);
  const interiorA = await joinLocation(clientA, transitionA.toMapId, profileA, transitionA.transitionId);

  const transitionB = await enterHomeVillageShop(roomB);
  await leaveRoom(roomB);
  const interiorB = await joinLocation(clientB, transitionB.toMapId, profileB, transitionB.transitionId);

  await waitFor(() => getPlayerCount(interiorA) === 2 && getPlayerCount(interiorB) === 2, 'two clients share building interior');
  assert.equal(interiorA.state.mapKind, 'interior');
  assert.equal(interiorA.state.mapId, 'home-village-shop-interior');
  await sendFirstValidMove(interiorA);

  await leaveRoom(interiorA);
  await leaveRoom(interiorB);
}

async function checkSharedWildEncounterClaimFlow(endpoint: string): Promise<void> {
  const clientA = new Client(endpoint);
  const clientB = new Client(endpoint);
  const profileA = createProfile('encounter-a');
  const profileB = createProfile('encounter-b');
  const roomA = await joinLocation(clientA, 'home-village', profileA);
  const roomB = await joinLocation(clientB, 'home-village', profileB);
  const encounter = await waitForEncounter(roomA);
  const claimant = await canonicalPlayerFor(profileA);
  const path = findPathToAdjacentFacing('home-village', getLocalPosition(roomA), encounter);

  assert.ok(path, `missing path to encounter ${encounter.id}`);
  await sendMoves(roomA, path.directions);

  const claimed = new Promise<{ status: 'claimed'; encounterId: string; speciesId: number; battleId: string; battleToken: string } | { status: 'rejected'; reason: string }>((resolve) => {
    roomA.onMessage('wildEncounterClaimed', (message) => resolve({ status: 'claimed', ...message }));
    roomA.onMessage('wildEncounterClaimRejected', (message) => resolve({ status: 'rejected', reason: message.reason }));
  });
  roomA.send('claimWildEncounter', {
    encounterId: encounter.id,
    activePartyCreatureIds: claimant.snapshot.save.creatures.activePartyCreatureIds,
    expectedRosterRevision: claimant.snapshot.rosterRevision
  });
  const claimedMessage = await withTimeout(claimed, 'wild encounter claimed');
  if (claimedMessage.status === 'rejected') {
    assert.fail(`wild encounter claim rejected: ${claimedMessage.reason}`);
  }

  assert.equal(claimedMessage.encounterId, encounter.id);
  assert.equal(typeof claimedMessage.speciesId, 'number');
  assert.equal(typeof claimedMessage.battleId, 'string');
  assert.equal(typeof claimedMessage.battleToken, 'string');
  await waitFor(() => roomB.state.encounters.get(encounter.id)?.status === 'claimed', 'shared encounter claimed');
  assert.equal(roomA.state.players.get(roomA.sessionId)?.inBattle, true);

  const beforeBattleMove = getLocalPosition(roomA);
  roomA.send('moveIntent', nextMoveMessage(roomA, 'north'));
  await new Promise((resolve) => setTimeout(resolve, 75));
  assert.deepEqual(getLocalPosition(roomA), beforeBattleMove);

  await assert.rejects(
    async () =>
      clientB.joinOrCreate('battle', {
        battleId: claimedMessage.battleId,
        battleToken: claimedMessage.battleToken,
        credential: await credentialFor(profileB),
        balanceVersion: CURRENT_BALANCE_VERSION
      }),
    /Spectating disabled|Failed to|forbidden/i
  );

  const battleRoom = (await clientA.joinOrCreate('battle', {
    battleId: claimedMessage.battleId,
    battleToken: claimedMessage.battleToken,
    credential: await credentialFor(profileA),
    balanceVersion: CURRENT_BALANCE_VERSION
  })) as SdkRoom;
  await waitFor(() => battleRoom.state.status === 'active', 'battle room active');
  assert.equal(battleRoom.state.balanceVersion, CURRENT_BALANCE_VERSION);

  const battleResult = new Promise<{ battleId: string; encounterId: string; outcome: string }>((resolve) => {
    battleRoom.onMessage('battleResult', resolve);
  });
  assert.equal(battleRoom.state.canRun, true);
  const maximumRunIntents = getMaximumRunIntents();
  for (let attempt = 0; attempt < maximumRunIntents && battleRoom.state.status === 'active'; attempt += 1) {
    const previousRunAttempts = battleRoom.state.runAttempts;
    battleRoom.send('run');
    await waitFor(
      () => battleRoom.state.status !== 'active' || battleRoom.state.runAttempts > previousRunAttempts,
      'run attempt progress or terminal battle state'
    );
  }
  const battleResultMessage = await withTimeout(battleResult, 'battle run result');
  assert.ok(['ran', 'lost'].includes(battleResultMessage.outcome));
  assert.equal(battleRoom.state.status, battleResultMessage.outcome === 'ran' ? 'ran' : 'player-lost');

  const released = new Promise<{ encounterId: string; outcome: string }>((resolve) => {
    roomA.onMessage('wildEncounterReleased', resolve);
  });
  roomA.send('resolveWildEncounter', {
    encounterId: encounter.id,
    outcome: battleResultMessage.outcome,
    battleId: claimedMessage.battleId,
    battleToken: claimedMessage.battleToken
  });
  const releasedMessage = await withTimeout(released, 'wild encounter released');

  assert.equal(releasedMessage.outcome, battleResultMessage.outcome);
  await waitFor(() => roomA.state.encounters.get(encounter.id)?.status === 'available', 'encounter released after terminal battle');
  assert.equal(roomA.state.players.get(roomA.sessionId)?.inBattle, false);

  await refreshCanonicalSnapshot(claimant);
  const rejected = new Promise<{ encounterId: string; reason: string }>((resolve) => {
    roomA.onMessage('wildEncounterClaimRejected', resolve);
  });
  roomA.send('claimWildEncounter', {
    encounterId: encounter.id,
    activePartyCreatureIds: claimant.snapshot.save.creatures.activePartyCreatureIds,
    expectedRosterRevision: claimant.snapshot.rosterRevision
  });
  const rejectedMessage = await withTimeout(rejected, 'wild encounter cooldown reject');

  assert.equal(rejectedMessage.reason, 'cooldown');

  await leaveRoom(battleRoom);
  await leaveRoom(roomA);
  await leaveRoom(roomB);
}

async function checkInvalidMapIdRejected(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  await assert.rejects(
    async () => client.joinOrCreate('location', {
      mapId: 'greenway-route',
      credential: await credentialFor(createProfile('invalid-map')),
      balanceVersion: CURRENT_BALANCE_VERSION,
      ...generatedMapIdentity()
    }),
    /Invalid map id|no available handler|Failed to/
  );
}

async function checkGeneratedMapSdkFlow(endpoint: string): Promise<void> {
  const client = new Client(endpoint); const town = await joinLocation(client, 'tracer-water-town', createProfile('generated-town'));
  assert.equal(town.state.mapSetId, generatedMapRegistry.handshake().id);
  await sendMoves(town, ['west']); const transition = await sendMoveForTransition(town, 'south'); assert.equal(transition.toMapId, 'tracer-world-route'); await leaveRoom(town);
  const route = await joinLocation(client, 'tracer-world-route', createProfile('generated-town'), transition.transitionId); assert.equal(route.state.mapId, 'tracer-world-route');
  const generatedRoute = generatedMapRegistry.require('tracer-world-route'); const routeMap = getGameMap('tracer-world-route');
  assert.ok(generatedRoute.collisions.length > 0, 'generated collision metadata is preserved'); assert.equal(generatedRoute.blocked.flat().some(Boolean), false, 'geometry collision is not enforced by v1 square movement');
  const start = getLocalPosition(route); const movementProbe = ([{ direction: 'north' as const, x: start.x, y: start.y - 1 }, { direction: 'east' as const, x: start.x + 1, y: start.y }, { direction: 'south' as const, x: start.x, y: start.y + 1 }, { direction: 'west' as const, x: start.x - 1, y: start.y }]).find((candidate) => canEnterTile(routeMap, candidate.x, candidate.y) && !routeMap.exits.some((exit) => exit.x === candidate.x && exit.y === candidate.y));
  assert.ok(movementProbe, 'reachable generated square-grid movement'); await sendMoves(route, [movementProbe.direction]); assert.deepEqual(getLocalPosition(route), { ...start, x: movementProbe.x, y: movementProbe.y, facing: movementProbe.direction }); await leaveRoom(route);
  await assert.rejects(async () => client.joinOrCreate('location', { mapId: 'tracer-water-town', credential: await credentialFor(createProfile('bad-handshake')), balanceVersion: CURRENT_BALANCE_VERSION, mapSetId: 'wrong', mapSetVersion: '0' }), /map-set version mismatch|409|Failed to/);
}

async function checkTrainerBattleSdkFlow(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  const secondClient = new Client(endpoint);
  const profile = createProfile('trainer-sdk');
  const opponent = createProfile('trainer-sdk-opponent');
  const player = await canonicalPlayerFor(profile);
  const location = await joinLocation(client, 'tracer-world-route', profile);

  const rejectedOutOfRange = nextMessage<{ objectId: string; reason: string }>(location, 'trainerChallengeRejected');
  location.send('challengeTrainer', { objectId: 'route-scout-trainer', activePartyCreatureIds: player.snapshot.save.creatures.activePartyCreatureIds, expectedRosterRevision: player.snapshot.rosterRevision });
  assert.equal((await withTimeout(rejectedOutOfRange, 'out-of-range trainer challenge')).reason, 'REJECTED');

  await prepareTrainerBattleParty(player);
  const staleRoster = nextMessage<{ objectId: string; reason: string }>(location, 'trainerChallengeRejected');
  location.send('challengeTrainer', { objectId: 'route-scout-trainer', activePartyCreatureIds: player.snapshot.save.creatures.activePartyCreatureIds, expectedRosterRevision: player.snapshot.rosterRevision - 1 });
  assert.equal((await withTimeout(staleRoster, 'stale trainer roster rejection')).reason, 'REJECTED');

  const claimMessage = nextMessage<TrainerChallengeClaim>(location, 'trainerChallengeClaimed');
  location.send('challengeTrainer', trainerChallengePayload(player));
  const claim = await withTimeout(claimMessage, 'trainer challenge claim');
  assert.deepEqual({ objectId: claim.objectId, trainerId: claim.trainerId }, { objectId: 'route-scout-trainer', trainerId: 'route-scout-1' });

  const secondLocation = (await secondClient.joinOrCreate('location', {
    mapId: 'tracer-world-route', credential: player.credential, balanceVersion: CURRENT_BALANCE_VERSION, ...generatedMapIdentity()
  })) as SdkRoom;
  await waitFor(() => secondLocation.state?.players?.get?.(secondLocation.sessionId)?.inBattle === true, 'second location session battle lock');
  const lockedPosition = getLocalPosition(secondLocation);
  secondLocation.send('moveIntent', nextMoveMessage(secondLocation, 'north'));
  await assertPositionRemains(secondLocation, lockedPosition, 'locked player remains immobile');

  await assert.rejects(
    async () => secondClient.joinOrCreate('battle', { battleId: claim.battleId, battleToken: claim.battleToken, credential: await credentialFor(opponent), balanceVersion: CURRENT_BALANCE_VERSION }),
    /Spectating disabled|Failed to|forbidden/i
  );

  const battle = (await client.joinOrCreate('battle', {
    battleId: claim.battleId, battleToken: claim.battleToken, credential: player.credential, balanceVersion: CURRENT_BALANCE_VERSION
  })) as SdkRoom;
  await waitFor(() => battle.state.status === 'active' && battle.state.battleKind === 'trainer', 'active trainer battle');
  assert.equal(battle.state.trainerId, 'route-scout-1');

  const activeCreatureId = battle.state.playerActiveCreatureId;
  const reserveCreatureId = Array.from(battle.state.playerParty as Iterable<any>).find((creature: any) => creature.id !== activeCreatureId)?.id;
  assert.equal(typeof reserveCreatureId, 'string', 'trainer SDK party has a reserve');
  const invalidSwitch = nextMessage<{ reason: string }>(battle, 'battleActionRejected');
  battle.send('switchCreature', { creatureId: activeCreatureId, expectedTurn: battle.state.turn - 1 });
  assert.equal((await withTimeout(invalidSwitch, 'invalid trainer switch rejection')).reason, 'invalid-attack');
  const turnBeforeSwitch = battle.state.turn;
  battle.send('switchCreature', { creatureId: reserveCreatureId, expectedTurn: turnBeforeSwitch });
  await waitFor(() => battle.state.playerActiveCreatureId === reserveCreatureId && battle.state.turn > turnBeforeSwitch, 'authoritative trainer switch');

  battle.reconnection.minUptime = 0;
  battle.reconnection.delay = 25;
  battle.reconnection.minDelay = 25;
  battle.reconnection.maxDelay = 25;
  let reconnectHandshakeReceived = false;
  const reconnected = new Promise<void>((resolve) => battle.onReconnect(() => {
    reconnectHandshakeReceived = true;
    resolve();
  }));
  const restoredState = new Promise<void>((resolve) => battle.onStateChange((state) => {
    if (reconnectHandshakeReceived && state.status === 'active' && state.playerActiveCreatureId === reserveCreatureId && !state.disconnectGraceUntil) resolve();
  }));
  battle.connection.close();
  await withTimeout(reconnected, 'trainer battle automatic reconnect');
  await withTimeout(restoredState, 'trainer battle post-reconnect authoritative state');
  const reconnectedBattle = battle;
  assert.equal(reconnectedBattle.state.status, 'active');
  assert.equal(reconnectedBattle.state.playerActiveCreatureId, reserveCreatureId);
  assert.equal(reconnectedBattle.state.disconnectGraceUntil, '');

  let trainerClearSnapshotCount = 0;
  location.onMessage('authoritySnapshot', (snapshot: AuthoritySnapshot) => {
    if (snapshot.save.progression.flags['trainer-clear:route-scout-1'] === true) trainerClearSnapshotCount += 1;
  });
  const clearSnapshot = nextMessageWhere<AuthoritySnapshot>(location, 'authoritySnapshot', (snapshot) => snapshot.save.progression.flags['trainer-clear:route-scout-1'] === true);
  const battleResult = nextMessage<{ outcome: string; battleId: string }>(reconnectedBattle, 'battleResult');
  await defeatTrainerThroughSdk(reconnectedBattle);
  const result = await withTimeout(battleResult, 'trainer terminal result');
  assert.equal(result.outcome, 'defeated');
  const cleared = await withTimeout(clearSnapshot, 'trainer clear authority snapshot');
  assert.equal(cleared.save.progression.flags['trainer-clear:route-scout-1'], true);
  assert.equal(cleared.save.inventory.currencies.magicDust, 4);
  const clearedReserve = cleared.save.creatures.creatures[reserveCreatureId];
  assert.ok(clearedReserve && clearedReserve.hp > 0 && clearedReserve.hp <= clearedReserve.maxHp, 'trainer snapshot persists player HP');
  await waitFor(() => location.state.players.get(location.sessionId)?.inBattle === false && secondLocation.state.players.get(secondLocation.sessionId)?.inBattle === false, 'trainer lock cleared in Location');

  const settledDust = cleared.save.inventory.currencies.magicDust;
  assert.equal(trainerClearSnapshotCount, 1, 'trainer terminal result publishes one clear snapshot');
  reconnectedBattle.send('chooseAttack', { attackId: reconnectedBattle.state.validPlayerAttackIds[0] ?? 'invalid' });
  await assertTerminalBattleRemains(reconnectedBattle, 'terminal trainer result remains idempotent');
  assert.equal(trainerClearSnapshotCount, 1, 'duplicate terminal action does not publish a second clear snapshot');
  await refreshCanonicalSnapshot(player);
  assert.equal(player.snapshot.save.progression.flags['trainer-clear:route-scout-1'], true);
  assert.equal(player.snapshot.save.inventory.currencies.magicDust, settledDust);
  assert.equal(player.snapshot.save.creatures.creatures[reserveCreatureId]?.hp, clearedReserve.hp);

  await leaveRoom(reconnectedBattle);
  await leaveRoom(location);
  await leaveRoom(secondLocation);
}

function trainerChallengePayload(player: CanonicalPlayer) {
  return { objectId: 'route-scout-trainer', activePartyCreatureIds: player.snapshot.save.creatures.activePartyCreatureIds, expectedRosterRevision: player.snapshot.rosterRevision };
}

/** Server-only fixture setup retains the aggregate's valid stat-growth shape; no client submits party state. */
async function prepareTrainerBattleParty(player: CanonicalPlayer): Promise<void> {
  const aggregate = await authorityRepository.read(player.principal.sub);
  assert.ok(aggregate, 'missing trainer SDK aggregate');
  const originalId = aggregate.save.creatures.activePartyCreatureIds[0];
  const original = originalId ? aggregate.save.creatures.creatures[originalId] : undefined;
  assert.ok(original, 'missing canonical starter for trainer SDK');
  const stats = { hp: 200, attack: 200, defense: 200, speed: 200, stamina: 200 };
  const readyCreature = (id: string): CreatureSaveRecord => ({ ...original, id, level: 1, experience: 0, stats, hp: stats.hp, maxHp: stats.hp, fainted: false, cooldowns: {}, statGrowth: { model: 'deterministic-default', basis: { level: 1, stats }, events: [] } });
  const reserveId = `${original.id}:trainer-reserve`;
  aggregate.save = {
    ...aggregate.save,
    mapId: 'tracer-world-route', position: { mapId: 'tracer-world-route', x: 12, y: 14, facing: 'south' },
    creatures: { ...aggregate.save.creatures, activePartyCreatureIds: [original.id, reserveId], creatures: { ...aggregate.save.creatures.creatures, [original.id]: readyCreature(original.id), [reserveId]: readyCreature(reserveId) } }
  };
  aggregate.rosterRevision += 1;
  assert.equal(await authorityRepository.compareExchange(player.principal.sub, aggregate.revision, aggregate), true, 'trainer SDK setup CAS failed');
  await refreshCanonicalSnapshot(player);
}

async function defeatTrainerThroughSdk(room: SdkRoom): Promise<void> {
  for (let actions = 0; actions < 40 && room.state.status === 'active'; actions += 1) {
    if (room.state.phase === 'forced-switch') {
      const reserve = Array.from(room.state.playerParty as Iterable<any>).find((creature: any) => !creature.fainted && creature.id !== room.state.playerActiveCreatureId);
      assert.ok(reserve, 'forced trainer switch has a ready reserve');
      room.send('switchCreature', { creatureId: reserve.id, expectedTurn: room.state.turn });
      await waitFor(() => room.state.playerActiveCreatureId === reserve.id && room.state.phase === 'player-action', 'forced trainer switch');
      continue;
    }
    const attackId = room.state.validPlayerAttackIds[0];
    assert.equal(typeof attackId, 'string', 'trainer battle exposes an authoritative attack');
    const previousTurn = room.state.turn;
    room.send('chooseAttack', { attackId });
    await waitFor(() => room.state.status !== 'active' || room.state.turn > previousTurn || room.state.phase === 'forced-switch', 'trainer attack progression');
  }
  assert.equal(room.state.status, 'player-won', `trainer battle must end in player-won, got ${String(room.state.status)}`);
}

function nextMessage<T>(room: SdkRoom, type: string): Promise<T> {
  return new Promise((resolve) => room.onMessage(type, resolve));
}

function nextMessageWhere<T>(room: SdkRoom, type: string, accepts: (message: T) => boolean): Promise<T> {
  return new Promise((resolve) => room.onMessage(type, (message: T) => { if (accepts(message)) resolve(message); }));
}

async function assertPositionRemains(room: SdkRoom, position: WorldPosition, label: string): Promise<void> {
  const deadline = Date.now() + 125;
  await waitFor(() => { assert.deepEqual(getLocalPosition(room), position); return Date.now() >= deadline; }, label, 500);
}

async function assertTerminalBattleRemains(room: SdkRoom, label: string): Promise<void> {
  const status = room.state.status;
  const turn = room.state.turn;
  const deadline = Date.now() + 125;
  await waitFor(() => {
    assert.equal(room.state.status, status);
    assert.equal(room.state.turn, turn);
    return Date.now() >= deadline;
  }, label, 500);
}

async function waitForEncounter(room: SdkRoom): Promise<EncounterTarget> {
  await waitFor(() => room.state.encounters.size > 0, 'wild encounter state');
  const encounter = Array.from(room.state.encounters.values()).find((candidate: any) => candidate.status === 'available');
  assert.ok(encounter, 'missing available encounter');
  return {
    id: encounter.id,
    x: encounter.x,
    y: encounter.y
  };
}

async function checkBlockedTerrainRejectedOnline(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  const room = await joinLocation(client, 'home-village-shop-interior', createProfile('blocked-online'));

  await sendMoves(room, ['north', 'north', 'north', 'north']);
  await sendMoves(room, ['east']);
  const beforeBlocked = getLocalPosition(room);
  room.send('moveIntent', nextMoveMessage(room, 'north'));
  await waitFor(() => getLocalPosition(room).facing === 'north', 'blocked move updates facing online');
  const afterBlocked = getLocalPosition(room);

  assert.deepEqual(afterBlocked, {
    ...beforeBlocked,
    facing: 'north'
  });

  await leaveRoom(room);
}

async function enterHomeVillageShop(room: SdkRoom): Promise<LocationTransition> {
  await sendMoves(room, ['east']);
  await sendMoves(room, ['south', 'south', 'south', 'south', 'south']);
  await sendMoves(room, ['west', 'west', 'west', 'west', 'west', 'west', 'west', 'west', 'west', 'west']);
  await sendMoves(room, ['south', 'south', 'south', 'south']);
  await sendMoves(room, ['east', 'east']);
  return sendMoveForTransition(room, 'north');
}

async function joinLocation(
  client: Client,
  mapId: MapId,
  profile: PlayerProfile,
  transitionId?: string
): Promise<SdkRoom> {
  if (!transitionId) await prepareCanonicalLocation(profile, mapId);
  const room = (await client.joinOrCreate('location', {
    mapId,
    credential: await credentialFor(profile),
    balanceVersion: CURRENT_BALANCE_VERSION,
    ...generatedMapIdentity(),
    ...(transitionId ? { transitionId } : {})
  })) as SdkRoom;
  await waitFor(() => room.state.mapId === mapId, `join ${mapId}`);
  return room;
}

/** Direct SDK scenarios use server-side repository CAS to place the canonical aggregate at the requested map spawn. */
async function prepareCanonicalLocation(profile: PlayerProfile, mapId: MapId): Promise<void> {
  const player = await canonicalPlayerFor(profile);
  const aggregate = await authorityRepository.read(player.principal.sub);
  assert.ok(aggregate, `missing canonical aggregate for ${profile.playerId}`);
  const spawn = getGameMap(mapId).spawn;
  aggregate.save = { ...aggregate.save, mapId, position: { ...spawn } };
  assert.equal(await authorityRepository.compareExchange(player.principal.sub, aggregate.revision, aggregate), true, `canonical setup CAS failed for ${profile.playerId}`);
  await refreshCanonicalSnapshot(player);
}

/** Issues one credential and prepares the canonical ready party through public authority commands. */
async function credentialFor(profile: PlayerProfile): Promise<string> {
  return (await canonicalPlayerFor(profile)).credential;
}

async function canonicalPlayerFor(profile: PlayerProfile): Promise<CanonicalPlayer> {
  const existing = canonicalPlayersByProfileId.get(profile.playerId);
  if (existing) return existing;

  const issued = issueGuestCredential(guestCredentialConfig);
  const player: CanonicalPlayer = {
    credential: issued.credential,
    principal: { sub: issued.claims.sub },
    snapshot: await playerAuthority.bootstrapProfile({ sub: issued.claims.sub }, { name: profile.name, avatar: profile.avatar })
  };
  await executeCanonicalCommand(player, 'complete-elder-dialog', { type: 'completeElderDialog' });
  await executeCanonicalCommand(player, 'convert-starter-creatures', { type: 'convertCreatureCard', starter: true });
  assert.ok(player.snapshot.save.creatures.activePartyCreatureIds.length > 0, `canonical party missing for ${profile.playerId}`);
  canonicalPlayersByProfileId.set(profile.playerId, player);
  return player;
}

async function executeCanonicalCommand(player: CanonicalPlayer, intentId: string, intent: AuthorityIntent): Promise<void> {
  const result = await playerAuthority.execute(player.principal, { intentId, expectedRevision: player.snapshot.revision, intent });
  if (result.status === 'rejected') {
    assert.fail(`authority setup rejected ${intent.type}: ${result.code}`);
  }
  player.snapshot = result.snapshot;
}

async function refreshCanonicalSnapshot(player: CanonicalPlayer): Promise<void> {
  const snapshot = await playerAuthority.snapshot(player.principal);
  assert.ok(snapshot, `missing canonical snapshot for ${player.principal.sub}`);
  player.snapshot = snapshot;
}

function generatedMapIdentity() { const mapSet = generatedMapRegistry.handshake(); return { mapSetId: mapSet.id, mapSetVersion: mapSet.version }; }

async function sendMoves(room: SdkRoom, directions: Direction[]): Promise<void> {
  for (const direction of directions) {
    const before = getLocalPosition(room);
    room.send('moveIntent', nextMoveMessage(room, direction));
    await waitFor(() => {
      const after = getLocalPosition(room);
      return after.x !== before.x || after.y !== before.y || after.facing !== before.facing;
    }, `move ${direction}`);
  }
}

async function sendMoveForTransition(room: SdkRoom, direction: Direction): Promise<LocationTransition> {
  const transition = new Promise<LocationTransition>((resolve) => {
    room.onMessage('locationTransition', resolve);
  });
  room.send('moveIntent', nextMoveMessage(room, direction));
  return withTimeout(transition, `transition ${direction}`);
}

async function sendFirstValidMove(room: SdkRoom): Promise<void> {
  const position = getLocalPosition(room);
  const map = getGameMap(position.mapId);
  const move = ([
    { direction: 'north' as const, x: position.x, y: position.y - 1 },
    { direction: 'east' as const, x: position.x + 1, y: position.y },
    { direction: 'south' as const, x: position.x, y: position.y + 1 },
    { direction: 'west' as const, x: position.x - 1, y: position.y }
  ]).find((candidate) =>
    canEnterTile(map, candidate.x, candidate.y) &&
    !map.exits.some((exit) => exit.x === candidate.x && exit.y === candidate.y)
  );
  assert.ok(move, `missing non-transition first move for ${room.sessionId}`);
  await sendMoves(room, [move.direction]);
}

function nextMoveMessage(room: SdkRoom, direction: Direction): MoveIntentMessage {
  const sequence = (sdkMoveSequencesBySessionId.get(room.sessionId) ?? 0) + 1;
  sdkMoveSequencesBySessionId.set(room.sessionId, sequence);
  return { direction, sequence };
}

function getLocalPosition(room: SdkRoom): WorldPosition {
  const player = room.state.players.get(room.sessionId);
  assert.ok(player, `missing local player ${room.sessionId}`);
  return {
    mapId: player.position.mapId,
    x: player.position.x,
    y: player.position.y,
    facing: player.position.facing
  };
}

function getPlayerCount(room: SdkRoom): number {
  return room.state.players.size;
}

function findPathToAdjacentFacing(
  mapId: MapId,
  start: WorldPosition,
  encounter: EncounterTarget
): { directions: Direction[]; facing: Direction } | null {
  const map = getGameMap(mapId);
  const steps: Array<{ direction: Direction; dx: number; dy: number }> = [
    { direction: 'north', dx: 0, dy: -1 },
    { direction: 'east', dx: 1, dy: 0 },
    { direction: 'south', dx: 0, dy: 1 },
    { direction: 'west', dx: -1, dy: 0 }
  ];
  const candidates = steps.map((step) => ({
    x: encounter.x - step.dx,
    y: encounter.y - step.dy,
    previousX: encounter.x - step.dx * 2,
    previousY: encounter.y - step.dy * 2,
    facing: step.direction
  }));

  for (const candidate of candidates) {
    if (!canEnterTile(map, candidate.x, candidate.y)) continue;
    if (start.x === candidate.x && start.y === candidate.y && start.facing === candidate.facing) {
      return { directions: [], facing: candidate.facing };
    }
    if (!canEnterTile(map, candidate.previousX, candidate.previousY)) continue;

    const directions = findPath(mapId, start, candidate.previousX, candidate.previousY);
    if (!directions) continue;
    return { directions: [...directions, candidate.facing], facing: candidate.facing };
  }

  return null;
}

function findPath(mapId: MapId, start: WorldPosition, targetX: number, targetY: number): Direction[] | null {
  const map = getGameMap(mapId);
  const queue: Array<{ x: number; y: number; directions: Direction[] }> = [
    { x: start.x, y: start.y, directions: [] }
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const steps: Array<{ direction: Direction; dx: number; dy: number }> = [
    { direction: 'north', dx: 0, dy: -1 },
    { direction: 'east', dx: 1, dy: 0 },
    { direction: 'south', dx: 0, dy: 1 },
    { direction: 'west', dx: -1, dy: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (current.x === targetX && current.y === targetY) {
      return current.directions;
    }

    for (const step of steps) {
      const nextX = current.x + step.dx;
      const nextY = current.y + step.dy;
      const key = `${nextX},${nextY}`;
      if (visited.has(key)) continue;
      if (nextX < 0 || nextY < 0 || nextX >= map.width || nextY >= map.height) continue;
      if (!canEnterTile(map, nextX, nextY)) continue;

      visited.add(key);
      queue.push({ x: nextX, y: nextY, directions: [...current.directions, step.direction] });
    }
  }

  return null;
}

async function leaveRoom(room: SdkRoom): Promise<void> {
  await room.leave();
}

async function waitFor(assertion: () => boolean, label: string, timeoutMs = 2_000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  assert.fail(`Timed out waiting for ${label}`);
}

function getMaximumRunIntents(): number {
  // Matches getBattleRunChance: speed adjustment is clamped to -0.2 and chance floors at 0.15.
  const minimumRunChance = Math.max(0.15, GAME_BALANCE_CONFIG.battles.baseRunChance - 0.2);
  return Math.ceil((1 - minimumRunChance) / GAME_BALANCE_CONFIG.battles.runAttemptBonus) + 1;
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 2_000): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

type SdkRoom = Room<unknown, any>;

interface LocationTransition {
  toMapId: MapId;
  spawn: WorldPosition;
  transitionId: string;
}

interface TrainerChallengeClaim {
  objectId: string;
  trainerId: string;
  battleId: string;
  battleToken: string;
}

interface EncounterTarget {
  id: string;
  x: number;
  y: number;
}

function createState(
  mapId: MonsterRpgSaveState['mapId'],
  x: number,
  y: number,
  facing: MonsterRpgSaveState['position']['facing']
): MonsterRpgSaveState {
  return {
    ...createInitialSave(createProfile('phase-4-checker')),
    mapId,
    position: { mapId, x, y, facing },
    updatedAt: new Date().toISOString()
  };
}

function createProfile(id = 'phase-4-checker'): PlayerProfile {
  return {
    schemaVersion: MONSTER_RPG_SCHEMA_VERSION,
    playerId: id,
    name: `Checker ${id}`.slice(0, 18),
    avatar: 'scout',
    homeVillageId: 'home-village'
  };
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}
