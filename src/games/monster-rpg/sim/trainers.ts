import type { TrainerDefinition } from './types';

export const TRAINER_DEFINITIONS: readonly TrainerDefinition[] = Object.freeze([Object.freeze({
  id: 'route-scout-1', trainerId: 'route-scout-1', name: 'Route Scout',
  team: Object.freeze([{ speciesId: 1, level: 2 }, { speciesId: 2, level: 2 }]),
  maxProactiveSwitches: 1, proactiveSwitchHpRatio: 0.25,
  reward: Object.freeze({ playerXp: 12, creatureXp: 8, magicDust: 4 })
})]);

export function getTrainerDefinition(id: string): TrainerDefinition | undefined {
  return TRAINER_DEFINITIONS.find((definition) => definition.id === id);
}
