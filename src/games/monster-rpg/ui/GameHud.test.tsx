import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { createInitialSave, createPlayerProfile } from '../sim';
import { createGameLogState } from './gameLog';
import { GameHud } from './GameHud';

test('renders item details, capacity, inbox contents, and bounded inventory controls', () => {
  const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
  const saveState = {
    ...save,
    inventory: {
      ...save.inventory,
      itemInventory: { stacks: { sprig: { id: 'sprig', itemId: 'mending-sprig' as const, quantity: 3 } } },
      rewardInbox: {
        ...save.inventory.rewardInbox,
        bundles: {
          reward: { sourceId: 'reward', ownerPlayerId: save.profile.playerId, items: [{ itemId: 'worn-key' as const, quantity: 2 }], createdAt: '2026-07-20T00:00:00.000Z' }
        }
      }
    }
  };
  const noop = vi.fn();
  const markup = renderToStaticMarkup(
    <GameHud
      battleState={null} canUseHospital={false} creatureLabelMode="icon-plus-name"
      farmStatusNow={Date.parse(save.updatedAt)} gameLog={createGameLogState(save.profile.playerId)}
      importStatus={null} lastMove={null} mapKind="village" mapName="Home Village"
      multiplayerStatus="offline" onActivateCard={noop} onAssignFarmGuard={noop} onBattleAttack={noop}
      onCancelStationTravel={noop} onClaimReward={noop} onConfirmStationTravel={noop}
      onCreatureLabelModeChange={noop} onDiscardItem={noop} onExport={noop} onHatchEgg={noop}
      onHospitalHeal={noop} onImport={noop} onMoveCreatureToActive={noop} onMoveCreatureToStorage={noop}
      onPrepareStationTravel={noop} onReset={noop} onReviveCreature={noop}
      onRouteCardToElder={noop} onRunBattle={noop} onBattleSwitchCreature={noop} onUpgradeFarm={noop} packOpenTrace={null}
      pendingStationDestinationId={null} playerCount={1} saveState={saveState}
    />
  );

  expect(markup).toContain('Item slots 1/150');
  expect(markup).toContain('Mending Sprig');
  expect(markup).toContain('restore 15 HP');
  expect(markup).toContain('Reward Inbox (1/50)');
  expect(markup).toContain('Worn Key ×2');
  expect(markup).toContain('aria-label="Discard quantity for Mending Sprig"');
  expect(markup).toContain('min="1"');
  expect(markup).toContain('max="3"');
  expect(markup).toContain('>Discard</button>');
  expect(markup).toContain('>Claim</button>');
});
