import { Link, useParams } from 'react-router-dom';
import { gameRegistry } from '../../config/games';
import { getPortalImageAsset } from '../../config/portalAssets';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M15 18 9 12l6-6" />
  </svg>
);

export const ComingSoonGamePage = () => {
  const params = useParams();
  const game = gameRegistry.find((item) => item.id === params.gameId);
  const fallbackName = params.gameId?.replace(/-/g, ' ') ?? 'This game';
  const hero = getPortalImageAsset(game?.assets.hero, 'hero');

  return (
    <main className="page coming-soon-page">
      <Link className="ghost-btn coming-soon-back" to="/">
        <BackIcon />
        <span>Portal</span>
      </Link>

      <section className="coming-soon-hero" aria-labelledby="coming-soon-title">
        <img src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} />
        <div className="coming-soon-copy">
          <p className="section-kicker">In The Portal Queue</p>
          <h1 id="coming-soon-title">{game?.name ?? fallbackName} is coming soon</h1>
          <p>{game?.description ?? 'This game already has a route and asset slot reserved for its full module.'}</p>
          <Link className="pixel-btn" to="/library">Browse Library</Link>
        </div>
      </section>
    </main>
  );
};
