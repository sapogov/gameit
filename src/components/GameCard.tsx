import { Link } from 'react-router-dom';
import type { Game } from '../types';

export function GameCard({ game, to }: { game: Game; to: string }) {
  return (
    <article className="card">
      <img src={game.cover} alt={game.title} />
      <div className="card-content">
        <h3>{game.title}</h3>
        <p>{game.description}</p>
        <Link to={to} className="play-btn">
          Open
        </Link>
      </div>
    </article>
  );
}
