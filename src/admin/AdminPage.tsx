import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultSnakeConfig, snakeConfigSchema, SnakeConfig } from '../games/snake/config';
import { loadSnakeConfig, resetSnakeConfig, saveSnakeConfig } from '../games/snake/storage';

const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSCODE || 'dev-admin';

export const AdminPage = () => {
  const navigate = useNavigate();
  const [granted, setGranted] = useState(false);
  const [code, setCode] = useState('');
  const [config, setConfig] = useState<SnakeConfig>(loadSnakeConfig());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) setGranted(true);
    else alert('Invalid passcode.');
  };

  if (!granted) {
    return (
      <main className="page panel">
        <button className="ghost-btn" onClick={() => navigate('/')}>← Portal</button>
        <h2>Admin Access</h2>
        <p>Dev-only passcode gate. Not secure for production.</p>
        <form onSubmit={submit} className="row">
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Passcode" />
          <button type="submit">Unlock</button>
        </form>
      </main>
    );
  }

  const update = <K extends keyof SnakeConfig>(key: K, value: SnakeConfig[K]) => setConfig({ ...config, [key]: value });

  return (
    <main className="page panel">
      <button className="ghost-btn" onClick={() => navigate('/')}>← Portal</button>
      <h2>Admin: Snake Settings</h2>
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
        <button onClick={() => {
          const parsed = snakeConfigSchema.safeParse(config);
          if (!parsed.success) return alert(parsed.error.issues[0].message);
          saveSnakeConfig(parsed.data);
          alert('Saved');
        }}>Save</button>
        <button onClick={() => { resetSnakeConfig(); setConfig(defaultSnakeConfig); }}>Reset defaults</button>
      </div>
    </main>
  );
};
