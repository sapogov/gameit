import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Game } from '../types';

export function GamePage({ games }: { games: Game[] }) {
  const { gameId } = useParams();
  const game = useMemo(() => games.find((item) => item.id === gameId), [games, gameId]);

  if (!game) {
    return (
      <main className="page">
        <h2>Game not found</h2>
        <Link to="/">Back to Home</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <h2>{game.title}</h2>
      <p>{game.description}</p>
      <div className="mock-game-area">
        <p>This is the game host page.</p>
        <p>Embed your game iframe or canvas here later.</p>
      </div>
      <Link to="/">← Back to Home</Link>
    </main>
  );
}
