import {
  gen1SpeciesCatalog,
  getJournalSpeciesViewState,
  type CreatureSpeciesRecord,
  type JournalSpeciesViewState,
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
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function GameHud({
  importStatus,
  lastMove,
  mapKind,
  mapName,
  multiplayerStatus,
  playerCount,
  saveState,
  onExport,
  onImport,
  onReset
}: GameHudProps) {
  const status = getStatusText(multiplayerStatus, playerCount, lastMove);
  const locationHint = `${formatMapKind(mapKind)} - ${saveState.position.x}, ${saveState.position.y}`;
  const discoveredCount = Object.values(saveState.journal.species).filter((state) => state === 'discovered').length;
  const silhouetteCount = Object.values(saveState.journal.species).filter((state) => state === 'silhouette').length;

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

function formatBlockedBy(blockedBy: MovementResult['blockedBy']): string {
  if (!blockedBy) return 'obstacle';
  if (blockedBy === 'bounds') return 'edge';
  if (blockedBy === 'onboarding') return 'Village Elder';
  return blockedBy.replace(/([A-Z])/g, ' $1').toLowerCase();
}
