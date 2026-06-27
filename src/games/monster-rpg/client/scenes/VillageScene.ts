import Phaser from 'phaser';
import type {
  AvatarId,
  CreatureLabelMode,
  Direction,
  FarmSaveRecord,
  GameMap,
  InputAction,
  LocationPlayerState,
  LocationRoomState,
  MapKind,
  MonsterRpgSaveState,
  RoomPlayerId,
  TileType,
  WildEncounterState
} from '../../sim';
import {
  FARM_FOOTPRINT_SIZE,
  findWalkPath,
  findWalkPathToInteractionDistance,
  getGameMap,
  getSpeciesById,
  isFarmTile
} from '../../sim';
import {
  monsterRpgAssetKeys,
  monsterRpgAssetManifest,
  monsterRpgSpriteSheetManifest,
  type MonsterRpgAssetKey
} from '../assets/monsterRpgAssets';

interface VillageSceneOptions {
  creatureLabelMode: CreatureLabelMode;
  initialState: MonsterRpgSaveState;
  map: GameMap;
  onAction: (action: InputAction) => void;
}

type MovementKeyMap = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
};

const tileColors: Record<TileType, number> = {
  grass: 0x75b96f,
  field: 0x97c75f,
  road: 0xc4a66a,
  plaza: 0xd8c98a,
  house: 0x9d5842,
  townHall: 0x796db2,
  clinic: 0xe8eef2,
  shop: 0xd6a14a,
  postOffice: 0x5c88c4,
  tavern: 0x8e5a38,
  villageFootprint: 0xe8d45d,
  floor: 0xb9a177,
  wall: 0x4f5360,
  counter: 0x6a4a32,
  bed: 0x7aa6d9,
  desk: 0x93643c,
  door: 0xe8d45d,
  tree: 0x2f6f3e,
  forest: 0x1f4d31,
  mountain: 0x777a80,
  water: 0x4d9bd7,
  bridge: 0xa66f3f,
  fence: 0x8b6b3f,
  exit: 0xe8d45d
};

const avatarColors: Record<AvatarId, number> = {
  scout: 0xffd166,
  ranger: 0x5cc8a7,
  keeper: 0xf26d6d
};

const directionDeltas: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

const buildingAssetKeys = {
  clinic: monsterRpgAssetKeys.buildingClinic,
  house: monsterRpgAssetKeys.buildingHouse,
  postOffice: monsterRpgAssetKeys.buildingPostOffice,
  shop: monsterRpgAssetKeys.buildingShop,
  tavern: monsterRpgAssetKeys.buildingTavern,
  townHall: monsterRpgAssetKeys.buildingTownHall
} as const satisfies Partial<Record<TileType, MonsterRpgAssetKey>>;

const terrainAssetKeys = {
  field: monsterRpgAssetKeys.terrainField,
  forest: monsterRpgAssetKeys.terrainForest,
  mountain: monsterRpgAssetKeys.terrainMountain,
  tree: monsterRpgAssetKeys.terrainTree,
  water: monsterRpgAssetKeys.terrainWater
} as const satisfies Partial<Record<TileType, MonsterRpgAssetKey>>;

const terrainVariantKeys = {
  field: [monsterRpgAssetKeys.terrainFieldAi1, monsterRpgAssetKeys.terrainFieldAi2, monsterRpgAssetKeys.terrainFieldAi3],
  forest: [monsterRpgAssetKeys.terrainForestAi1, monsterRpgAssetKeys.terrainForestAi2, monsterRpgAssetKeys.terrainForestAi3],
  grass: [monsterRpgAssetKeys.terrainGrass1, monsterRpgAssetKeys.terrainGrass2, monsterRpgAssetKeys.terrainGrass3],
  mountain: [monsterRpgAssetKeys.terrainMountainAi1, monsterRpgAssetKeys.terrainMountainAi2],
  tree: [monsterRpgAssetKeys.terrainTreeAi1, monsterRpgAssetKeys.terrainTreeAi2]
} as const satisfies Partial<Record<TileType, readonly MonsterRpgAssetKey[]>>;

const CREATURE_ENCOUNTER_ROWS = 6;
const CREATURE_ENCOUNTER_FRAMES = 4;

interface MapRenderMetrics {
  cameraZoom: number;
  labelOffsetY: number;
  labelFontSize: string;
  playerBodyHeight: number;
  playerBodyWidth: number;
  playerFacingOffsetY: number;
  playerFacingScale: number;
}

interface PlayerView {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  facing: Phaser.GameObjects.Triangle;
  label: Phaser.GameObjects.Text;
  lastTileX?: number;
  lastTileY?: number;
  moveTween?: Phaser.Tweens.Tween;
}

interface EncounterView {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  shadow: Phaser.GameObjects.Ellipse;
  sprite: Phaser.GameObjects.Sprite;
}

interface FarmView {
  container: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Rectangle;
  field: Phaser.GameObjects.Rectangle;
  dust: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

export class VillageScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private creatureLabelMode: CreatureLabelMode;
  private keys?: MovementKeyMap;
  private map: GameMap;
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private mapSprites?: Phaser.GameObjects.Container;
  private onAction: (action: InputAction) => void;
  private encounters = new Map<string, EncounterView>();
  private farms = new Map<string, FarmView>();
  private players = new Map<RoomPlayerId, PlayerView>();
  private readyToRender = false;
  private roomState: LocationRoomState | null = null;
  private saveState: MonsterRpgSaveState;
  private queuedInteraction = false;
  private expectedMovementTile: { x: number; y: number } | null = null;
  private movementQueue: Direction[] = [];
  private movementStepInFlight = false;
  private movementTimer?: Phaser.Time.TimerEvent;

  constructor(options: VillageSceneOptions) {
    super({ key: 'VillageScene' });
    this.creatureLabelMode = options.creatureLabelMode;
    this.saveState = options.initialState;
    this.map = options.map;
    this.onAction = options.onAction;
  }

  preload() {
    monsterRpgAssetManifest.forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.src);
      }
    });
    monsterRpgSpriteSheetManifest.forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this.load.spritesheet(asset.key, asset.src, {
          frameHeight: asset.frameHeight,
          frameWidth: asset.frameWidth
        });
      }
    });
  }

  create() {
    this.configureEncounterAnimations();
    this.drawMap();
    this.configureInput();
    this.readyToRender = true;
    this.renderFarms();
    this.renderEncounters();
    this.renderPlayers();
    this.configureCamera();
    this.scale.on('resize', this.handleResize, this);
  }

  update() {
    if (!this.cursors || !this.keys) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keys.A)) {
      this.dispatchManualMove('west');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keys.D)) {
      this.dispatchManualMove('east');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W)) {
      this.dispatchManualMove('north');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.S)) {
      this.dispatchManualMove('south');
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.clearMovementQueue();
      this.onAction({ type: 'interact' });
    }

    this.updateEncounterLabelVisibility();
  }

  setCreatureLabelMode(mode: CreatureLabelMode) {
    this.creatureLabelMode = mode;
    this.renderEncounters();
  }

  setSaveState(state: MonsterRpgSaveState) {
    if (state.mapId !== this.map.id) {
      this.setActiveMap(getGameMap(state.mapId));
    }
    this.saveState = state;
    this.renderFarms();
    this.renderPlayers();
    if (this.readyToRender) this.completeQueuedMovementStep();
  }

  setRoomState(state: LocationRoomState | null) {
    if (state && state.mapId !== this.map.id) {
      this.setActiveMap(getGameMap(state.mapId));
    }
    this.roomState = state;
    this.renderEncounters();
    this.renderPlayers();
    if (this.readyToRender) this.completeQueuedMovementStep();
  }

  private configureInput() {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE') as MovementKeyMap;
    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  private configureEncounterAnimations() {
    for (let row = 0; row < CREATURE_ENCOUNTER_ROWS; row += 1) {
      const key = this.getEncounterAnimationKey(row + 1);
      if (this.anims.exists(key)) continue;

      this.anims.create({
        frameRate: 5,
        frames: this.anims.generateFrameNumbers(monsterRpgAssetKeys.creatureEncounters, {
          end: row * CREATURE_ENCOUNTER_FRAMES + CREATURE_ENCOUNTER_FRAMES - 1,
          start: row * CREATURE_ENCOUNTER_FRAMES
        }),
        key,
        repeat: -1
      });
    }
  }

  private configureCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.map.width * this.map.tileSize, this.map.height * this.map.tileSize);
    camera.setZoom(this.getRenderMetrics().cameraZoom);
    camera.setRoundPixels(true);
    camera.setDeadzone(Math.max(96, camera.width * 0.36), Math.max(96, camera.height * 0.32));
    this.followLocalPlayer();
  }

  private setActiveMap(map: GameMap) {
    this.clearMovementQueue();
    this.map = map;
    if (!this.readyToRender) return;

    this.mapGraphics?.destroy();
    this.mapSprites?.destroy();
    this.players.forEach((view) => view.container.destroy());
    this.players.clear();
    this.farms.forEach((view) => view.container.destroy());
    this.farms.clear();
    this.encounters.forEach((view) => view.container.destroy());
    this.encounters.clear();
    this.drawMap();
    this.configureCamera();
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.configureCamera();
    this.updateEncounterLabelVisibility();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!pointer.primaryDown) return;

    const camera = this.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    const targetX = Math.floor(worldPoint.x / this.map.tileSize);
    const targetY = Math.floor(worldPoint.y / this.map.tileSize);
    const localPlayer = this.getLocalPlayer();
    if (!localPlayer) return;

    const encounter = this.getEncounterAt(targetX, targetY);
    const farm = this.getFarmAt(targetX, targetY);
    const pathOptions = { isBlocked: (x: number, y: number) => this.isFarmTileAt(x, y) };
    const path = farm
      ? findWalkPathToInteractionDistance(
          this.map,
          localPlayer.position,
          farm.position.x,
          farm.position.y,
          FARM_FOOTPRINT_SIZE,
          FARM_FOOTPRINT_SIZE,
          pathOptions
        )
      : encounter
        ? findWalkPathToInteractionDistance(this.map, localPlayer.position, targetX, targetY, 1, 1, pathOptions)
        : findWalkPath(this.map, localPlayer.position, targetX, targetY, pathOptions);

    if (!path) return;
    this.queueMovement(path, Boolean(farm || encounter));
  }

  private dispatchManualMove(direction: Direction) {
    this.clearMovementQueue();
    this.onAction({ type: 'move', direction });
  }

  private queueMovement(path: Direction[], interactAfterPath: boolean) {
    this.clearMovementQueue();
    this.movementQueue = [...path];
    this.queuedInteraction = interactAfterPath;

    if (this.movementQueue.length === 0) {
      if (this.queuedInteraction) this.onAction({ type: 'interact' });
      this.queuedInteraction = false;
      return;
    }

    this.advanceMovementQueue();
  }

  private advanceMovementQueue() {
    if (this.movementStepInFlight || this.movementTimer) return;

    const direction = this.movementQueue.shift();
    if (direction) {
      const localPlayer = this.getLocalPlayer();
      const delta = directionDeltas[direction];
      this.expectedMovementTile = localPlayer
        ? {
            x: localPlayer.position.x + delta.x,
            y: localPlayer.position.y + delta.y
          }
        : null;
      this.movementStepInFlight = true;
      this.onAction({ type: 'move', direction });
      this.movementTimer = this.time.delayedCall(360, () => {
        this.movementTimer = undefined;
        if (this.movementStepInFlight) this.clearMovementQueue();
      });
      return;
    }

    const shouldInteract = this.queuedInteraction;
    this.clearMovementQueue();
    if (shouldInteract) this.onAction({ type: 'interact' });
  }

  private completeQueuedMovementStep() {
    if (!this.movementStepInFlight) return;
    const localPlayer = this.getLocalPlayer();
    if (
      this.expectedMovementTile &&
      localPlayer &&
      (localPlayer.position.x !== this.expectedMovementTile.x || localPlayer.position.y !== this.expectedMovementTile.y)
    ) {
      return;
    }

    this.movementStepInFlight = false;
    this.expectedMovementTile = null;
    this.movementTimer?.remove(false);
    this.movementTimer = this.time.delayedCall(190, () => {
      this.movementTimer = undefined;
      this.advanceMovementQueue();
    });
  }

  private clearMovementQueue() {
    this.movementQueue = [];
    this.queuedInteraction = false;
    this.expectedMovementTile = null;
    this.movementStepInFlight = false;
    this.movementTimer?.remove(false);
    this.movementTimer = undefined;
  }

  private drawMap() {
    const graphics = this.add.graphics();
    const sprites = this.add.container(0, 0);
    this.mapGraphics = graphics;
    this.mapSprites = sprites;
    const { tileSize } = this.map;

    this.map.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const left = x * tileSize;
        const top = y * tileSize;
        graphics.fillStyle(tileColors[tile], 1);
        graphics.fillRect(left, top, tileSize, tileSize);

        this.drawTileDetail(graphics, tile, left, top, tileSize);
      });
    });

    this.drawMapGrid(graphics);
    this.drawTerrainSprites(sprites);
    this.drawMapMarkers(sprites);
  }

  private drawMapGrid(graphics: Phaser.GameObjects.Graphics) {
    const { height, tileSize, width } = this.map;
    const mapWidth = width * tileSize;
    const mapHeight = height * tileSize;

    graphics.lineStyle(1, 0x213526, this.map.kind === 'world-map' ? 0.13 : 0.16);
    for (let x = 0; x <= width; x += 1) {
      const left = x * tileSize;
      graphics.strokeLineShape(new Phaser.Geom.Line(left, 0, left, mapHeight));
    }

    for (let y = 0; y <= height; y += 1) {
      const top = y * tileSize;
      graphics.strokeLineShape(new Phaser.Geom.Line(0, top, mapWidth, top));
    }
  }

  private drawTileDetail(
    graphics: Phaser.GameObjects.Graphics,
    tile: TileType,
    left: number,
    top: number,
    tileSize: number
  ) {
    const u = tileSize / 8;

    if (tile === 'road' || tile === 'plaza') {
      graphics.fillStyle(0xeadc9b, tile === 'plaza' ? 0.36 : 0.24);
      graphics.fillRect(left + u, top + 3.25 * u, tileSize - 2 * u, Math.max(1, u));
    }

    if (tile === 'bridge') {
      graphics.fillStyle(0x6f4729, 1);
      graphics.fillRect(left, top + 1.5 * u, tileSize, tileSize - 3 * u);
      graphics.lineStyle(Math.max(1, u * 0.45), 0xd6a965, 0.65);
      graphics.strokeLineShape(new Phaser.Geom.Line(left + u, top + 2.4 * u, left + tileSize - u, top + 2.4 * u));
      graphics.strokeLineShape(new Phaser.Geom.Line(left + u, top + 5.5 * u, left + tileSize - u, top + 5.5 * u));
    }

    if (tile === 'exit' || tile === 'villageFootprint' || tile === 'door') {
      graphics.fillStyle(0xeadc9b, 0.82);
      graphics.fillRect(left, top + 2.5 * u, tileSize, 3 * u);
      graphics.fillStyle(0xffffff, 0.42);
      graphics.fillTriangle(left + 2.25 * u, top + 2 * u, left + 5.75 * u, top + 4 * u, left + 2.25 * u, top + 6 * u);
    }

    if (tile === 'fence') {
      graphics.lineStyle(Math.max(2, u * 0.75), 0x5d4228, 1);
      graphics.strokeLineShape(new Phaser.Geom.Line(left + u, top + 2.5 * u, left + tileSize - u, top + 2.5 * u));
      graphics.strokeLineShape(new Phaser.Geom.Line(left + u, top + 5.25 * u, left + tileSize - u, top + 5.25 * u));
    }

    if (tile === 'wall') {
      graphics.fillStyle(0xffffff, 0.18);
      graphics.fillRect(left + u * 0.5, top + u * 0.5, tileSize - u, Math.max(2, u));
    }

    if (tile === 'counter' || tile === 'desk' || tile === 'bed') {
      graphics.fillStyle(0x2b2438, 0.2);
      graphics.fillRect(left + u, top + 1.25 * u, tileSize - 2 * u, tileSize - 2 * u);
    }

    if (this.isBuildingTile(tile)) {
      graphics.fillStyle(0x2b2438, 0.18);
      graphics.fillRect(left + u, top + u, tileSize - 2 * u, tileSize - 1.5 * u);
    }
  }

  private drawTerrainSprites(sprites: Phaser.GameObjects.Container) {
    const { tileSize } = this.map;
    this.map.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const terrainSprite = this.getTerrainSprite(tile, x, y);
        if (!terrainSprite || !this.shouldDrawTerrainSprite(tile, x, y)) return;

        const image = this.addSpriteOverlay(sprites, terrainSprite.key, x * tileSize, y * tileSize, tileSize, tileSize);
        image.setAlpha(terrainSprite.alpha ?? 0.96);
      });
    });
  }

  private drawMapMarkers(sprites: Phaser.GameObjects.Container) {
    const { tileSize } = this.map;

    if (this.map.kind === 'world-map') {
      this.map.exits.forEach((exit) => {
        const width = exit.width ?? 1;
        const height = exit.height ?? 1;
        const key = width >= 3 || height >= 3 ? monsterRpgAssetKeys.villageLarge : monsterRpgAssetKeys.villageSmall;
        this.addSpriteOverlay(sprites, key, exit.x * tileSize, exit.y * tileSize, width * tileSize, height * tileSize);
        this.addSpriteOverlay(
          sprites,
          monsterRpgAssetKeys.markerSign,
          (exit.x + width - 0.8) * tileSize,
          (exit.y + height - 0.85) * tileSize,
          tileSize,
          tileSize
        );
      });
      return;
    }

    this.map.exits.forEach((exit) => {
      if (String(exit.toMapId).endsWith('-interior')) {
        const buildingTile = this.map.tiles[exit.y - 1]?.[exit.x] ?? this.map.tiles[exit.y - 2]?.[exit.x];
        const buildingKey = buildingTile ? this.getBuildingAssetKey(buildingTile) : undefined;
        if (buildingKey) {
          this.addSpriteOverlay(sprites, buildingKey, (exit.x - 1) * tileSize, (exit.y - 2) * tileSize, tileSize * 3, tileSize * 3);
        }
        if (buildingTile) {
          this.addMapLabel(sprites, this.getBuildingLabel(buildingTile), exit.x * tileSize + tileSize / 2, (exit.y - 2.15) * tileSize);
        }
        this.addSpriteOverlay(sprites, monsterRpgAssetKeys.markerDoor, exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);
        this.addSpriteOverlay(
          sprites,
          monsterRpgAssetKeys.markerSign,
          (exit.x - 1) * tileSize,
          (exit.y + 0.05) * tileSize,
          tileSize * 0.8,
          tileSize * 0.8
        );
        return;
      }

      this.addSpriteOverlay(sprites, monsterRpgAssetKeys.markerSign, exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);
    });
  }

  private addSpriteOverlay(
    sprites: Phaser.GameObjects.Container,
    key: MonsterRpgAssetKey,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const image = this.add.image(x, y, key).setOrigin(0, 0).setDisplaySize(width, height);
    image.setDepth(2);
    sprites.add(image);
    return image;
  }

  private addMapLabel(sprites: Phaser.GameObjects.Container, text: string, x: number, y: number) {
    const label = this.add
      .text(x, y, text, {
        align: 'center',
        color: '#fff8d6',
        fontFamily: 'monospace',
        fontSize: this.map.kind === 'world-map' ? '6px' : '7px',
        stroke: '#1b1c24',
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4);
    sprites.add(label);
    return label;
  }

  private shouldDrawTerrainSprite(tile: TileType, x: number, y: number): boolean {
    if (tile === 'road' || tile === 'bridge' || tile === 'water') return true;
    if (tile === 'grass') return this.map.kind === 'world-map' ? (x + 3 * y) % 16 === 0 : (x + 2 * y) % 3 === 0;

    if (this.map.kind === 'world-map') {
      if (tile === 'field') return (x + 2 * y) % 8 === 0;
      if (tile === 'forest' || tile === 'mountain') return (x + y) % 6 === 0;
    }

    if (tile === 'field' || tile === 'forest' || tile === 'mountain' || tile === 'tree') return true;
    return true;
  }

  private renderEncounters() {
    if (!this.readyToRender) return;

    const encounters = this.getRenderableEncounters();
    const activeIds = new Set(Object.keys(encounters));

    this.encounters.forEach((view, id) => {
      if (!activeIds.has(id)) {
        view.container.destroy();
        this.encounters.delete(id);
      }
    });

    Object.entries(encounters).forEach(([id, encounter]) => {
      const view = this.encounters.get(id) ?? this.createEncounterView(id);
      this.syncEncounterView(view, encounter);
    });

    this.updateEncounterLabelVisibility();
  }

  private renderFarms() {
    if (!this.readyToRender) return;

    const farms = this.getRenderableFarms();
    const activeIds = new Set(Object.keys(farms));

    this.farms.forEach((view, id) => {
      if (!activeIds.has(id)) {
        view.container.destroy();
        this.farms.delete(id);
      }
    });

    Object.entries(farms).forEach(([id, farm]) => {
      const view = this.farms.get(id) ?? this.createFarmView(id);
      this.syncFarmView(view, farm);
    });
  }

  private renderPlayers() {
    if (!this.readyToRender) return;

    const players = this.getRenderablePlayers();
    const activeIds = new Set(Object.keys(players));

    this.players.forEach((view, id) => {
      if (!activeIds.has(id)) {
        view.container.destroy();
        this.players.delete(id);
      }
    });

    Object.entries(players).forEach(([id, player]) => {
      const view = this.players.get(id) ?? this.createPlayerView(id, player);
      this.syncPlayerView(view, player, id === this.getLocalPlayerId());
    });

    this.followLocalPlayer();
  }

  private getRenderableEncounters(): Record<string, WildEncounterState> {
    if (!this.roomState) return {};

    return Object.fromEntries(
      Object.entries(this.roomState.encounters).filter(
        ([, encounter]) => encounter.mapId === this.map.id && encounter.status === 'available'
      )
    );
  }

  private getRenderableFarms(): Record<string, FarmSaveRecord> {
    return Object.fromEntries(
      Object.entries(this.saveState.farms.farms).filter(([, farm]) => farm.position.mapId === this.map.id)
    );
  }

  private getRenderablePlayers(): Record<RoomPlayerId, LocationPlayerState> {
    if (this.roomState) {
      return Object.fromEntries(
        Object.entries(this.roomState.players).filter(([, player]) => player.position.mapId === this.map.id)
      );
    }

    return {
      local: {
        profile: this.saveState.profile,
        position: this.saveState.position,
        connected: true,
        inBattle: false
      }
    };
  }

  private createEncounterView(id: string): EncounterView {
    const container = this.add.container(0, 0);
    const shadow = this.add.ellipse(0, 5, 16, 5, 0x1b1c24, 0.24);
    const sprite = this.add.sprite(0, 0, monsterRpgAssetKeys.creatureEncounters, 0);
    const label = this.add
      .text(0, 10, '', {
        color: '#fff8d6',
        fontFamily: 'monospace',
        fontSize: '7px',
        stroke: '#17351f',
        strokeThickness: 3
      })
      .setOrigin(0.5, 0);
    container.add([shadow, sprite, label]);
    container.setDepth(4);
    this.encounters.set(id, { container, label, shadow, sprite });
    return { container, label, shadow, sprite };
  }

  private syncEncounterView(view: EncounterView, encounter: WildEncounterState) {
    const { tileSize } = this.map;
    const spriteSize = this.map.kind === 'world-map' ? tileSize * 1.45 : tileSize * 1.32;
    const animationKey = this.getEncounterAnimationKey(encounter.speciesId);
    view.container.setPosition(encounter.x * tileSize + tileSize / 2, encounter.y * tileSize + tileSize / 2);
    view.shadow.setSize(spriteSize * 0.72, Math.max(3, spriteSize * 0.16));
    view.shadow.setY(spriteSize * 0.32);
    view.sprite.setDisplaySize(spriteSize, spriteSize);
    view.sprite.play(animationKey, true);
    view.label.setY(spriteSize * 0.36 + 2);
    view.label.setFontSize(this.map.kind === 'world-map' ? '6px' : '7px');
    view.label.setText(getSpeciesById(encounter.speciesId)?.displayName ?? `Species #${encounter.speciesId}`);
  }

  private createFarmView(id: string): FarmView {
    const container = this.add.container(0, 0);
    const base = this.add.rectangle(0, 0, 18, 16, 0x8c5b2a).setStrokeStyle(2, 0x26351f);
    const field = this.add.rectangle(0, 4, 16, 7, 0x6f9f48);
    const dust = this.add.circle(5, -5, 3, 0xf8df64, 0.95).setStrokeStyle(1, 0xfff8d6);
    const label = this.add
      .text(0, 12, 'Magic Dust Farm', {
        align: 'center',
        color: '#fff8d6',
        fontFamily: 'monospace',
        fontSize: '7px',
        stroke: '#1b1c24',
        strokeThickness: 3
      })
      .setOrigin(0.5, 0);

    container.add([base, field, dust, label]);
    container.setDepth(3);
    this.farms.set(id, { container, base, field, dust, label });
    return { container, base, field, dust, label };
  }

  private syncFarmView(view: FarmView, farm: FarmSaveRecord) {
    const { tileSize } = this.map;
    const width = tileSize * FARM_FOOTPRINT_SIZE * 0.86;
    const height = tileSize * FARM_FOOTPRINT_SIZE * 0.76;

    view.container.setPosition(
      (farm.position.x + FARM_FOOTPRINT_SIZE / 2) * tileSize,
      (farm.position.y + FARM_FOOTPRINT_SIZE / 2) * tileSize
    );
    view.base.setSize(width, height);
    view.base.setFillStyle(0x8c5b2a, 1);
    view.base.setStrokeStyle(Math.max(1, tileSize * 0.08), 0x26351f);
    view.field.setSize(width * 0.86, height * 0.38);
    view.field.setY(height * 0.18);
    view.dust.setPosition(width * 0.28, -height * 0.32);
    view.dust.setRadius(Math.max(2, tileSize * 0.14));
    view.label.setY(height * 0.48);
    view.label.setFontSize(this.map.kind === 'world-map' ? '6px' : '7px');
  }

  private createPlayerView(id: RoomPlayerId, player: LocationPlayerState): PlayerView {
    const color = avatarColors[player.profile.avatar];
    const container = this.add.container(0, 0);
    const body = this.add.rectangle(0, 0, 12, 14, color).setStrokeStyle(2, 0x1b1c24);
    const facing = this.add.triangle(0, -17, 0, 0, 8, 8, -8, 8, 0x1b1c24);
    const label = this.add
      .text(0, 12, '', {
        color: '#fff8d6',
        fontFamily: 'monospace',
        fontSize: '8px',
        stroke: '#1b1c24',
        strokeThickness: 3
      })
      .setOrigin(0.5, 0);

    container.add([body, facing, label]);
    container.setDepth(5);
    this.players.set(id, { container, body, facing, label });
    return { container, body, facing, label };
  }

  private syncPlayerView(view: PlayerView, player: LocationPlayerState, isLocal: boolean) {
    const { tileSize } = this.map;
    const metrics = this.getRenderMetrics();
    const targetX = player.position.x * tileSize + tileSize / 2;
    const targetY = player.position.y * tileSize + tileSize / 2;
    const movedFromPreviousTile =
      view.lastTileX !== undefined &&
      view.lastTileY !== undefined &&
      (view.lastTileX !== player.position.x || view.lastTileY !== player.position.y);
    const adjacentMove =
      movedFromPreviousTile &&
      Math.abs(view.lastTileX! - player.position.x) + Math.abs(view.lastTileY! - player.position.y) === 1;

    if (movedFromPreviousTile) {
      view.moveTween?.stop();
      view.moveTween = undefined;
      if (adjacentMove) {
        view.moveTween = this.tweens.add({
          targets: view.container,
          x: targetX,
          y: targetY,
          duration: 170,
          ease: 'Linear',
          onComplete: () => {
            view.moveTween = undefined;
          }
        });
      } else {
        view.container.setPosition(targetX, targetY);
      }
      view.lastTileX = player.position.x;
      view.lastTileY = player.position.y;
    } else if (!view.moveTween) {
      view.container.setPosition(targetX, targetY);
      view.lastTileX = player.position.x;
      view.lastTileY = player.position.y;
    }
    view.container.setAlpha(player.inBattle ? 0.52 : 1);
    view.body.setSize(metrics.playerBodyWidth, metrics.playerBodyHeight);
    view.body.setFillStyle(avatarColors[player.profile.avatar], 1);
    view.body.setStrokeStyle(isLocal ? 3 : 2, isLocal ? 0xffffff : 0x1b1c24);
    view.facing.setY(metrics.playerFacingOffsetY);
    view.facing.setScale(metrics.playerFacingScale);
    view.label.setY(metrics.labelOffsetY);
    view.label.setFontSize(metrics.labelFontSize);
    const battleMarker = player.inBattle ? ' *' : '';
    view.label.setText(
      isLocal ? `${player.profile.name}${battleMarker}` : `${player.profile.name} ${player.position.facing.slice(0, 1)}${battleMarker}`
    );

    const angleByDirection = {
      north: 0,
      east: 90,
      south: 180,
      west: 270
    };
    view.facing.setAngle(angleByDirection[player.position.facing]);
  }

  private getRenderMetrics(): MapRenderMetrics {
    const tileSize = this.map.tileSize;
    const cameraZoom = this.getCameraZoom(this.map.kind);

    if (this.map.kind === 'world-map') {
      return {
        cameraZoom,
        labelOffsetY: tileSize * 0.48,
        labelFontSize: '7px',
        playerBodyHeight: tileSize * 0.8,
        playerBodyWidth: tileSize * 0.62,
        playerFacingOffsetY: -tileSize * 0.68,
        playerFacingScale: 0.72
      };
    }

    return {
      cameraZoom,
      labelOffsetY: tileSize * 0.54,
      labelFontSize: this.map.kind === 'interior' ? '7px' : '8px',
      playerBodyHeight: tileSize * 0.76,
      playerBodyWidth: tileSize * 0.56,
      playerFacingOffsetY: -tileSize * 0.64,
      playerFacingScale: 0.86
    };
  }

  private getCameraZoom(kind: MapKind): number {
    const viewportWidth = this.scale.gameSize.width || 640;
    const isMobileWidth = viewportWidth < 680;

    if (kind === 'world-map') return isMobileWidth ? 1.9 : 2.2;
    if (kind === 'interior') return isMobileWidth ? 1.65 : 2.2;
    return isMobileWidth ? 1.35 : 1.55;
  }

  private getLocalPlayerId(): RoomPlayerId {
    return this.roomState?.localPlayerId ?? 'local';
  }

  private getLocalPlayer(): LocationPlayerState | null {
    return this.getRenderablePlayers()[this.getLocalPlayerId()] ?? null;
  }

  private getEncounterAt(x: number, y: number): WildEncounterState | null {
    return Object.values(this.getRenderableEncounters()).find((encounter) => encounter.x === x && encounter.y === y) ?? null;
  }

  private getFarmAt(x: number, y: number): FarmSaveRecord | null {
    return Object.values(this.getRenderableFarms()).find((farm) => isFarmTile(farm, x, y)) ?? null;
  }

  private isFarmTileAt(x: number, y: number): boolean {
    return Object.values(this.getRenderableFarms()).some((farm) => isFarmTile(farm, x, y));
  }

  private updateEncounterLabelVisibility() {
    this.encounters.forEach((view) => {
      const screen = this.worldToScreen(view.container.x, view.container.y);
      const visible = this.creatureLabelMode === 'icon-plus-name' && !this.isInReservedHudArea(screen.x, screen.y);
      view.label.setVisible(visible);
    });
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    const camera = this.cameras.main;
    return {
      x: (x - camera.worldView.x) * camera.zoom,
      y: (y - camera.worldView.y) * camera.zoom
    };
  }

  private isInReservedHudArea(x: number, y: number): boolean {
    const width = this.scale.gameSize.width || 640;
    const height = this.scale.gameSize.height || 480;
    const isMobileWidth = width < 680;
    const topHudHeight = isMobileWidth ? 124 : 112;
    const dpadWidth = isMobileWidth ? 156 : 170;
    const dpadHeight = isMobileWidth ? 156 : 170;

    if (y < topHudHeight) return true;
    if (x > width - dpadWidth && y > height - dpadHeight) return true;
    return false;
  }

  private followLocalPlayer() {
    const local = this.players.get(this.getLocalPlayerId());
    if (local) {
      this.cameras.main.startFollow(local.container, true, 0.18, 0.18);
    }
  }

  private isBuildingTile(tile: TileType): boolean {
    return (
      tile === 'house' ||
      tile === 'townHall' ||
      tile === 'clinic' ||
      tile === 'shop' ||
      tile === 'postOffice' ||
      tile === 'tavern'
    );
  }

  private getBuildingAssetKey(tile: TileType): MonsterRpgAssetKey | undefined {
    return buildingAssetKeys[tile as keyof typeof buildingAssetKeys];
  }

  private getBuildingLabel(tile: TileType): string {
    if (tile === 'townHall') return 'Town Hall / Elder';
    if (tile === 'clinic') return 'Hospital';
    if (tile === 'postOffice') return 'Station';
    if (tile === 'shop') return 'Shop';
    if (tile === 'tavern') return 'Tavern';
    return 'Home';
  }

  private getEncounterAnimationKey(speciesId: number): string {
    const row = Math.abs(speciesId - 1) % CREATURE_ENCOUNTER_ROWS;
    return `monster-rpg.creature.encounter.${row}`;
  }

  private getTerrainSprite(
    tile: TileType,
    x: number,
    y: number
  ): { alpha?: number; key: MonsterRpgAssetKey } | undefined {
    if (tile === 'road') {
      return {
        key: this.isVerticalRoadAt(x, y)
          ? monsterRpgAssetKeys.terrainRoadVertical
          : monsterRpgAssetKeys.terrainRoadHorizontal
      };
    }

    if (tile === 'bridge') return { key: monsterRpgAssetKeys.terrainBridgeWater };
    if (tile === 'water') {
      return { key: (x + y) % 2 === 0 ? monsterRpgAssetKeys.terrainWaterAi1 : monsterRpgAssetKeys.terrainWaterAi2 };
    }

    if (tile === 'grass' || tile === 'field' || tile === 'forest' || tile === 'tree' || tile === 'mountain') {
      return { alpha: tile === 'field' ? 0.9 : 0.96, key: this.getTerrainVariantKey(tile, x, y) };
    }

    const key = terrainAssetKeys[tile as keyof typeof terrainAssetKeys];
    if (!key) return undefined;
    return { alpha: 0.96, key };
  }

  private getTerrainVariantKey(tile: TileType, x: number, y: number): MonsterRpgAssetKey {
    const keys = terrainVariantKeys[tile as keyof typeof terrainVariantKeys];
    if (!keys?.length) return terrainAssetKeys[tile as keyof typeof terrainAssetKeys] ?? monsterRpgAssetKeys.terrainGrass1;
    return keys[this.hashTile(x, y) % keys.length];
  }

  private hashTile(x: number, y: number): number {
    return Math.abs((x * 73856093) ^ (y * 19349663) ^ (this.map.id.length * 83492791));
  }

  private isVerticalRoadAt(x: number, y: number): boolean {
    const north = this.isRoadLikeTile(x, y - 1);
    const south = this.isRoadLikeTile(x, y + 1);
    const east = this.isRoadLikeTile(x + 1, y);
    const west = this.isRoadLikeTile(x - 1, y);
    if ((north || south) && !(east || west)) return true;
    if ((east || west) && !(north || south)) return false;
    return north || south;
  }

  private isRoadLikeTile(x: number, y: number): boolean {
    const tile = this.map.tiles[y]?.[x];
    return tile === 'road' || tile === 'plaza' || tile === 'bridge' || tile === 'exit' || tile === 'villageFootprint';
  }
}
