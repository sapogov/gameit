import { formatGameLogEntry, gameLogKindLabel, type GameLogState } from './gameLog';

export function GameLogStatus({ gameLog }: { gameLog: GameLogState }) {
  const latestEntry = gameLog.entries.at(-1);

  return (
    <small
      aria-live="polite"
      className="monster-status-message"
      data-kind={latestEntry?.kind ?? 'system'}
      title={latestEntry ? formatGameLogEntry(latestEntry) : 'Ready'}
    >
      {latestEntry ? formatGameLogEntry(latestEntry) : 'Ready'}
    </small>
  );
}

export function GameLogHistory({ gameLog }: { gameLog: GameLogState }) {
  return (
    <details className="monster-game-log" aria-label="Game Log">
      <summary>
        Game Log <span>{gameLog.entries.length}</span>
      </summary>
      <ol>
        {[...gameLog.entries].reverse().map((entry) => (
          <li className={`monster-game-log-${entry.kind}`} data-kind={entry.kind} key={entry.id}>
            <strong>{gameLogKindLabel[entry.kind]}</strong> {entry.message}
          </li>
        ))}
        {gameLog.entries.length === 0 ? <li>Session events appear here.</li> : null}
      </ol>
    </details>
  );
}
