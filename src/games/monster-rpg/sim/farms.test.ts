import { describe, expect, it } from 'vitest';
import {
  collectFacingFarm,
  createInitialSave,
  createPlayerProfile,
  attemptFacingFarmTheft,
  getAccruedFarmRecord,
  getFarmTheftAttemptCost,
  getFarmUpgradePreview,
  assignFarmGuard,
  isFarmGuardActive,
  MAGIC_DUST_CURRENCY_ID,
  MAGIC_DUST_FARM_CARD_ID,
  MAGIC_DUST_FARM_ID,
  MAGIC_DUST_FARM_TYPE,
  setCreatureHp,
  resolveGuardedFarmTheft,
  upgradeFarm,
  type CreatureSaveRecord,
  createFarmSaveRecord,
  type FarmSaveRecord
} from '.';

describe('Magic Dust Farms', () => {
  it('creates a built farm with owner, plot, production rate, cap, and resource type', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const farm = createFarmSaveRecord({
      id: MAGIC_DUST_FARM_ID,
      ownerPlayerId: profile.playerId,
      farmType: MAGIC_DUST_FARM_TYPE,
      villageId: profile.homeVillageId,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    expect(farm).toMatchObject({
      id: MAGIC_DUST_FARM_ID,
      ownerPlayerId: profile.playerId,
      farmType: MAGIC_DUST_FARM_TYPE,
      resourceId: MAGIC_DUST_CURRENCY_ID,
      mapId: 'home-village',
      position: { mapId: 'home-village', x: 24, y: 16 },
      productionRatePerMinute: 1,
      storageCap: 24,
      storedResources: { [MAGIC_DUST_CURRENCY_ID]: 0 },
      lastProductionAt: '2026-06-20T12:00:00.000Z'
    });
  });

  it('accrues production over time up to the storage cap', () => {
    const farm = createFarm({
      stored: 3,
      storageCap: 10,
      productionRatePerMinute: 2,
      lastProductionAt: '2026-06-20T12:00:00.000Z'
    });

    const accrued = getAccruedFarmRecord(farm, new Date('2026-06-20T12:05:30.000Z'));

    expect(accrued.storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(10);
    expect(accrued.lastProductionAt).toBe('2026-06-20T12:05:30.000Z');
  });

  it('collects only when the owner is adjacent and facing the farm', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, stored: 4 }));
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const collected = collectFacingFarm(adjacent, new Date('2026-06-20T12:05:00.000Z'));

    expect(collected.ok).toBe(true);
    if (!collected.ok) throw new Error(collected.reason);
    expect(collected.collectedQuantity).toBe(9);
    expect(collected.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(collected.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(0);
  });

  it('rejects collection when not facing a farm or when the farm is empty', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId }));
    const notFacing = collectFacingFarm(state);
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };
    const empty = collectFacingFarm(adjacent, new Date('2026-06-20T12:00:20.000Z'));

    expect(notFacing.ok).toBe(false);
    if (notFacing.ok) throw new Error('Expected collection failure');
    expect(notFacing.reason).toBe('not-facing-farm');
    expect(empty.ok).toBe(false);
    if (empty.ok) throw new Error('Expected empty farm failure');
    expect(empty.reason).toBe('empty');
  });

  it('upgrades a farm by consuming matching Farm Cards and materials', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, stored: 4 }));
    const stocked = {
      ...state,
      inventory: {
        ...state.inventory,
        currencies: { [MAGIC_DUST_CURRENCY_ID]: 12 },
        cards: {
          [MAGIC_DUST_FARM_CARD_ID]: {
            id: MAGIC_DUST_FARM_CARD_ID,
            ownerPlayerId: profile.playerId,
            quantity: 1
          }
        }
      }
    };

    const upgraded = upgradeFarm(stocked, MAGIC_DUST_FARM_ID, new Date('2026-06-20T12:03:00.000Z'));

    expect(upgraded.ok).toBe(true);
    if (!upgraded.ok) throw new Error(upgraded.reason);
    expect(upgraded.farm.level).toBe(2);
    expect(upgraded.farm.productionRatePerMinute).toBe(2);
    expect(upgraded.farm.storageCap).toBe(48);
    expect(upgraded.farm.storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(7);
    expect(upgraded.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(4);
    expect(upgraded.state.inventory.cards[MAGIC_DUST_FARM_CARD_ID]).toBeUndefined();
  });

  it('exposes farm upgrade requirements before confirming', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const state = withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId }));

    const preview = getFarmUpgradePreview(state, MAGIC_DUST_FARM_ID);

    expect(preview?.plan?.toLevel).toBe(2);
    expect(preview?.plan?.requirements.materials).toEqual([{ materialId: MAGIC_DUST_CURRENCY_ID, quantity: 8 }]);
    expect(preview?.plan?.requirements.farmCards).toEqual([
      {
        cardDefinitionId: MAGIC_DUST_FARM_CARD_ID,
        quantity: 1,
        scope: { farmType: MAGIC_DUST_FARM_TYPE, rarity: 'uncommon' }
      }
    ]);
    expect(preview?.canUpgrade).toBe(false);
    expect(preview?.missingMaterials).toHaveLength(1);
    expect(preview?.missingFarmCards).toHaveLength(1);
  });

  it('assigns only non-fainted owned Creatures as farm guards', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const readyCreature = createCreature({ id: 'creature-ready', ownerPlayerId: profile.playerId });
    const faintedCreature = createCreature({
      id: 'creature-fainted',
      ownerPlayerId: profile.playerId,
      hp: 0,
      fainted: true
    });
    const state = withCreature(
      withCreature(withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId })), readyCreature),
      faintedCreature
    );

    const rejected = assignFarmGuard(state, MAGIC_DUST_FARM_ID, faintedCreature.id);
    const assigned = assignFarmGuard(state, MAGIC_DUST_FARM_ID, readyCreature.id);

    expect(rejected.ok).toBe(false);
    if (rejected.ok) throw new Error('Expected fainted guard rejection');
    expect(rejected.reason).toBe('creature-fainted');
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) throw new Error(assigned.reason);
    expect(assigned.farm.guardCreatureId).toBe(readyCreature.id);
    expect(isFarmGuardActive(assigned.state, assigned.farm)).toBe(true);
  });

  it('keeps a fainted assigned guard persisted but inactive for theft checks', () => {
    const profile = createPlayerProfile('Mika', 'scout');
    const guard = createCreature({ id: 'guard-1', ownerPlayerId: profile.playerId });
    const state = withCreature(
      withFarm(createInitialSave(profile), createFarm({ ownerPlayerId: profile.playerId, guardCreatureId: guard.id })),
      guard
    );

    const fainted = setCreatureHp(state, guard.id, 0);

    expect(fainted.ok).toBe(true);
    if (!fainted.ok) throw new Error(fainted.reason);
    const farm = fainted.state.farms.farms[MAGIC_DUST_FARM_ID];
    expect(farm.guardCreatureId).toBe(guard.id);
    expect(isFarmGuardActive(fainted.state, farm)).toBe(false);
  });

  it('lets visitors steal capped resources from unguarded farms and starts a 24-hour cooldown', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const ownerPlayerId = 'owner-1';
    const state = withMagicDust(
      withFarm(createInitialSave(visitor), createFarm({ ownerPlayerId, stored: 12 })),
      10
    );
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const result = attemptFacingFarmTheft(adjacent, new Date('2026-06-20T12:00:00.000Z'), { rng: () => 0 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.outcome).toBe('success');
    expect(result.stolenQuantity).toBe(3);
    expect(result.costPaid).toBe(1);
    expect(result.cooldownUntil).toBe('2026-06-21T12:00:00.000Z');
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(12);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].theftCooldowns[`visitor:${visitor.playerId}`]).toBe(
      '2026-06-21T12:00:00.000Z'
    );
    expect(result.state.farms.theftLog).toHaveLength(1);
    expect(result.state.farms.theftLog?.[0]).toMatchObject({
      attackerPlayerId: visitor.playerId,
      defenderPlayerId: ownerPlayerId,
      outcome: 'success',
      stolenQuantity: 3,
      costPaid: 1,
      guardResult: 'unguarded'
    });
  });

  it('blocks visitor theft during cooldown without charging Magic Dust', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const state = withMagicDust(
      withFarm(
        createInitialSave(visitor),
        createFarm({
          ownerPlayerId: 'owner-1',
          stored: 12,
          theftCooldowns: { [`visitor:${visitor.playerId}`]: '2026-06-21T12:00:00.000Z' }
        })
      ),
      10
    );
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const result = attemptFacingFarmTheft(adjacent, new Date('2026-06-20T12:05:00.000Z'), { rng: () => 0 });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected cooldown failure');
    expect(result.reason).toBe('cooldown');
    expect(result.cooldownUntil).toBe('2026-06-21T12:00:00.000Z');
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(10);
    expect(result.state.farms.theftLog).toHaveLength(0);
  });

  it('charges failed theft attempts but does not steal or start cooldown', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const state = withMagicDust(
      withFarm(createInitialSave(visitor), createFarm({ ownerPlayerId: 'owner-1', stored: 12 })),
      10
    );
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const result = attemptFacingFarmTheft(adjacent, new Date('2026-06-20T12:00:00.000Z'), { rng: () => 1 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.outcome).toBe('failed');
    expect(result.stolenQuantity).toBe(0);
    expect(result.cooldownUntil).toBeUndefined();
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(12);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].theftCooldowns[`visitor:${visitor.playerId}`]).toBeUndefined();
    expect(result.state.farms.theftLog?.[0]).toMatchObject({ outcome: 'failed', stolenQuantity: 0, costPaid: 1 });
  });

  it('blocks visitor theft from guarded farms even when the guard Creature is not in the visitor save', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const state = withMagicDust(
      withFarm(
        createInitialSave(visitor),
        createFarm({ ownerPlayerId: 'owner-1', stored: 12, guardCreatureId: 'owner-guard-1' })
      ),
      10
    );
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const result = attemptFacingFarmTheft(adjacent, new Date('2026-06-20T12:00:00.000Z'), { rng: () => 0 });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected guarded failure');
    expect(result.reason).toBe('guarded');
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(10);
    expect(result.state.farms.theftLog).toHaveLength(0);
  });

  it('treats a farm with a fainted assigned guard as unguarded for visitor theft', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const faintedGuard = createCreature({
      id: 'owner-guard-1',
      ownerPlayerId: 'owner-1',
      hp: 0,
      fainted: true
    });
    const state = withMagicDust(
      withCreature(
        withFarm(
          createInitialSave(visitor),
          createFarm({ ownerPlayerId: 'owner-1', stored: 12, guardCreatureId: faintedGuard.id })
        ),
        faintedGuard
      ),
      10
    );
    const adjacent = {
      ...state,
      position: { mapId: 'home-village' as const, x: 24, y: 17, facing: 'north' as const }
    };

    const result = attemptFacingFarmTheft(adjacent, new Date('2026-06-20T12:00:00.000Z'), { rng: () => 0 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.outcome).toBe('success');
    expect(result.stolenQuantity).toBe(3);
    expect(result.logEntry.guardResult).toBe('unguarded');
  });

  it('resolves a lost guard battle by fainting the visitor Creature and stealing nothing', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const visitorCreature = createCreature({ id: 'visitor-creature', ownerPlayerId: visitor.playerId, hp: 7 });
    const guard = createCreature({ id: 'owner-guard-1', ownerPlayerId: 'owner-1' });
    const state = withMagicDust(
      withCreature(
        withCreature(
          withFarm(
            createInitialSave(visitor),
            createFarm({ ownerPlayerId: 'owner-1', stored: 12, guardCreatureId: guard.id })
          ),
          visitorCreature
        ),
        guard
      ),
      10
    );

    const result = resolveGuardedFarmTheft(state, {
      farmId: MAGIC_DUST_FARM_ID,
      playerCreatureId: visitorCreature.id,
      playerCreatureHp: 0,
      playerCreatureFainted: true,
      visitorWon: false,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.outcome).toBe('failed');
    expect(result.stolenQuantity).toBe(0);
    expect(result.state.creatures.creatures[visitorCreature.id].hp).toBe(0);
    expect(result.state.creatures.creatures[visitorCreature.id].fainted).toBe(true);
    expect(result.state.creatures.creatures[guard.id].fainted).toBe(false);
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(12);
    expect(result.state.farms.theftLog?.[0]).toMatchObject({
      outcome: 'failed',
      stolenQuantity: 0,
      guardResult: 'visitor-lost'
    });
  });

  it('resolves a won guard battle by stealing capped resources and fainting the guard', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const visitorCreature = createCreature({ id: 'visitor-creature', ownerPlayerId: visitor.playerId, hp: 7 });
    const guard = createCreature({ id: 'owner-guard-1', ownerPlayerId: 'owner-1', hp: 5 });
    const state = withMagicDust(
      withCreature(
        withCreature(
          withFarm(
            createInitialSave(visitor),
            createFarm({ ownerPlayerId: 'owner-1', stored: 12, guardCreatureId: guard.id })
          ),
          visitorCreature
        ),
        guard
      ),
      10
    );

    const result = resolveGuardedFarmTheft(state, {
      farmId: MAGIC_DUST_FARM_ID,
      guardCreatureHp: 0,
      playerCreatureId: visitorCreature.id,
      playerCreatureHp: 3,
      playerCreatureFainted: false,
      visitorWon: true,
      now: new Date('2026-06-20T12:00:00.000Z')
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.outcome).toBe('success');
    expect(result.stolenQuantity).toBe(3);
    expect(result.cooldownUntil).toBe('2026-06-21T12:00:00.000Z');
    expect(result.state.creatures.creatures[visitorCreature.id].hp).toBe(3);
    expect(result.state.creatures.creatures[visitorCreature.id].fainted).toBe(false);
    expect(result.state.creatures.creatures[guard.id].hp).toBe(0);
    expect(result.state.creatures.creatures[guard.id].fainted).toBe(true);
    expect(isFarmGuardActive(result.state, result.state.farms.farms[MAGIC_DUST_FARM_ID])).toBe(false);
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(12);
    expect(result.state.farms.farms[MAGIC_DUST_FARM_ID].storedResources[MAGIC_DUST_CURRENCY_ID]).toBe(9);
    expect(result.state.farms.theftLog?.[0]).toMatchObject({
      outcome: 'success',
      stolenQuantity: 3,
      guardResult: 'visitor-won'
    });
  });

  it('increases Magic Dust theft cost when visitor player or village level exceeds target village level', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const initial = createInitialSave(visitor);
    const state = {
      ...initial,
      village: { ...initial.village, level: 4 },
      progression: { ...initial.progression, playerLevel: 3 }
    };

    expect(getFarmTheftAttemptCost(state, 1)).toBe(7);
  });

  it('keeps farm management owner-only for visitor-held farm records', () => {
    const visitor = createPlayerProfile('Mika', 'scout');
    const readyCreature = createCreature({ id: 'visitor-guard', ownerPlayerId: visitor.playerId });
    const state = withCreature(
      withFarm(createInitialSave(visitor), createFarm({ ownerPlayerId: 'owner-1', stored: 12 })),
      readyCreature
    );

    const upgraded = upgradeFarm(state, MAGIC_DUST_FARM_ID);
    const guarded = assignFarmGuard(state, MAGIC_DUST_FARM_ID, readyCreature.id);

    expect(upgraded.ok).toBe(false);
    if (upgraded.ok) throw new Error('Expected upgrade rejection');
    expect(upgraded.reason).toBe('not-owner');
    expect(guarded.ok).toBe(false);
    if (guarded.ok) throw new Error('Expected guard rejection');
    expect(guarded.reason).toBe('not-owner');
  });
});

function createFarm(overrides: Partial<FarmSaveRecord> & { stored?: number } = {}): FarmSaveRecord {
  const { stored: storedOverride, ...farmOverrides } = overrides;
  const ownerPlayerId = overrides.ownerPlayerId ?? 'player-1';
  const stored = storedOverride ?? 0;

  return {
    id: MAGIC_DUST_FARM_ID,
    ownerPlayerId,
    farmType: MAGIC_DUST_FARM_TYPE,
    resourceId: MAGIC_DUST_CURRENCY_ID,
    level: 1,
    mapId: 'home-village',
    position: { mapId: 'home-village', x: 24, y: 16 },
    productionRatePerMinute: 1,
    storageCap: 24,
    storedResources: { [MAGIC_DUST_CURRENCY_ID]: stored },
    lastProductionAt: '2026-06-20T12:00:00.000Z',
    theftCooldowns: {},
    ...farmOverrides
  };
}

function withFarm(state: ReturnType<typeof createInitialSave>, farm: FarmSaveRecord) {
  return {
    ...state,
    farms: {
      ...state.farms,
      farms: {
        [farm.id]: farm
      }
    }
  };
}

function withCreature(state: ReturnType<typeof createInitialSave>, creature: CreatureSaveRecord) {
  return {
    ...state,
    creatures: {
      ...state.creatures,
      activePartyCreatureIds: [...state.creatures.activePartyCreatureIds, creature.id],
      creatures: {
        ...state.creatures.creatures,
        [creature.id]: creature
      }
    }
  };
}

function withMagicDust(state: ReturnType<typeof createInitialSave>, quantity: number) {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        [MAGIC_DUST_CURRENCY_ID]: quantity
      }
    }
  };
}

function createCreature(overrides: Partial<CreatureSaveRecord> = {}): CreatureSaveRecord {
  return {
    id: 'creature-1',
    ownerPlayerId: 'player-1',
    speciesId: 1,
    level: 1,
    experience: 0,
    stats: { hp: 10, attack: 4, defense: 4, speed: 4, stamina: 4 },
    attacks: [
      { id: 'attack-1', name: 'Tackle', type: 'verdant', power: 4, statFocus: 'attack' },
      { id: 'attack-2', name: 'Brace', type: 'stone', power: 3, statFocus: 'defense' },
      { id: 'attack-3', name: 'Dash', type: 'gale', power: 3, statFocus: 'speed' },
      { id: 'attack-4', name: 'Pulse', type: 'lumen', power: 3, statFocus: 'stamina' }
    ],
    hp: 10,
    maxHp: 10,
    fainted: false,
    cooldowns: {},
    ...overrides
  };
}
