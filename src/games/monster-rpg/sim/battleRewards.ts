import type {
  BattleResultMessage,
  BattleRewardBundle,
  BattleRoomState,
  CreatureRarity,
  CreatureType,
  MonsterRpgSaveState
} from './types';
import { openPack, type PackOpenTrace } from './cards';
import { createDirectDropEgg, createRng } from './creatureLifecycle';
import { applyPlayerExperience, type ApplyPlayerExperienceResult } from './playerProgression';
import { getSpeciesById } from './speciesCatalog';

export const BATTLE_REWARD_MAGIC_DUST_BASE = 2;
export const BATTLE_REWARD_PACK_CHANCE = 0.18;
export const BATTLE_REWARD_DIRECT_EGG_CHANCE = 0.03;
export const BATTLE_REWARD_MATERIAL_CHANCE = 0.4;

export interface ApplyBattleRewardsResult {
  state: MonsterRpgSaveState;
  rewardsApplied: boolean;
  packTrace?: PackOpenTrace;
  levelRewardPackTraces: PackOpenTrace[];
  claimedLevelRewardIds: string[];
}

export function generateWildBattleRewards(
  state: BattleRoomState,
  options?: { seed?: number; rng?: () => number }
): BattleRewardBundle {
  const species = getSpeciesById(state.wildSpeciesId);
  const rarity = species?.rarity ?? 'common';
  const rngSeed = options?.seed ?? hashString(`${state.battleId}:${state.encounterId}:${state.wildSpeciesId}:rewards`);
  const rng = options?.rng ?? createRng(rngSeed);
  const rarityRank = getRarityRank(rarity);
  const materialRoll = rng();
  const packRoll = rng();
  const eggRoll = rng();
  const magicDustRoll = rng();

  return {
    seed: rngSeed,
    magicDust: BATTLE_REWARD_MAGIC_DUST_BASE + rarityRank + Math.floor(magicDustRoll * 2),
    playerExperience: 12 + rarityRank * 4,
    battlingCreatureExperience: 20 + rarityRank * 6,
    activePartyExperience: Math.floor((20 + rarityRank * 6) * 0.8),
    packSeed: packRoll < BATTLE_REWARD_PACK_CHANCE ? hashString(`${rngSeed}:pack`) : undefined,
    directDropEggSpeciesId: eggRoll < BATTLE_REWARD_DIRECT_EGG_CHANCE ? state.wildSpeciesId : undefined,
    materials:
      materialRoll < BATTLE_REWARD_MATERIAL_CHANCE && species
        ? [
            {
              materialId: getMaterialIdForType(species.type),
              quantity: 1 + Math.floor(rarityRank / 2)
            }
          ]
        : []
  };
}

export function applyBattleRewardsToSave(
  state: MonsterRpgSaveState,
  result: BattleResultMessage
): ApplyBattleRewardsResult {
  const stateWithBattleCreature = updateBattleCreatureOutcome(state, result);

  if (result.outcome !== 'defeated' || !result.rewardGranted || !result.rewards) {
    return {
      state: withUpdatedAt(stateWithBattleCreature),
      rewardsApplied: false,
      levelRewardPackTraces: [],
      claimedLevelRewardIds: []
    };
  }

  const rewardFlag = getBattleRewardFlag(result.battleId);
  if (stateWithBattleCreature.progression.flags[rewardFlag]) {
    return {
      state: withUpdatedAt(stateWithBattleCreature),
      rewardsApplied: false,
      levelRewardPackTraces: [],
      claimedLevelRewardIds: []
    };
  }

  const rewardNumbers = applyRewardNumbers(stateWithBattleCreature, result);
  let next = rewardNumbers.state;
  let packTrace: PackOpenTrace | undefined;

  if (result.rewards.directDropEggSpeciesId !== undefined) {
    const eggResult = createDirectDropEgg(next, result.rewards.directDropEggSpeciesId, {
      seed: hashString(`${result.rewards.seed}:egg`)
    });
    if (eggResult.ok) next = eggResult.state;
  }

  if (result.rewards.packSeed !== undefined) {
    const packResult = openPack(next, { seed: result.rewards.packSeed });
    next = packResult.state;
    packTrace = packResult.trace;
  }

  return {
    state: withUpdatedAt({
      ...next,
      progression: {
        ...next.progression,
        flags: {
          ...next.progression.flags,
          [rewardFlag]: true
        }
      }
    }),
    rewardsApplied: true,
    packTrace,
    levelRewardPackTraces: rewardNumbers.progression.packTraces,
    claimedLevelRewardIds: rewardNumbers.progression.claimedRewards.map((reward) => reward.rewardId)
  };
}

function updateBattleCreatureOutcome(
  state: MonsterRpgSaveState,
  result: BattleResultMessage
): MonsterRpgSaveState {
  const creature = state.creatures.creatures[result.playerCreatureId];
  if (!creature) return state;

  return {
    ...state,
    creatures: {
      ...state.creatures,
      creatures: {
        ...state.creatures.creatures,
        [result.playerCreatureId]: {
          ...creature,
          hp: result.playerCreatureHp,
          fainted: result.playerCreatureFainted
        }
      }
    }
  };
}

function applyRewardNumbers(
  state: MonsterRpgSaveState,
  result: BattleResultMessage
): { state: MonsterRpgSaveState; progression: ApplyPlayerExperienceResult } {
  const rewards = result.rewards;
  if (!rewards) {
    const progression = applyPlayerExperience(state, 0);
    return { state: progression.state, progression };
  }

  const currencies = { ...state.inventory.currencies };
  currencies.magicDust = (currencies.magicDust ?? 0) + rewards.magicDust;
  rewards.materials.forEach((material) => {
    currencies[material.materialId] = (currencies[material.materialId] ?? 0) + material.quantity;
  });

  const creatures = { ...state.creatures.creatures };
  state.creatures.activePartyCreatureIds.forEach((creatureId) => {
    const creature = creatures[creatureId];
    if (!creature || creature.fainted) return;

    const experience =
      creatureId === result.playerCreatureId
        ? rewards.battlingCreatureExperience
        : rewards.activePartyExperience;

    creatures[creatureId] = {
      ...creature,
      experience: creature.experience + experience
    };
  });

  const withNumberRewards: MonsterRpgSaveState = {
    ...state,
    inventory: {
      ...state.inventory,
      currencies
    },
    creatures: {
      ...state.creatures,
      creatures
    }
  };
  const progression = applyPlayerExperience(withNumberRewards, rewards.playerExperience, { seed: rewards.seed });

  return {
    state: progression.state,
    progression
  };
}

function getBattleRewardFlag(battleId: string): string {
  return `battleReward:${battleId}`;
}

function withUpdatedAt(state: MonsterRpgSaveState): MonsterRpgSaveState {
  return {
    ...state,
    updatedAt: new Date().toISOString()
  };
}

function getRarityRank(rarity: CreatureRarity): number {
  const ranks: Record<CreatureRarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    legendary: 3,
    mythical: 4
  };

  return ranks[rarity];
}

function getMaterialIdForType(type: CreatureType): string {
  return `${type}Essence`;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
