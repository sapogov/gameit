import { FormEvent, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { gameRegistry } from '../config/games';
import { getPortalImageAsset, portalCoverAssetKeys } from '../config/portalAssets';
import {
  loadRegistryOverride,
  mergeRegistryOverride,
  registryGenres,
  registryStatuses,
  resetRegistryOverride,
  saveRegistryOverride,
  type RegistryOverride,
  type RegistryOverrideEntry,
} from '../config/registryOverride';
import { defaultSnakeConfig, snakeConfigSchema, type SnakeConfig } from '../games/snake/config';
import { loadSnakeConfig, resetSnakeConfig, saveSnakeConfig } from '../games/snake/storage';
import type { GameId } from '../types/game';

const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSCODE || 'dev-admin';

interface AdminPageProps {
  onRegistryChange: () => void;
}

export const AdminPage = ({ onRegistryChange }: AdminPageProps) => {
  const [granted, setGranted] = useState(false);
  const [code, setCode] = useState('');
  const [config, setConfig] = useState<SnakeConfig>(loadSnakeConfig());
  const [registryOverride, setRegistryOverride] = useState<RegistryOverride>(loadRegistryOverride());
  const [registryMessage, setRegistryMessage] = useState('');
  const registryGames = useMemo(() => mergeRegistryOverride(gameRegistry, registryOverride), [registryOverride]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) setGranted(true);
    else alert('Invalid passcode.');
  };

  if (!granted) {
    return (
      <main className="page panel">
        <h2>Admin Access</h2>
        <p>Dev-only passcode gate. Not secure for production.</p>
        <form onSubmit={submit} className="row">
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Passcode" />
          <button className="pixel-btn" type="submit">Unlock</button>
        </form>
      </main>
    );
  }

  const update = <K extends keyof SnakeConfig>(key: K, value: SnakeConfig[K]) => setConfig({ ...config, [key]: value });
  const updateRegistry = <K extends keyof RegistryOverrideEntry>(
    gameId: GameId,
    key: K,
    value: RegistryOverrideEntry[K],
  ) => {
    setRegistryOverride((current) => ({
      ...current,
      [gameId]: {
        ...current[gameId],
        [key]: value,
      },
    }));
  };
  const resetRegistryGame = (gameId: GameId) => {
    setRegistryOverride((current) => {
      const next = { ...current };
      delete next[gameId];
      return next;
    });
  };

  return (
    <main className="page panel">
      <h2>Admin Control Center</h2>
      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <p className="section-kicker">Registry Override</p>
            <h3>Game display metadata</h3>
          </div>
          <div className="row wrap">
            <button className="pixel-btn" onClick={() => {
              saveRegistryOverride(registryOverride);
              setRegistryOverride(loadRegistryOverride());
              onRegistryChange();
              setRegistryMessage('Registry override saved');
            }}>Save registry</button>
            <button className="pixel-btn secondary" onClick={() => {
              resetRegistryOverride();
              setRegistryOverride({});
              onRegistryChange();
              setRegistryMessage('Registry override reset');
            }}>Reset registry</button>
          </div>
        </div>
        {registryMessage && <p className="admin-message" role="status">{registryMessage}</p>}
        <div className="admin-registry-list">
          {registryGames.map((game) => {
            const cover = getPortalImageAsset(game.assets.cover, 'cover');
            return (
              <article
                className="admin-registry-card"
                key={game.id}
                style={{ borderColor: game.accent, '--game-accent': game.accent } as CSSProperties}
              >
                <div className="admin-code-row">
                  <label>
                    <span>Game ID</span>
                    <code>{game.id}</code>
                  </label>
                  <label>
                    <span>Route</span>
                    <code>{game.route}</code>
                  </label>
                </div>
                <div className="admin-registry-fields">
                  <label>Name<input value={game.name} onChange={(e) => updateRegistry(game.id, 'name', e.target.value)} /></label>
                  <label>Description<textarea value={game.description} onChange={(e) => updateRegistry(game.id, 'description', e.target.value)} /></label>
                  <label>Genre<select value={game.genre} onChange={(e) => updateRegistry(game.id, 'genre', e.target.value as RegistryOverrideEntry['genre'])}>
                    {registryGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
                  </select></label>
                  <label>Status<select value={game.status} onChange={(e) => updateRegistry(game.id, 'status', e.target.value as RegistryOverrideEntry['status'])}>
                    {registryStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select></label>
                  <label>Accent<input type="color" value={game.accent} onChange={(e) => updateRegistry(game.id, 'accent', e.target.value)} /></label>
                  <label>Cover asset<select value={game.assets.cover} onChange={(e) => updateRegistry(game.id, 'coverAssetKey', e.target.value as RegistryOverrideEntry['coverAssetKey'])}>
                    {portalCoverAssetKeys.map((key) => <option key={key} value={key}>{key}</option>)}
                  </select></label>
                  <label className="admin-check"><input type="checkbox" checked={game.featured} onChange={(e) => updateRegistry(game.id, 'featured', e.target.checked)} /> Featured</label>
                </div>
                <div className="admin-cover-preview">
                  <img src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} />
                  <button className="ghost-btn" onClick={() => resetRegistryGame(game.id)}>Reset game</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <p className="section-kicker">Snake</p>
        <h3>Snake settings</h3>
      <div className="admin-grid">
        <label>Board cols<input type="number" value={config.boardCols} onChange={(e) => update('boardCols', Number(e.target.value))} /></label>
        <label>Board rows<input type="number" value={config.boardRows} onChange={(e) => update('boardRows', Number(e.target.value))} /></label>
        <label>Initial speed (ms)<input type="number" value={config.initialSpeedMs} onChange={(e) => update('initialSpeedMs', Number(e.target.value))} /></label>
        <label>Speed ramp<input type="number" value={config.speedRampMs} onChange={(e) => update('speedRampMs', Number(e.target.value))} /></label>
        <label>Target food/room<input type="number" value={config.roomTargetFoods} onChange={(e) => update('roomTargetFoods', Number(e.target.value))} /></label>
        <label>Obstacle density<input step="0.01" type="number" value={config.obstacleDensity} onChange={(e) => update('obstacleDensity', Number(e.target.value))} /></label>
        <label>Endless intensity<input step="0.01" type="number" value={config.endlessObstacleIntensity} onChange={(e) => update('endlessObstacleIntensity', Number(e.target.value))} /></label>
        <label>Spawn distance<input type="number" value={config.maxFoodSpawnScreenDistance} onChange={(e) => update('maxFoodSpawnScreenDistance', Number(e.target.value))} /></label>
        <label>Points per food<input type="number" value={config.pointsPerFood} onChange={(e) => update('pointsPerFood', Number(e.target.value))} /></label>
        <label>Lives<input type="number" value={config.lives} onChange={(e) => update('lives', Number(e.target.value))} /></label>
      </div>
      <div className="row">
        <button className="pixel-btn" onClick={() => {
          const parsed = snakeConfigSchema.safeParse(config);
          if (!parsed.success) return alert(parsed.error.issues[0].message);
          saveSnakeConfig(parsed.data);
          alert('Saved');
        }}>Save</button>
        <button className="pixel-btn secondary" onClick={() => { resetSnakeConfig(); setConfig(defaultSnakeConfig); }}>Reset defaults</button>
      </div>
      </section>
    </main>
  );
};
