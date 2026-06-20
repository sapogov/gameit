# GameIt Portal MVP

Browser-based arcade portal MVP built with **React + TypeScript + Vite** and designed for static hosting.

## Features

- Responsive portal with light/dark mode toggle.
- Game registry with playable Snake, playable GameIt Monsters, and placeholders.
- Global leaderboard modal with per-game and daily/weekly/all-time tabs.
- Snake MVP with start flow, modes, powerups, pause/resume, restart, game-over, level-complete, local profile persistence, and in-game leaderboard.
- GameIt Monsters foundation with original monster-collecting fantasy, Phaser 2D playfield, DOM HUD, local save state, and optional Colyseus multiplayer presence.
- Admin route (`/admin`) with passcode gate for Snake config.
- LocalStorage config + leaderboard providers with future remote provider stub.
- GitHub Pages workflow + Vite base path toggle.

## Local Run

```bash
npm install
npm run dev
```

## Multiplayer Dev

```bash
npm run dev:multiplayer
```

Open `http://127.0.0.1:5173/gameit/games/gameit-monsters` in two browser tabs to test local Colyseus presence and server-authoritative movement. If the Colyseus server is not running, GameIt Monsters falls back to offline local mode.

## Build / Preview

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push to `main`.
2. Enable **Pages** in repo settings and set source to **GitHub Actions**.
3. Workflow `.github/workflows/deploy-pages.yml` builds with `GITHUB_PAGES=true`.

Update `vite.config.ts` repo base (`/gameit/`) if your repository name differs.

## Admin Access (MVP)

- Route: `/admin`
- Passcode uses `VITE_ADMIN_PASSCODE` or falls back to `dev-admin`.
- This gate is intentionally lightweight and **not secure production auth**.

## Architecture Overview

- `src/app`: routing + shell
- `src/config`: game registry
- `src/providers`: leaderboard provider abstraction
- `src/games/snake`: snake engine/config/UI
- `src/games/monster-rpg`: GameIt Monsters simulation, Phaser client, UI, and networking adapter
- `src/admin`: admin settings UI
- `src/games/placeholders`: future game placeholders
- `server`: Colyseus authoritative rooms for GameIt Monsters

The Snake engine isolates deterministic updates, item rules, and collision logic from React UI. GameIt Monsters keeps simulation, rendering, DOM UI, and networking separated so the server can remain authoritative for online play.

## Monster RPG Foundation

GameIt Monsters is an original monster-collecting browser MMO inspired by retro handheld RPGs.

- Phase 0 docs: `docs/monster-rpg/phase-0-foundation.md`
- MVP PRD: `docs/monster-rpg/prd-gameit-monsters-mvp.md`
- Running work summary: `docs/monster-rpg/work-summary.md`
- Shared game contracts: `src/games/monster-rpg/sim`
- Phaser client: `src/games/monster-rpg/client`
- DOM UI: `src/games/monster-rpg/ui`

Chosen direction: React/Vite portal, Phaser 2D client, DOM HUD, square tiles, Node + Colyseus authoritative multiplayer, first proving online presence + movement.

## Adding a New Game

1. Add entry in `src/config/games.ts`.
2. Add route and lazy module in `src/app/App.tsx`.
3. Implement game module under `src/games/<game-name>`.
4. Use leaderboard provider interface for score persistence.

## Known Limitations

- Snake rendering currently targets fixed 24x24 draw space.
- Endless mode currently wraps world and provides directional text indicator.
- Some advanced admin knobs are available in config schema but not all are exposed in the first UI form.
- GameIt Monsters persistence is local-first until deployment target and backend storage are locked.
- No backend auth or remote persistence in MVP.

## Future Improvements

- PWA offline caching.
- Seeded RNG mode for deterministic tests.
- More exhaustive engine tests and replay harness.
- Full admin controls for every nested spawn/powerup parameter.
- Remote leaderboard provider.
- Production persistence and auth for GameIt Monsters.

## UI Asset Integration

- Place logo sheet at `public/assets/logos.png`.
- Place UI sprite sheet at `public/assets/assets.png`.
- Logo crop coordinates are configured in `src/config/uiAssets.ts` (`logoSpriteSheet.logos`).
- Sprite mapping placeholders for buttons/frames are also centralized in `src/config/uiAssets.ts` for quick updates.
