import {
  STANDARD_CARD_PACK_REWARD_TABLE_ID,
  getCardRewardTable,
  getCardRewardTableForSource,
  openPack,
  type PackOpenTrace
} from './cards';
import type { MonsterRpgSaveState, PlayerSkillUnlockKind } from './types';

export interface PlayerLevelThreshold {
  level: number;
  totalExperience: number;
}

export interface PlayerSkillUnlockDefinition {
  id: string;
  level: number;
  kind: PlayerSkillUnlockKind;
  description: string;
  implemented: false;
}

export interface PlayerLevelPackRewardDefinition {
  quantity: number;
  rewardTableId: string;
}

export interface PlayerLevelRewardDefinition {
  id: string;
  level: number;
  packs?: PlayerLevelPackRewardDefinition;
  skillUnlocks?: readonly PlayerSkillUnlockDefinition[];
}

export interface ClaimedPlayerLevelReward {
  rewardId: string;
  level: number;
}

export interface ClaimLevelRewardsResult {
  state: MonsterRpgSaveState;
  claimedRewards: ClaimedPlayerLevelReward[];
  packTraces: PackOpenTrace[];
  unlockedSkillIds: string[];
}

export interface ApplyPlayerExperienceResult extends ClaimLevelRewardsResult {
  previousLevel: number;
  currentLevel: number;
  levelsGained: number;
}

export const PLAYER_LEVEL_THRESHOLDS = [
  { level: 1, totalExperience: 0 },
  { level: 2, totalExperience: 10 },
  { level: 3, totalExperience: 25 },
  { level: 4, totalExperience: 45 },
  { level: 5, totalExperience: 70 },
  { level: 6, totalExperience: 100 },
  { level: 7, totalExperience: 135 },
  { level: 8, totalExperience: 175 },
  { level: 9, totalExperience: 220 },
  { level: 10, totalExperience: 270 }
] as const satisfies readonly PlayerLevelThreshold[];

export const PLAYER_LEVEL_REWARDS: readonly PlayerLevelRewardDefinition[] = [
  {
    id: 'player-level-2-pack',
    level: 2,
    packs: {
      quantity: 1,
      rewardTableId: STANDARD_CARD_PACK_REWARD_TABLE_ID
    }
  },
  {
    id: 'player-level-4-pack',
    level: 4,
    packs: {
      quantity: 1,
      rewardTableId: STANDARD_CARD_PACK_REWARD_TABLE_ID
    }
  },
  {
    id: 'player-level-6-double-pack',
    level: 6,
    packs: {
      quantity: 2,
      rewardTableId: STANDARD_CARD_PACK_REWARD_TABLE_ID
    }
  },
  {
    id: 'player-level-8-theft-cooldown-hook',
    level: 8,
    packs: {
      quantity: 1,
      rewardTableId: STANDARD_CARD_PACK_REWARD_TABLE_ID
    },
    skillUnlocks: [
      {
        id: 'skill:theft-cooldown-apprentice',
        level: 8,
        kind: 'theft-modifier',
        description: 'Future hook for reducing theft cooldowns.',
        implemented: false
      }
    ]
  },
  {
    id: 'player-level-10-travel-hook',
    level: 10,
    packs: {
      quantity: 2,
      rewardTableId: STANDARD_CARD_PACK_REWARD_TABLE_ID
    },
    skillUnlocks: [
      {
        id: 'skill:station-travel-discount',
        level: 10,
        kind: 'travel-modifier',
        description: 'Future hook for modifying Station travel costs.',
        implemented: false
      }
    ]
  }
] as const;

export function applyPlayerExperience(
  state: MonsterRpgSaveState,
  experience: number,
  options?: { seed?: number }
): ApplyPlayerExperienceResult {
  const previousLevel = state.progression.playerLevel;
  const nextExperience = state.progression.playerExperience + Math.max(0, experience);
  const currentLevel = getPlayerLevelForExperience(nextExperience);
  const leveledState: MonsterRpgSaveState = {
    ...state,
    progression: {
      ...state.progression,
      playerExperience: nextExperience,
      playerLevel: Math.max(previousLevel, currentLevel)
    }
  };
  const claimed = claimAvailableLevelRewards(leveledState, options);

  return {
    ...claimed,
    previousLevel,
    currentLevel: claimed.state.progression.playerLevel,
    levelsGained: Math.max(0, claimed.state.progression.playerLevel - previousLevel)
  };
}

export function claimAvailableLevelRewards(
  state: MonsterRpgSaveState,
  options?: { seed?: number }
): ClaimLevelRewardsResult {
  const claimedRewardIds = new Set(state.progression.claimedLevelRewardIds);
  const unlockedSkillIds = new Set(state.progression.unlockedPlayerSkillIds);
  const newlyClaimed: ClaimedPlayerLevelReward[] = [];
  const packTraces: PackOpenTrace[] = [];
  let next = state;

  PLAYER_LEVEL_REWARDS.forEach((reward) => {
    if (reward.level > next.progression.playerLevel || claimedRewardIds.has(reward.id)) return;

    const table = getCardRewardTable(reward.packs?.rewardTableId ?? '') ?? getCardRewardTableForSource('level');
    for (let packIndex = 0; packIndex < (reward.packs?.quantity ?? 0); packIndex += 1) {
      const pack = openPack(next, {
        seed: hashString(`${options?.seed ?? next.progression.playerExperience}:${reward.id}:${packIndex}`),
        rewardTable: table
      });
      next = pack.state;
      packTraces.push(pack.trace);
    }

    reward.skillUnlocks?.forEach((unlock) => {
      unlockedSkillIds.add(unlock.id);
    });
    claimedRewardIds.add(reward.id);
    newlyClaimed.push({ rewardId: reward.id, level: reward.level });
  });

  if (newlyClaimed.length === 0) {
    return {
      state: next,
      claimedRewards: [],
      packTraces,
      unlockedSkillIds: []
    };
  }

  return {
    state: {
      ...next,
      progression: {
        ...next.progression,
        claimedLevelRewardIds: Array.from(claimedRewardIds),
        unlockedPlayerSkillIds: Array.from(unlockedSkillIds)
      },
      updatedAt: new Date().toISOString()
    },
    claimedRewards: newlyClaimed,
    packTraces,
    unlockedSkillIds: newlyClaimed.flatMap(
      (claim) =>
        PLAYER_LEVEL_REWARDS.find((reward) => reward.id === claim.rewardId)?.skillUnlocks?.map((unlock) => unlock.id) ??
        []
    )
  };
}

export function getPlayerLevelForExperience(experience: number): number {
  return PLAYER_LEVEL_THRESHOLDS.reduce(
    (level, threshold) => (experience >= threshold.totalExperience ? threshold.level : level),
    1
  );
}

export function getNextPlayerLevelThreshold(level: number): PlayerLevelThreshold | undefined {
  return PLAYER_LEVEL_THRESHOLDS.find((threshold) => threshold.level > level);
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
