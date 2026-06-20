import {
  gen1SpeciesCatalog,
  getCardDefinition,
  getJournalSpeciesViewState,
  type CardDefinition,
  type CreatureSpeciesRecord,
  type JournalSpeciesViewState,
  type PackOpenTrace,
  type MapKind,
  type MonsterRpgSaveState,
  type MovementResult,
  type MultiplayerStatus
} from '../sim';

interface GameHudProps {
  importStatus: string | null;
  lastMove: MovementResult | null;
  mapKind: MapKind;
  mapName: string;
  multiplayerStatus: MultiplayerStatus;
  playerCount: number;
  saveState: MonsterRpgSaveState;
  packOpenTrace: PackOpenTrace | null;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onOpenPack: () => void;
  onActivateCard: (cardId: string) => void;
  onRouteCardToElder: (cardId: string) => void;
}

export function GameHud({
  importStatus,
  lastMove,
  mapKind,
  mapName,
  multiplayerStatus,
  playerCount,
  saveState,
  packOpenTrace,
  onExport,
  onImport,
  onReset,
  onOpenPack,
  onActivateCard,
  onRouteCardToElder
}: GameHudProps) {
  const status = getStatusText(multiplayerStatus, playerCount, lastMove);
  const locationHint = `${formatMapKind(mapKind)} - ${saveState.position.x}, ${saveState.position.y}`;
  const discoveredCount = Object.values(saveState.journal.species).filter((state) => state === 'discovered').length;
  const silhouetteCount = Object.values(saveState.journal.species).filter((state) => state === 'silhouette').length;
  const cardRows = getCardRows(saveState);

  return (
    <div className="monster-hud">
      <div className="monster-hud-stack">
        <section className="monster-hud-panel">
          <p>{mapName}</p>
          <h2>{saveState.profile.name}</h2>
          <span>{status}</span>
          <small>{locationHint}</small>
          {importStatus ? <small>{importStatus}</small> : null}
        </section>
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
                      <strong>{card.definition?.name ?? card.id}</strong>
                    </span>
                    <small>
                      {card.definition?.type ?? 'unknown'} · {card.definition?.rarity ?? 'unknown'} · qty {card.quantity}
                    </small>
                    {allowedAction ? (
                      <button
                        onClick={() => {
                          if (card.definition?.type === 'material' || card.definition?.type === 'buff') {
                            onActivateCard(card.id);
                          } else {
                            onRouteCardToElder(card.id);
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

function getStatusText(status: MultiplayerStatus, playerCount: number, lastMove: MovementResult | null): string {
  if (status === 'online') return `Online - ${playerCount} player${playerCount === 1 ? '' : 's'}`;
  if (status === 'connecting') return 'Connecting';
  return lastMove?.blocked ? `Offline local - blocked by ${formatBlockedBy(lastMove.blockedBy)}` : 'Offline local';
}

function getCardRows(saveState: MonsterRpgSaveState): Array<{ id: string; definition: CardDefinition | undefined; quantity: number }> {
  return Object.entries(saveState.inventory.cards)
    .map(([id, stack]) => ({
      id,
      definition: getCardDefinition(id),
      quantity: stack.quantity
    }))
    .filter((card) => card.quantity > 0)
    .sort((a, b) => {
      const aType = a.definition?.type ?? 'zzz';
      const bType = b.definition?.type ?? 'zzz';
      return aType.localeCompare(bType) || a.id.localeCompare(b.id);
    });
}

function getCardAction(card: { definition: CardDefinition | undefined }): string | null {
  if (!card.definition) return null;
  if (card.definition.type === 'material' || card.definition.type === 'buff') return 'Activate';
  if (card.definition.type === 'creature' || card.definition.type === 'farm') return 'Use Elder';
  return null;
}

function formatBlockedBy(blockedBy: MovementResult['blockedBy']): string {
  if (!blockedBy) return 'obstacle';
  if (blockedBy === 'bounds') return 'edge';
  if (blockedBy === 'onboarding') return 'Village Elder';
  return blockedBy.replace(/([A-Z])/g, ' $1').toLowerCase();
}
