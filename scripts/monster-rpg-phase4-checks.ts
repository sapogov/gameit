import { strict as assert } from 'node:assert';
import { Client, Room } from '@colyseus/sdk';
import { Server } from 'colyseus';
import { LocationRoom } from '../server/rooms/LocationRoom';
import {
  buildingDefinitions,
  createInitialSave,
  getGameMap,
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
  validateSpeciesCatalog,
  type MonsterRpgSaveState,
  type PlayerProfile
} from '../src/games/monster-rpg/sim';
import type { Direction, MapId, MoveIntentMessage, WorldPosition } from '../src/games/monster-rpg/sim/types';

const storage = createMemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true
});

let sdkMoveSequence = 0;

checkSaveReset();
checkInitialSaveStartsInHomeVillage();
checkHomeVillageEastGateExit();
checkOverworldVillageEntry();
checkBuildingEntryAndExit();
checkBlockedMovement();
checkGen1SpeciesCatalog();
checkCreatureJournalStates();
await checkSdkMultiplayerFlow();

console.log('monster-rpg phase 4 sim and SDK checks passed');

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

  assert.equal(loadSave(), null);
  assert.equal(loadProfile(), null);
  assert.equal(storage.getItem(MONSTER_RPG_SAVE_KEY), null);
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
  server.define('location', LocationRoom).filterBy(['mapId']);
  await server.listen(port, '127.0.0.1');

  try {
    const endpoint = `ws://127.0.0.1:${port}`;
    await checkTwoClientsShareWorldMap(endpoint);
    await checkWorldToVillageRoomHandoff(endpoint);
    await checkTwoClientsShareBuildingInterior(endpoint);
    await checkInvalidMapIdRejected(endpoint);
    await checkBlockedTerrainRejectedOnline(endpoint);
  } finally {
    await server.gracefullyShutdown(false);
  }
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

  await leaveRoom(interiorA);
  await leaveRoom(interiorB);
}

async function checkInvalidMapIdRejected(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  await assert.rejects(
    () => client.joinOrCreate('location', { mapId: 'greenway-route', profile: createProfile('invalid-map') }),
    /Invalid map id|no available handler|Failed to/
  );
}

async function checkBlockedTerrainRejectedOnline(endpoint: string): Promise<void> {
  const client = new Client(endpoint);
  const room = await joinLocation(client, 'home-village-shop-interior', createProfile('blocked-online'));

  await sendMoves(room, ['north', 'north', 'north', 'north']);
  await sendMoves(room, ['east']);
  const beforeBlocked = getLocalPosition(room);
  room.send('moveIntent', nextMoveMessage('north'));
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
  const room = (await client.joinOrCreate('location', {
    mapId,
    profile,
    ...(transitionId ? { transitionId } : {})
  })) as SdkRoom;
  await waitFor(() => room.state.mapId === mapId, `join ${mapId}`);
  return room;
}

async function sendMoves(room: SdkRoom, directions: Direction[]): Promise<void> {
  for (const direction of directions) {
    const before = getLocalPosition(room);
    room.send('moveIntent', nextMoveMessage(direction));
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
  room.send('moveIntent', nextMoveMessage(direction));
  return withTimeout(transition, `transition ${direction}`);
}

function nextMoveMessage(direction: Direction): MoveIntentMessage {
  sdkMoveSequence += 1;
  return { direction, sequence: sdkMoveSequence };
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
