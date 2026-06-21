import { describe, expect, it } from 'vitest';
import {
  activateBuffCard,
  activateCreatureCardViaElder,
  activateMaterialCard,
  buildFarmCardViaElder,
  convertCreatureCardViaElder,
  createCreatureCardInstance,
  createDirectDropEgg,
  createInitialSave,
  createPlayerProfile,
  drawCardFromRewardTable,
  getCardCatalog,
  getCreatureCreationRequirements,
  getEggDescription,
  getMaterialCardById,
  getCreatureCardById,
  getFarmCardById,
  getSpeciesById,
  hatchEgg,
  openPack,
  type CardRewardTable,
  type MonsterRpgSaveState
} from '.';

describe('Monster RPG cards', () => {
  it('opens packs with five cards and deterministic results for the same seed', () => {
    const state = createInitialSave(createPlayerProfile('Tess', 'ranger'));
    const seed = 2026;

    const first = openPack(state, { seed });
    const second = openPack(state, { seed });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.trace.cards).toHaveLength(5);
    expect(first.trace.seed).toBe(seed);
    expect(first.trace.rewardTableId).toBe('card-pack:standard');
    expect(second.trace.seed).toBe(seed);
    expect(first.trace.cards.map((card) => card.cardId)).toEqual(second.trace.cards.map((card) => card.cardId));
    expect(first.trace.cards.map((card) => card.instanceId ?? null)).toEqual(
      second.trace.cards.map((card) => card.instanceId ?? null)
    );
    const totalByRarity = Object.values(first.trace.countsByRarity).reduce((sum, count) => sum + count, 0);
    expect(totalByRarity).toBe(5);
    const inventoryCount =
      Object.values(first.state.inventory.cards).reduce((sum, stack) => sum + stack.quantity, 0) +
      Object.keys(first.state.inventory.creatureCards).length;
    expect(inventoryCount).toBe(5);
  });

  it('draws reward-table entries at deterministic rarity and card-type boundaries', () => {
    const table: CardRewardTable = {
      id: 'test-table',
      sources: ['quest', 'level'],
      entries: [
        { cardId: 'material-card:charcoal-bundle', weight: 5 },
        { cardId: 'creature-card:duskleaf', weight: 3 },
        { cardId: 'buff-card:drop-luck', weight: 2 }
      ]
    };

    expect(drawCardFromRewardTable(table, () => 0).type).toBe('material');
    expect(drawCardFromRewardTable(table, () => 0.499).rarity).toBe('common');
    expect(drawCardFromRewardTable(table, () => 0.501).type).toBe('creature');
    expect(drawCardFromRewardTable(table, () => 0.799).rarity).toBe('uncommon');
    expect(drawCardFromRewardTable(table, () => 0.801).type).toBe('buff');
    expect(drawCardFromRewardTable(table, () => 0.999).rarity).toBe('rare');
  });

  it('supports deterministic material card activation and keeps remaining stack state', () => {
    const catalog = getCardCatalog();
    const materialCard = catalog.find((card) => card.type === 'material');
    if (!materialCard) throw new Error('Material card not configured');
    const start = createProfileState('Kira');
    const stateWithMaterial = setCardStack(start, materialCard.id, 2);

    const result = activateMaterialCard(stateWithMaterial, materialCard.id);
    const definition = getMaterialCardById(materialCard.id);
    if (!definition) throw new Error('Material definition not found');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.inventory.cards[materialCard.id]?.quantity).toBe(1);
    expect(result.state.inventory.currencies[definition.materialId]).toBe(definition.materialAmount);
  });

  it('allows only one active buff card per buff type', () => {
    const catalog = getCardCatalog();
    const buffCard = catalog.find((card) => card.type === 'buff');
    if (!buffCard) throw new Error('Buff card not configured');
    const start = createProfileState('Arin');
    const stateWithBuffs = setCardStack(start, buffCard.id, 2);

    const first = activateBuffCard(stateWithBuffs, buffCard.id);
    const buffType = buffCard.type === 'buff' ? buffCard.buffType : 'battle';
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.reason);
    expect(first.state.progression.activeCardBuffs).toBeDefined();
    expect(first.state.progression.activeCardBuffs?.[buffType]).toBe(buffCard.id);

    const second = activateBuffCard(first.state, buffCard.id);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('buff-slot-occupied');
  });

  it('routes common creature card instances to the Village Elder and creates a creature with inherited stats and attacks', () => {
    const catalog = getCardCatalog();
    const creatureCard = catalog.find((card) => card.type === 'creature');
    if (!creatureCard) throw new Error('Creature card not configured');
    const definition = getCreatureCardById(creatureCard.id);
    if (!definition) throw new Error('Creature definition not found');
    const start = withMagicDust(createProfileState('Jules'), 3);
    const instance = createCreatureCardInstance(definition, start.profile.playerId, {}, { seed: 10 });
    const stateWithCreatureCard = setCreatureCardInstance(start, instance);

    const result = activateCreatureCardViaElder(stateWithCreatureCard, instance.id);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    const creatureIds = Object.keys(result.state.creatures.creatures);
    expect(creatureIds.length).toBe(1);
    const creature = result.state.creatures.creatures[creatureIds[0]];
    expect(creature.speciesId).toBe(definition.speciesId);
    expect(creature.stats).toEqual(instance.stats);
    expect(creature.attacks).toHaveLength(4);
    expect(creature.attacks.slice(0, 2)).toEqual(instance.knownAttacks);
    expect(result.state.inventory.creatureCards[instance.id]).toBeUndefined();
    expect(result.state.journal.species[String(definition.speciesId)]).toBe('discovered');
  });

  it('turns uncommon-or-higher creature cards into eggs with inherited attacks in the description', () => {
    const definition = getCreatureCardById('creature-card:duskleaf');
    if (!definition) throw new Error('Uncommon Creature Card not configured');
    const start = withMagicDust(createProfileState('Mara'), 3);
    const instance = createCreatureCardInstance(definition, start.profile.playerId, {}, { seed: 15 });
    const stateWithCard = setCreatureCardInstance(start, instance);

    const result = convertCreatureCardViaElder(stateWithCard, instance.id, { seed: 16 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(Object.keys(result.state.creatures.creatures)).toHaveLength(0);
    const egg = Object.values(result.state.inventory.eggs)[0];
    expect(egg.origin).toBe('card');
    expect(egg.stats).toEqual(instance.stats);
    expect(egg.inheritedAttacks).toEqual(instance.knownAttacks);
    const species = getSpeciesById(egg.speciesId);
    const description = getEggDescription(egg, species);
    instance.knownAttacks.forEach((attack) => {
      expect(description).toContain(attack.name);
    });
  });

  it('hatches direct-drop eggs by rolling all four attacks only when the creature is created', () => {
    const start = withMagicDust(createProfileState('Orrin'), 10);
    const eggResult = createDirectDropEgg(start, 20, { seed: 30 });
    expect(eggResult.ok).toBe(true);
    if (!eggResult.ok) throw new Error(eggResult.reason);
    const egg = Object.values(eggResult.state.inventory.eggs)[0];
    expect(egg.origin).toBe('direct-drop');
    expect(egg.inheritedAttacks).toBeUndefined();
    expect(getEggDescription(egg, getSpeciesById(egg.speciesId))).toContain('Attacks will be revealed');

    const hatchResult = hatchEgg(eggResult.state, egg.id, { seed: 31 });
    expect(hatchResult.ok).toBe(true);
    if (!hatchResult.ok) throw new Error(hatchResult.reason);
    const creature = Object.values(hatchResult.state.creatures.creatures)[0];
    expect(creature.attacks).toHaveLength(4);
    expect(new Set(creature.attacks.map((attack) => attack.id)).size).toBe(4);
    expect(hatchResult.state.inventory.eggs[egg.id]).toBeUndefined();
    expect(hatchResult.state.journal.species[String(egg.speciesId)]).toBe('discovered');
  });

  it('models creation requirements with Magic Dust scopes for rarity, type, and species', () => {
    const species = getSpeciesById(20);
    if (!species) throw new Error('Species not configured');

    const [requirement] = getCreatureCreationRequirements(species);

    expect(requirement.materialId).toBe('magicDust');
    expect(requirement.quantity).toBeGreaterThan(0);
    expect(requirement.scope).toEqual({
      rarity: species.rarity,
      type: species.type,
      speciesId: species.id
    });
  });

  it('builds farms from farm cards via the Village Elder and blocks duplicate farm types', () => {
    const catalog = getCardCatalog();
    const farmCard = catalog.find((card) => card.type === 'farm');
    if (!farmCard) throw new Error('Farm card not configured');
    const definition = getFarmCardById(farmCard.id);
    if (!definition) throw new Error('Farm definition not found');
    const start = createProfileState('Nia');
    const stateWithFarmCard = setCardStack(start, farmCard.id, 2);

    const first = buildFarmCardViaElder(stateWithFarmCard, farmCard.id);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.reason);
    const farmIds = Object.keys(first.state.farms.farms);
    expect(farmIds).toHaveLength(1);
    expect(first.state.farms.farms[farmIds[0]].farmType).toBe(definition.farmType);

    const second = buildFarmCardViaElder(first.state, farmCard.id);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('farm-type-locked');
  });
});

function createProfileState(name: string): MonsterRpgSaveState {
  return createInitialSave(createPlayerProfile(name, 'scout'));
}

function setCardStack(state: MonsterRpgSaveState, cardId: string, quantity: number): MonsterRpgSaveState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      cards: {
        ...state.inventory.cards,
        [cardId]: {
          id: cardId,
          ownerPlayerId: state.profile.playerId,
          quantity
        }
      }
    }
  };
}

function setCreatureCardInstance(
  state: MonsterRpgSaveState,
  instance: ReturnType<typeof createCreatureCardInstance>
): MonsterRpgSaveState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      creatureCards: {
        ...state.inventory.creatureCards,
        [instance.id]: instance
      }
    }
  };
}

function withMagicDust(state: MonsterRpgSaveState, quantity: number): MonsterRpgSaveState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      currencies: {
        ...state.inventory.currencies,
        magicDust: quantity
      }
    }
  };
}
