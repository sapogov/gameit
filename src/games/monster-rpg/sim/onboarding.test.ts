import { describe, expect, it } from 'vitest';
import {
  buildStarterMagicDustFarm,
  completeVillageElderDialog,
  completeVillageElderOnboarding,
  convertStarterCreatureCards,
  createInitialSave,
  exportSave,
  getStarterCreatureConversionCost,
  getVillageElderOnboardingStep,
  hasBuiltStarterMagicDustFarm,
  hasClaimedStarterPack,
  hasConvertedStarterCreatureCards,
  isVillageElderDialogComplete,
  isVillageElderOnboardingComplete,
  importSavePayload,
  MAGIC_DUST_CURRENCY_ID,
  MAGIC_DUST_FARM_ID,
  STARTER_FARM_CARD_ID,
  starterCreatureCards,
  villageElderFlags,
  type PlayerProfile
} from '.';

describe('Village Elder onboarding', () => {
  it('starts a new player near Town Hall and requires the Elder dialog first', () => {
    const state = createInitialSave(createProfile());

    expect(state.mapId).toBe('home-village');
    expect(state.position).toEqual({ mapId: 'home-village', x: 13, y: 5, facing: 'south' });
    expect(getVillageElderOnboardingStep(state)).toBe('elder-dialog');
    expect(isVillageElderDialogComplete(state)).toBe(false);
  });

  it('grants the Starter Pack exactly once and discovers the starter Species', () => {
    const state = createInitialSave(createProfile());
    const withPack = completeVillageElderDialog(state);
    const repeated = completeVillageElderDialog(withPack);

    expect(hasClaimedStarterPack(withPack)).toBe(true);
    expect(isVillageElderDialogComplete(withPack)).toBe(true);
    starterCreatureCards.forEach((card) => {
      expect(withPack.inventory.cards[card.cardId]?.quantity).toBe(1);
      expect(withPack.journal.species[String(card.speciesId)]).toBe('discovered');
      expect(repeated.inventory.cards[card.cardId]?.quantity).toBe(1);
    });
    expect(withPack.inventory.cards[STARTER_FARM_CARD_ID]?.quantity).toBe(1);
    expect(repeated.inventory.cards[STARTER_FARM_CARD_ID]?.quantity).toBe(1);
  });

  it('converts starter common Creature Cards when Magic Dust requirements are met', () => {
    const withPack = completeVillageElderDialog(createInitialSave(createProfile()));
    const result = convertStarterCreatureCards(withPack);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    expect(hasConvertedStarterCreatureCards(result.state)).toBe(true);
    expect(result.state.inventory.currencies[MAGIC_DUST_CURRENCY_ID]).toBe(0);
    starterCreatureCards.forEach((card) => {
      expect(result.state.inventory.cards[card.cardId]).toBeUndefined();
      expect(result.state.creatures.activePartyCreatureIds).toContain(`starter-creature-${card.speciesId}`);
      expect(result.state.creatures.creatures[`starter-creature-${card.speciesId}`]?.speciesId).toBe(card.speciesId);
    });
  });

  it('blocks starter conversion when Magic Dust is missing', () => {
    const withPack = completeVillageElderDialog(createInitialSave(createProfile()));
    const withoutDust = {
      ...withPack,
      inventory: {
        ...withPack.inventory,
        currencies: {
          ...withPack.inventory.currencies,
          [MAGIC_DUST_CURRENCY_ID]: getStarterCreatureConversionCost() - 1
        }
      }
    };

    const result = convertStarterCreatureCards(withoutDust);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected conversion to fail');
    expect(result.reason).toBe('missing-magic-dust');
  });

  it('builds the first Magic Dust Farm once and completes onboarding', () => {
    const withPack = completeVillageElderDialog(createInitialSave(createProfile()));
    const converted = convertStarterCreatureCards(withPack);
    if (!converted.ok) throw new Error(converted.reason);

    const built = buildStarterMagicDustFarm(converted.state);
    expect(built.ok).toBe(true);
    if (!built.ok) throw new Error(built.reason);

    const completed = completeVillageElderOnboarding(built.state);
    const roundTrip = importSavePayload(exportSave(completed));
    const repeatedBuild = buildStarterMagicDustFarm(completed);

    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) throw new Error(roundTrip.reason);
    expect(hasBuiltStarterMagicDustFarm(completed)).toBe(true);
    expect(isVillageElderOnboardingComplete(completed)).toBe(true);
    expect(isVillageElderOnboardingComplete(roundTrip.state)).toBe(true);
    expect(completed.farms.farms[MAGIC_DUST_FARM_ID]).toMatchObject({
      id: MAGIC_DUST_FARM_ID,
      ownerPlayerId: completed.profile.playerId,
      farmType: 'magic-dust',
      level: 1
    });
    expect(completed.inventory.cards[STARTER_FARM_CARD_ID]).toBeUndefined();
    expect(repeatedBuild.ok).toBe(false);
    if (repeatedBuild.ok) throw new Error('Expected repeated build to fail');
    expect(repeatedBuild.reason).toBe('already-built');
    expect(completed.progression.flags[villageElderFlags.onboardingComplete]).toBe(true);
  });
});

function createProfile(): PlayerProfile {
  return {
    schemaVersion: 5,
    playerId: 'player-1',
    name: 'Mika',
    avatar: 'scout',
    homeVillageId: 'home-village'
  };
}
