import type { Game } from '../types';
import { gameRegistry } from '../config/games';
import { getPortalImageSrc } from '../config/portalAssets';

export const defaultGames: Game[] = gameRegistry.map((game) => ({
  id: game.id,
  title: game.name,
  description: game.description,
  cover: getPortalImageSrc(game.assets.cover, 'cover'),
  route: `/game/${game.id}`,
  modes: game.status === 'playable' ? ['Casual', 'Ranked'] : ['Casual'],
  enabled: true,
}));
