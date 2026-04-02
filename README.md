# GameIt Portal MVP

Browser-based arcade portal MVP built with **React + TypeScript + Vite** and designed for static hosting.

## Features
- Responsive portal with light/dark mode toggle.
- Game registry with playable Snake + placeholders (Flappy Bird, Stickman Fight).
- Global leaderboard modal with per-game and daily/weekly/all-time tabs.
- Snake MVP with:
  - start flow (name, skin, mode)
  - classic, room, and endless modes
  - powerups (heart, berry, leaf, magnet, coin)
  - pause/resume, restart, game-over, level-complete
  - local profile persistence and in-game leaderboard
- Admin route (`/admin`) with passcode gate for Snake config.
- LocalStorage config + leaderboard providers with future remote provider stub.
- GitHub Pages workflow + Vite base path toggle.

## Local Run
```bash
npm install
npm run dev
```

## Build / Preview
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
1. Push to `main`.
2. Enable **Pages** in repo settings and set source to **GitHub Actions**.
3. Workflow `.github/workflows/deploy-pages.yml` builds with `GITHUB_PAGES=true`.

> Update `vite.config.ts` repo base (`/gameit/`) if your repository name differs.

## Admin Access (MVP)
- Route: `/admin`
- Passcode uses `VITE_ADMIN_PASSCODE` or falls back to `dev-admin`.
- This gate is intentionally lightweight and **not secure production auth**.

## Architecture Overview
- `src/app`: routing + shell
- `src/config`: game registry
- `src/providers`: leaderboard provider abstraction
- `src/games/snake`: snake engine/config/UI
- `src/admin`: admin settings UI
- `src/games/placeholders`: future game placeholders

The Snake engine isolates deterministic updates, item rules, and collision logic from React UI.

## Adding a New Game
1. Add entry in `src/config/games.ts`.
2. Add route and lazy module in `src/app/App.tsx`.
3. Implement game module under `src/games/<game-name>`.
4. Use leaderboard provider interface for score persistence.

## Known Limitations
- Snake rendering currently targets fixed 24x24 draw space.
- Endless mode currently wraps world and provides directional text indicator (not minimap arrow sprite).
- Some advanced admin knobs are available in config schema but not all are exposed in the first UI form.
- No backend auth or remote persistence in MVP.

## Future Improvements
- PWA offline caching.
- Seeded RNG mode for deterministic tests.
- More exhaustive engine tests and replay harness.
- Full admin controls for every nested spawn/powerup parameter.
- Remote leaderboard provider (Supabase/Firebase/API).
