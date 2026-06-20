import type {
  BaseStatTendencies,
  CardRarity,
  CreationRequirement,
  CreatureAttackRecord,
  CreatureCardInstance,
  CreatureRarity,
  CreatureSaveRecord,
  CreatureSpeciesRecord,
  CreatureType,
  EggSaveRecord,
  MonsterRpgSaveState
} from './types';
import { getSpeciesById } from './speciesCatalog';

export const MAGIC_DUST_MATERIAL_ID = 'magicDust';
export const CREATURE_ATTACK_COUNT = 4;
export const CREATURE_CARD_KNOWN_ATTACK_COUNT = 2;

export interface CreatureCardDefinitionLike {
  id: string;
  rarity: CardRarity;
  speciesId: number;
}

export type CreatureLifecycleFailureReason =
  | 'missing-card'
  | 'missing-egg'
  | 'invalid-species'
  | 'missing-material';

export type CreatureLifecycleResult =
  | { ok: true; state: MonsterRpgSaveState; creatureId?: string; eggId?: string }
  | { ok: false; state: MonsterRpgSaveState; reason: CreatureLifecycleFailureReason };

export function createCreatureCardInstance(
  definition: CreatureCardDefinitionLike,
  ownerPlayerId: string,
  existingCards: Record<string, CreatureCardInstance>,
  options?: { seed?: number; rng?: () => number }
): CreatureCardInstance {
  const species = getSpeciesById(definition.speciesId);
  if (!species) throw new Error(`Unknown Creature Card species ${definition.speciesId}`);

  const rng = options?.rng ?? createRng(options?.seed ?? hashString(`${ownerPlayerId}:${definition.id}`));
  const stats = rollStats(species, rng);
  const knownAttacks = selectCreatureAttacks(species, definition.rarity, stats, CREATURE_CARD_KNOWN_ATTACK_COUNT, rng);

  return {
    id: createNextId(existingCards, `card-${species.slug}`),
    ownerPlayerId,
    cardDefinitionId: definition.id,
    speciesId: species.id,
    rarity: definition.rarity,
    stats,
    knownAttacks: [knownAttacks[0], knownAttacks[1]]
  };
}

export function convertCreatureCardViaElder(
  state: MonsterRpgSaveState,
  cardInstanceId: string,
  options?: { seed?: number; rng?: () => number }
): CreatureLifecycleResult {
  const card = findCreatureCardInstance(state, cardInstanceId);
  if (!card) return { ok: false, state, reason: 'missing-card' };

  const species = getSpeciesById(card.speciesId);
  if (!species) return { ok: false, state, reason: 'invalid-species' };

  const requirements = getCreatureCreationRequirements(species);
  if (!hasRequirements(state, requirements)) return { ok: false, state, reason: 'missing-material' };

  const stateAfterCost = consumeRequirements(state, requirements);
  const creatureCards = { ...stateAfterCost.inventory.creatureCards };
  delete creatureCards[card.id];

  if (card.rarity === 'common') {
    const rng = options?.rng ?? createRng(options?.seed ?? hashString(card.id));
    const extraAttacks = selectCreatureAttacks(
      species,
      card.rarity,
      card.stats,
      CREATURE_ATTACK_COUNT - card.knownAttacks.length,
      rng,
      card.knownAttacks
    );
    const creatureId = createNextId(stateAfterCost.creatures.creatures, `creature-${species.slug}`);
    const creatureRecord = createCreatureRecord({
      id: creatureId,
      ownerPlayerId: state.profile.playerId,
      species,
      stats: card.stats,
      attacks: [...card.knownAttacks, ...extraAttacks]
    });

    return {
      ok: true,
      creatureId,
      state: {
        ...stateAfterCost,
        inventory: {
          ...stateAfterCost.inventory,
          creatureCards
        },
        creatures: {
          ...stateAfterCost.creatures,
          activePartyCreatureIds: [...stateAfterCost.creatures.activePartyCreatureIds, creatureId],
          creatures: {
            ...stateAfterCost.creatures.creatures,
            [creatureId]: creatureRecord
          }
        },
        journal: recordDiscovered(stateAfterCost, species.id),
        updatedAt: new Date().toISOString()
      }
    };
  }

  const eggId = createNextId(stateAfterCost.inventory.eggs, `egg-${species.slug}`);
  const egg: EggSaveRecord = {
    id: eggId,
    ownerPlayerId: state.profile.playerId,
    speciesId: species.id,
    rarity: species.rarity,
    origin: 'card',
    stats: card.stats,
    inheritedAttacks: card.knownAttacks,
    requirements,
    createdAt: new Date().toISOString()
  };

  return {
    ok: true,
    eggId,
    state: {
      ...stateAfterCost,
      inventory: {
        ...stateAfterCost.inventory,
        creatureCards,
        eggs: {
          ...stateAfterCost.inventory.eggs,
          [eggId]: egg
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function createDirectDropEgg(
  state: MonsterRpgSaveState,
  speciesId: number,
  options?: { seed?: number; rng?: () => number }
): CreatureLifecycleResult {
  const species = getSpeciesById(speciesId);
  if (!species) return { ok: false, state, reason: 'invalid-species' };

  const rng = options?.rng ?? createRng(options?.seed ?? hashString(`${state.profile.playerId}:${species.slug}:egg`));
  const eggId = createNextId(state.inventory.eggs, `egg-${species.slug}`);
  const egg: EggSaveRecord = {
    id: eggId,
    ownerPlayerId: state.profile.playerId,
    speciesId: species.id,
    rarity: species.rarity,
    origin: 'direct-drop',
    stats: rollStats(species, rng),
    requirements: getCreatureCreationRequirements(species),
    createdAt: new Date().toISOString()
  };

  return {
    ok: true,
    eggId,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        eggs: {
          ...state.inventory.eggs,
          [eggId]: egg
        }
      },
      updatedAt: new Date().toISOString()
    }
  };
}

export function hatchEgg(
  state: MonsterRpgSaveState,
  eggId: string,
  options?: { seed?: number; rng?: () => number }
): CreatureLifecycleResult {
  const egg = state.inventory.eggs[eggId];
  if (!egg) return { ok: false, state, reason: 'missing-egg' };

  const species = getSpeciesById(egg.speciesId);
  if (!species) return { ok: false, state, reason: 'invalid-species' };
  if (!hasRequirements(state, egg.requirements)) return { ok: false, state, reason: 'missing-material' };

  const rng = options?.rng ?? createRng(options?.seed ?? hashString(egg.id));
  const stats = egg.stats ?? rollStats(species, rng);
  const inheritedAttacks = egg.inheritedAttacks ?? [];
  const rolledAttacks = selectCreatureAttacks(
    species,
    egg.rarity,
    stats,
    CREATURE_ATTACK_COUNT - inheritedAttacks.length,
    rng,
    inheritedAttacks
  );
  const creatureId = createNextId(state.creatures.creatures, `creature-${species.slug}`);
  const creatureRecord = createCreatureRecord({
    id: creatureId,
    ownerPlayerId: state.profile.playerId,
    species,
    stats,
    attacks: [...inheritedAttacks, ...rolledAttacks]
  });
  const eggs = { ...state.inventory.eggs };
  delete eggs[eggId];
  const stateAfterCost = consumeRequirements(state, egg.requirements);

  return {
    ok: true,
    creatureId,
    state: {
      ...stateAfterCost,
      inventory: {
        ...stateAfterCost.inventory,
        eggs
      },
      creatures: {
        ...stateAfterCost.creatures,
        activePartyCreatureIds: [...stateAfterCost.creatures.activePartyCreatureIds, creatureId],
        creatures: {
          ...stateAfterCost.creatures.creatures,
          [creatureId]: creatureRecord
        }
      },
      journal: recordDiscovered(stateAfterCost, species.id),
      updatedAt: new Date().toISOString()
    }
  };
}

export function getEggDescription(egg: EggSaveRecord, species: CreatureSpeciesRecord | undefined): string {
  const speciesName = species?.displayName ?? `Species #${egg.speciesId}`;
  if (egg.origin === 'card' && egg.inheritedAttacks?.length) {
    return `${speciesName} Egg with inherited attacks: ${egg.inheritedAttacks.map((attack) => attack.name).join(', ')}.`;
  }

  return `${speciesName} Egg. Attacks will be revealed when the Creature hatches.`;
}

export function getCreatureCreationRequirements(species: CreatureSpeciesRecord): CreationRequirement[] {
  return [
    {
      materialId: MAGIC_DUST_MATERIAL_ID,
      quantity: getMagicDustRequirement(species.rarity),
      scope: {
        rarity: species.rarity,
        type: species.type,
        speciesId: species.id
      }
    }
  ];
}

export function rollStats(species: CreatureSpeciesRecord, rng: () => number): BaseStatTendencies {
  return {
    hp: rollStat(species.baseStats.hp, rng),
    attack: rollStat(species.baseStats.attack, rng),
    defense: rollStat(species.baseStats.defense, rng),
    speed: rollStat(species.baseStats.speed, rng),
    stamina: rollStat(species.baseStats.stamina, rng)
  };
}

export function selectCreatureAttacks(
  species: CreatureSpeciesRecord,
  rarity: CreatureRarity,
  stats: BaseStatTendencies,
  count: number,
  rng: () => number,
  existingAttacks: readonly CreatureAttackRecord[] = []
): CreatureAttackRecord[] {
  const existingIds = new Set(existingAttacks.map((attack) => attack.id));
  const topStats = getTopStatKeys(stats);
  const candidates = getAttackCandidates(species, rarity)
    .filter((attack) => !existingIds.has(attack.id))
    .map((attack) => ({
      attack,
      score:
        (attack.type === species.type ? 30 : 0) +
        (topStats.includes(attack.statFocus) ? 18 : 0) +
        attack.power +
        rng() * 10
    }))
    .sort((a, b) => b.score - a.score || a.attack.id.localeCompare(b.attack.id))
    .map((entry) => entry.attack);

  return candidates.slice(0, count);
}

export function createRng(seed: number = Date.now()): () => number {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(value, 1_664_525) + 1_013_904_223;
    return (value >>> 0) / 0x1_0000_0000;
  };
}

function findCreatureCardInstance(state: MonsterRpgSaveState, idOrDefinitionId: string): CreatureCardInstance | undefined {
  return (
    state.inventory.creatureCards[idOrDefinitionId] ??
    Object.values(state.inventory.creatureCards).find((card) => card.cardDefinitionId === idOrDefinitionId)
  );
}

function createCreatureRecord({
  id,
  ownerPlayerId,
  species,
  stats,
  attacks
}: {
  id: string;
  ownerPlayerId: string;
  species: CreatureSpeciesRecord;
  stats: BaseStatTendencies;
  attacks: CreatureAttackRecord[];
}): CreatureSaveRecord {
  return {
    id,
    ownerPlayerId,
    speciesId: species.id,
    level: 1,
    experience: 0,
    stats,
    attacks,
    hp: stats.hp,
    maxHp: stats.hp,
    fainted: false,
    cooldowns: {}
  };
}

function recordDiscovered(state: MonsterRpgSaveState, speciesId: number): MonsterRpgSaveState['journal'] {
  return {
    ...state.journal,
    species: {
      ...state.journal.species,
      [String(speciesId)]: 'discovered'
    }
  };
}

function hasRequirements(state: MonsterRpgSaveState, requirements: readonly CreationRequirement[]): boolean {
  return requirements.every((requirement) => {
    const current = state.inventory.currencies[requirement.materialId] ?? 0;
    return current >= requirement.quantity;
  });
}

function consumeRequirements(
  state: MonsterRpgSaveState,
  requirements: readonly CreationRequirement[]
): MonsterRpgSaveState {
  const currencies = { ...state.inventory.currencies };
  requirements.forEach((requirement) => {
    currencies[requirement.materialId] = (currencies[requirement.materialId] ?? 0) - requirement.quantity;
  });

  return {
    ...state,
    inventory: {
      ...state.inventory,
      currencies
    }
  };
}

function getMagicDustRequirement(rarity: CreatureRarity): number {
  const costs: Record<CreatureRarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 4,
    legendary: 8,
    mythical: 12
  };

  return costs[rarity];
}

function rollStat(base: number, rng: () => number): number {
  return Math.max(1, base + Math.floor(rng() * 11) - 5);
}

function getTopStatKeys(stats: BaseStatTendencies): Array<keyof BaseStatTendencies> {
  return (Object.entries(stats) as Array<[keyof BaseStatTendencies, number]>)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([key]) => key);
}

function getAttackCandidates(
  species: CreatureSpeciesRecord,
  rarity: CreatureRarity
): CreatureAttackRecord[] {
  const candidates = new Map<string, CreatureAttackRecord>();

  species.attackPoolIds.forEach((poolId) => {
    const attack = attackByPoolId[poolId];
    if (attack) candidates.set(attack.id, attack);
  });
  typeAttacks[species.type].forEach((attack) => candidates.set(attack.id, attack));
  statAttacks.forEach((attack) => candidates.set(attack.id, attack));

  if (rarity === 'rare' || rarity === 'legendary' || rarity === 'mythical') {
    rareAttacks.forEach((attack) => candidates.set(attack.id, attack));
  }
  if (rarity === 'legendary' || rarity === 'mythical') {
    highRarityAttacks.forEach((attack) => candidates.set(attack.id, attack));
  }

  return [...candidates.values()];
}

function createNextId(records: Record<string, unknown>, prefix: string): string {
  let next = 1;
  while (records[`${prefix}-${next}`]) next += 1;
  return `${prefix}-${next}`;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

const attackByPoolId: Record<string, CreatureAttackRecord> = {
  basic: attack('quick-tackle', 'Quick Tackle', 'gale', 18, 'speed'),
  'starter-balanced': attack('steady-swipe', 'Steady Swipe', 'verdant', 22, 'attack'),
  'starter-guard': attack('guarding-bash', 'Guarding Bash', 'stone', 20, 'defense'),
  'starter-quick': attack('darting-pounce', 'Darting Pounce', 'gale', 21, 'speed'),
  'verdant-bite': attack('verdant-bite', 'Verdant Bite', 'verdant', 24, 'stamina'),
  'ember-claw': attack('ember-claw', 'Ember Claw', 'ember', 25, 'attack'),
  'tide-splash': attack('tide-splash', 'Tide Splash', 'tide', 22, 'hp'),
  'stone-guard': attack('stone-guard', 'Stone Guard', 'stone', 19, 'defense'),
  'gale-peck': attack('gale-peck', 'Gale Peck', 'gale', 23, 'speed'),
  'spark-jolt': attack('spark-jolt', 'Spark Jolt', 'spark', 24, 'speed'),
  'shade-prowl': attack('shade-prowl', 'Shade Prowl', 'shade', 25, 'attack'),
  'lumen-pulse': attack('lumen-pulse', 'Lumen Pulse', 'lumen', 22, 'stamina'),
  'frost-nip': attack('frost-nip', 'Frost Nip', 'frost', 21, 'defense'),
  'mystic-focus': attack('mystic-focus', 'Mystic Focus', 'mystic', 23, 'stamina'),
  'toxin-sting': attack('toxin-sting', 'Toxin Sting', 'toxin', 23, 'attack'),
  'metal-tackle': attack('metal-tackle', 'Metal Tackle', 'metal', 22, 'defense'),
  'rare-burst': attack('rare-burst', 'Rare Burst', 'mystic', 32, 'attack'),
  'legendary-aura': attack('legendary-aura', 'Legendary Aura', 'lumen', 38, 'stamina'),
  'mythic-surge': attack('mythic-surge', 'Mythic Surge', 'mystic', 42, 'attack')
};

const typeAttacks: Record<CreatureType, CreatureAttackRecord[]> = {
  verdant: [attack('leaf-feint', 'Leaf Feint', 'verdant', 20, 'speed')],
  ember: [attack('warm-spark', 'Warm Spark', 'ember', 20, 'attack')],
  tide: [attack('foam-rush', 'Foam Rush', 'tide', 20, 'stamina')],
  stone: [attack('pebble-wallop', 'Pebble Wallop', 'stone', 20, 'defense')],
  gale: [attack('tailwind-tap', 'Tailwind Tap', 'gale', 20, 'speed')],
  spark: [attack('static-hop', 'Static Hop', 'spark', 20, 'speed')],
  shade: [attack('night-nudge', 'Night Nudge', 'shade', 20, 'attack')],
  lumen: [attack('glow-ring', 'Glow Ring', 'lumen', 20, 'stamina')],
  frost: [attack('snow-pinch', 'Snow Pinch', 'frost', 20, 'defense')],
  mystic: [attack('rune-tap', 'Rune Tap', 'mystic', 20, 'stamina')],
  toxin: [attack('spore-prick', 'Spore Prick', 'toxin', 20, 'attack')],
  metal: [attack('tin-bump', 'Tin Bump', 'metal', 20, 'defense')]
};

const statAttacks: CreatureAttackRecord[] = [
  attack('hardy-bump', 'Hardy Bump', 'stone', 17, 'hp'),
  attack('sharp-rush', 'Sharp Rush', 'gale', 18, 'attack'),
  attack('brace-hit', 'Brace Hit', 'metal', 18, 'defense'),
  attack('snap-step', 'Snap Step', 'spark', 18, 'speed'),
  attack('second-wind', 'Second Wind', 'lumen', 17, 'stamina')
];

const rareAttacks: CreatureAttackRecord[] = [
  attack('moonlit-lunge', 'Moonlit Lunge', 'shade', 30, 'speed'),
  attack('crystal-charge', 'Crystal Charge', 'frost', 31, 'attack')
];

const highRarityAttacks: CreatureAttackRecord[] = [
  attack('starfall-guard', 'Starfall Guard', 'lumen', 36, 'defense'),
  attack('ancient-pulse', 'Ancient Pulse', 'mystic', 37, 'stamina')
];

function attack(
  id: string,
  name: string,
  type: CreatureType,
  power: number,
  statFocus: keyof BaseStatTendencies
): CreatureAttackRecord {
  return { id, name, type, power, statFocus };
}
