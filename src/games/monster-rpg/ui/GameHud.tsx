import type { MapKind, MonsterRpgSaveState, MovementResult, MultiplayerStatus } from '../sim';

interface GameHudProps {
  lastMove: MovementResult | null;
  mapKind: MapKind;
  mapName: string;
  multiplayerStatus: MultiplayerStatus;
  playerCount: number;
  saveState: MonsterRpgSaveState;
  onReset: () => void;
}

export function GameHud({ lastMove, mapKind, mapName, multiplayerStatus, playerCount, saveState, onReset }: GameHudProps) {
  const status = getStatusText(multiplayerStatus, playerCount, lastMove);
  const locationHint = `${formatMapKind(mapKind)} - ${saveState.position.x}, ${saveState.position.y}`;

  return (
    <div className="monster-hud">
      <section className="monster-hud-panel">
        <p>{mapName}</p>
        <h2>{saveState.profile.name}</h2>
        <span>{status}</span>
        <small>{locationHint}</small>
      </section>
      <button className="monster-reset-button" onClick={onReset} title="Reset local profile" type="button">
        Reset
      </button>
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
