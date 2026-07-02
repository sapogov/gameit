import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { getPortalImageAsset } from '../config/portalAssets';
import type { GameDefinition } from '../types/game';

export const GameTile = ({ game, featured = false }: { game: GameDefinition; featured?: boolean }) => {
  const cover = getPortalImageAsset(game.assets.cover, 'cover');

  return (
    <Link
      to={game.route}
      className={`game-tile ${featured ? 'game-tile-featured' : ''}`}
      style={{ borderColor: game.accent, '--game-accent': game.accent } as CSSProperties}
      aria-label={`${game.status === 'playable' ? 'Play' : 'Preview'} ${game.name}. ${game.description}`}
    >
      <img className="game-tile-cover" src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} />
      <div className="badge-row">
        <span className="badge">{game.status === 'playable' ? 'New Release' : 'Signal Locked'}</span>
        <span className="badge">{game.genre}</span>
      </div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <span className={`pixel-btn ${game.status === 'playable' ? '' : 'secondary'}`} aria-hidden="true">
        {game.status === 'playable' ? 'Play Now' : 'Coming Soon'}
      </span>
    </Link>
  );
};
