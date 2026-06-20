import { describe, expect, test } from 'vitest';
import { defaultSnakeConfig, snakeConfigSchema } from './config';

describe('snakeConfigSchema', () => {
  test('accepts default config', () => {
    const result = snakeConfigSchema.safeParse(defaultSnakeConfig);
    expect(result.success).toBe(true);
  });

  test('rejects invalid values', () => {
    const result = snakeConfigSchema.safeParse({ ...defaultSnakeConfig, boardCols: 1 });
    expect(result.success).toBe(false);
  });
});
