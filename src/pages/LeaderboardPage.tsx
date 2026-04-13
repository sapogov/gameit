import { useMemo, useState } from 'react';
import { getLeaderboardEntries } from '../repositories/localStorageRepository';
import type { Game, LeaderboardRange } from '../types';

const ranges: { value: LeaderboardRange; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'all', label: 'All time' }
];

function getRandomGame(games: Game[]): Game {
  return games[Math.floor(Math.random() * games.length)];
}

export function LeaderboardPage({ games }: { games: Game[] }) {
  const [selectedGame, setSelectedGame] = useState<Game>(() => getRandomGame(games));
  const [range, setRange] = useState<LeaderboardRange>('day');

  const entries = useMemo(() => getLeaderboardEntries(selectedGame.id, range), [selectedGame, range]);

  return (
    <main className="page">
      <h2>Leaderboard</h2>
      <div className="tabs">
        {games.map((game) => (
          <button
            key={game.id}
            className={selectedGame.id === game.id ? 'active' : ''}
            onClick={() => setSelectedGame(game)}
          >
            {game.title}
          </button>
        ))}
      </div>
      <div className="tabs sub">
        {ranges.map((option) => (
          <button key={option.value} className={range === option.value ? 'active' : ''} onClick={() => setRange(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Skin</th>
            <th>Mode</th>
            <th>Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.playerName}</td>
              <td>{entry.skin}</td>
              <td>{entry.mode}</td>
              <td>{entry.score}</td>
              <td>{new Date(entry.date).toLocaleDateString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
