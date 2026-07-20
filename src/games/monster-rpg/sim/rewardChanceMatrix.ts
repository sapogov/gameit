import type { CreatureRarity, WildEncounterOutcome } from './types';

export interface RewardChanceContext {
  zoneId: string;
  enemyRarity: CreatureRarity;
  speciesId: number;
  outcome: WildEncounterOutcome;
}

export interface RewardChanceConstraints {
  readonly zoneId?: string | readonly string[];
  readonly enemyRarity?: CreatureRarity | readonly CreatureRarity[];
  readonly speciesId?: number | readonly number[];
  readonly outcome?: WildEncounterOutcome | readonly WildEncounterOutcome[];
}

export interface RewardChanceEntry<TReward = string> {
  readonly id: string;
  readonly chance: number;
  readonly quantity: readonly [minimum: number, maximum: number];
  readonly reward: TReward;
  readonly constraints?: RewardChanceConstraints;
  readonly boostable?: boolean;
}

export interface RolledReward<TReward = string> {
  entryId: string;
  reward: TReward;
  quantity: number;
}

export function rollRewardChanceMatrix<TReward>(
  entries: readonly RewardChanceEntry<TReward>[],
  context: RewardChanceContext | undefined,
  options: { rng: () => number; boostMultiplier?: number }
): RolledReward<TReward>[] {
  if (!hasCompleteContext(context)) return [];
  assertValidMatrix(entries);
  const boostMultiplier = normalizeNonNegative(options.boostMultiplier ?? 1);
  return entries.flatMap((entry) => {
    if (!matchesConstraints(context, entry.constraints)) return [];
    const chance = Math.min(1, entry.chance * (entry.boostable ? boostMultiplier : 1));
    if (chance === 0 || (chance < 1 && normalizeRng(options.rng()) >= chance)) return [];
    const [minimum, maximum] = entry.quantity;
    return [{
      entryId: entry.id,
      reward: entry.reward,
      quantity: minimum + Math.floor(normalizeRng(options.rng()) * (maximum - minimum + 1))
    }];
  });
}

export function applyRewardChanceEntryOverrides<TReward>(
  entries: readonly RewardChanceEntry<TReward>[],
  overrides: readonly RewardChanceEntry<TReward>[]
): RewardChanceEntry<TReward>[] {
  assertValidMatrix(entries);
  assertValidMatrix(overrides);
  const replacements = new Map(overrides.map((entry) => [entry.id, entry]));
  const baseIds = new Set(entries.map((entry) => entry.id));
  return [
    ...entries.map((entry) => replacements.get(entry.id) ?? entry),
    ...overrides.filter((entry) => !baseIds.has(entry.id))
  ];
}

function hasCompleteContext(value: RewardChanceContext | undefined): value is RewardChanceContext {
  return !!value && value.zoneId.length > 0 && Number.isSafeInteger(value.speciesId) && !!value.enemyRarity && !!value.outcome;
}

function matchesConstraints(context: RewardChanceContext, constraints: RewardChanceConstraints | undefined): boolean {
  if (!constraints) return true;
  const allowedKeys = new Set<keyof RewardChanceConstraints>(['zoneId', 'enemyRarity', 'speciesId', 'outcome']);
  return (Object.keys(constraints) as (keyof RewardChanceConstraints)[]).every((key) => {
    if (!allowedKeys.has(key)) return false;
    const expected = constraints[key];
    const actual = context[key];
    return expected === undefined || (Array.isArray(expected) ? expected.includes(actual as never) : expected === actual);
  });
}

export function assertValidMatrix<TReward>(entries: readonly RewardChanceEntry<TReward>[]): void {
  const ids = new Set<string>();
  entries.forEach((entry) => {
    assertValidEntry(entry);
    if (ids.has(entry.id)) throw new Error(`Duplicate reward chance entry: ${entry.id}`);
    ids.add(entry.id);
  });
}

function assertValidEntry<TReward>(entry: RewardChanceEntry<TReward>): void {
  const [minimum, maximum] = entry.quantity;
  if (!entry.id || !Number.isFinite(entry.chance) || entry.chance < 0 || entry.chance > 1 || !Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || maximum < minimum) {
    throw new Error(`Invalid reward chance entry: ${entry.id || 'missing-id'}`);
  }
  if (entry.constraints && !hasValidConstraints(entry.constraints)) {
    throw new Error(`Invalid reward chance constraints: ${entry.id}`);
  }
}

function hasValidConstraints(constraints: RewardChanceConstraints): boolean {
  const allowedKeys = new Set<keyof RewardChanceConstraints>(['zoneId', 'enemyRarity', 'speciesId', 'outcome']);
  return Object.entries(constraints).every(([key, value]) => {
    if (!allowedKeys.has(key as keyof RewardChanceConstraints)) return false;
    const values = Array.isArray(value) ? value : [value];
    return values.length > 0 && values.every((candidate) => isValidConstraintValue(key, candidate));
  });
}

function isValidConstraintValue(key: string, value: unknown): boolean {
  if (key === 'zoneId') return typeof value === 'string' && value.length > 0;
  if (key === 'speciesId') return typeof value === 'number' && Number.isSafeInteger(value);
  if (key === 'enemyRarity') return ['common', 'uncommon', 'rare', 'legendary', 'mythical'].includes(value as string);
  return ['defeated', 'lost', 'ran'].includes(value as string);
}

function normalizeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeRng(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value === Infinity) return 1 - Number.EPSILON;
  if (value === -Infinity) return 0;
  return Math.max(0, Math.min(1 - Number.EPSILON, value));
}
