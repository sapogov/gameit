import { lazy, Suspense, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { gameRegistry } from '../config/games';
import { GameTile } from '../components/GameTile';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { useTheme } from '../hooks/useTheme';
import { AdminPage } from '../admin/AdminPage';
import { IconCircleButton } from '../components/IconCircleButton';

const SnakeGamePage = lazy(() => import('../games/snake/SnakeGamePage').then((m) => ({ default: m.SnakeGamePage })));
const MonsterRpgGame = lazy(() =>
  import('../games/monster-rpg/MonsterRpgGame').then((m) => ({ default: m.MonsterRpgGame })),
);
const ComingSoonPage = lazy(() =>
  import('../games/placeholders/ComingSoonGamePage').then((m) => ({ default: m.ComingSoonGamePage })),
);

const ThemeIcon = ({ isLight }: { isLight: boolean }) => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    {isLight ? (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </>
    ) : (
      <path d="M20.2 15.7A8.3 8.3 0 0 1 8.3 3.8 8.7 8.7 0 1 0 20.2 15.7Z" />
    )}
  </svg>
);

const LeaderboardIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    <path d="M8 21h8M12 17v4M7 4h10v4.5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
  </svg>
);

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
    <path d="M9.5 12.2 11.2 14l3.4-4" />
  </svg>
);

const Home = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <main className="portal-shell" id="portal-top">
      <a className="skip-link" href="#collection">Skip to games</a>
      <nav className="portal-nav" aria-label="Portal navigation">
        <Link to="/" className="portal-brand">GameIt</Link>
        <div className="portal-nav-links" aria-label="Portal sections">
          <a href="#portal-top" className="is-active" aria-current="page">Home</a>
          <a href="#collection">Library</a>
          <button type="button" onClick={() => setShowLeaderboard(true)}>Leaderboard</button>
          <Link to="/admin">Admin</Link>
        </div>
        <div className="portal-actions" role="toolbar" aria-label="Portal actions">
          <IconCircleButton
            label={theme === 'light' ? 'Light mode enabled' : 'Dark mode enabled'}
            onClick={toggleTheme}
            icon={<ThemeIcon isLight={theme === 'light'} />}
          />
          <IconCircleButton label="Open leaderboard" onClick={() => setShowLeaderboard(true)} icon={<LeaderboardIcon />} />
          <IconCircleButton label="Open admin settings" onClick={() => navigate('/admin')} icon={<AdminIcon />} />
        </div>
      </nav>

      <section className="portal-hero" aria-labelledby="portal-title">
        <div className="portal-hero-backdrop" aria-hidden />
        <div className="portal-hero-copy">
          <h1 id="portal-title">GameIt</h1>
          <p>Step into the Kinetic Portal. A curated universe of fast browser games built for instant play.</p>
          <a className="portal-primary-action" href="#collection">Explore Vault</a>
        </div>
      </section>

      <section className="portal-collection" id="collection" aria-labelledby="collection-title">
        <div className="collection-heading">
          <div>
            <span className="collection-kicker">Featured Titles</span>
            <h2 id="collection-title">The Kinetic Collection</h2>
          </div>
          <div className="collection-tags" aria-label="Game categories">
            <span>Arcade</span>
            <span>RPG</span>
            <span>Indie</span>
          </div>
        </div>

        <div className="kinetic-grid">
          {gameRegistry.map((game, index) => <GameTile key={game.id} game={game} featured={index === 0} />)}
        </div>
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
      <Route path="/games/gameit-monsters" element={<MonsterRpgGame />} />
      <Route path="/games/:gameId" element={<ComingSoonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
