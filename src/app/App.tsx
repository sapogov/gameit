import { lazy, Suspense, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getFeaturedGame } from '../config/games';
import { getPortalImageAsset } from '../config/portalAssets';
import { loadGameRegistry } from '../config/registryOverride';
import { useTheme } from '../hooks/useTheme';
import { AdminPage } from '../admin/AdminPage';
import { GameTile } from '../components/GameTile';
import { IconCircleButton } from '../components/IconCircleButton';
import { LibraryPage } from '../pages/LibraryPage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import type { GameDefinition } from '../types/game';
import { portalNavigationItems, portalRouteSet } from './portalNavigation';

const SnakeGamePage = lazy(() => import('../games/snake/SnakeGamePage').then((m) => ({ default: m.SnakeGamePage })));
const MonsterRpgGame = lazy(() =>
  import('../games/monster-rpg/MonsterRpgGame').then((m) => ({ default: m.MonsterRpgGame })),
);
const ComingSoonPage = lazy(() =>
  import('../games/placeholders/ComingSoonGamePage').then((m) => ({ default: m.ComingSoonGamePage })),
);

const ThemeIcon = ({ mode }: { mode: 'light' | 'dark' }) => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    {mode === 'light' ? (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </>
    ) : (
      <path d="M20 14.7A7.6 7.6 0 0 1 9.3 4 8.7 8.7 0 1 0 20 14.7Z" />
    )}
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 11v5M9 20h6M10 16h4" />
  </svg>
);

const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M5 4h5a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H5V4Z" />
    <path d="M14 8a4 4 0 0 1 4-4h1v12h-1a4 4 0 0 0-4 4" />
  </svg>
);

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="m3 8 5 4 4-7 4 7 5-4-2 11H5L3 8Z" />
    <path d="M5 19h14" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6.5 10.5V20h11v-9.5" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

const navIcons = {
  '/': <HomeIcon />,
  '/library': <LibraryIcon />,
  '/leaderboard': <TrophyIcon />,
  '/admin': <CrownIcon />,
} as const;

const popularOrder = ['gameit-monsters', 'snake', 'flappy-bird', 'stickman-fight'] as const;

const Home = ({ games }: { games: GameDefinition[] }) => {
  const featuredGame = getFeaturedGame(games);
  const hero = getPortalImageAsset(featuredGame.assets.hero, 'hero');
  const popularGames = useMemo(
    () =>
      popularOrder
        .map((id) => games.find((game) => game.id === id))
        .filter((game): game is GameDefinition => Boolean(game)),
    [games],
  );
  const playableCount = games.filter((game) => game.status === 'playable').length;
  const queuedCount = games.length - playableCount;
  const heroStyle = {
    '--hero-image': `url(${hero.src})`,
    '--hero-accent': featuredGame.accent,
  } as CSSProperties;

  return (
    <main className="portal-main">
      <a className="skip-link" href="#collection">Skip to games</a>
      <section className="portal-hero" aria-labelledby="portal-title" style={heroStyle}>
        <div className="kinetic-hero-copy">
          <p className="section-kicker">Browser game arcade</p>
          <h1 id="portal-title">GameIt</h1>
          <p>Fast games, sharp scores, and a whole arcade waiting in the browser.</p>
          <div className="hero-actions">
            <Link className="portal-primary-action" to={featuredGame.route}>Play featured</Link>
            <Link className="portal-secondary-action" to="/library">Open library</Link>
          </div>
        </div>

        <div className="hero-feature-card" aria-label={`Featured game: ${featuredGame.name}`}>
          <span>Featured now</span>
          <strong>{featuredGame.name}</strong>
          <p>{featuredGame.description}</p>
        </div>

        <dl className="portal-stat-strip" aria-label="Portal stats">
          <div>
            <dt>{games.length}</dt>
            <dd>Total games</dd>
          </div>
          <div>
            <dt>{playableCount}</dt>
            <dd>Playable</dd>
          </div>
          <div>
            <dt>{queuedCount}</dt>
            <dd>In queue</dd>
          </div>
        </dl>
      </section>

      <section className="portal-section portal-popular" id="collection" aria-labelledby="collection-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Most popular</span>
            <h2 id="collection-title">Hot right now</h2>
          </div>
          <Link className="section-link" to="/library">View all games</Link>
        </div>

        <div className="popular-grid">
          {popularGames.map((game, index) => <GameTile key={game.id} game={game} featured={index === 0} />)}
        </div>
      </section>

      <section className="portal-section portal-leaderboard-preview" aria-labelledby="score-preview-title">
        <div className="leaderboard-preview-copy">
          <span className="section-kicker">Daily, weekly, all-time</span>
          <h2 id="score-preview-title">Every game has its own race.</h2>
          <p>Jump from one title to another and check score ranges without leaving the portal.</p>
        </div>
        <Link className="portal-primary-action" to="/leaderboard">Open leaderboard</Link>
      </section>

      <section className="portal-section portal-library-preview" aria-labelledby="library-preview-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Full library</span>
            <h2 id="library-preview-title">Everything in the portal</h2>
          </div>
        </div>
        <div className="mini-library-grid">
          {games.slice(0, 6).map((game) => (
            <Link key={game.id} to={game.route} className="mini-library-tile">
              <span style={{ background: game.accent }} />
              <strong>{game.name}</strong>
              <small>{game.status === 'playable' ? 'Playable' : 'Coming soon'}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

const PortalNav = ({ variant }: { variant: 'desktop' | 'mobile' }) => (
  <nav className={`portal-nav portal-nav-${variant}`} aria-label={variant === 'desktop' ? 'Portal navigation' : 'Mobile portal navigation'}>
    {portalNavigationItems.map((item) => (
      <NavLink
        key={item.route}
        to={item.route}
        end={item.route === '/'}
        className={({ isActive }) => `portal-nav-link${isActive ? ' active' : ''}`}
        aria-label={item.ariaLabel}
      >
        <span className="portal-nav-icon" aria-hidden="true">{navIcons[item.route]}</span>
        <span>{variant === 'mobile' ? item.shortLabel : item.label}</span>
      </NavLink>
    ))}
  </nav>
);

const PortalShell = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page portal-shell">
      <header className="portal-header arcade-panel header-shell">
        <Link to="/" className="portal-brand" aria-label="Go to portal home">GameIt</Link>

        <div className="header-actions">
          <PortalNav variant="desktop" />
          <IconCircleButton
            label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            onClick={toggleTheme}
            icon={<ThemeIcon mode={theme} />}
          />
        </div>
      </header>

      {children}
      <PortalNav variant="mobile" />
    </div>
  );
};

export const App = () => {
  const [games, setGames] = useState(() => loadGameRegistry());
  const { pathname } = useLocation();
  const refreshRegistry = () => setGames(loadGameRegistry());
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const isPortalRoute = portalRouteSet.has(normalizedPathname);
  const routes = (
    <Routes>
      <Route path="/" element={<Home games={games} />} />
      <Route path="/library" element={<LibraryPage games={games} />} />
      <Route path="/leaderboard" element={<LeaderboardPage games={games} />} />
      <Route path="/admin" element={<AdminPage onRegistryChange={refreshRegistry} />} />
      <Route path="/games/snake" element={<SnakeGamePage />} />
      <Route path="/games/gameit-monsters" element={<MonsterRpgGame />} />
      <Route path="/games/:gameId" element={<ComingSoonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <Suspense fallback={<main className="page"><p>Loading...</p></main>}>
      {isPortalRoute ? <PortalShell>{routes}</PortalShell> : routes}
    </Suspense>
  );
};
