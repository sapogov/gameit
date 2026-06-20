import {
  ACTIVE_PARTY_LIMIT,
  REVIVE_ITEM_ID,
  canCreatureUseRole,
  getBattleAttackFatigueCost,
  gen1SpeciesCatalog,
  getAccruedFarmRecord,
  getCardDefinition,
  getEggDescription,
  getFarmDefinition,
  getFarmUpgradePreview,
  getJournalSpeciesViewState,
  getSpeciesById,
  isFarmGuardActive,
  type CardDefinition,
  type BattleRoomState,
  type CreatureLabelMode,
  type CreatureSaveRecord,
  type FarmSaveRecord,
  type FarmUpgradePlan,
  type CreatureSpeciesRecord,
  type JournalSpeciesViewState,
  type PackOpenTrace,
  type MapKind,
  type MonsterRpgSaveState,
  type MovementResult,
  type MultiplayerStatus
} from '../sim';

interface GameHudProps {
  canUseHospital: boolean;
  importStatus: string | null;
  lastMove: MovementResult | null;
  mapKind: MapKind;
  mapName: string;
  multiplayerStatus: MultiplayerStatus;
  playerCount: number;
  saveState: MonsterRpgSaveState;
  farmStatusNow: number;
  creatureLabelMode: CreatureLabelMode;
  packOpenTrace: PackOpenTrace | null;
  battleState: BattleRoomState | null;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onOpenPack: () => void;
  onActivateCard: (cardId: string) => void;
  onRouteCardToElder: (cardId: string) => void;
  onHatchEgg: (eggId: string) => void;
  onHospitalHeal: () => void;
  onMoveCreatureToActive: (creatureId: string) => void;
  onMoveCreatureToStorage: (creatureId: string) => void;
  onUpgradeFarm: (farmId: string) => void;
  onAssignFarmGuard: (farmId: string, creatureId: string | null) => void;
  onCreatureLabelModeChange: (mode: CreatureLabelMode) => void;
  onBattleAttack: (attackId: string) => void;
  onRunBattle: () => void;
  onReviveCreature: (creatureId: string) => void;
}

export function GameHud({
  canUseHospital,
  importStatus,
  lastMove,
  mapKind,
  mapName,
  multiplayerStatus,
  playerCount,
  saveState,
  farmStatusNow,
  creatureLabelMode,
  packOpenTrace,
  battleState,
  onExport,
  onImport,
  onReset,
  onOpenPack,
  onActivateCard,
  onRouteCardToElder,
  onHatchEgg,
  onHospitalHeal,
  onMoveCreatureToActive,
  onMoveCreatureToStorage,
  onUpgradeFarm,
  onAssignFarmGuard,
  onCreatureLabelModeChange,
  onBattleAttack,
  onRunBattle,
  onReviveCreature
}: GameHudProps) {
  const status = getStatusText(multiplayerStatus, playerCount, lastMove);
  const locationHint = `${formatMapKind(mapKind)} - ${saveState.position.x}, ${saveState.position.y}`;
  const discoveredCount = Object.values(saveState.journal.species).filter((state) => state === 'discovered').length;
  const silhouetteCount = Object.values(saveState.journal.species).filter((state) => state === 'silhouette').length;
  const cardRows = getCardRows(saveState);
  const creatureRows = getCreatureRows(saveState);
  const farmRows = getFarmRows(saveState, new Date(farmStatusNow));
  const guardOptions = creatureRows.map((row) => ({
    id: row.id,
    label: `${row.species?.displayName ?? `Species #${row.creature.speciesId}`} (${row.container})`,
    disabled: !canCreatureUseRole(row.creature, 'guard')
  }));
  const activeCount = saveState.creatures.activePartyCreatureIds.length;
  const reviveCount = saveState.inventory.items[REVIVE_ITEM_ID]?.quantity ?? 0;
  const currencySummary = formatCurrencySummary(saveState.inventory.currencies);
  const canRunFromBattle = battleState?.status === 'active' && battleState.canRun;

  return (
    <div className="monster-hud">
      <div className="monster-hud-stack">
        <section className="monster-hud-panel">
          <p>{mapName}</p>
          <h2>{saveState.profile.name}</h2>
          <span>{status}</span>
          <small>Player XP {saveState.progression.playerExperience}</small>
          <small>{currencySummary}</small>
          <small>{locationHint}</small>
          {importStatus ? <small>{importStatus}</small> : null}
        </section>
        {battleState ? (
          <section className="monster-battle-panel">
            <div className="monster-battle-heading">
              <span>Battle</span>
              <strong>{formatBattleStatus(battleState.status)}</strong>
            </div>
            <div className="monster-battle-health">
              <BattleMeter
                label={battleState.player.name}
                hp={battleState.player.activeCreature.hp}
                maxHp={battleState.player.activeCreature.maxHp}
                fatigue={battleState.player.activeCreature.fatigue}
                maxFatigue={battleState.player.activeCreature.maxFatigue}
              />
              <BattleMeter
                label={battleState.enemy.name}
                hp={battleState.enemy.activeCreature.hp}
                maxHp={battleState.enemy.activeCreature.maxHp}
                fatigue={battleState.enemy.activeCreature.fatigue}
                maxFatigue={battleState.enemy.activeCreature.maxFatigue}
              />
            </div>
            <div className="monster-battle-actions">
              {battleState.player.activeCreature.attacks.map((attack) => {
                const canUse =
                  battleState.status === 'active' && battleState.validPlayerAttackIds.includes(attack.id);
                return (
                  <button disabled={!canUse} key={attack.id} onClick={() => onBattleAttack(attack.id)} type="button">
                    {attack.name}
                    <span>{getBattleAttackFatigueCost(attack)} fatigue</span>
                  </button>
                );
              })}
              {battleState.canRun ? (
                <button disabled={!canRunFromBattle} onClick={onRunBattle} type="button">
                  Run
                </button>
              ) : null}
            </div>
            <div className="monster-battle-log">
              {battleState.lastLog.map((entry) => (
                <small key={entry.id}>{entry.message}</small>
              ))}
            </div>
          </section>
        ) : null}
        {farmRows.length > 0 ? (
          <section className="monster-hud-panel monster-farm-panel">
            <h3>Farms</h3>
            <div className="monster-farm-grid">
              {farmRows.map((farm) => (
                <article className="monster-farm-row" key={farm.id}>
                  <strong>
                    {farm.name} <span>Lv {farm.level}</span>
                  </strong>
                  <small>
                    Stored {farm.stored}/{farm.cap} {farm.resourceName}
                  </small>
                  <small>
                    Produces {farm.rate}/min · {farm.status}
                  </small>
                  <small>{farm.guardStatus}</small>
                  <small>{farm.upgradeRequirementText}</small>
                  <div className="monster-farm-actions">
                    <button disabled={!farm.canUpgrade} onClick={() => onUpgradeFarm(farm.id)} type="button">
                      Upgrade
                    </button>
                    <label>
                      Guard
                      <select
                        value={farm.guardCreatureId ?? ''}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          onAssignFarmGuard(farm.id, value.length > 0 ? value : null);
                        }}
                      >
                        <option value="">None</option>
                        {guardOptions.map((option) => (
                          <option disabled={option.disabled} key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <details className="monster-creature-panel" open>
          <summary>
            Creatures <span>{activeCount}/{ACTIVE_PARTY_LIMIT} active</span> <span>{reviveCount} revives</span>
          </summary>
          <div className="monster-creature-actions">
            <button disabled={!canUseHospital} onClick={onHospitalHeal} type="button">
              Hospital Heal
            </button>
          </div>
          <div className="monster-creature-grid">
            {creatureRows.length > 0 ? (
              creatureRows.map((row) => {
                const canActivate = row.container === 'storage' && activeCount < ACTIVE_PARTY_LIMIT;
                const canBattle = row.container === 'active' && canCreatureUseRole(row.creature, 'battle');
                const canGuard = canCreatureUseRole(row.creature, 'guard');
                const canMount = row.container === 'active' && canCreatureUseRole(row.creature, 'mount');
                return (
                  <article className={`monster-creature-row ${row.creature.fainted ? 'fainted' : ''}`} key={row.id}>
                    <div>
                      <strong>{row.species?.displayName ?? `Species #${row.creature.speciesId}`}</strong>
                      <small>
                        {row.container} · {row.species?.rarity ?? 'unknown'} · {row.species?.type ?? 'unknown'}
                      </small>
                    </div>
                    <small>
                      HP {row.creature.hp}/{row.creature.maxHp} · XP {row.creature.experience} ·{' '}
                      {row.creature.fainted ? 'Fainted' : 'Ready'}
                    </small>
                    <small>
                      Stats HP {row.creature.stats.hp} / ATK {row.creature.stats.attack} / DEF{' '}
                      {row.creature.stats.defense} / SPD {row.creature.stats.speed} / STA {row.creature.stats.stamina}
                    </small>
                    <small>Attacks: {row.creature.attacks.map((attack) => attack.name).join(', ')}</small>
                    <small>
                      Uses:{' '}
                      {canBattle ? 'battle' : 'no battle'} · {canGuard ? 'guard' : 'no guard'} ·{' '}
                      {canMount ? 'mount' : 'no mount'}
                    </small>
                    <div className="monster-creature-actions">
                      {row.container === 'active' ? (
                        <button onClick={() => onMoveCreatureToStorage(row.id)} type="button">
                          Store
                        </button>
                      ) : (
                        <button disabled={!canActivate} onClick={() => onMoveCreatureToActive(row.id)} type="button">
                          Activate
                        </button>
                      )}
                      {row.creature.fainted ? (
                        <button disabled={reviveCount < 1} onClick={() => onReviveCreature(row.id)} type="button">
                          Revive
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <small>No Creatures owned</small>
            )}
          </div>
        </details>
        <section className="monster-hud-panel monster-card-panel">
          <h3>Inventory Cards</h3>
          <div className="monster-card-actions">
            <button onClick={onOpenPack} type="button">
              Open Pack
            </button>
          </div>
          {packOpenTrace ? (
            <small>
              Last pack: {packOpenTrace.cards.length} cards at {new Date(packOpenTrace.openedAt).toLocaleTimeString()}
            </small>
          ) : null}
          <div className="monster-card-grid">
            {cardRows.length > 0 ? (
              cardRows.map((card) => {
                const allowedAction = getCardAction(card);
                return (
                  <article className="monster-card-row" key={card.id}>
                    <span>
                      <strong>{card.name}</strong>
                    </span>
                    <small>{card.detail}</small>
                    {card.description ? <small>{card.description}</small> : null}
                    {allowedAction ? (
                      <button
                        onClick={() => {
                          if (card.kind === 'stack') {
                            if (card.definition?.type === 'farm') {
                              onRouteCardToElder(card.id);
                            } else {
                              onActivateCard(card.id);
                            }
                          } else if (card.kind === 'creature-card') {
                            onRouteCardToElder(card.id);
                          } else {
                            onHatchEgg(card.id);
                          }
                        }}
                        type="button"
                      >
                        {allowedAction}
                      </button>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <small>Empty inventory</small>
            )}
          </div>
        </section>
        <details className="monster-settings-panel">
          <summary>Settings</summary>
          <div className="monster-segmented-control" aria-label="Creature label mode">
            <button
              className={creatureLabelMode === 'icon-only' ? 'active' : ''}
              onClick={() => onCreatureLabelModeChange('icon-only')}
              type="button"
            >
              Icon
            </button>
            <button
              className={creatureLabelMode === 'icon-plus-name' ? 'active' : ''}
              onClick={() => onCreatureLabelModeChange('icon-plus-name')}
              type="button"
            >
              Icon + Name
            </button>
          </div>
        </details>
        <details className="monster-journal-panel">
          <summary>
            Creature Journal <span>{discoveredCount} found</span> <span>{silhouetteCount} seen</span>
          </summary>
          <div className="monster-journal-grid">
            {gen1SpeciesCatalog.map((species) => (
              <JournalSpeciesRow
                key={species.id}
                species={species}
                viewState={getJournalSpeciesViewState(saveState, species.id)}
              />
            ))}
          </div>
        </details>
      </div>
      <div className="monster-save-actions" aria-label="Save actions">
        <button onClick={onExport} title="Export local save" type="button">
          Export
        </button>
        <label title="Import local save">
          Import
          <input
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) onImport(file);
            }}
            type="file"
          />
        </label>
        <button onClick={onReset} title="Reset local profile" type="button">
          Reset
        </button>
      </div>
    </div>
  );
}

function BattleMeter({
  fatigue,
  hp,
  label,
  maxFatigue,
  maxHp
}: {
  fatigue: number;
  hp: number;
  label: string;
  maxFatigue: number;
  maxHp: number;
}) {
  const hpPercent = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const fatiguePercent = maxFatigue > 0 ? Math.max(0, Math.min(100, (fatigue / maxFatigue) * 100)) : 0;

  return (
    <div className="monster-battle-meter">
      <strong>{label}</strong>
      <span>
        HP {hp}/{maxHp}
      </span>
      <div className="monster-battle-bar">
        <i style={{ width: `${hpPercent}%` }} />
      </div>
      <span>
        Fatigue {fatigue}/{maxFatigue}
      </span>
      <div className="monster-battle-bar fatigue">
        <i style={{ width: `${fatiguePercent}%` }} />
      </div>
    </div>
  );
}

function formatBattleStatus(status: BattleRoomState['status']): string {
  if (status === 'player-won') return 'Won';
  if (status === 'player-lost') return 'Lost';
  if (status === 'disconnected-grace') return 'Reconnecting';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function JournalSpeciesRow({
  species,
  viewState
}: {
  species: CreatureSpeciesRecord;
  viewState: JournalSpeciesViewState;
}) {
  const isDiscovered = viewState === 'discovered';
  const isSilhouette = viewState === 'silhouette';
  const displayName = isDiscovered ? species.displayName : isSilhouette ? 'Silhouette' : 'Unseen';

  return (
    <div className={`monster-journal-row ${viewState}`}>
      <span className="monster-journal-number">#{String(species.id).padStart(3, '0')}</span>
      <span className="monster-journal-mark" aria-hidden="true" />
      <span className="monster-journal-name">{displayName}</span>
      <span className="monster-journal-meta">{isDiscovered ? `${species.rarity} / ${species.type}` : viewState}</span>
    </div>
  );
}

function formatMapKind(kind: MapKind): string {
  if (kind === 'world-map') return 'Overworld';
  if (kind === 'interior') return 'Interior';
  return 'Village';
}

function formatCurrencySummary(currencies: Record<string, number>): string {
  const entries = Object.entries(currencies).filter(([, quantity]) => quantity > 0);
  if (entries.length === 0) return 'No materials';

  return entries.map(([id, quantity]) => `${formatMaterialId(id)} ${quantity}`).join(' / ');
}

function formatMaterialId(id: string): string {
  if (id === 'magicDust') return 'Magic Dust';
  return id.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function getStatusText(status: MultiplayerStatus, playerCount: number, lastMove: MovementResult | null): string {
  if (status === 'online') return `Online - ${playerCount} player${playerCount === 1 ? '' : 's'}`;
  if (status === 'connecting') return 'Connecting';
  return lastMove?.blocked ? `Offline local - blocked by ${formatBlockedBy(lastMove.blockedBy)}` : 'Offline local';
}

type CardRow =
  | { id: string; kind: 'stack'; definition: CardDefinition | undefined; name: string; detail: string; description?: string }
  | { id: string; kind: 'creature-card'; name: string; detail: string; description?: string }
  | { id: string; kind: 'egg'; name: string; detail: string; description?: string };

function getCardRows(saveState: MonsterRpgSaveState): CardRow[] {
  const stackRows: CardRow[] = Object.entries(saveState.inventory.cards)
    .map(([id, stack]) => ({
      id,
      kind: 'stack' as const,
      definition: getCardDefinition(id),
      quantity: stack.quantity,
      name: getCardDefinition(id)?.name ?? id,
      detail: `${getCardDefinition(id)?.type ?? 'unknown'} · ${getCardDefinition(id)?.rarity ?? 'unknown'} · qty ${stack.quantity}`
    }))
    .filter((card) => card.quantity > 0)
    .map(({ id, kind, definition, name, detail }) => ({ id, kind, definition, name, detail }));

  const creatureCardRows: CardRow[] = Object.values(saveState.inventory.creatureCards).map((card) => {
    const definition = getCardDefinition(card.cardDefinitionId);
    const stats = `HP ${card.stats.hp} / ATK ${card.stats.attack} / DEF ${card.stats.defense} / SPD ${card.stats.speed}`;
    return {
      id: card.id,
      kind: 'creature-card',
      name: definition?.name ?? card.id,
      detail: `creature · ${card.rarity} · ${stats}`,
      description: `Known attacks: ${card.knownAttacks.map((attack) => attack.name).join(', ')}`
    };
  });

  const eggRows: CardRow[] = Object.values(saveState.inventory.eggs).map((egg) => {
    const species = getSpeciesById(egg.speciesId);
    return {
      id: egg.id,
      kind: 'egg',
      name: `${species?.displayName ?? `Species #${egg.speciesId}`} Egg`,
      detail: `egg · ${egg.rarity} · ${egg.origin === 'card' ? 'card-made' : 'direct drop'}`,
      description: getEggDescription(egg, species)
    };
  });

  return [...stackRows, ...creatureCardRows, ...eggRows].sort((a, b) => {
    const kindSort = a.kind.localeCompare(b.kind);
    return kindSort || a.id.localeCompare(b.id);
  });
}

type CreatureRow = {
  id: string;
  container: 'active' | 'storage';
  creature: CreatureSaveRecord;
  species: CreatureSpeciesRecord | undefined;
};

type FarmRow = {
  id: string;
  name: string;
  level: number;
  resourceName: string;
  stored: number;
  cap: number;
  rate: number;
  status: string;
  canUpgrade: boolean;
  guardCreatureId?: string;
  guardStatus: string;
  upgradeRequirementText: string;
};

function getFarmRows(saveState: MonsterRpgSaveState, now: Date): FarmRow[] {
  return Object.values(saveState.farms.farms)
    .map((farm) => toFarmRow(saveState, farm, now))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

function toFarmRow(saveState: MonsterRpgSaveState, farm: FarmSaveRecord, now: Date): FarmRow {
  const definition = getFarmDefinition(farm.farmType);
  const accrued = getAccruedFarmRecord(farm, now);
  const preview = getFarmUpgradePreview(saveState, farm.id);
  const stored = accrued.storedResources[accrued.resourceId] ?? 0;
  const cap = accrued.storageCap;
  const guard = farm.guardCreatureId ? saveState.creatures.creatures[farm.guardCreatureId] : undefined;
  const guardSpecies = guard ? getSpeciesById(guard.speciesId) : undefined;

  return {
    id: farm.id,
    name: definition?.displayName ?? farm.farmType,
    level: farm.level,
    resourceName: definition?.resourceName ?? formatMaterialId(accrued.resourceId),
    stored,
    cap,
    rate: accrued.productionRatePerMinute,
    status: stored >= cap ? 'Full' : stored > 0 ? 'Ready' : 'Producing',
    canUpgrade: Boolean(preview?.canUpgrade),
    guardCreatureId: farm.guardCreatureId,
    guardStatus: farm.guardCreatureId
      ? `Guard ${guardSpecies?.displayName ?? farm.guardCreatureId} · ${
          isFarmGuardActive(saveState, farm) ? 'active' : 'inactive'
        }`
      : 'Guard unassigned',
    upgradeRequirementText: formatFarmUpgradeRequirement(preview?.plan)
  };
}

function formatFarmUpgradeRequirement(plan: FarmUpgradePlan | undefined): string {
  if (!plan) return 'Max level';
  const materialText = plan.requirements.materials
    .map((requirement) => `${requirement.quantity} ${formatMaterialId(requirement.materialId)}`)
    .join(', ');
  const cardText = plan.requirements.farmCards
    .map((requirement) => `${requirement.quantity} Farm Card${requirement.quantity === 1 ? '' : 's'}`)
    .join(', ');
  return `Upgrade to Lv ${plan.toLevel}: ${[cardText, materialText].filter(Boolean).join(' + ')}`;
}

function getCreatureRows(saveState: MonsterRpgSaveState): CreatureRow[] {
  const activeRows = saveState.creatures.activePartyCreatureIds.flatMap((id): CreatureRow[] => {
    const creature = saveState.creatures.creatures[id];
    if (!creature) return [];
    return [{ id, container: 'active', creature, species: getSpeciesById(creature.speciesId) }];
  });
  const storedRows = saveState.creatures.storedCreatureIds.flatMap((id): CreatureRow[] => {
    const creature = saveState.creatures.creatures[id];
    if (!creature) return [];
    return [{ id, container: 'storage', creature, species: getSpeciesById(creature.speciesId) }];
  });

  return [...activeRows, ...storedRows];
}

function getCardAction(card: CardRow): string | null {
  if (card.kind === 'egg') return 'Hatch';
  if (card.kind === 'creature-card') return 'Use Elder';
  if (!card.definition) return null;
  if (card.definition.type === 'material' || card.definition.type === 'buff') return 'Activate';
  if (card.definition.type === 'farm') return 'Use Elder';
  return null;
}

function formatBlockedBy(blockedBy: MovementResult['blockedBy']): string {
  if (!blockedBy) return 'obstacle';
  if (blockedBy === 'bounds') return 'edge';
  if (blockedBy === 'onboarding') return 'Village Elder';
  return blockedBy.replace(/([A-Z])/g, ' $1').toLowerCase();
}
