import type { BaseStatTendencies, CreatureRarity, CreatureSaveRecord, CreatureSpeciesRecord, CreatureStatGrowthDraftEvent, CreatureStatGrowthState, GrowthAuditEvent, StatGrowthModel } from './types';
import { GAME_BALANCE_CONFIG } from './gameBalance';

export interface StatGrowthDependencies { rng: () => number; now: () => Date }
export interface ApplyCreatureExperienceOptions extends Partial<StatGrowthDependencies> { model?: StatGrowthModel; species?: Pick<CreatureSpeciesRecord, 'baseStats' | 'type'> }
export interface RebalanceCreatureStatsOptions extends Pick<Partial<StatGrowthDependencies>, 'now'> { species?: Pick<CreatureSpeciesRecord, 'baseStats' | 'type'> }

const statKeys = ['hp', 'attack', 'defense', 'speed', 'stamina'] as const;
const models = new Set<StatGrowthModel>(['deterministic-default', 'rarity-weighted-random']);

export function applyCreatureExperience(creature: CreatureSaveRecord, experience: number, rarity: CreatureRarity, options: ApplyCreatureExperienceOptions = {}): CreatureSaveRecord {
  if (!isSafeNonNegativeInteger(experience) || !isValidCreatureState(creature)) return creature;
  const gainedExperience = experience;
  if (gainedExperience === 0) return options.model && options.model !== getGrowth(creature).model ? withGrowthModel(creature, options.model) : creature;
  const totalExperience = creature.experience + gainedExperience;
  if (!Number.isSafeInteger(totalExperience)) return creature;
  const targetLevel = getCreatureLevelForExperience(totalExperience);
  if (targetLevel <= creature.level) return { ...creature, experience: totalExperience, statGrowth: { ...getGrowth(creature), model: options.model ?? getGrowth(creature).model } };
  const rng = options.rng ?? (() => 0.5);
  const now = options.now ?? (() => new Date());
  const model = options.model ?? getGrowth(creature).model;
  if (!models.has(model) || !isValidClock(now)) return creature;
  let next: CreatureSaveRecord = { ...creature, experience: totalExperience, statGrowth: { ...getGrowth(creature), model } };
  for (let level = creature.level + 1; level <= targetLevel; level += 1) {
    try { next = appendStatGrowth(next, createLevelGrowthEvent(next, level, rarity, model, rng, now, options.species)); } catch { return creature; }
  }
  return next;
}

export function getCreatureLevelForExperience(experience: number): number {
  if (!isSafeNonNegativeInteger(experience)) return 1;
  const perLevel = GAME_BALANCE_CONFIG.creatureStatGrowth.experiencePerLevel;
  return Math.max(1, Math.floor(experience / perLevel) + 1);
}

export function createLevelGrowthEvent(creature: CreatureSaveRecord, level: number, rarity: CreatureRarity, model: StatGrowthModel, rng: () => number, now: () => Date, species?: Pick<CreatureSpeciesRecord, 'baseStats' | 'type'>): CreatureStatGrowthDraftEvent {
  if (!isSafePositiveInteger(level) || !models.has(model) || !isValidClock(now)) throw new Error('Invalid stat growth event input');
  const id = `growth:${level}`;
  if (getGrowth(creature).events.some((event) => growthEventId(event) === id) || creature.pendingGrowthEvents?.some((event) => event.id === id)) throw new Error(`Duplicate stat growth event ${id}`);
  return { id, kind: 'level-up', level, model, deltas: getGrowthDeltas(rarity, model, rng, species), createdAt: now().toISOString() };
}

export function appendStatGrowth(creature: CreatureSaveRecord, event: CreatureStatGrowthDraftEvent): CreatureSaveRecord {
  const growth = getGrowth(creature);
  const pending = creature.pendingGrowthEvents ?? [];
  if (pending.some((existing) => existing.id === event.id) || growth.events.some((existing) => growthEventId(existing) === event.id)) return creature;
  if (!isValidCreatureState(creature) || !isValidGrowthEvent(event, growth, creature.level + 1) || !isCanonicalDraftEvent(event) ||
    (event.kind === 'level-up' && event.level !== creature.level + 1) ||
    (event.kind === 'rebalance' && event.level !== creature.level)) throw new Error('Invalid stat growth event');
  const stats = addStats(creature.stats, event.deltas);
  const maxHp = creature.maxHp + event.deltas.hp;
  if (!isValidStats(stats) || !isSafePositiveInteger(maxHp)) throw new Error('Stat growth would produce invalid stats');
  const hp = creature.fainted ? 0 : Math.min(maxHp, creature.hp + Math.max(0, event.deltas.hp));
  return { ...creature, level: Math.max(creature.level, event.level), stats, maxHp, hp, pendingGrowthEvents: [...pending, event], statGrowth: growth };
}

/** Recomputes deterministic historical level-ups from the active balance config and appends only the required adjustment. */
export function rebalanceCreatureStats(creature: CreatureSaveRecord, _rarity?: CreatureRarity, options: RebalanceCreatureStatsOptions = {}): CreatureSaveRecord {
  if (!isValidCreatureState(creature)) return creature;
  const growth = getGrowth(creature);
  const replayed = replayStatGrowth(growth, { recomputeDeterministic: true, ignoreRebalances: true });
  if (!replayed) return creature;
  const deltas = subtractStats(replayed.stats, creature.stats);
  if (statKeys.every((key) => deltas[key] === 0)) return creature;
  const now = options.now ?? (() => new Date());
  if (!isValidClock(now)) return creature;
  const event: CreatureStatGrowthDraftEvent = { id: `rebalance:${creature.level}:${growth.events.filter((entry) => entry.kind === 'rebalance').length + (creature.pendingGrowthEvents?.filter((entry) => entry.kind === 'rebalance').length ?? 0) + 1}`, kind: 'rebalance', model: 'rebalance', level: creature.level, deltas, createdAt: now().toISOString() };
  try { return appendStatGrowth(creature, event); } catch { return creature; }
}

export function getGrowthDeltas(rarity: CreatureRarity, model: StatGrowthModel, rng: () => number, species?: Pick<CreatureSpeciesRecord, 'baseStats' | 'type'>): BaseStatTendencies {
  if (model === 'deterministic-default') return { ...GAME_BALANCE_CONFIG.creatureStatGrowth.deterministicDelta };
  const range = GAME_BALANCE_CONFIG.creatureStatGrowth.randomRange;
  const rarityBonus = GAME_BALANCE_CONFIG.creatureStatGrowth.rarityBonus[rarity];
  const speciesPreferred = getSpeciesPreferredStat(species?.baseStats);
  const typePreferred = species ? GAME_BALANCE_CONFIG.creatureStatGrowth.typeStatPreference[species.type] : undefined;
  return statKeys.reduce<BaseStatTendencies>((deltas, key) => {
    const roll = normalizedRng(rng);
    deltas[key] = range.min + Math.floor(roll * roll * (range.max - range.min + 1)) + rarityBonus + (key === speciesPreferred ? GAME_BALANCE_CONFIG.creatureStatGrowth.speciesPreferenceBonus : 0) + (key === typePreferred ? GAME_BALANCE_CONFIG.creatureStatGrowth.typePreferenceBonus : 0);
    return deltas;
  }, { hp: 0, attack: 0, defense: 0, speed: 0, stamina: 0 });
}

/** Safely replays a persisted basis and ordered event stream; rebalance events are deliberately excluded when requested. */
export function replayStatGrowth(growth: CreatureStatGrowthState, options: { recomputeDeterministic?: boolean; ignoreRebalances?: boolean } = {}): { stats: BaseStatTendencies; maxHp: number } | null {
  if (!isValidGrowthState(growth)) return null;
  let stats = { ...growth.basis.stats };
  for (const event of growth.events) {
    if (options.ignoreRebalances && event.kind === 'rebalance') continue;
    const deltas = options.recomputeDeterministic && event.kind === 'level-up' && event.model === 'deterministic-default' ? GAME_BALANCE_CONFIG.creatureStatGrowth.deterministicDelta : event.deltas;
    stats = addStats(stats, deltas);
    if (!isValidStats(stats)) return null;
  }
  return { stats, maxHp: stats.hp };
}

export function isValidStatGrowthState(value: unknown, level: number, stats: BaseStatTendencies, maxHp: number): boolean {
  if (!isValidGrowthState(value)) return false;
  const growth = value as CreatureStatGrowthState;
  if (growth.basis.level > level || growth.basis.level + growth.events.filter((event) => event.kind === 'level-up').length !== level) return false;
  const replayed = replayStatGrowth(growth);
  return replayed !== null && sameStats(replayed.stats, stats) && replayed.maxHp === maxHp && growth.events.every((event) => event.levelTo <= level);
}

function getGrowth(creature: CreatureSaveRecord): CreatureStatGrowthState { return creature.statGrowth ?? { model: GAME_BALANCE_CONFIG.creatureStatGrowth.model, basis: { level: creature.level, stats: { ...creature.stats } }, events: [] }; }
function withGrowthModel(creature: CreatureSaveRecord, model: StatGrowthModel): CreatureSaveRecord { return models.has(model) ? { ...creature, statGrowth: { ...getGrowth(creature), model } } : creature; }
function isValidGrowthState(value: unknown): value is CreatureStatGrowthState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const growth = value as CreatureStatGrowthState;
  if (!models.has(growth.model) || !growth.basis || !isSafePositiveInteger(growth.basis.level) || !isValidStats(growth.basis.stats) || !Array.isArray(growth.events)) return false;
  let expectedLevel = growth.basis.level + 1; let previousTime = -Infinity; const grants = new Set<string>();
  return growth.events.every((event) => {
    if (!isCanonicalGrowthEvent(event) || grants.has(event.grantId)) return false;
    const time = Date.parse(event.createdAt); if (time < previousTime) return false;
    if (event.kind === 'level-up') {
      if (event.levelFrom !== expectedLevel - 1 || event.levelTo !== expectedLevel || (event.model === 'deterministic-default' && !sameStats(event.deltas, GAME_BALANCE_CONFIG.creatureStatGrowth.deterministicDelta))) return false;
      expectedLevel += 1;
    } else {
      if (event.levelFrom !== expectedLevel - 1 || event.levelTo !== expectedLevel - 1) return false;
    }
    grants.add(event.grantId); previousTime = time; return true;
  });
}
function isValidGrowthEvent(event: unknown, _growth: CreatureStatGrowthState, maximumLevel: number): event is CreatureStatGrowthDraftEvent {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return false;
  const candidate = event as CreatureStatGrowthDraftEvent;
  return typeof candidate.id === 'string' && candidate.id.trim().length > 0 && isSafePositiveInteger(candidate.level) && candidate.level <= maximumLevel && isValidStatsDelta(candidate.deltas) && isValidDate(candidate.createdAt) && ((candidate.kind === 'level-up' && models.has(candidate.model as StatGrowthModel)) || (candidate.kind === 'rebalance' && candidate.model === 'rebalance'));
}
function isCanonicalDraftEvent(event: CreatureStatGrowthDraftEvent): boolean {
  if (event.kind === 'level-up') {
    return event.id === `growth:${event.level}` && (event.model !== 'deterministic-default' || sameStats(event.deltas, GAME_BALANCE_CONFIG.creatureStatGrowth.deterministicDelta));
  }
  return event.id.startsWith(`rebalance:${event.level}:`);
}
function isCanonicalGrowthEvent(event: GrowthAuditEvent): boolean {
  return event.v === 1 && event.levelFrom > 0 && event.levelTo >= event.levelFrom && typeof event.grantId === 'string' && typeof event.eventHash === 'string' && typeof event.previousHash === 'string';
}
function growthEventId(event: GrowthAuditEvent): string { return event.kind === 'level-up' ? `growth:${event.levelTo}` : `rebalance:${event.levelTo}:${event.targetBalanceVersion}`; }
function isValidCreatureState(creature: CreatureSaveRecord): boolean { return isSafePositiveInteger(creature.level) && isSafeNonNegativeInteger(creature.experience) && isValidStats(creature.stats) && isSafePositiveInteger(creature.maxHp) && isSafeNonNegativeInteger(creature.hp) && creature.hp <= creature.maxHp && creature.fainted === (creature.hp === 0) && (!creature.statGrowth || Boolean(creature.pendingGrowthEvents) || isValidStatGrowthState(creature.statGrowth, creature.level, creature.stats, creature.maxHp)); }
function normalizedRng(rng: () => number): number { let value: unknown; try { value = rng(); } catch { return 0.5; } return typeof value === 'number' && Number.isFinite(value) ? ((value % 1) + 1) % 1 : 0.5; }
function isValidClock(now: () => Date): boolean { try { return isValidDate(now()?.toISOString()); } catch { return false; } }
function isValidDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function isSafePositiveInteger(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) > 0; }
function isSafeNonNegativeInteger(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) >= 0; }
function isValidStats(value: unknown): value is BaseStatTendencies { return !!value && typeof value === 'object' && statKeys.every((key) => isSafeNonNegativeInteger((value as BaseStatTendencies)[key]) && (key !== 'hp' || (value as BaseStatTendencies)[key] > 0)); }
function isValidStatsDelta(value: unknown): value is BaseStatTendencies { return !!value && typeof value === 'object' && statKeys.every((key) => Number.isSafeInteger((value as BaseStatTendencies)[key])); }
function getSpeciesPreferredStat(stats: BaseStatTendencies | undefined): keyof BaseStatTendencies | undefined { return stats ? statKeys.reduce((best, key) => stats[key] > stats[best] ? key : best, statKeys[0]) : undefined; }
function addStats(stats: BaseStatTendencies, deltas: BaseStatTendencies): BaseStatTendencies { return { hp: stats.hp + deltas.hp, attack: stats.attack + deltas.attack, defense: stats.defense + deltas.defense, speed: stats.speed + deltas.speed, stamina: stats.stamina + deltas.stamina }; }
function subtractStats(left: BaseStatTendencies, right: BaseStatTendencies): BaseStatTendencies { return { hp: left.hp - right.hp, attack: left.attack - right.attack, defense: left.defense - right.defense, speed: left.speed - right.speed, stamina: left.stamina - right.stamina }; }
function sameStats(left: BaseStatTendencies, right: BaseStatTendencies): boolean { return statKeys.every((key) => left[key] === right[key]); }
