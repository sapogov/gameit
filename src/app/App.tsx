import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { gameRegistry } from '../config/games';
import { GameTile } from '../components/GameTile';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { useTheme } from '../hooks/useTheme';
import { AdminPage } from '../admin/AdminPage';
import { PortalLogo } from '../components/PortalLogo';
import { IconCircleButton } from '../components/IconCircleButton';

const SnakeGamePage = lazy(() => import('../games/snake/SnakeGamePage').then((m) => ({ default: m.SnakeGamePage })));
const ComingSoonPage = lazy(() =>
  import('../games/placeholders/ComingSoonGamePage').then((m) => ({ default: m.ComingSoonGamePage })),
);

const Home = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const logoIndex = useMemo(() => Math.floor(Math.random() * 4), []);

  return (
    <main className="page">
      <header className="portal-header arcade-panel header-shell">
        <div className="logo-wrap">
          <PortalLogo index={logoIndex} />
        </div>

        <div className="header-actions" role="toolbar" aria-label="Portal actions">
          <IconCircleButton
            label={theme === 'light' ? 'Light mode enabled' : 'Dark mode enabled'}
            onClick={toggleTheme}
            icon={theme === 'light' ? '☀️' : '🌙'}
          />
          <IconCircleButton label="Open leaderboard" onClick={() => setShowLeaderboard(true)} icon="🏆" />
          <IconCircleButton label="Open admin settings" onClick={() => navigate('/admin')} icon="👑" />
        </div>
      </header>

      <section className="tile-grid">
        {gameRegistry.map((game) => <GameTile key={game.id} game={game} />)}
      </section>

      <div className="quick-links">
        <Link to="/games/snake" className="ghost-btn">Play Snake</Link>
      </div>

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
