import { Link } from 'react-router-dom';
import { getPortalImageAsset } from '../config/portalAssets';
import type { GameDefinition } from '../types/game';

export const GameTile = ({ game }: { game: GameDefinition }) => {
  const cover = getPortalImageAsset(game.assets.cover, 'cover');

  return (
    <Link to={game.route} className="game-tile" style={{ borderColor: game.accent }}>
      <img className="game-tile-cover" src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} />
      <div className="badge-row">
        <span className="badge">{game.status === 'playable' ? 'Play now' : 'Coming soon'}</span>
        <span className="badge">{game.genre}</span>
      </div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <span className={`pixel-btn ${game.status === 'playable' ? '' : 'secondary'}`}>{game.status === 'playable' ? 'Enter' : 'Soon'}</span>
    </Link>
  );
};
