import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Game } from '../types';

interface Props {
  games: Game[];
  onSave: (game: Game) => void;
}

export function AdminGameConfigPage({ games, onSave }: Props) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = useMemo(() => games.find((item) => item.id === gameId), [games, gameId]);
  const [title, setTitle] = useState(game?.title ?? '');
  const [description, setDescription] = useState(game?.description ?? '');
  const [enabled, setEnabled] = useState(game?.enabled ?? false);

  if (!game) {
    return (
      <main className="page">
        <h2>Game not found</h2>
        <Link to="/admin">Back to Admin</Link>
      </main>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ ...game, title, description, enabled });
    navigate('/admin');
  };

  return (
    <main className="page">
      <h2>Configure: {game.title}</h2>
      <form className="admin-form" onSubmit={submit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        <label className="checkbox-row">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled in library
        </label>
        <button type="submit">Save</button>
      </form>
      <Link to="/admin">← Back to Admin</Link>
    </main>
  );
}
