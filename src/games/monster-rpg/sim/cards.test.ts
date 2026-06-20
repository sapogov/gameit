import { describe, expect, it } from 'vitest';
import {
  activateBuffCard,
  activateCreatureCardViaElder,
  activateMaterialCard,
  buildFarmCardViaElder,
  createInitialSave,
  createPlayerProfile,
  getCardCatalog,
  getMaterialCardById,
  getCreatureCardById,
  getFarmCardById,
  openPack,
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
    expect(second.trace.seed).toBe(seed);
    expect(first.trace.cards.map((card) => card.cardId)).toEqual(second.trace.cards.map((card) => card.cardId));
    const totalByRarity = Object.values(first.trace.countsByRarity).reduce((sum, count) => sum + count, 0);
    expect(totalByRarity).toBe(5);
    expect(first.state.inventory.cards).not.toEqual(state.inventory.cards);
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

  it('routes creature cards to the Village Elder and creates a creature', () => {
    const catalog = getCardCatalog();
    const creatureCard = catalog.find((card) => card.type === 'creature');
    if (!creatureCard) throw new Error('Creature card not configured');
    const definition = getCreatureCardById(creatureCard.id);
    if (!definition) throw new Error('Creature definition not found');
    const start = createProfileState('Jules');
    const stateWithCreatureCard = setCardStack(start, creatureCard.id, 1);

    const result = activateCreatureCardViaElder(stateWithCreatureCard, creatureCard.id);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    const creatureIds = Object.keys(result.state.creatures.creatures);
    expect(creatureIds.length).toBe(1);
    expect(result.state.creatures.creatures[creatureIds[0]].speciesId).toBe(definition.speciesId);
    expect(result.state.journal.species[String(definition.speciesId)]).toBe('discovered');
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
