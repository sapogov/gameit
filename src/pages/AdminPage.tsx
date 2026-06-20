import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../types';

interface Props {
  games: Game[];
  onAdd: (game: Omit<Game, 'route'>) => void;
}

export function AdminPage({ games, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const id = title.toLowerCase().trim().replaceAll(/[^a-z0-9]+/g, '-');
    if (!id) return;
    onAdd({
      id,
      title,
      description,
      cover: cover || 'https://images.unsplash.com/photo-1614292253387-6e8eb4ac9f45?auto=format&fit=crop&w=900&q=80',
      modes: ['Arcade', 'Casual'],
      enabled: true
    });
    setTitle('');
    setDescription('');
    setCover('');
  };

  return (
    <main className="page">
      <h2>Admin panel</h2>
      <form className="admin-form" onSubmit={onSubmit}>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Game title" />
        <input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover URL (optional)" />
        <button type="submit">Add game</button>
      </form>
      <section className="grid">
        {games.map((game) => (
          <article className="card" key={game.id}>
            <img src={game.cover} alt={game.title} />
            <div className="card-content">
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <Link to={`/admin/game/${game.id}`} className="play-btn">
                Configure
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
