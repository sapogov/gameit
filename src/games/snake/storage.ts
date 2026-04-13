import { readLocal, writeLocal } from '../../lib/storage';
import { defaultSnakeConfig, snakeConfigSchema, SnakeConfig } from './config';

const CONFIG_KEY = 'gameit.snake.config.v1';
const PROFILE_KEY = 'gameit.snake.profile.v1';

export interface PlayerProfile {
  name: string;
  skin: string;
  mode: SnakeMode;
}

export type SnakeMode = 'classic' | 'room' | 'endless';

export const loadSnakeConfig = (): SnakeConfig => {
  const candidate = readLocal<SnakeConfig>(CONFIG_KEY, defaultSnakeConfig);
  const parsed = snakeConfigSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaultSnakeConfig;
};

export const saveSnakeConfig = (config: SnakeConfig) => writeLocal(CONFIG_KEY, config);
export const resetSnakeConfig = () => writeLocal(CONFIG_KEY, defaultSnakeConfig);

export const loadProfile = (): PlayerProfile =>
  readLocal<PlayerProfile>(PROFILE_KEY, {
    name: '',
    skin: defaultSnakeConfig.skins[0],
    mode: 'classic',
  });

export const saveProfile = (profile: PlayerProfile) => writeLocal(PROFILE_KEY, profile);
