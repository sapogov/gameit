# GameIt Monster RPG Phase 0 Foundation

## Summary

GameIt Monster RPG is an original monster-collecting browser MMO with a Game Boy-inspired 2D presentation. It will live inside the existing React/Vite GameIt portal and evolve from a focused multiplayer slice into villages, exploration, creatures, battles, and economy.

Phase 0 defines the foundation only. It does not implement gameplay, install Phaser, scaffold Colyseus, or introduce persistence.

## Roadmap

- **Phase 0: Foundation** - stack, repo structure, runtime boundaries, networking model, `AGENTS.md`, work-summary habit.
- **Phase 1: Playable Client Slice** - character creation, spawn in personal village, square-tile walking, camera, collision, placeholder pixel art.
- **Phase 2: Multiplayer Presence** - Colyseus room, server-authoritative movement, players visible together in one village or map zone.
- **Phase 3: World + Villages** - generated session map, roads, terrain rules, village placement, location transitions.
- **Phase 4: Creatures + Encounters** - creature data, types, rarity, terrain encounter tables, mount/swim/fly traversal.
- **Phase 5: Real-Time Battles** - creature stats, 4 attacks, attack-speed loop, HP/stamina recovery, win/loss resolution.
- **Phase 6: Village Economy** - farm items, build/upgrade farms, manual collection, storage caps, theft + guard battles.
- **Phase 7: Portal Integration** - auth, persistence, leaderboards, admin tools, asset pipeline, deployment hardening.

## Stack Decisions

- **Portal:** keep current React 18 + Vite + React Router app.
- **Game client:** TypeScript + Phaser for the 2D canvas playfield.
- **UI:** React DOM overlays for HUD, character creation, inventory, battle panels, dialogs, and settings.
- **Multiplayer:** Node + Colyseus authoritative server rooms.
- **Persistence:** choose PostgreSQL or DynamoDB later behind repository interfaces.
- **Grid:** square tiles for v1.
- **First online proof:** presence + movement.

## Architecture Boundaries

- `src/games/monster-rpg/sim` contains pure game rules, serializable state, and shared contracts.
- `src/games/monster-rpg/client` will contain Phaser boot, scenes, render adapters, camera, input plumbing, and asset manifest usage.
- `src/games/monster-rpg/ui` will contain React HUD and menu surfaces.
- `server` or `packages/server` will contain Colyseus rooms once backend work starts.

The renderer never owns source-of-truth game state. The client sends input intent; server and simulation code validate movement, battles, rewards, resources, stealing, and progression.

## Initial Contracts

The first shared TypeScript contracts live in `src/games/monster-rpg/sim/types.ts`:

- `PlayerProfile`
- `WorldPosition`
- `InputAction`
- `NetworkEvent`
- `LocationRoomState`

These are intentionally small. Later phases should extend them through focused feature work rather than front-loading the full MMO schema.

## Test Strategy

- Run `npm run build` after every client-facing change.
- Add unit tests for pure simulation before implementing terrain access, encounter chance, farm caps, or battle resolution.
- Add multiplayer smoke tests when the Colyseus server exists: two clients join one room, movement syncs, invalid movement is rejected.
- Use browser QA for playable slices: canvas nonblank, desktop/mobile layout, no HUD overlap, keyboard input clear, reduced-motion respected.
