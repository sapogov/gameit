import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Theme } from '../types';

interface LayoutProps {
  children: ReactNode;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Layout({ children, theme, onToggleTheme }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <Link to="/" className="brand">
          GameIt
        </Link>
        <nav className="actions">
          <button aria-label="Toggle theme" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button aria-label="Leaderboard" onClick={() => navigate('/leaderboard')} title="Leaderboard">
            🏆
          </button>
          <button aria-label="Admin panel" onClick={() => navigate('/admin')} title="Admin panel">
            ⚙️
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
