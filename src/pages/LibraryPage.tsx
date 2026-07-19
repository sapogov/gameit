import { useMemo, useState } from 'react';
import { GameTile } from '../components/GameTile';
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

export function LibraryPage({ games }: LibraryPageProps) {
  const [query, setQuery] = useState(defaultLibraryFilters.query);
  const [genre, setGenre] = useState<LibraryGenreFilter>(defaultLibraryFilters.genre);
  const [status, setStatus] = useState<LibraryStatusFilter>(defaultLibraryFilters.status);

  const genres = useMemo(() => getLibraryGenres(games), [games]);
  const filteredGames = useMemo(
    () => filterLibraryGames(games, { genre, query, status }),
    [games, genre, query, status],
  );
  const playableCount = filteredGames.filter((game) => game.status === 'playable').length;

  return (
    <main className="portal-main library-page">
      <section className="portal-page-hero library-header">
        <div>
          <p className="section-kicker">Library</p>
          <h1>All games</h1>
          <p>Every registered GameIt title, from live releases to the next arcade arrivals.</p>
        </div>
        <dl className="library-counts" aria-label="Library result counts">
          <div>
            <dt>{filteredGames.length}</dt>
            <dd>Shown</dd>
          </div>
          <div>
            <dt>{playableCount}</dt>
            <dd>Playable</dd>
          </div>
        </dl>
      </section>

      <section className="portal-filter-panel library-filters" aria-label="Library filters">
        <label htmlFor="library-search" className="library-search-field">
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
          <GameTile key={game.id} game={game} />
        ))}
        {filteredGames.length === 0 && (
          <div className="portal-empty-state library-empty">
            <h2>No games found</h2>
            <p>Adjust search or filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}
