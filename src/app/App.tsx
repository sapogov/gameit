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

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <path d="M7 5v4M12 10v4M17 15v4" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Home = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const playableCount = gameRegistry.filter((game) => game.status === 'playable').length;

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
          <span className="portal-hero-kicker">Browser Games</span>
          <h1 id="portal-title">GameIt</h1>
          <p>Play fast web games, track scores, and jump into new experiments from one lightweight portal.</p>
          <a className="portal-primary-action" href="#collection">Browse Games</a>
        </div>
      </section>

      <section className="portal-collection" id="collection" aria-labelledby="collection-title">
        <div className="collection-heading">
          <div>
            <span className="collection-kicker">Featured Games</span>
            <h2 id="collection-title">Discover Games</h2>
          </div>
          <p className="collection-count">{playableCount} playable now</p>
          <div className="collection-tags" aria-label="Game categories">
            <span>Arcade</span>
            <span>RPG</span>
            <span>Indie</span>
          </div>
        </div>

        <div className="kinetic-grid">
          {gameRegistry.map((game) => <GameTile key={game.id} game={game} />)}
        </div>
      </section>

      <footer className="portal-footer" aria-label="Portal footer">
        <div>
          <h2>GameIt</h2>
          <p>Compact browser games with instant play, local progress, and lightweight multiplayer experiments.</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#portal-top">Home</a>
          <a href="#collection">Games</a>
          <button type="button" onClick={() => setShowLeaderboard(true)}>Leaderboard</button>
          <Link to="/admin">Admin</Link>
        </nav>
      </footer>

      <nav className="mobile-tabbar" aria-label="Mobile portal navigation">
        <a className="is-active" href="#portal-top" aria-current="page">
          <span><HomeIcon /></span>
          Home
        </a>
        <a href="#collection">
          <span><LibraryIcon /></span>
          Library
        </a>
        <button type="button" onClick={() => setShowLeaderboard(true)}>
          <span><LeaderboardIcon /></span>
          Scores
        </button>
        <button type="button" onClick={() => navigate('/admin')}>
          <span><AdminIcon /></span>
          Admin
        </button>
      </nav>

      <button className="portal-fab" type="button" aria-label="Open admin settings" onClick={() => navigate('/admin')}>
        <PlusIcon />
      </button>

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
