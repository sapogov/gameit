import { Link } from 'react-router-dom';
import { GameDefinition } from '../types/game';

export const GameTile = ({ game }: { game: GameDefinition }) => (
  <Link to={game.route} className="game-tile" style={{ borderColor: game.accent }}>
    <div className="badge">{game.status === 'playable' ? 'Play now' : 'Coming soon'}</div>
    <h3>{game.name}</h3>
    <p>{game.description}</p>
  </Link>
);
