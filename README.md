# GameIt Portal

GameIt is a compact browser-game portal built for **GitHub Pages**.
It includes:

- Home page with GameIt hero banner and game cards.
- Individual game pages (`/game/:gameId`).
- Leaderboard page with game tabs + period filters (daily / weekly / monthly / all time).
- Admin panel with game cards and per-game config pages.
- Theme switcher (dark/light), persisted in `localStorage`.
- Data layer currently backed by `localStorage`, designed to be swapped with AWS backend later.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- GitHub Actions + GitHub Pages deploy

## Project Structure

```text
.
├── .github/workflows/deploy-pages.yml   # Build and deploy to GitHub Pages
├── design.html                           # Provided design reference
├── src
│   ├── components
│   │   ├── GameCard.tsx
│   │   └── Layout.tsx
│   ├── data
│   │   └── defaultGames.ts
│   ├── pages
│   │   ├── AdminGameConfigPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── GamePage.tsx
│   │   ├── HomePage.tsx
│   │   └── LeaderboardPage.tsx
│   ├── repositories
│   │   └── localStorageRepository.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Local Development

### Requirements

- Node.js 20+ (recommended)
- npm 10+

### Install

```bash
npm ci
```

### Start dev server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview built app

```bash
npm run preview
```

## Routing

- `/` — Home
- `/game/:gameId` — Game host page
- `/leaderboard` — Leaderboard with tabs and date-range filters
- `/admin` — Admin panel
- `/admin/game/:gameId` — Per-game config

## Data Model

### Game

- `id: string`
- `title: string`
- `description: string`
- `cover: string`
- `route: string`
- `modes: Mode[]`
- `enabled: boolean`

### LeaderboardEntry

- `id: string`
- `gameId: string`
- `playerName: string`
- `skin: string`
- `mode: Mode`
- `score: number`
- `date: ISO string`

## Current Storage Strategy (v1)

Implemented in `src/repositories/localStorageRepository.ts`:

- Games are stored under `gameit.games`.
- Leaderboard entries are stored under `gameit.entries`.
- Theme is stored under `gameit.theme`.
- On first load, default games and sample leaderboard data are seeded.

## AWS Migration Plan (v2+)

To migrate from local storage to AWS with minimal UI changes:

1. Keep `Game` and `LeaderboardEntry` types as API contracts.
2. Introduce repository interfaces (`GamesRepository`, `LeaderboardRepository`).
3. Create AWS implementation (e.g., API Gateway + Lambda + DynamoDB).
4. Replace only data provider wiring in `App.tsx`.

Suggested AWS path:

- **Auth**: Cognito (later, for admin authentication)
- **API**: API Gateway + Lambda
- **Data**: DynamoDB (`games`, `leaderboard_entries`)
- **Assets**: S3 + CloudFront (if game assets become heavy)

## GitHub Pages Deploy

Workflow file: `.github/workflows/deploy-pages.yml`.

It runs on every push to `main`:

1. `npm ci`
2. `npm run build`
3. Upload `dist`
4. Deploy via `actions/deploy-pages`

### One-time repository setup

In GitHub repo settings:

1. Go to **Settings → Pages**.
2. Set **Build and deployment** to **GitHub Actions**.
3. Ensure default branch is `main`.

### Base path note

`vite.config.ts` uses:

```ts
base: '/gameit/'
```

If your repository name is different, update this value to match your repo slug.

## How to Add Games Now

1. Open `/admin`.
2. Fill title, description, optional cover URL.
3. Click **Add game**.
4. Open **Configure** to change title/description and toggle enabled state.

## Future Enhancements

- Admin authentication (password/Cognito).
- Real leaderboard ingestion from game clients.
- Cloud synchronization instead of local-only storage.
- Search/filter/sort for large game collections.
- Localization support if non-English UI is needed later.
