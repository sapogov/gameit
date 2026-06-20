import type { AttackPoolId, BaseStatTendencies, CreatureRarity, CreatureSpeciesRecord, CreatureType } from './types';

export const GEN_1_SPECIES_COUNT = 147;
const POLISHED_MVP_SPECIES_COUNT = 22;

export const creatureRarities = ['common', 'uncommon', 'rare', 'legendary', 'mythical'] as const;

export const creatureTypes = [
  'verdant',
  'ember',
  'tide',
  'stone',
  'gale',
  'spark',
  'shade',
  'lumen',
  'frost',
  'mystic',
  'toxin',
  'metal'
] as const;

export const attackPoolIds = [
  'basic',
  'starter-balanced',
  'starter-guard',
  'starter-quick',
  'verdant-bite',
  'ember-claw',
  'tide-splash',
  'stone-guard',
  'gale-peck',
  'spark-jolt',
  'shade-prowl',
  'lumen-pulse',
  'frost-nip',
  'mystic-focus',
  'toxin-sting',
  'metal-tackle',
  'rare-burst',
  'legendary-aura',
  'mythic-surge'
] as const;

const polishedSpecies = [
  species(1, 'spriglet', 'Spriglet', 'common', 'verdant', stats(54, 46, 44, 52, 56), [
    'basic',
    'starter-balanced',
    'verdant-bite'
  ]),
  species(2, 'bramblet', 'Bramblet', 'common', 'verdant', stats(64, 38, 62, 34, 60), [
    'basic',
    'starter-guard',
    'verdant-bite'
  ]),
  species(3, 'dashkit', 'Dashkit', 'common', 'gale', stats(44, 48, 34, 72, 58), [
    'basic',
    'starter-quick',
    'gale-peck'
  ]),
  species(4, 'cinderpup', 'Cinderpup', 'common', 'ember', stats(48, 58, 40, 54, 44), ['basic', 'ember-claw']),
  species(5, 'pebblehorn', 'Pebblehorn', 'common', 'stone', stats(66, 44, 70, 26, 48), ['basic', 'stone-guard']),
  species(6, 'brookfin', 'Brookfin', 'common', 'tide', stats(52, 42, 46, 48, 64), ['basic', 'tide-splash']),
  species(7, 'reedwing', 'Reedwing', 'common', 'gale', stats(42, 50, 36, 68, 46), ['basic', 'gale-peck']),
  species(8, 'glowmite', 'Glowmite', 'common', 'lumen', stats(40, 38, 50, 44, 62), ['basic', 'lumen-pulse']),
  species(9, 'mudsnout', 'Mudsnout', 'common', 'stone', stats(62, 48, 58, 30, 52), ['basic', 'stone-guard']),
  species(10, 'thornmouse', 'Thornmouse', 'common', 'verdant', stats(38, 52, 34, 70, 44), ['basic', 'verdant-bite']),
  species(11, 'sparkkit', 'Sparkkit', 'common', 'spark', stats(42, 54, 36, 74, 38), ['basic', 'spark-jolt']),
  species(12, 'shivercub', 'Shivercub', 'common', 'frost', stats(50, 46, 48, 42, 58), ['basic', 'frost-nip']),
  species(13, 'mossback', 'Mossback', 'common', 'verdant', stats(72, 38, 68, 24, 66), ['basic', 'verdant-bite']),
  species(14, 'brightskip', 'Brightskip', 'common', 'lumen', stats(44, 44, 40, 64, 54), ['basic', 'lumen-pulse']),
  species(15, 'duskleaf', 'Duskleaf', 'uncommon', 'shade', stats(50, 62, 42, 62, 48), ['basic', 'shade-prowl']),
  species(16, 'ironbun', 'Ironbun', 'uncommon', 'metal', stats(58, 46, 78, 34, 42), ['basic', 'metal-tackle']),
  species(17, 'venomble', 'Venomble', 'uncommon', 'toxin', stats(46, 60, 42, 58, 50), ['basic', 'toxin-sting']),
  species(18, 'mistmoth', 'Mistmoth', 'uncommon', 'mystic', stats(44, 50, 44, 66, 62), ['basic', 'mystic-focus']),
  species(19, 'coralynx', 'Coralynx', 'uncommon', 'tide', stats(56, 58, 50, 56, 56), ['basic', 'tide-splash']),
  species(20, 'runebuck', 'Runebuck', 'rare', 'mystic', stats(66, 72, 58, 64, 62), ['basic', 'mystic-focus', 'rare-burst']),
  species(21, 'stormperch', 'Stormperch', 'rare', 'spark', stats(54, 76, 48, 82, 52), ['basic', 'spark-jolt', 'rare-burst']),
  species(22, 'frostmane', 'Frostmane', 'rare', 'frost', stats(70, 68, 64, 54, 66), ['basic', 'frost-nip', 'rare-burst'])
] as const satisfies readonly CreatureSpeciesRecord[];

const placeholderFamilies = [
  { prefix: 'moss', type: 'verdant', attackPoolIds: ['basic', 'verdant-bite'], baseStats: stats(50, 44, 48, 42, 56) },
  { prefix: 'coal', type: 'ember', attackPoolIds: ['basic', 'ember-claw'], baseStats: stats(46, 56, 42, 50, 44) },
  { prefix: 'rill', type: 'tide', attackPoolIds: ['basic', 'tide-splash'], baseStats: stats(52, 42, 48, 44, 58) },
  { prefix: 'crag', type: 'stone', attackPoolIds: ['basic', 'stone-guard'], baseStats: stats(62, 46, 66, 28, 46) },
  { prefix: 'gust', type: 'gale', attackPoolIds: ['basic', 'gale-peck'], baseStats: stats(42, 50, 36, 68, 44) },
  { prefix: 'volt', type: 'spark', attackPoolIds: ['basic', 'spark-jolt'], baseStats: stats(44, 54, 38, 70, 42) },
  { prefix: 'dusk', type: 'shade', attackPoolIds: ['basic', 'shade-prowl'], baseStats: stats(50, 58, 44, 58, 46) },
  { prefix: 'halo', type: 'lumen', attackPoolIds: ['basic', 'lumen-pulse'], baseStats: stats(46, 44, 48, 54, 58) },
  { prefix: 'snow', type: 'frost', attackPoolIds: ['basic', 'frost-nip'], baseStats: stats(54, 50, 52, 42, 56) },
  { prefix: 'rune', type: 'mystic', attackPoolIds: ['basic', 'mystic-focus'], baseStats: stats(48, 52, 46, 56, 56) },
  { prefix: 'spore', type: 'toxin', attackPoolIds: ['basic', 'toxin-sting'], baseStats: stats(46, 56, 44, 56, 48) },
  { prefix: 'gear', type: 'metal', attackPoolIds: ['basic', 'metal-tackle'], baseStats: stats(56, 48, 70, 34, 42) }
] as const satisfies ReadonlyArray<{
  prefix: string;
  type: CreatureType;
  attackPoolIds: readonly AttackPoolId[];
  baseStats: BaseStatTendencies;
}>;

export const gen1SpeciesCatalog = [
  ...polishedSpecies,
  ...Array.from({ length: GEN_1_SPECIES_COUNT - POLISHED_MVP_SPECIES_COUNT }, (_, index) =>
    createPlaceholderSpecies(POLISHED_MVP_SPECIES_COUNT + index + 1)
  )
] as const satisfies readonly CreatureSpeciesRecord[];

const speciesById = new Map(gen1SpeciesCatalog.map((record) => [record.id, record]));
const speciesBySlug = new Map(gen1SpeciesCatalog.map((record) => [record.slug, record]));

export function getSpeciesById(id: number): CreatureSpeciesRecord | undefined {
  return speciesById.get(id);
}

export function getSpeciesBySlug(slug: string): CreatureSpeciesRecord | undefined {
  return speciesBySlug.get(slug);
}

export function isKnownSpeciesId(id: number): boolean {
  return speciesById.has(id);
}

export function validateSpeciesCatalog(catalog: readonly CreatureSpeciesRecord[] = gen1SpeciesCatalog): string[] {
  const errors: string[] = [];
  const ids = new Set<number>();
  const slugs = new Set<string>();
  const validRarities = new Set<string>(creatureRarities);
  const validTypes = new Set<string>(creatureTypes);
  const validAttackPools = new Set<string>(attackPoolIds);

  if (catalog.length !== GEN_1_SPECIES_COUNT) {
    errors.push(`catalog must contain ${GEN_1_SPECIES_COUNT} species`);
  }

  catalog.forEach((record) => {
    if (!Number.isSafeInteger(record.id) || record.id < 1) errors.push(`${record.slug} has invalid id ${record.id}`);
    if (record.id !== ids.size + 1) errors.push(`${record.slug} must use sequential id ${ids.size + 1}`);
    if (ids.has(record.id)) errors.push(`duplicate species id ${record.id}`);
    ids.add(record.id);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) errors.push(`${record.id} has invalid slug ${record.slug}`);
    if (slugs.has(record.slug)) errors.push(`duplicate species slug ${record.slug}`);
    slugs.add(record.slug);

    if (!validRarities.has(record.rarity)) errors.push(`${record.slug} has invalid rarity ${record.rarity}`);
    if (!validTypes.has(record.type)) errors.push(`${record.slug} has invalid type ${record.type}`);
    if (!record.attackPoolIds.length) errors.push(`${record.slug} must reference at least one attack pool`);

    record.attackPoolIds.forEach((attackPoolId) => {
      if (!validAttackPools.has(attackPoolId)) errors.push(`${record.slug} references missing attack pool ${attackPoolId}`);
    });
  });

  return errors;
}

function createPlaceholderSpecies(id: number): CreatureSpeciesRecord {
  const family = placeholderFamilies[(id - POLISHED_MVP_SPECIES_COUNT - 1) % placeholderFamilies.length];
  const rarity = getPlaceholderRarity(id);
  const attackPoolIds = getPlaceholderAttackPools(family.attackPoolIds, rarity);
  const index = String(id).padStart(3, '0');

  return {
    id,
    slug: `${family.prefix}-kin-${index}`,
    displayName: `${capitalize(family.prefix)}kin ${index}`,
    rarity,
    type: family.type,
    baseStats: scaleStats(family.baseStats, rarity),
    attackPoolIds,
    mvpStatus: 'placeholder'
  };
}

function getPlaceholderRarity(id: number): CreatureRarity {
  if (id >= 146) return 'mythical';
  if (id >= 144) return 'legendary';
  if (id >= 132) return 'rare';
  if (id >= 92) return 'uncommon';
  return 'common';
}

function getPlaceholderAttackPools(baseAttackPoolIds: readonly AttackPoolId[], rarity: CreatureRarity): AttackPoolId[] {
  if (rarity === 'mythical') return [...baseAttackPoolIds, 'rare-burst', 'mythic-surge'];
  if (rarity === 'legendary') return [...baseAttackPoolIds, 'rare-burst', 'legendary-aura'];
  if (rarity === 'rare') return [...baseAttackPoolIds, 'rare-burst'];
  return [...baseAttackPoolIds];
}

function scaleStats(baseStats: BaseStatTendencies, rarity: CreatureRarity): BaseStatTendencies {
  const boostByRarity: Record<CreatureRarity, number> = {
    common: 0,
    uncommon: 6,
    rare: 14,
    legendary: 24,
    mythical: 28
  };
  const boost = boostByRarity[rarity];

  return {
    hp: baseStats.hp + boost,
    attack: baseStats.attack + boost,
    defense: baseStats.defense + boost,
    speed: baseStats.speed + boost,
    stamina: baseStats.stamina + boost
  };
}

function species(
  id: number,
  slug: string,
  displayName: string,
  rarity: CreatureRarity,
  type: CreatureType,
  baseStats: BaseStatTendencies,
  attackPoolIds: AttackPoolId[]
): CreatureSpeciesRecord {
  return { id, slug, displayName, rarity, type, baseStats, attackPoolIds, mvpStatus: 'polished' };
}

function stats(hp: number, attack: number, defense: number, speed: number, stamina: number): BaseStatTendencies {
  return { hp, attack, defense, speed, stamina };
}

function capitalize(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
