import { lazy, Suspense, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { gameRegistry } from '../config/games';
import { GameTile } from '../components/GameTile';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { useTheme } from '../hooks/useTheme';
import { AdminPage } from '../admin/AdminPage';

const SnakeGamePage = lazy(() => import('../games/snake/SnakeGamePage').then((m) => ({ default: m.SnakeGamePage })));
const ComingSoonPage = lazy(() =>
  import('../games/placeholders/ComingSoonGamePage').then((m) => ({ default: m.ComingSoonGamePage })),
);

const Home = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="page">
      <header className="portal-header arcade-panel">
        <div>
          <h1 className="brand-title">🎮 GameIt Portal</h1>
          <p>Arcade games for desktop + mobile.</p>
        </div>
        <div className="row wrap">
          <button className="pixel-btn secondary" onClick={toggleTheme}>Theme: {theme}</button>
          <button className="pixel-btn" onClick={() => setShowLeaderboard(true)}>🏆 Leaderboard</button>
          <Link to="/admin" className="ghost-btn">Admin</Link>
        </div>
      </header>
      <section className="tile-grid">
        {gameRegistry.map((game) => <GameTile key={game.id} game={game} />)}
      </section>
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </main>
  );
};

export const App = () => (
  <Suspense fallback={<main className="page"><p>Loading…</p></main>}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/games/snake" element={<SnakeGamePage />} />
      <Route path="/games/:gameId" element={<ComingSoonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
