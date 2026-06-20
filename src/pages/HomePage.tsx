import { GameCard } from '../components/GameCard';
import type { Game } from '../types';

export function HomePage({ games }: { games: Game[] }) {
  return (
    <main>
      <section className="hero">
        <h1>GameIt</h1>
        <p>Your compact browser gaming portal. Pick a game and launch instantly.</p>
      </section>
      <section className="grid">
        {games.filter((item) => item.enabled).map((game) => (
          <GameCard key={game.id} game={game} to={game.route} />
        ))}
      </section>
    </main>
  );
}
