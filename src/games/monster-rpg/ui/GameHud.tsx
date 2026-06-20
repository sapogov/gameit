import type { MapKind, MonsterRpgSaveState, MovementResult, MultiplayerStatus } from '../sim';

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

  return (
    <div className="monster-hud">
      <section className="monster-hud-panel">
        <p>{mapName}</p>
        <h2>{saveState.profile.name}</h2>
        <span>{status}</span>
        <small>{locationHint}</small>
        {importStatus ? <small>{importStatus}</small> : null}
      </section>
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
  return blockedBy.replace(/([A-Z])/g, ' $1').toLowerCase();
}
