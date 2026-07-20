export const CURRENT_BALANCE_VERSION = 2 as const;

export interface GameBalanceConfig {
  readonly version: typeof CURRENT_BALANCE_VERSION;
  readonly creatures: { readonly activePartyLimit: number; readonly reviveRestoreRatio: number };
  readonly battles: { readonly disconnectGraceMs: number; readonly fatigueRecoveryFloor: number; readonly baseRunChance: number; readonly runAttemptBonus: number };
  readonly items: { readonly startingReviveQuantity: number };
  readonly inventory: { readonly startingMagicDust: number; readonly startingClinks: number };
  readonly chests: { readonly cardPackSize: number };
  readonly rewards: { readonly battleMagicDustBase: number; readonly battlePackChance: number; readonly battleDirectEggChance: number; readonly battleMaterialChance: number };
  readonly economy: { readonly stationTravelBaseCost: number; readonly stationTravelLevelDiffCost: number };
  readonly maps: { readonly transitionTokenTtlMs: number; readonly wildEncounterRespawnMs: number };
}

export const GAME_BALANCE_CONFIG: Readonly<GameBalanceConfig> = Object.freeze({
  version: CURRENT_BALANCE_VERSION,
  creatures: Object.freeze({ activePartyLimit: 5, reviveRestoreRatio: 0.25 }),
  battles: Object.freeze({ disconnectGraceMs: 15_000, fatigueRecoveryFloor: 4, baseRunChance: 0.5, runAttemptBonus: 0.25 }),
  items: Object.freeze({ startingReviveQuantity: 1 }),
  inventory: Object.freeze({ startingMagicDust: 0, startingClinks: 0 }),
  chests: Object.freeze({ cardPackSize: 5 }),
  rewards: Object.freeze({ battleMagicDustBase: 2, battlePackChance: 0.18, battleDirectEggChance: 0.03, battleMaterialChance: 0.4 }),
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
