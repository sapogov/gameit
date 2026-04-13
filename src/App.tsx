import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { AdminGameConfigPage } from './pages/AdminGameConfigPage';
import { AdminPage } from './pages/AdminPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { createGame, getGames, saveGame } from './repositories/localStorageRepository';
import type { Game, Theme } from './types';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('gameit.theme');
  return saved === 'light' ? 'light' : 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [games, setGames] = useState<Game[]>(() => getGames());

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('gameit.theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSave = (game: Game) => {
    saveGame(game);
    setGames(getGames());
  };

  const handleAdd = (game: Omit<Game, 'route'>) => {
    createGame(game);
    setGames(getGames());
  };

  return (
    <Layout theme={theme} onToggleTheme={toggleTheme}>
      <Routes>
        <Route path="/" element={<HomePage games={games} />} />
        <Route path="/game/:gameId" element={<GamePage games={games} />} />
        <Route path="/leaderboard" element={<LeaderboardPage games={games} />} />
        <Route path="/admin" element={<AdminPage games={games} onAdd={handleAdd} />} />
        <Route path="/admin/game/:gameId" element={<AdminGameConfigPage games={games} onSave={handleSave} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
