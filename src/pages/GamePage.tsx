import { lazy, Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Game } from '../types';

const MonsterRpgGame = lazy(() =>
  import('../games/monster-rpg/MonsterRpgGame').then((module) => ({ default: module.MonsterRpgGame }))
);

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

  if (game.id === 'gameit-monsters') {
    return (
      <Suspense
        fallback={
          <main className="page">
            <h2>Loading GameIt Monsters</h2>
          </main>
        }
      >
        <MonsterRpgGame />
      </Suspense>
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
