import { SnakeConfig } from './config';
import { SnakeMode } from './storage';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
export type ItemKind = 'food' | 'heart' | 'berry' | 'leaf' | 'magnet' | 'coin';

type Item = Point & { kind: ItemKind };

type Effects = {
  speedUntil: number;
  leafUntil: number;
  magnetUntil: number;
};

export interface SnakeSnapshot {
  snake: Point[];
  obstacles: Point[];
  items: Item[];
  score: number;
  lives: number;
  level: number;
  foodsEaten: number;
  status: 'ready' | 'running' | 'paused' | 'game-over' | 'level-complete';
  mode: SnakeMode;
  arrowToFood?: Point;
}

const dirVec: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class SnakeEngine {
  private now = 0;
  private nextMove = 0;
  private direction: Direction = 'right';
  private queuedDirection: Direction = 'right';
  private effects: Effects = { speedUntil: 0, leafUntil: 0, magnetUntil: 0 };
  private specialCooldown = 0;
  private growth = 0;
  state: SnakeSnapshot;

  constructor(private config: SnakeConfig, private mode: SnakeMode) {
    const mid = { x: Math.floor(config.boardCols / 2), y: Math.floor(config.boardRows / 2) };
    this.state = {
      snake: [mid, { x: mid.x - 1, y: mid.y }, { x: mid.x - 2, y: mid.y }],
      obstacles: this.makeObstacles(1),
      items: [this.spawnItem('food')],
      score: 0,
      lives: config.lives,
      level: 1,
      foodsEaten: 0,
      status: 'ready',
      mode,
    };
  }

  setDirection(next: Direction) {
    const reverse =
      (this.direction === 'up' && next === 'down') ||
      (this.direction === 'down' && next === 'up') ||
      (this.direction === 'left' && next === 'right') ||
      (this.direction === 'right' && next === 'left');
    if (!reverse) this.queuedDirection = next;
  }

  start() {
    this.state.status = 'running';
  }

  togglePause() {
    if (this.state.status === 'running') this.state.status = 'paused';
    else if (this.state.status === 'paused') this.state.status = 'running';
  }

  tick(deltaMs: number) {
    if (this.state.status !== 'running') return;
    this.now += deltaMs;
    if (this.now < this.nextMove) return;

    const speedEffect = this.now < this.effects.speedUntil ? this.config.powerups.berrySpeedMultiplier : 1;
    const interval =
      (this.config.initialSpeedMs - this.config.speedRampMs * this.state.foodsEaten - this.config.levelScaling.speedPerLevelMs * (this.state.level - 1)) /
      speedEffect;
    this.nextMove = this.now + Math.max(45, interval);

    this.direction = this.queuedDirection;
    const head = this.state.snake[0];
    const vec = dirVec[this.direction];
    const next = { x: head.x + vec.x, y: head.y + vec.y };

    if (this.mode !== 'endless') {
      if (next.x < 0 || next.y < 0 || next.x >= this.config.boardCols || next.y >= this.config.boardRows) {
        this.die();
        return;
      }
    } else {
      next.x = (next.x + this.config.boardCols) % this.config.boardCols;
      next.y = (next.y + this.config.boardRows) % this.config.boardRows;
    }

    const ghost = this.now < this.effects.leafUntil;
    const hitSelf = this.state.snake.some((seg) => seg.x === next.x && seg.y === next.y);
    const hitObstacle = this.state.obstacles.some((ob) => ob.x === next.x && ob.y === next.y);
    if (!ghost && (hitSelf || hitObstacle)) {
      this.die();
      return;
    }

    this.state.snake.unshift(next);
    let ate = false;
    this.state.items = this.state.items.filter((item) => {
      const nearMagnet =
        this.now < this.effects.magnetUntil && Math.abs(item.x - next.x) + Math.abs(item.y - next.y) <= this.config.powerups.magnetRadius;
      const picked = (item.x === next.x && item.y === next.y) || nearMagnet;
      if (picked) {
        ate = true;
        this.applyItem(item.kind);
      }
      return !picked;
    });

    if (!ate && this.growth === 0) this.state.snake.pop();
    else if (this.growth > 0) this.growth -= 1;

    if (!this.state.items.some((i) => i.kind === 'food')) this.state.items.push(this.spawnItem('food'));
    this.maybeSpawnSpecial();

    const food = this.state.items.find((i) => i.kind === 'food');
    if (food && this.mode === 'endless') {
      this.state.arrowToFood = { x: food.x - next.x, y: food.y - next.y };
    }

    if (this.mode === 'room' && this.state.foodsEaten >= this.config.roomTargetFoods) {
      this.state.status = 'level-complete';
    }
  }

  nextLevel() {
    this.state.level += 1;
    this.state.foodsEaten = 0;
    this.state.obstacles = this.makeObstacles(this.state.level);
    this.state.items = [this.spawnItem('food')];
    this.state.status = 'running';
  }

  private applyItem(kind: ItemKind) {
    switch (kind) {
      case 'food':
        this.state.score += this.config.pointsPerFood;
        this.state.foodsEaten += 1;
        this.growth += 1;
        break;
      case 'coin':
        this.state.score += this.config.powerups.coinPoints;
        break;
      case 'heart':
        this.state.lives += 1;
        break;
      case 'berry':
        this.effects.speedUntil = this.now + this.config.powerups.berryDurationMs;
        break;
      case 'leaf':
        this.effects.leafUntil = this.now + this.config.powerups.leafDurationMs;
        break;
      case 'magnet':
        this.effects.magnetUntil = this.now + this.config.powerups.magnetDurationMs;
        break;
    }
  }

  private die() {
    this.state.lives -= 1;
    if (this.state.lives < 0) {
      this.state.status = 'game-over';
      return;
    }
    const mid = { x: Math.floor(this.config.boardCols / 2), y: Math.floor(this.config.boardRows / 2) };
    this.state.snake = [mid, { x: mid.x - 1, y: mid.y }];
    this.direction = 'right';
    this.queuedDirection = 'right';
  }

  private maybeSpawnSpecial() {
    this.specialCooldown += 1;
    const currentSpecials = this.state.items.filter((i) => i.kind !== 'food').length;
    if (this.specialCooldown < this.config.spawnRules.specialCooldownTicks) return;
    if (currentSpecials >= this.config.spawnRules.maxSpecialSimultaneous) return;
    this.specialCooldown = 0;
    const heartReady = this.state.foodsEaten >= this.config.spawnRules.heartCooldownFoods;
    const roll = Math.random();

    if (heartReady && roll < this.config.spawnRules.heartProbability) return this.state.items.push(this.spawnItem('heart'));
    if (roll < this.config.spawnRules.leafProbability) return this.state.items.push(this.spawnItem('leaf'));
    if (roll < this.config.spawnRules.berryProbability) return this.state.items.push(this.spawnItem('berry'));
    if (roll < this.config.spawnRules.magnetProbability) return this.state.items.push(this.spawnItem('magnet'));
    if (roll < this.config.spawnRules.coinProbability) return this.state.items.push(this.spawnItem('coin'));
  }

  private makeObstacles(level: number): Point[] {
    if (this.mode === 'classic') return [];
    const density =
      this.mode === 'endless'
        ? this.config.endlessObstacleIntensity
        : this.config.obstacleDensity + (level - 1) * this.config.levelScaling.obstaclePerLevel;
    const count = Math.floor(this.config.boardCols * this.config.boardRows * density);
    return Array.from({ length: count }, () => this.spawnPoint());
  }

  private spawnItem(kind: ItemKind): Item {
    return { ...this.spawnPoint(), kind };
  }

  private spawnPoint(): Point {
    return {
      x: Math.floor(Math.random() * this.config.boardCols),
      y: Math.floor(Math.random() * this.config.boardRows),
    };
  }
}
