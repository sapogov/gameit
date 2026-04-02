import { useState } from 'react';
import { gameRegistry } from '../config/games';
import { LocalStorageLeaderboardProvider } from '../providers/leaderboardProvider';
import { GameId, LeaderboardRange } from '../types/game';

const provider = new LocalStorageLeaderboardProvider();

export const LeaderboardModal = ({ onClose }: { onClose: () => void }) => {
  const [gameId, setGameId] = useState<GameId>('snake');
  const [range, setRange] = useState<LeaderboardRange>('all-time');
  const rows = provider.listByGame(gameId, range);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal panel">
        <header className="row">
          <h2>Leaderboards</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <div className="row wrap">
          {gameRegistry.map((game) => (
            <button key={game.id} className={gameId === game.id ? 'active' : ''} onClick={() => setGameId(game.id)}>{game.name}</button>
          ))}
        </div>
        <div className="row wrap">
          {(['daily', 'weekly', 'all-time'] as LeaderboardRange[]).map((r) => (
            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p>No scores in this range.</p>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Player</th><th>Skin</th><th>Mode</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.createdAt}-${i}`}>
                  <td>{i + 1}</td><td>{row.playerName}</td><td>{row.skin}</td><td>{row.mode}</td><td>{row.score}</td><td>{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
