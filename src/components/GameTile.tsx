import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { getPortalImageAsset } from '../config/portalAssets';
import type { GameDefinition, GameGenre } from '../types/game';

const genreLabels: Record<GameGenre, string> = {
  arcade: 'Arcade',
  fighting: 'Fighting',
  'monster-rpg': 'Monster RPG',
  platformer: 'Platformer',
};

export const GameTile = ({ game, featured = false }: { game: GameDefinition; featured?: boolean }) => {
  const cover = getPortalImageAsset(game.assets.cover, 'cover');
  const isPlayable = game.status === 'playable';
  const statusLabel = isPlayable ? 'Playable' : 'Coming Soon';
  const actionLabel = isPlayable ? 'Play now' : 'Preview';

  return (
    <Link
      to={game.route}
      className={`game-tile ${featured ? 'game-tile-featured' : ''} ${
        isPlayable ? 'game-tile-playable' : 'game-tile-coming-soon'
      }`}
      style={{ borderColor: game.accent, '--game-accent': game.accent } as CSSProperties}
      aria-label={`${isPlayable ? 'Play' : 'Preview'} ${game.name}. ${game.description}`}
    >
      <div className="game-tile-media">
        <img className="game-tile-cover" src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} />
        <span className={`game-tile-status ${isPlayable ? 'status-badge-live' : 'status-badge-soon'}`}>{statusLabel}</span>
      </div>
      <div className="game-tile-body">
        <div className="badge-row">
          <span className="badge">{genreLabels[game.genre]}</span>
          {featured && <span className="badge">Popular pick</span>}
        </div>
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        <span className={`pixel-btn ${isPlayable ? '' : 'secondary'}`} aria-hidden="true">
          {actionLabel}
        </span>
      </div>
    </Link>
  );
};
