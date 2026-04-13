import { z } from 'zod';

export const snakeConfigSchema = z.object({
  boardCols: z.number().int().min(12).max(120),
  boardRows: z.number().int().min(12).max(120),
  initialSpeedMs: z.number().min(40).max(400),
  speedRampMs: z.number().min(0).max(20),
  roomTargetFoods: z.number().int().min(5).max(200),
  obstacleDensity: z.number().min(0).max(0.35),
  endlessObstacleIntensity: z.number().min(0).max(0.55),
  maxFoodSpawnScreenDistance: z.number().min(1).max(10),
  pointsPerFood: z.number().int().min(1).max(50),
  lives: z.number().int().min(1).max(10),
  skins: z.array(z.string().min(1)).min(1),
  powerups: z.object({
    berryDurationMs: z.number().min(1000).max(20000),
    leafDurationMs: z.number().min(1000).max(20000),
    magnetDurationMs: z.number().min(1000).max(20000),
    magnetRadius: z.number().min(1).max(10),
    coinPoints: z.number().min(10).max(500),
    berrySpeedMultiplier: z.number().min(1.1).max(3),
  }),
  spawnRules: z.object({
    heartProbability: z.number().min(0).max(1),
    heartCooldownFoods: z.number().int().min(1).max(50),
    leafProbability: z.number().min(0).max(1),
    berryProbability: z.number().min(0).max(1),
    magnetProbability: z.number().min(0).max(1),
    coinProbability: z.number().min(0).max(1),
    specialCooldownTicks: z.number().int().min(5).max(500),
    maxSpecialSimultaneous: z.number().int().min(1).max(6),
  }),
  levelScaling: z.object({
    speedPerLevelMs: z.number().min(0).max(20),
    obstaclePerLevel: z.number().min(0).max(0.2),
  }),
});

export type SnakeConfig = z.infer<typeof snakeConfigSchema>;

export const defaultSnakeConfig: SnakeConfig = {
  boardCols: 24,
  boardRows: 24,
  initialSpeedMs: 160,
  speedRampMs: 1,
  roomTargetFoods: 50,
  obstacleDensity: 0.04,
  endlessObstacleIntensity: 0.1,
  maxFoodSpawnScreenDistance: 3,
  pointsPerFood: 10,
  lives: 2,
  skins: ['Classic', 'Neon', 'Ocean', 'Ruby'],
  powerups: {
    berryDurationMs: 5000,
    leafDurationMs: 7000,
    magnetDurationMs: 7000,
    magnetRadius: 3,
    coinPoints: 50,
    berrySpeedMultiplier: 1.5,
  },
  spawnRules: {
    heartProbability: 0.08,
    heartCooldownFoods: 8,
    leafProbability: 0.12,
    berryProbability: 0.14,
    magnetProbability: 0.1,
    coinProbability: 0.2,
    specialCooldownTicks: 15,
    maxSpecialSimultaneous: 2,
  },
  levelScaling: {
    speedPerLevelMs: 4,
    obstaclePerLevel: 0.02,
  },
};
