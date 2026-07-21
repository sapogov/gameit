import { describe, expect, it } from 'vitest';
import {
  applyBattleRewardsToSave,
  choosePlayerBattleAttack,
  createBattleRoomState,
  createGuardBattleRoomState,
  createTrainerBattleRoomState,
  generateWildBattleRewards,
  getBattleAttackFatigueCost,
  getFirstBattleReadyCreature,
  getBattleRunChance,
  resolveWildBattleRewardEntries,
  runFromBattle,
  switchPlayerBattleCreature,
  toBattleResult,
  GAME_BALANCE_CONFIG
} from '.';
import type { BattleRewardBundle, CreatureSaveRecord, MonsterRpgSaveState } from './types';
import { createInitialSave, createPlayerProfile } from './saveState';

describe('battle simulation', () => {
  it('uses a non-default zone table before species entry replacements and appends', () => {
    const entry = (id: string, quantity: number) => ({ id, chance: 1, quantity: [quantity, quantity] as const, reward: 'clinks' as const });
    const entries = resolveWildBattleRewardEntries(
      { zoneId: 'north', enemyRarity: 'common', speciesId: 3 },
      [
        { zoneId: '*', enemyRarity: 'common', entries: [entry('default', 1)] },
        { zoneId: 'north', enemyRarity: 'common', entries: [entry('zone', 2), entry('replace', 3)] }
      ],
      { 3: [entry('replace', 4), entry('species-extra', 5)] }
    );
    expect(entries.map((entry) => entry.id)).toEqual(['zone', 'replace', 'species-extra']);
    expect(entries.find((entry) => entry.id === 'replace')?.quantity).toEqual([4, 4]);
  });

  it('fails closed for invalid species IDs and ignores inherited species overrides', () => {
    const entry = { id: 'default', chance: 1, quantity: [1, 1] as const, reward: 'clinks' as const };
    const inheritedOverrides = Object.create({ 3: [{ ...entry, id: 'inherited' }] }) as Record<number, ReadonlyArray<typeof entry>>;
    const tables = [{ zoneId: '*', enemyRarity: 'common' as const, entries: [entry] }];

    expect(resolveWildBattleRewardEntries({ zoneId: 'north', enemyRarity: 'common', speciesId: 999 }, tables)).toEqual([]);
    expect(resolveWildBattleRewardEntries({ zoneId: 'north', enemyRarity: 'common', speciesId: 3 }, tables, inheritedOverrides).map((candidate) => candidate.id)).toEqual(['default']);
  });

  it('selects the first non-fainted active Creature for battle', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const fainted = createCreature(profile.playerId, 'fainted-creature', 1, 0, true);
    const ready = createCreature(profile.playerId, 'ready-creature', 2, 42, false);
    const state: MonsterRpgSaveState = {
      ...createInitialSave(profile),
      creatures: {
        ownerPlayerId: profile.playerId,
        activePartyCreatureIds: [fainted.id, ready.id],
        storedCreatureIds: [],
        creatures: {
          [fainted.id]: fainted,
          [ready.id]: ready
        }
      }
    };

    expect(getFirstBattleReadyCreature(state)?.id).toBe(ready.id);
  });

  it('charges a proactive Trainer switch with one incoming action and rejects stale, foreign, fainted, or active player targets', () => {
    const profile = createPlayerProfile('Trainer Tester', 'scout');
    const active = createCreature(profile.playerId, 'active', 1, 60, false);
    const reserve = createCreature(profile.playerId, 'reserve', 2, 60, false);
    const fainted = createCreature(profile.playerId, 'fainted', 3, 0, true);
    const state = createTrainerBattleRoomState({
      battleId: 'trainer-switch', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [active, reserve, fainted]
    });
    const proactiveState = {
      ...state,
      enemy: { ...state.enemy, activeCreature: { ...state.enemy.activeCreature, hp: 50, maxHp: 200 } }
    };
    const playerHp = proactiveState.player.activeCreature.hp;
    const proactive = choosePlayerBattleAttack(proactiveState, proactiveState.validPlayerAttackIds[0]);

    expect(proactive.ok).toBe(true);
    if (!proactive.ok) throw new Error(proactive.reason);
    expect(proactive.state.enemy.activeCreature.id).not.toBe(proactiveState.enemy.activeCreature.id);
    expect(proactive.state.player.activeCreature.hp).toBe(playerHp);
    expect(proactive.state.remainingTrainerSwitches).toBe(0);
    expect(switchPlayerBattleCreature(state, reserve.id, state.turn + 1)).toMatchObject({ ok: false, state });
    expect(switchPlayerBattleCreature(state, state.enemy.activeCreature.id, state.turn)).toMatchObject({ ok: false, state });
    expect(switchPlayerBattleCreature(state, fainted.id, state.turn)).toMatchObject({ ok: false, state });
    expect(switchPlayerBattleCreature(state, active.id, state.turn)).toMatchObject({ ok: false, state });
  });

  it('resolves a forced player switch without another Trainer action', () => {
    const profile = createPlayerProfile('Forced Switch Tester', 'scout');
    const active = createCreature(profile.playerId, 'active', 1, 0, true);
    const reserve = createCreature(profile.playerId, 'reserve', 2, 60, false);
    const seeded = createTrainerBattleRoomState({ battleId: 'trainer-forced-switch', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [{ ...active, hp: 60, fainted: false }, reserve] });
    const state = {
      ...seeded,
      player: { ...seeded.player, activeCreature: { ...seeded.player.activeCreature, hp: 0, fainted: true } },
      playerParty: seeded.playerParty?.map((creature) => creature.id === active.id ? { ...creature, hp: 0, fainted: true } : creature),
      phase: 'forced-switch' as const
    };
    const result = switchPlayerBattleCreature(state, reserve.id, state.turn);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.turn).toBe(state.turn);
    expect(result.state.phase).toBe('player-action');
    expect(result.state.player.activeCreature.id).toBe(reserve.id);
  });

  it('requires a forced switch when an enemy action KOs a voluntary Trainer switch target with a ready reserve', () => {
    const profile = createPlayerProfile('Voluntary Switch KO', 'scout');
    const active = createCreature(profile.playerId, 'switch-active', 1, 60, false);
    const incoming = createCreature(profile.playerId, 'switch-incoming', 2, 1, false);
    const reserve = createCreature(profile.playerId, 'switch-reserve', 3, 60, false);
    const state = createTrainerBattleRoomState({
      battleId: 'trainer-voluntary-switch-ko', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [active, incoming, reserve]
    });

    const result = switchPlayerBattleCreature(state, incoming.id, state.turn);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error(result.reason);
    expect(result.result).toBeUndefined();
    expect(result.state).toMatchObject({ status: 'active', phase: 'forced-switch' });
    expect(result.state.player.activeCreature).toMatchObject({ id: incoming.id, hp: 0, fainted: true });
    expect(result.state.playerParty).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: incoming.id, hp: 0, fainted: true }),
      expect.objectContaining({ id: reserve.id, hp: reserve.hp, fainted: false })
    ]));
  });

  it('ends the Trainer battle when an enemy action KOs a voluntary switch target with no ready reserve', () => {
    const profile = createPlayerProfile('Voluntary Switch Loss', 'scout');
    const faintedActive = createCreature(profile.playerId, 'last-active', 1, 0, true);
    const incoming = createCreature(profile.playerId, 'last-incoming', 2, 1, false);
    const seeded = createTrainerBattleRoomState({
      battleId: 'trainer-voluntary-switch-loss', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [faintedActive, incoming]
    });
    const faintedActiveBattleCreature = seeded.playerParty?.find((creature) => creature.id === faintedActive.id);
    if (!faintedActiveBattleCreature) throw new Error('Missing fainted active fixture');
    const state = {
      ...seeded,
      player: { ...seeded.player, activeCreature: faintedActiveBattleCreature },
      playerActiveCreatureId: faintedActive.id,
      playerParty: seeded.playerParty?.map((creature) => creature.id === faintedActive.id ? { ...creature, hp: 0, fainted: true } : creature)
    };

    const result = switchPlayerBattleCreature(state, incoming.id, state.turn);

    expect(result).toMatchObject({ ok: true, result: { outcome: 'lost', playerCreatureId: incoming.id, playerCreatureHp: 0, playerCreatureFainted: true } });
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.status).toBe('player-lost');
    expect(result.state.playerParty).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: faintedActive.id, hp: 0, fainted: true }),
      expect.objectContaining({ id: incoming.id, hp: 0, fainted: true })
    ]));
  });

  it('returns final outcomes for every Trainer party Creature', () => {
    const profile = createPlayerProfile('Trainer Outcomes', 'scout');
    const active = createCreature(profile.playerId, 'active-outcome', 1, 0, true);
    const reserve = createCreature(profile.playerId, 'reserve-outcome', 2, 31, false);
    const seeded = createTrainerBattleRoomState({ battleId: 'trainer-outcomes', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [active, reserve] });
    const result = toBattleResult({
      ...seeded,
      status: 'player-won',
      player: { ...seeded.player, activeCreature: { ...seeded.player.activeCreature, hp: reserve.hp, fainted: false } },
      playerParty: seeded.playerParty?.map((creature) => creature.id === active.id
        ? { ...creature, hp: 0, fainted: true }
        : { ...creature, hp: reserve.hp, fainted: false })
    });

    expect(result?.playerPartyOutcomes).toEqual([
      { creatureId: active.id, hp: 0, fainted: true },
      { creatureId: reserve.id, hp: reserve.hp, fainted: false }
    ]);
  });

  it('signals Trainer authority settlement without generating wild rewards', () => {
    const profile = createPlayerProfile('Trainer Reward Signal', 'scout');
    const creature = createCreature(profile.playerId, 'trainer-winner', 1, 60, false);
    const seeded = createTrainerBattleRoomState({ battleId: 'trainer-reward-signal', trainerId: 'route-scout-1', playerProfile: profile, playerParty: [creature] });
    const state = {
      ...seeded,
      enemy: { ...seeded.enemy, activeCreature: { ...seeded.enemy.activeCreature, hp: 1 } },
      trainerParty: [{ ...seeded.enemy.activeCreature, hp: 1 }]
    };

    const result = choosePlayerBattleAttack(state, state.validPlayerAttackIds[0]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result).toMatchObject({ outcome: 'defeated', rewardGranted: true });
    expect(result.result?.rewards).toBeUndefined();
  });

  it('resolves manual player attacks and enemy AI attacks on the server state', () => {
    const profile = createPlayerProfile('Battle Tester', 'ranger');
    const state = createBattleRoomState({
      battleId: 'battle-1',
      encounterId: 'encounter-1',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'player-creature', 1, 60, false),
      wildSpeciesId: 3,
      now: new Date('2026-06-20T12:00:00.000Z')
    });
    const attackId = state.validPlayerAttackIds[0];
    const result = choosePlayerBattleAttack(state, attackId, new Date('2026-06-20T12:00:01.000Z'));

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.turn).toBeGreaterThanOrEqual(1);
    expect(result.state.player.activeCreature.fatigue).toBeGreaterThanOrEqual(0);
    expect(result.state.enemy.activeCreature.hp).toBeLessThan(result.state.enemy.activeCreature.maxHp);
    expect(result.state.lastLog.some((entry) => entry.message.includes('used'))).toBe(true);
  });

  it('adds server-generated rewards only when the player wins', () => {
    const profile = createPlayerProfile('Battle Tester', 'ranger');
    const state = createBattleRoomState({
      battleId: 'battle-win',
      encounterId: 'encounter-win',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'winner', 1, 60, false),
      wildSpeciesId: 3,
      now: new Date('2026-06-20T12:00:00.000Z')
    });
    const weakEnemy = {
      ...state,
      enemy: {
        ...state.enemy,
        activeCreature: {
          ...state.enemy.activeCreature,
          hp: 1
        }
      }
    };

    const result = choosePlayerBattleAttack(weakEnemy, state.validPlayerAttackIds[0]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result?.outcome).toBe('defeated');
    expect(result.result?.rewardGranted).toBe(true);
    expect(result.result?.rewards?.magicDust).toBeGreaterThan(0);
    if (result.result?.rewards?.directDropEggSpeciesId !== undefined) {
      expect(result.result.rewards.directDropEggSpeciesId).toBe(3);
    }
  });

  it('rejects repeated strong attacks when fatigue is too high', () => {
    const profile = createPlayerProfile('Battle Tester', 'keeper');
    const playerCreature = createCreature(profile.playerId, 'heavy-creature', 1, 60, false);
    const strongAttack = playerCreature.attacks[0];
    const state = createBattleRoomState({
      battleId: 'battle-fatigue',
      encounterId: 'encounter-fatigue',
      playerProfile: profile,
      playerCreature,
      wildSpeciesId: 3
    });
    const exhausted = {
      ...state,
      player: {
        ...state.player,
        activeCreature: {
          ...state.player.activeCreature,
          fatigue: state.player.activeCreature.maxFatigue - getBattleAttackFatigueCost(strongAttack) + 1
        }
      }
    };

    const result = choosePlayerBattleAttack(exhausted, strongAttack.id);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected fatigue rejection');
    expect(result.reason).toBe('fatigued');
  });

  it('lets a failed run attempt keep the wild battle active for another action', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-fail',
      encounterId: 'encounter-run-fail',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0.99);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result).toBeUndefined();
    expect(result.state.status).toBe('active');
    expect(result.state.runAttempts).toBe(1);
    expect(result.state.turn).toBe(2);
    expect(result.state.player.activeCreature.hp).toBeLessThan(state.player.activeCreature.hp);
    expect(result.state.lastLog.some((entry) => entry.message.includes('Could not get away'))).toBe(true);
  });

  it('increases run chance after failed attempts so the player can retry', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-retry',
      encounterId: 'encounter-run-retry',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });

    const failed = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0.99);

    expect(failed.ok).toBe(true);
    if (!failed.ok) throw new Error(failed.reason);
    expect(getBattleRunChance(failed.state)).toBeGreaterThan(getBattleRunChance(state));

    const retried = runFromBattle(failed.state, new Date('2026-06-20T12:00:02.000Z'), () => 0);
    expect(retried.ok).toBe(true);
    if (!retried.ok) throw new Error(retried.reason);
    expect(retried.result?.outcome).toBe('ran');
  });

  it('resolves a failed escape as a loss when the enemy defeats the 1HP player', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-loss',
      encounterId: 'encounter-run-loss',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });
    const oneHp = {
      ...state,
      player: { ...state.player, activeCreature: { ...state.player.activeCreature, hp: 1 } }
    };

    const result = runFromBattle(oneHp, new Date('2026-06-20T12:00:01.000Z'), () => 0.99);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result?.outcome).toBe('lost');
    expect(result.state.status).toBe('player-lost');
    expect(result.state.runAttempts).toBe(1);
  });

  it('guarantees escape within the config-derived attempt bound when the player survives retries', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run-bound',
      encounterId: 'encounter-run-bound',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });
    const minimumSpeedAdjustmentFromRunFormula = -0.2;
    const minimumRunChance = Math.max(0.15, GAME_BALANCE_CONFIG.battles.baseRunChance + minimumSpeedAdjustmentFromRunFormula);
    const maximumRunIntents = Math.ceil((1 - minimumRunChance) / GAME_BALANCE_CONFIG.battles.runAttemptBonus) + 1;
    let current = {
      ...state,
      player: {
        ...state.player,
        activeCreature: { ...state.player.activeCreature, hp: 999, maxHp: 999, stats: { ...state.player.activeCreature.stats, speed: 1 } }
      },
      enemy: { ...state.enemy, activeCreature: { ...state.enemy.activeCreature, stats: { ...state.enemy.activeCreature.stats, speed: 100 } } }
    };

    for (let attempt = 1; attempt < maximumRunIntents; attempt += 1) {
      const result = runFromBattle(current, new Date(`2026-06-20T12:00:0${attempt}.000Z`), () => 0.99);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.reason);
      expect(result.result).toBeUndefined();
      current = result.state;
    }

    const result = runFromBattle(current, new Date('2026-06-20T12:00:09.000Z'), () => 0.99);
    expect(maximumRunIntents).toBe(4);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result?.outcome).toBe('ran');
    expect(result.state.runAttempts).toBe(maximumRunIntents - 1);
  });

  it('marks successful run away as resolved without granting rewards', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = createBattleRoomState({
      battleId: 'battle-run',
      encounterId: 'encounter-run',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
      wildSpeciesId: 3
    });

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    if (!result.result) throw new Error('expected run result');
    expect(result.result.outcome).toBe('ran');
    expect(result.result.rewardGranted).toBe(false);
    expect(result.result.rewards).toBeUndefined();
  });

  it('rejects running when the battle type does not support escape', () => {
    const profile = createPlayerProfile('Battle Tester', 'scout');
    const state = {
      ...createBattleRoomState({
        battleId: 'battle-no-run',
        encounterId: 'encounter-no-run',
        playerProfile: profile,
        playerCreature: createCreature(profile.playerId, 'runner', 1, 60, false),
        wildSpeciesId: 3
      }),
      canRun: false
    };

    const result = runFromBattle(state, new Date('2026-06-20T12:00:01.000Z'), () => 0);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected run rejection');
    expect(result.reason).toBe('run-unavailable');
  });

  it('resolves guard battles with core attack rules but no run or wild rewards', () => {
    const profile = createPlayerProfile('Guard Challenger', 'scout');
    const playerCreature = createCreature(profile.playerId, 'visitor-creature', 1, 60, false);
    const guardCreature = createCreature('owner-1', 'guard-creature', 2, 1, false);
    const state = createGuardBattleRoomState({
      battleId: 'battle-guard',
      farmId: 'farm-1',
      playerProfile: profile,
      playerCreature,
      guardCreature,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    const run = runFromBattle(state);
    const result = choosePlayerBattleAttack(state, state.validPlayerAttackIds[0]);

    expect(state.battleKind).toBe('guard-theft');
    expect(state.canRun).toBe(false);
    expect(run.ok).toBe(false);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.result?.outcome).toBe('defeated');
    expect(result.result?.rewardGranted).toBe(false);
    expect(result.result?.rewards).toBeUndefined();
  });

  it('generates deterministic wild battle rewards with optional pack, material, and exact-species egg drops', () => {
    const profile = createPlayerProfile('Reward Tester', 'keeper');
    const state = createBattleRoomState({
      battleId: 'battle-reward-deterministic',
      encounterId: 'encounter-reward-deterministic',
      playerProfile: profile,
      playerCreature: createCreature(profile.playerId, 'rewarder', 1, 60, false),
      wildSpeciesId: 3,
      zoneId: 'world-north-fields'
    });

    const first = generateWildBattleRewards(state, { seed: 44 });
    const second = generateWildBattleRewards(state, { seed: 44 });
    const forcedDrops = generateWildBattleRewards(state, { seed: 45, rng: sequenceRng([0, 0, 0, 0.5]) });

    expect(first).toEqual(second);
    expect(forcedDrops.packSeed).toBeDefined();
    expect(forcedDrops.materials).toHaveLength(1);
    expect(forcedDrops.directDropEggSpeciesId).toBe(3);
    expect(forcedDrops.clinks).toBeGreaterThanOrEqual(6);
  });

  it('applies win rewards to currencies, XP, pack cards, and exact-species direct-drop eggs once', () => {
    const profile = createPlayerProfile('Reward Saver', 'scout');
    const battling = createCreature(profile.playerId, 'battling-creature', 1, 40, false);
    const support = createCreature(profile.playerId, 'support-creature', 2, 50, false);
    const fainted = createCreature(profile.playerId, 'fainted-support', 3, 0, true);
    const stored = createCreature(profile.playerId, 'stored-creature', 4, 50, false);
    const state: MonsterRpgSaveState = {
      ...createInitialSave(profile),
      inventory: {
        ...createInitialSave(profile).inventory,
        currencies: { magicDust: 1 }
      },
      creatures: {
        ownerPlayerId: profile.playerId,
        activePartyCreatureIds: [battling.id, support.id, fainted.id],
        storedCreatureIds: [stored.id],
        creatures: {
          [battling.id]: battling,
          [support.id]: support,
          [fainted.id]: fainted,
          [stored.id]: stored
        }
      }
    };
    const rewards: BattleRewardBundle = {
      seed: 700,
      magicDust: 5,
      clinks: 7,
      playerExperience: 11,
      battlingCreatureExperience: 20,
      activePartyExperience: 16,
      packSeed: 701,
      directDropEggSpeciesId: 3,
      materials: [{ materialId: 'galeEssence', quantity: 2 }]
    };
    const result = {
      battleId: 'battle-apply-rewards',
      encounterId: 'encounter-apply-rewards',
      outcome: 'defeated' as const,
      playerCreatureId: battling.id,
      playerCreatureHp: 34,
      playerCreatureFainted: false,
      playerPartyOutcomes: [
        { creatureId: battling.id, hp: 34, fainted: false },
        { creatureId: support.id, hp: 17, fainted: false },
        { creatureId: fainted.id, hp: 0, fainted: true }
      ],
      rewardGranted: true,
      rewards
    };

    const applied = applyBattleRewardsToSave(state, result);
    const appliedAgain = applyBattleRewardsToSave(applied.state, result);

    expect(applied.rewardsApplied).toBe(true);
    expect(applied.packTrace?.cards).toHaveLength(5);
    expect(applied.state.inventory.currencies.magicDust).toBe(6);
    expect(applied.state.inventory.currencies.clinks).toBe(7);
    expect(applied.state.inventory.currencies.galeEssence).toBe(2);
    expect(applied.state.progression.playerExperience).toBe(11);
    expect(applied.state.progression.playerLevel).toBe(2);
    expect(applied.claimedLevelRewardIds).toEqual(['player-level-2-pack']);
    expect(applied.levelRewardPackTraces).toHaveLength(1);
    expect(applied.state.creatures.creatures[battling.id].experience).toBe(20);
    expect(applied.state.creatures.creatures[battling.id].hp).toBe(34);
    expect(applied.state.creatures.creatures[support.id].hp).toBe(17);
    expect(applied.state.creatures.creatures[support.id].experience).toBe(16);
    expect(applied.state.creatures.creatures[fainted.id].experience).toBe(0);
    expect(applied.state.creatures.creatures[stored.id].experience).toBe(0);
    expect(Object.values(applied.state.inventory.eggs)[0].speciesId).toBe(3);

    expect(appliedAgain.rewardsApplied).toBe(false);
    expect(appliedAgain.state.inventory.currencies.magicDust).toBe(6);
    expect(appliedAgain.state.inventory.currencies.clinks).toBe(7);
    expect(appliedAgain.state.progression.playerExperience).toBe(11);
    expect(appliedAgain.state.progression.playerLevel).toBe(2);
    expect(appliedAgain.claimedLevelRewardIds).toHaveLength(0);
    expect(Object.values(appliedAgain.state.inventory.eggs)).toHaveLength(1);
  });

  it('settles battle HP, rewards, and growth at one supplied time with deterministic reward RNG', () => {
    const profile = createPlayerProfile('Settlement Clock', 'scout');
    const baseCreature = createCreature(profile.playerId, 'settlement-creature', 1, 40, false);
    const creature = {
      ...baseCreature,
      experience: 90,
      statGrowth: { model: 'rarity-weighted-random' as const, basis: { level: 1, stats: { ...baseCreature.stats } }, events: [] }
    };
    const state: MonsterRpgSaveState = {
      ...createInitialSave(profile),
      creatures: { ownerPlayerId: profile.playerId, activePartyCreatureIds: [creature.id], storedCreatureIds: [], creatures: { [creature.id]: creature } }
    };
    const fixedNow = new Date('2026-07-21T12:34:56.000Z');
    const result = {
      battleId: 'battle-settlement-clock', encounterId: 'encounter-settlement-clock', outcome: 'defeated' as const,
      playerCreatureId: creature.id, playerCreatureHp: 23, playerCreatureFainted: false, rewardGranted: true,
      playerPartyOutcomes: [{ creatureId: creature.id, hp: 23, fainted: false }],
      rewards: { seed: 88, magicDust: 2, clinks: 3, playerExperience: 10, battlingCreatureExperience: 10, activePartyExperience: 8, materials: [] }
    };

    const first = applyBattleRewardsToSave(state, result, { now: fixedNow, rng: sequenceRng([0.1, 0.2, 0.3, 0.4, 0.5]) });
    const second = applyBattleRewardsToSave(state, result, { now: fixedNow, rng: sequenceRng([0.1, 0.2, 0.3, 0.4, 0.5]) });
    const differentRng = applyBattleRewardsToSave(state, result, { now: fixedNow, rng: sequenceRng([0.9, 0.8, 0.7, 0.6, 0.5]) });

    expect(first.state).toEqual(second.state);
    expect(first.state.creatures.creatures[creature.id].stats).not.toEqual(differentRng.state.creatures.creatures[creature.id].stats);
    expect(first.state.updatedAt).toBe(fixedNow.toISOString());
    expect(first.state.creatures.creatures[creature.id]).toMatchObject({ hp: 23, experience: 100, level: 2 });
    expect(first.state.inventory.currencies).toMatchObject({ magicDust: 2, clinks: 3 });
    expect(first.state.creatures.creatures[creature.id].pendingGrowthEvents?.[0]?.createdAt).toBe(fixedNow.toISOString());
  });

  it('does not apply a no-reward receipt or create Clinks', () => {
    const profile = createPlayerProfile('No Reward', 'scout');
    const battling = createCreature(profile.playerId, 'no-reward-creature', 1, 40, false);
    const state: MonsterRpgSaveState = {
      ...createInitialSave(profile),
      creatures: {
        ownerPlayerId: profile.playerId,
        activePartyCreatureIds: [battling.id],
        storedCreatureIds: [],
        creatures: { [battling.id]: battling }
      }
    };

    const applied = applyBattleRewardsToSave(state, {
      battleId: 'battle-no-reward',
      encounterId: 'encounter-no-reward',
      outcome: 'ran',
      playerCreatureId: battling.id,
      playerCreatureHp: battling.hp,
      playerCreatureFainted: false,
      playerPartyOutcomes: [{ creatureId: battling.id, hp: battling.hp, fainted: false }],
      rewardGranted: false
    });

    expect(applied.rewardsApplied).toBe(false);
    expect(applied.state.inventory.currencies.clinks).toBe(0);
    expect(applied.state.progression.flags['battleReward:battle-no-reward']).toBeUndefined();
  });
});

function createCreature(
  ownerPlayerId: string,
  id: string,
  speciesId: number,
  hp: number,
  fainted: boolean
): CreatureSaveRecord {
  return {
    id,
    ownerPlayerId,
    speciesId,
    level: 1,
    experience: 0,
    stats: {
      hp: 60,
      attack: 28,
      defense: 14,
      speed: 18,
      stamina: 16
    },
    attacks: [
      {
        id: 'heavy-hit',
        name: 'Heavy Hit',
        type: 'verdant',
        power: 32,
        statFocus: 'attack'
      },
      {
        id: 'quick-jab',
        name: 'Quick Jab',
        type: 'verdant',
        power: 12,
        statFocus: 'speed'
      }
    ],
    hp,
    maxHp: 60,
    fainted,
    cooldowns: {},
    statGrowth: { model: 'deterministic-default', basis: { level: 1, stats: { hp: 60, attack: 28, defense: 14, speed: 18, stamina: 16 } }, events: [] }
  };
}

function sequenceRng(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}
