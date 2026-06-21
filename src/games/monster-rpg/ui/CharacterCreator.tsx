import { FormEvent, useState } from 'react';
import type { AvatarId } from '../sim';

interface CharacterCreatorProps {
  onCreate: (name: string, avatar: AvatarId) => void;
}

const avatarOptions: Array<{ id: AvatarId; label: string; description: string; gear: string }> = [
  { id: 'scout', label: 'Scout', description: 'Bright village runner', gear: 'gold jacket' },
  { id: 'ranger', label: 'Ranger', description: 'Trail-wise explorer', gear: 'green cloak' },
  { id: 'keeper', label: 'Keeper', description: 'Calm creature friend', gear: 'rose coat' }
];

export function CharacterCreator({ onCreate }: CharacterCreatorProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('scout');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate(trimmedName, avatar);
  };

  return (
    <main className="monster-creator-shell">
      <form className="monster-creator-panel" onSubmit={handleSubmit}>
        <p className="monster-kicker">GameIt Monsters</p>
        <h1>Create your villager</h1>
        <label className="monster-field">
          <span>Name</span>
          <input
            autoFocus
            maxLength={18}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mika"
            required
            value={name}
          />
        </label>

        <div className="monster-avatar-grid" role="radiogroup" aria-label="Choose avatar">
          {avatarOptions.map((option) => (
            <button
              aria-checked={avatar === option.id}
              className={`monster-avatar-option avatar-${option.id}${avatar === option.id ? ' selected' : ''}`}
              key={option.id}
              onClick={() => setAvatar(option.id)}
              role="radio"
              type="button"
            >
              <span className="monster-avatar-sprite" aria-hidden="true">
                <span className="monster-avatar-head" />
                <span className="monster-avatar-body" />
                <span className="monster-avatar-feet" />
              </span>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
              <small>{option.gear}</small>
            </button>
          ))}
        </div>

        <button className="monster-primary-action" type="submit">
          Enter Village
        </button>
      </form>
    </main>
  );
}
