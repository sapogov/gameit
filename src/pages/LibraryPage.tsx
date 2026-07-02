import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getPortalImageAsset } from '../config/portalAssets';
import type { GameDefinition } from '../types/game';
import {
  defaultLibraryFilters,
  filterLibraryGames,
  formatLibraryLabel,
  getLibraryGenres,
  type LibraryGenreFilter,
  type LibraryStatusFilter,
} from './libraryCatalog';

const statusOptions: LibraryStatusFilter[] = ['all', 'playable', 'coming-soon'];

interface LibraryPageProps {
  games: GameDefinition[];
}

function LibraryGameCard({ game }: { game: GameDefinition }) {
  const cover = getPortalImageAsset(game.assets.cover, 'cover');
  const isPlayable = game.status === 'playable';

  return (
    <article
      className={`library-card ${isPlayable ? 'library-card-playable' : 'library-card-coming-soon'}`}
      style={{ borderColor: game.accent, '--game-accent': game.accent } as CSSProperties}
    >
      <img className="library-card-cover" src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} />
      <div className="library-card-body">
        <div className="badge-row">
          <span className="badge">{formatLibraryLabel(game.genre)}</span>
          <span className={`badge status-badge ${isPlayable ? 'status-badge-live' : 'status-badge-soon'}`}>
            {isPlayable ? 'Playable' : 'Coming soon'}
          </span>
        </div>
        <h2>{game.name}</h2>
        <p>{game.description}</p>
        {isPlayable ? (
          <Link to={game.route} className="pixel-btn library-launch">
            Launch
          </Link>
        ) : (
          <span className="pixel-btn secondary library-launch disabled" aria-disabled="true" title="This game is in the portal queue.">
            Coming soon
          </span>
        )}
      </div>
    </article>
  );
}

export function LibraryPage({ games }: LibraryPageProps) {
  const [query, setQuery] = useState(defaultLibraryFilters.query);
  const [genre, setGenre] = useState<LibraryGenreFilter>(defaultLibraryFilters.genre);
  const [status, setStatus] = useState<LibraryStatusFilter>(defaultLibraryFilters.status);

  const genres = useMemo(() => getLibraryGenres(games), [games]);
  const filteredGames = useMemo(
    () => filterLibraryGames(games, { genre, query, status }),
    [games, genre, query, status],
  );

  return (
    <main className="page library-page">
      <section className="arcade-panel library-header">
        <div>
          <p className="section-kicker">Library</p>
          <h1>Game catalog</h1>
          <p>Browse every registered GameIt title.</p>
        </div>
      </section>

      <section className="arcade-panel library-filters" aria-label="Library filters">
        <label htmlFor="library-search">
          <span>Search</span>
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games"
          />
        </label>
        <label htmlFor="library-genre">
          <span>Genre</span>
          <select id="library-genre" value={genre} onChange={(event) => setGenre(event.target.value as LibraryGenreFilter)}>
            <option value="all">All genres</option>
            {genres.map((item) => (
              <option key={item} value={item}>
                {formatLibraryLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="library-status">
          <span>Status</span>
          <select id="library-status" value={status} onChange={(event) => setStatus(event.target.value as LibraryStatusFilter)}>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All statuses' : formatLibraryLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="library-results" aria-label="Library games">
        {filteredGames.map((game) => (
          <LibraryGameCard key={game.id} game={game} />
        ))}
        {filteredGames.length === 0 && (
          <div className="arcade-panel library-empty">
            <h2>No games found</h2>
            <p>Adjust search or filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}
