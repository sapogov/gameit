import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { gameRegistry } from '../config/games';
import { GameTile } from './GameTile';

const renderTile = (gameId: string) => {
  const game = gameRegistry.find((candidate) => candidate.id === gameId);
  if (!game) throw new Error(`Missing game fixture: ${gameId}`);

  return renderToStaticMarkup(
    <MemoryRouter>
      <GameTile game={game} />
    </MemoryRouter>,
  );
};

describe('GameTile', () => {
  it('links playable games to their launch route', () => {
    const markup = renderTile('snake');

    expect(markup).toContain('href="/games/snake"');
    expect(markup).toContain('Play now');
  });

  it('renders coming-soon games as non-navigation cards', () => {
    const markup = renderTile('flappy-bird');

    expect(markup).not.toMatch(/<a(?:\s|>)/);
    expect(markup).toContain('<article');
    expect(markup).toContain('Coming soon');
  });
});
