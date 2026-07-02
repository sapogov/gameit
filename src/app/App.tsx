import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getFeaturedGame } from '../config/games';
import { getPortalImageAsset } from '../config/portalAssets';
import { loadGameRegistry } from '../config/registryOverride';
import { useTheme } from '../hooks/useTheme';
import { AdminPage } from '../admin/AdminPage';
import { PortalLogo } from '../components/PortalLogo';
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

const LaunchIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M5 19 19 5M9 5h10v10" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const navIcons = {
  '/': <HomeIcon />,
  '/library': <LibraryIcon />,
  '/leaderboard': <TrophyIcon />,
  '/admin': <CrownIcon />,
} as const;

const Home = ({ games }: { games: GameDefinition[] }) => {
  const featuredGame = getFeaturedGame(games);
  const featuredHero = getPortalImageAsset(featuredGame.assets.hero, 'hero');
  const launchGames = games.filter((game) => game.status === 'playable' && game.id !== featuredGame.id);
  const queuedGames = games.filter((game) => game.status !== 'playable').slice(0, 2);

  return (
    <>
      <Link
        to={featuredGame.route}
        className="featured-game launch-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgb(8 10 22 / 84%), rgb(8 10 22 / 18%)), url(${featuredHero.src})` }}
        aria-label={`Launch ${featuredGame.name}`}
      >
        <span className="badge">Featured Launch</span>
        <div className="launch-hero-copy">
          <h1>{featuredGame.name}</h1>
          <p>{featuredGame.description}</p>
        </div>
        <span className="pixel-btn launch-action">
          <span>Play now</span>
          <LaunchIcon />
        </span>
      </Link>

      <section className="launch-dashboard" aria-label="Portal launch dashboard">
        <div className="arcade-panel launch-panel">
          <p className="section-kicker">Ready</p>
          <h2>Jump straight in</h2>
          <div className="quick-launch-list">
            {launchGames.map((game) => (
              <Link key={game.id} to={game.route} className="quick-launch" style={{ borderColor: game.accent }}>
                <span>
                  <strong>{game.name}</strong>
                  <small>{game.description}</small>
                </span>
                <ChevronIcon />
              </Link>
            ))}
          </div>
        </div>

        <aside className="arcade-panel portal-status" aria-label="Portal status">
          <p className="section-kicker">On deck</p>
          <h2>Next arenas</h2>
          <div className="queued-list">
            {queuedGames.map((game) => (
              <span key={game.id} className="queued-game">
                <span>{game.name}</span>
                <small>{game.genre}</small>
              </span>
            ))}
          </div>
        </aside>
      </section>
    </>
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
  const logoIndex = useMemo(() => Math.floor(Math.random() * 4), []);

  return (
    <div className="page portal-shell">
      <header className="portal-header arcade-panel header-shell">
        <div className="logo-wrap">
          <Link to="/" aria-label="Go to portal home">
            <PortalLogo index={logoIndex} />
          </Link>
        </div>

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
