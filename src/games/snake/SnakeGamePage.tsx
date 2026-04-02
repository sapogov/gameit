import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalStorageLeaderboardProvider } from '../../providers/leaderboardProvider';
import { SnakeCanvas } from './SnakeCanvas';
import { SnakeEngine } from './engine';
import { loadProfile, loadSnakeConfig, PlayerProfile, saveProfile, SnakeMode } from './storage';

const provider = new LocalStorageLeaderboardProvider();

export const SnakeGamePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile());
  const [error, setError] = useState('');
  const config = useMemo(() => loadSnakeConfig(), []);
  const engineRef = useRef<SnakeEngine | null>(null);
  const [tick, setTick] = useState(0);

  const start = (e: FormEvent) => {
    e.preventDefault();
    if (profile.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    saveProfile(profile);
    engineRef.current = new SnakeEngine(config, profile.mode);
    engineRef.current.start();
    setError('');
    setTick((x) => x + 1);
  };

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (engineRef.current) {
        engineRef.current.tick(now - last);
        setTick((x) => x + 1);
      }
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (e.key === 'ArrowUp') engineRef.current.setDirection('up');
      if (e.key === 'ArrowDown') engineRef.current.setDirection('down');
      if (e.key === 'ArrowLeft') engineRef.current.setDirection('left');
      if (e.key === 'ArrowRight') engineRef.current.setDirection('right');
      if (e.key.toLowerCase() === 'p') engineRef.current.togglePause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const state = engineRef.current?.state;
  const leaderboard = provider.listByGame('snake', 'all-time');

  useEffect(() => {
    if (state?.status !== 'game-over') return;
    provider.addEntry({
      gameId: 'snake',
      playerName: profile.name,
      skin: profile.skin,
      mode: profile.mode,
      score: state.score,
      levelReached: state.level,
      createdAt: new Date().toISOString(),
    });
  }, [state?.status]);

  return (
    <main className="page">
      <div className="top-bar">
        <button className="ghost-btn" onClick={() => navigate('/')}>← Portal</button>
      </div>

      {!state && (
        <form className="panel" onSubmit={start}>
          <h2>Start Snake</h2>
          <label>Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label>Skin
            <select value={profile.skin} onChange={(e) => setProfile({ ...profile, skin: e.target.value })}>
              {config.skins.map((skin) => <option key={skin}>{skin}</option>)}
            </select>
          </label>
          <label>Mode
            <select value={profile.mode} onChange={(e) => setProfile({ ...profile, mode: e.target.value as SnakeMode })}>
              <option value="classic">Classic</option>
              <option value="room">Room mode</option>
              <option value="endless">Endless field</option>
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="pixel-btn" type="submit">Play</button>
        </form>
      )}

      {state && (
        <section className="game-layout">
          <div className="panel">
            <SnakeCanvas snapshot={state} />
            <div className="hud">
              <span>Score: {state.score}</span>
              <span>Lives: {state.lives}</span>
              <span>Level: {state.level}</span>
              <span>Status: {state.status}</span>
              {state.arrowToFood && <span>Food → x:{state.arrowToFood.x} y:{state.arrowToFood.y}</span>}
            </div>
            {(state.status === 'game-over' || state.status === 'level-complete') && (
              <div className="game-state-banner">{state.status === 'game-over' ? 'Game Over' : 'Level Complete'}</div>
            )}
            <div className="controls-row">
              <button className="pixel-btn secondary" onClick={() => engineRef.current?.togglePause()}>Pause/Resume</button>
              {state.status === 'level-complete' && <button className="pixel-btn" onClick={() => engineRef.current?.nextLevel()}>Next Level</button>}
              <button className="pixel-btn secondary" onClick={() => { engineRef.current = null; setTick((x) => x + 1); }}>Restart</button>
            </div>
            <div className="touch-controls" role="group" aria-label="Touch controls">
              <button className="pixel-btn" onClick={() => engineRef.current?.setDirection('up')}>↑</button>
              <button className="pixel-btn" onClick={() => engineRef.current?.setDirection('left')}>←</button>
              <button className="pixel-btn" onClick={() => engineRef.current?.setDirection('down')}>↓</button>
              <button className="pixel-btn" onClick={() => engineRef.current?.setDirection('right')}>→</button>
            </div>
          </div>
          <aside className="panel">
            <h3>Snake Leaderboard</h3>
            {leaderboard.length === 0 && <p>No runs yet.</p>}
            <ol>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <li key={`${entry.createdAt}-${index}`}>{entry.playerName} · {entry.score} · {entry.mode}</li>
              ))}
            </ol>
          </aside>
        </section>
      )}
    </main>
  );
};
