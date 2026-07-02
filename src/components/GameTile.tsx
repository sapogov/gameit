import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { GameDefinition } from '../types/game';

export const GameTile = ({ game, featured = false }: { game: GameDefinition; featured?: boolean }) => (
  <Link
    to={game.route}
    className={`game-tile ${featured ? 'game-tile-featured' : ''}`}
    style={{ '--game-accent': game.accent } as CSSProperties}
    aria-label={`${game.status === 'playable' ? 'Play' : 'Preview'} ${game.name}. ${game.description}`}
  >
    <div className="game-tile-art" aria-hidden>
      <span />
    </div>
    <div className="game-tile-overlay" aria-hidden />
    <div className="game-tile-content">
      <div className="badge">{game.status === 'playable' ? 'New Release' : 'Signal Locked'}</div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <span className={`pixel-btn ${game.status === 'playable' ? '' : 'secondary'}`} aria-hidden="true">
        {game.status === 'playable' ? 'Play Now' : 'Coming Soon'}
      </span>
    </div>
  </Link>
);
