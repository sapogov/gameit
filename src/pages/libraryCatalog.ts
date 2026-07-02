import type { GameDefinition, GameGenre, GameStatus } from '../types/game';

export type LibraryStatusFilter = GameStatus | 'all';
export type LibraryGenreFilter = GameGenre | 'all';

export interface LibraryFilters {
  genre: LibraryGenreFilter;
  query: string;
  status: LibraryStatusFilter;
}

export const defaultLibraryFilters: LibraryFilters = {
  genre: 'all',
  query: '',
  status: 'all',
};

export function getLibraryGenres(games: readonly GameDefinition[]): GameGenre[] {
  return Array.from(new Set(games.map((game) => game.genre))).sort();
}

export function formatLibraryLabel(value: string): string {
  return value
    .split('-')
    .map((part) => (part === 'rpg' ? 'RPG' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

export function filterLibraryGames(
  games: readonly GameDefinition[],
  filters: LibraryFilters,
): GameDefinition[] {
  const query = filters.query.trim().toLowerCase();

  return games.filter((game) => {
    const matchesQuery =
      query.length === 0 ||
      game.name.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query);
    const matchesGenre = filters.genre === 'all' || game.genre === filters.genre;
    const matchesStatus = filters.status === 'all' || game.status === filters.status;

    return matchesQuery && matchesGenre && matchesStatus;
  });
}
