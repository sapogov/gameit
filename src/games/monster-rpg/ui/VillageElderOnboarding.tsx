import {
  getSpeciesById,
  getStarterCreatureConversionCost,
  getVillageElderOnboardingStep,
  MAGIC_DUST_CURRENCY_ID,
  STARTER_FARM_CARD_ID,
  STARTER_CREATURE_MAGIC_DUST_COST,
  STARTER_PACK_MAGIC_DUST_GRANT,
  STARTER_PACK_ONBOARDING_TEXT,
  starterCreatureCards,
  type MonsterRpgSaveState
} from '../sim';

interface VillageElderOnboardingProps {
  saveState: MonsterRpgSaveState;
  onBuildFarm: () => void;
  onCompleteDialog: () => void;
  onConvertCreatures: () => void;
  onFinish: () => void;
}

export function VillageElderOnboarding({
  saveState,
  onBuildFarm,
  onCompleteDialog,
  onConvertCreatures,
  onFinish
}: VillageElderOnboardingProps) {
  const step = getVillageElderOnboardingStep(saveState);
  if (step === 'complete') return null;

  const magicDust = saveState.inventory.currencies[MAGIC_DUST_CURRENCY_ID] ?? 0;
  const requiredMagicDust = getStarterCreatureConversionCost();
  const hasStarterCards = starterCreatureCards.every((card) => (saveState.inventory.cards[card.cardId]?.quantity ?? 0) > 0);
  const canConvert = hasStarterCards && magicDust >= requiredMagicDust;
  const canBuildFarm = (saveState.inventory.cards[STARTER_FARM_CARD_ID]?.quantity ?? 0) > 0;

  return (
    <section className="monster-onboarding-panel" aria-label="Village Elder onboarding">
      <p className="monster-kicker">Village Elder</p>
      {step === 'elder-dialog' ? (
        <>
          <h2>Welcome, {saveState.profile.name}</h2>
          <p>
            Your village starts at Town Hall. Take this Starter Pack, then turn the cards into your first party and
            build a Magic Dust Farm.
          </p>
          <ul>
            <li>3 common Creature Cards</li>
            <li>1 Magic Dust Farm Card</li>
            <li>{STARTER_PACK_MAGIC_DUST_GRANT} Magic Dust for starter conversions</li>
          </ul>
          <small>{STARTER_PACK_ONBOARDING_TEXT}</small>
          <button onClick={onCompleteDialog} type="button">
            Receive Starter Pack
          </button>
        </>
      ) : null}

      {step === 'convert-creatures' ? (
        <>
          <h2>Convert Creature Cards</h2>
          <p>
            Each card uses {STARTER_CREATURE_MAGIC_DUST_COST} Magic Dust. You have {magicDust}/{requiredMagicDust}.
          </p>
          <ul>
            {starterCreatureCards.map((card) => (
              <li key={card.cardId}>{getSpeciesById(card.speciesId)?.displayName ?? card.cardId}</li>
            ))}
          </ul>
          <button disabled={!canConvert} onClick={onConvertCreatures} type="button">
            Convert Starter Cards
          </button>
        </>
      ) : null}

      {step === 'build-farm' ? (
        <>
          <h2>Build Magic Dust Farm</h2>
          <p>The Farm Card becomes your first village resource building. It starts at level 1.</p>
          <button disabled={!canBuildFarm} onClick={onBuildFarm} type="button">
            Build Farm
          </button>
        </>
      ) : null}

      {step === 'finish' ? (
        <>
          <h2>First Farm Built</h2>
          <p>Your party and Magic Dust Farm are ready. The village is yours to explore.</p>
          <button onClick={onFinish} type="button">
            Begin Journey
          </button>
        </>
      ) : null}
    </section>
  );
}
