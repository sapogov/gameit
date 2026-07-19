import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { gameRegistry } from '../config/games';
import { getPortalImageAsset } from '../config/portalAssets';
import { LocalStorageLeaderboardProvider, type LeaderboardProvider } from '../providers/leaderboardProvider';
import { type GameDefinition, type GameId, type LeaderboardRange } from '../types/game';

const ranges: readonly { value: LeaderboardRange; label: string }[] = [
  { value: 'daily', label: 'Day' },
  { value: 'weekly', label: 'Week' },
  { value: 'all-time', label: 'All time' },
];

const defaultProvider = new LocalStorageLeaderboardProvider();

export interface LeaderboardRowVm {
  rank: number;
  playerName: string;
  skin: string;
  mode: string;
  score: number;
  dateLabel: string;
}

export interface LeaderboardPageViewModel {
  gameName: string;
  rangeLabel: string;
  rows: LeaderboardRowVm[];
  isEmpty: boolean;
  emptyStateMessage: string;
}

const getRangeLabel = (range: LeaderboardRange): string =>
  ranges.find((option) => option.value === range)?.label ?? 'All time';

const dateLabel = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const buildLeaderboardViewModel = ({
  provider,
  games,
  selectedGameId,
  selectedRange,
}: {
  provider: LeaderboardProvider;
  games: readonly GameDefinition[];
  selectedGameId: GameId;
  selectedRange: LeaderboardRange;
}): LeaderboardPageViewModel => {
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? games[0];
  if (!selectedGame) {
    const rangeText = getRangeLabel(selectedRange);
    return {
      gameName: 'Unknown game',
      rangeLabel: rangeText,
      rows: [],
      isEmpty: true,
      emptyStateMessage: `No ${rangeText} scores for Unknown game yet.`,
    };
  }
  const rows = provider
    .listByGame(selectedGame.id, selectedRange)
    .map((entry, index) => ({
      rank: index + 1,
      playerName: entry.playerName,
      skin: entry.skin,
      mode: entry.mode,
      score: entry.score,
      dateLabel: dateLabel(entry.createdAt),
    }));
  const selectedGameName = selectedGame?.name ?? 'Unknown game';
  const rangeText = getRangeLabel(selectedRange);
  const emptyStateMessage = rows.length === 0 ? `No ${rangeText} scores for ${selectedGameName} yet.` : '';

  return { gameName: selectedGameName, rangeLabel: rangeText, rows, isEmpty: rows.length === 0, emptyStateMessage };
};

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className="leaderboard-icon">
    <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 11v5M9 20h6M10 16h4" />
  </svg>
);

export const LeaderboardPage = ({
  provider = defaultProvider,
  games = gameRegistry,
}: {
  provider?: LeaderboardProvider;
  games?: GameDefinition[];
}) => {
  const registryGames = games?.length ? games : gameRegistry;
  const firstGame = registryGames[0]?.id ?? 'snake';
  const [selectedGameId, setSelectedGameId] = useState<GameId>(firstGame);
  const [selectedRange, setSelectedRange] = useState<LeaderboardRange>('all-time');
  useEffect(() => {
    if (!registryGames.some((game) => game.id === selectedGameId)) {
      setSelectedGameId(firstGame);
    }
  }, [firstGame, registryGames, selectedGameId]);
  const viewModel = useMemo(
    () =>
      buildLeaderboardViewModel({
        provider,
        games: registryGames,
        selectedGameId,
        selectedRange,
      }),
    [provider, registryGames, selectedGameId, selectedRange],
  );
  const selectedGame = registryGames.find((game) => game.id === selectedGameId) ?? registryGames[0];
  const selectedCover = selectedGame ? getPortalImageAsset(selectedGame.assets.cover, 'cover') : undefined;

  return (
    <main className="portal-main leaderboard-page">
      <header className="portal-page-hero leaderboard-header">
        <div>
          <p className="section-kicker">Leaderboard</p>
          <h1>
            <TrophyIcon /> Score chase
          </h1>
          <p className="leaderboard-subtitle">Each game has separate rankings for day, week, and all time.</p>
        </div>
        {selectedGame && selectedCover && (
          <div className="leaderboard-feature">
            <img src={selectedCover.src} alt={selectedCover.alt} width={selectedCover.width} height={selectedCover.height} />
            <div>
              <span>Viewing</span>
              <strong>{selectedGame.name}</strong>
            </div>
          </div>
        )}
      </header>

      <section className="leaderboard-controls portal-filter-panel" aria-label="Leaderboard filters">
        <div className="leaderboard-control-group">
          <h2>Choose game</h2>
          <div className="leaderboard-game-grid" role="group" aria-label="Game filter">
            {registryGames.map((game) => (
              <button
                key={game.id}
                type="button"
                className={`leaderboard-game-button ${selectedGameId === game.id ? 'active' : ''}`}
                style={{ '--game-accent': game.accent } as CSSProperties}
                aria-pressed={selectedGameId === game.id}
                onClick={() => setSelectedGameId(game.id)}
              >
                <span>{game.name}</span>
                <small>{game.status === 'playable' ? 'Live' : 'Queued'}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="leaderboard-control-group">
          <h2>Score range</h2>
          <div className="leaderboard-segment" role="group" aria-label="Score range">
            {ranges.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`range-button ${selectedRange === option.value ? 'active' : ''}`}
                aria-pressed={selectedRange === option.value}
                onClick={() => setSelectedRange(option.value)}
              >
                {option.label}
              </button>
              ))}
          </div>
        </div>
      </section>

      <section className="portal-panel leaderboard-summary">
        <p className="leaderboard-summary-label">
          Showing <strong>{viewModel.rangeLabel}</strong> scores for <strong>{viewModel.gameName}</strong>
        </p>

        {viewModel.isEmpty ? (
          <p className="leaderboard-empty" role="status">
            {viewModel.emptyStateMessage}
          </p>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col">Skin</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Score</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.rows.map((row) => (
                  <tr key={`${row.playerName}-${row.score}-${row.rank}-${row.dateLabel}`}>
                    <td>{row.rank}</td>
                    <td>{row.playerName}</td>
                    <td>{row.skin}</td>
                    <td>{row.mode}</td>
                    <td>{row.score}</td>
                    <td>{row.dateLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};
