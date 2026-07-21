import type { CreatureStatKey, CreatureType } from './types';

const growthStatKeys: readonly CreatureStatKey[] = ['hp', 'attack', 'defense', 'speed', 'stamina'];
const rarities = ['common', 'uncommon', 'rare', 'legendary', 'mythical'] as const;
const creatureTypes = ['verdant', 'ember', 'tide', 'stone', 'gale', 'spark', 'shade', 'lumen', 'frost', 'mystic', 'toxin', 'metal'] as const;

export const CURRENT_BALANCE_VERSION = 2 as const;

export interface RewardChanceBalanceEntry {
  readonly id: string;
  readonly chance: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly boostable: boolean;
}

export interface GameBalanceConfig {
  readonly version: typeof CURRENT_BALANCE_VERSION;
  readonly creatures: { readonly activePartyLimit: number; readonly reviveRestoreRatio: number };
  readonly creatureStatGrowth: { readonly model: 'deterministic-default' | 'rarity-weighted-random'; readonly experiencePerLevel: number; readonly deterministicDelta: { readonly hp: number; readonly attack: number; readonly defense: number; readonly speed: number; readonly stamina: number }; readonly randomRange: { readonly min: number; readonly max: number }; readonly rarityBonus: Record<'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical', number>; readonly speciesPreferenceBonus: number; readonly typePreferenceBonus: number; readonly typeStatPreference: Record<CreatureType, CreatureStatKey> };
  readonly battles: { readonly disconnectGraceMs: number; readonly fatigueRecoveryFloor: number; readonly baseRunChance: number; readonly runAttemptBonus: number };
  readonly items: { readonly startingReviveQuantity: number };
  readonly inventory: { readonly startingMagicDust: number; readonly startingClinks: number };
  readonly chests: { readonly cardPackSize: number };
  readonly rewards: {
    readonly battleMagicDustBase: number;
    readonly battlePackChance: number;
    readonly battleDirectEggChance: number;
    readonly battleMaterialChance: number;
    readonly wildBattleCommonClinks: readonly RewardChanceBalanceEntry[];
  };
  readonly economy: { readonly stationTravelBaseCost: number; readonly stationTravelLevelDiffCost: number };
  readonly maps: { readonly transitionTokenTtlMs: number; readonly wildEncounterRespawnMs: number };
}

export const GAME_BALANCE_CONFIG: Readonly<GameBalanceConfig> = Object.freeze({
  version: CURRENT_BALANCE_VERSION,
  creatures: Object.freeze({ activePartyLimit: 5, reviveRestoreRatio: 0.25 }),
  creatureStatGrowth: Object.freeze({ model: 'deterministic-default', experiencePerLevel: 100, deterministicDelta: Object.freeze({ hp: 2, attack: 1, defense: 1, speed: 1, stamina: 1 }), randomRange: Object.freeze({ min: 0, max: 2 }), rarityBonus: Object.freeze({ common: 0, uncommon: 0, rare: 1, legendary: 1, mythical: 2 }), speciesPreferenceBonus: 1, typePreferenceBonus: 1, typeStatPreference: Object.freeze({ verdant: 'stamina', ember: 'attack', tide: 'hp', stone: 'defense', gale: 'speed', spark: 'speed', shade: 'attack', lumen: 'stamina', frost: 'defense', mystic: 'stamina', toxin: 'attack', metal: 'defense' }) }),
  battles: Object.freeze({ disconnectGraceMs: 15_000, fatigueRecoveryFloor: 4, baseRunChance: 0.5, runAttemptBonus: 0.25 }),
  items: Object.freeze({ startingReviveQuantity: 1 }),
  inventory: Object.freeze({ startingMagicDust: 0, startingClinks: 0 }),
  chests: Object.freeze({ cardPackSize: 5 }),
  rewards: Object.freeze({
    battleMagicDustBase: 2,
    battlePackChance: 0.18,
    battleDirectEggChance: 0.03,
    battleMaterialChance: 0.4,
    wildBattleCommonClinks: Object.freeze([
      Object.freeze({ id: 'clinks-common-guaranteed', chance: 1, minimum: 6, maximum: 8, boostable: false }),
      Object.freeze({ id: 'clinks-common-bonus', chance: 0.4, minimum: 5, maximum: 10, boostable: true })
    ])
  }),
  economy: Object.freeze({ stationTravelBaseCost: 2, stationTravelLevelDiffCost: 3 }),
  maps: Object.freeze({ transitionTokenTtlMs: 15_000, wildEncounterRespawnMs: 30_000 })
});

export interface BalanceValidationIssue { path: string; message: string }

export function validateGameBalanceConfig(config: unknown = GAME_BALANCE_CONFIG): BalanceValidationIssue[] {
  const issues: BalanceValidationIssue[] = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) return [{ path: 'config', message: 'must be an object' }];
  const candidate = config as Record<string, unknown>;
  if (candidate.version !== CURRENT_BALANCE_VERSION) issues.push({ path: 'version', message: `must equal ${CURRENT_BALANCE_VERSION}` });
  const integer = (path: string, minimum = 0) => validateNumber(candidate, path, issues, { integer: true, minimum });
  const probability = (path: string) => validateNumber(candidate, path, issues, { minimum: 0, maximum: 1 });
  integer('creatures.activePartyLimit', 1);
  probability('creatures.reviveRestoreRatio');
  integer('creatureStatGrowth.experiencePerLevel', 1);
  integer('creatureStatGrowth.deterministicDelta.hp'); integer('creatureStatGrowth.deterministicDelta.attack'); integer('creatureStatGrowth.deterministicDelta.defense'); integer('creatureStatGrowth.deterministicDelta.speed'); integer('creatureStatGrowth.deterministicDelta.stamina');
  integer('creatureStatGrowth.randomRange.min'); integer('creatureStatGrowth.randomRange.max');
  integer('creatureStatGrowth.speciesPreferenceBonus'); integer('creatureStatGrowth.typePreferenceBonus');
  if (getPath(candidate, 'creatureStatGrowth.model') !== 'deterministic-default' && getPath(candidate, 'creatureStatGrowth.model') !== 'rarity-weighted-random') issues.push({ path: 'creatureStatGrowth.model', message: 'must be a supported model' });
  const randomMin = getPath(candidate, 'creatureStatGrowth.randomRange.min'); const randomMax = getPath(candidate, 'creatureStatGrowth.randomRange.max');
  if (typeof randomMin === 'number' && typeof randomMax === 'number' && randomMin > randomMax) issues.push({ path: 'creatureStatGrowth.randomRange', message: 'min must not exceed max' });
  validateExactNumberMap(candidate, 'creatureStatGrowth.rarityBonus', rarities, issues);
  validateExactStringMap(candidate, 'creatureStatGrowth.typeStatPreference', creatureTypes, growthStatKeys, issues);
  integer('battles.disconnectGraceMs', 1);
  integer('battles.fatigueRecoveryFloor');
  probability('battles.baseRunChance');
  probability('battles.runAttemptBonus');
  integer('items.startingReviveQuantity');
  integer('inventory.startingMagicDust');
  integer('inventory.startingClinks');
  integer('chests.cardPackSize', 1);
  integer('rewards.battleMagicDustBase');
  probability('rewards.battlePackChance');
  probability('rewards.battleDirectEggChance');
  probability('rewards.battleMaterialChance');
  validateRewardChanceEntries(candidate, 'rewards.wildBattleCommonClinks', issues);
  integer('economy.stationTravelBaseCost');
  integer('economy.stationTravelLevelDiffCost');
  integer('maps.transitionTokenTtlMs', 1);
  integer('maps.wildEncounterRespawnMs', 1);
  const transitionTtl = getPath(candidate, 'maps.transitionTokenTtlMs');
  const respawn = getPath(candidate, 'maps.wildEncounterRespawnMs');
  if (typeof transitionTtl === 'number' && typeof respawn === 'number' && transitionTtl > respawn) {
    issues.push({ path: 'maps.transitionTokenTtlMs', message: 'must not exceed maps.wildEncounterRespawnMs' });
  }
  return issues;
}

function validateRewardChanceEntries(
  root: Record<string, unknown>,
  path: string,
  issues: BalanceValidationIssue[]
): void {
  const value = getPath(root, path);
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'must be an array' });
    return;
  }
  if (value.length === 0) issues.push({ path, message: 'must not be empty' });

  const ids = new Set<string>();
  const entryKeys = new Set(['id', 'chance', 'minimum', 'maximum', 'boostable']);
  value.forEach((entry, index) => {
    const entryPath = `${path}.${index}`;
    if (!isPlainObject(entry)) {
      issues.push({ path: entryPath, message: 'must be an object' });
      return;
    }
    const candidate = entry as Record<string, unknown>;
    if (Object.keys(candidate).some((key) => !entryKeys.has(key))) {
      issues.push({ path: entryPath, message: 'contains unknown properties' });
    }
    if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
      issues.push({ path: `${entryPath}.id`, message: 'must be a non-empty string' });
    } else if (ids.has(candidate.id)) {
      issues.push({ path: `${entryPath}.id`, message: 'must be unique' });
    } else {
      ids.add(candidate.id);
    }
    validateRewardEntryNumber(candidate.chance, `${entryPath}.chance`, issues, false, 0, 1);
    validateRewardEntryNumber(candidate.minimum, `${entryPath}.minimum`, issues, true, 0);
    validateRewardEntryNumber(candidate.maximum, `${entryPath}.maximum`, issues, true, 0);
    if (
      typeof candidate.minimum === 'number' &&
      typeof candidate.maximum === 'number' &&
      candidate.maximum < candidate.minimum
    ) {
      issues.push({ path: `${entryPath}.maximum`, message: 'must be at least minimum' });
    }
    if (typeof candidate.boostable !== 'boolean') {
      issues.push({ path: `${entryPath}.boostable`, message: 'must be a boolean' });
    }
  });
}

function validateRewardEntryNumber(
  value: unknown,
  path: string,
  issues: BalanceValidationIssue[],
  integer: boolean,
  minimum: number,
  maximum?: number
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: 'must be a finite number' });
    return;
  }
  if (integer && !Number.isSafeInteger(value)) issues.push({ path, message: 'must be a safe integer' });
  if (value < minimum) issues.push({ path, message: `must be at least ${minimum}` });
  if (maximum !== undefined && value > maximum) issues.push({ path, message: `must be at most ${maximum}` });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateExactNumberMap(root: Record<string, unknown>, path: string, keys: readonly string[], issues: BalanceValidationIssue[]): void {
  const value = getPath(root, path);
  if (!value || typeof value !== 'object' || Array.isArray(value)) { issues.push({ path, message: 'must be an object' }); return; }
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const start = issues.length;
    validateNumber(record, key, issues, { integer: true, minimum: 0 });
    for (let index = start; index < issues.length; index += 1) issues[index].path = `${path}.${issues[index].path}`;
  }
  for (const key of Object.keys(record)) if (!keys.includes(key)) issues.push({ path: `${path}.${key}`, message: 'is not supported' });
}

function validateExactStringMap(root: Record<string, unknown>, path: string, keys: readonly string[], values: readonly string[], issues: BalanceValidationIssue[]): void {
  const value = getPath(root, path);
  if (!value || typeof value !== 'object' || Array.isArray(value)) { issues.push({ path, message: 'must be an object' }); return; }
  const record = value as Record<string, unknown>;
  for (const key of keys) if (!values.includes(record[key] as string)) issues.push({ path: `${path}.${key}`, message: 'must be a supported stat key' });
  for (const key of Object.keys(record)) if (!keys.includes(key)) issues.push({ path: `${path}.${key}`, message: 'is not supported' });
}

function validateNumber(root: Record<string, unknown>, path: string, issues: BalanceValidationIssue[], rules: { integer?: boolean; minimum: number; maximum?: number }): void {
  const value = getPath(root, path);
  if (typeof value !== 'number' || !Number.isFinite(value)) { issues.push({ path, message: 'must be a finite number' }); return; }
  if (rules.integer && !Number.isInteger(value)) issues.push({ path, message: 'must be an integer' });
  if (value < rules.minimum) issues.push({ path, message: `must be at least ${rules.minimum}` });
  if (rules.maximum !== undefined && value > rules.maximum) issues.push({ path, message: `must be at most ${rules.maximum}` });
}

function getPath(root: Record<string, unknown>, path: string): unknown {
  let value: unknown = root;
  for (const segment of path.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

const balanceConfigIssues = validateGameBalanceConfig();
if (balanceConfigIssues.length) throw new Error(`Invalid Monster RPG game balance config: ${balanceConfigIssues.map((issue) => issue.path).join(', ')}`);
