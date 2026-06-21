import { describe, expect, it } from 'vitest';
import {
  PLAYER_LEVEL_THRESHOLDS,
  applyPlayerExperience,
  claimAvailableLevelRewards,
  createInitialSave,
  createPlayerProfile,
  getPlayerLevelForExperience
} from '.';

describe('Monster RPG player progression', () => {
  it('uses data-driven thresholds to derive player level from total XP', () => {
    expect(PLAYER_LEVEL_THRESHOLDS.map((threshold) => threshold.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(getPlayerLevelForExperience(0)).toBe(1);
    expect(getPlayerLevelForExperience(9)).toBe(1);
    expect(getPlayerLevelForExperience(10)).toBe(2);
    expect(getPlayerLevelForExperience(45)).toBe(4);
  });

  it('applies battle XP to player level and grants milestone packs once', () => {
    const state = createInitialSave(createPlayerProfile('Level Tester', 'keeper'));

    const first = applyPlayerExperience(state, 10, { seed: 99 });
    const second = claimAvailableLevelRewards(first.state, { seed: 99 });

    expect(first.currentLevel).toBe(2);
    expect(first.levelsGained).toBe(1);
    expect(first.claimedRewards.map((reward) => reward.rewardId)).toEqual(['player-level-2-pack']);
    expect(first.packTraces).toHaveLength(1);
    expect(first.packTraces[0].cards).toHaveLength(5);
    expect(first.state.progression.claimedLevelRewardIds).toEqual(['player-level-2-pack']);
    expect(first.state.progression.playerExperience).toBe(10);
    expect(first.state.progression.playerLevel).toBe(2);
    expect(second.claimedRewards).toHaveLength(0);
    expect(second.packTraces).toHaveLength(0);
    expect(second.state.progression.claimedLevelRewardIds).toEqual(['player-level-2-pack']);
  });

  it('represents future skill unlocks without applying their behavior', () => {
    const state = createInitialSave(createPlayerProfile('Unlock Tester', 'scout'));

    const result = applyPlayerExperience(state, 175, { seed: 175 });

    expect(result.currentLevel).toBe(8);
    expect(result.claimedRewards.map((reward) => reward.rewardId)).toContain('player-level-8-theft-cooldown-hook');
    expect(result.unlockedSkillIds).toEqual(['skill:theft-cooldown-apprentice']);
    expect(result.state.progression.unlockedPlayerSkillIds).toEqual(['skill:theft-cooldown-apprentice']);
  });
});
