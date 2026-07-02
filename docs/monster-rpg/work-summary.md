# Monster RPG Work Summary

## 2026-07-02 - Issue #49: Portal Navigation And Final Responsive QA

- Added a shared portal shell with desktop/tablet/mobile navigation for Home, Library, Scores, and Admin only, with Store and Community left hidden.
- Kept game launch routes outside the portal shell while making Snake and GameIt Monsters reachable from Home and Library.
- Added focused navigation contract coverage and prepared final responsive/browser QA around portal routes and playable launches.

## 2026-07-02 - Issue #48: Admin Registry Override

- Added a localStorage-backed Registry Override for display-only game metadata, with source defaults recovered when override data is absent or invalid.
- Extended Admin into a passcode-gated control center that edits registry names, descriptions, genre, status, featured state, accent, and bundled cover asset keys while protecting IDs and routes.
- Wired Home and Library to consume the merged registry and added focused override tests for load, save, merge, reset, and invalid data recovery.

## 2026-07-02 - Issue #47: Full Leaderboard Route

- Reworked `/leaderboard` into a full route in the app shell and changed Home’s trophy action to navigate there.
- Rebuilt `LeaderboardPage` around `gameRegistry` + `LocalStorageLeaderboardProvider` with selectable games and daily/weekly/all-time ranges.
- Added focused pure view-model coverage in `LeaderboardPage.test.ts` for provider query behavior and empty-state messaging.
- Added responsive leaderboard-specific styling, focus-visible-aware controls, empty-state panel, and table presentation in `global.css`.

## 2026-07-02 - Issue #46: Library Catalog Route

- Added `/library` as a registry-backed GameIt Portal catalog with search, genre/status filters, local cover assets, and non-launching coming-soon cards.
- Added focused Library filtering tests for default registry coverage, search, genre/status filters, and local asset fallback behavior.

## 2026-07-02 - Issue #45: Launch-First Home Dashboard

- Reworked the portal Home surface around the registry-selected featured playable game as the primary launch action.
- Replaced the full registry grid with a focused launch dashboard that keeps Snake and GameIt Monsters reachable while showing only a small on-deck preview.
- Swapped Home header controls to inline SVG icons and tightened focus, responsive, and reduced-motion states for the dashboard.

## 2026-07-01 - Portal Registry Metadata And Local Assets

- Added shared portal registry metadata for genre, status, featured selection, accent, and stable cover/hero asset keys.
- Added local portal image assets with role-specific fallback lookup and focused registry tests.
- Projected legacy default game cards from the shared registry and documented portal glossary terms.

## 2026-06-13 - Phase 0 Foundation

- Added durable project rules in `AGENTS.md`: Game Studio workflow, caveman brevity, English-only future work, summary habit, and browser-game architecture boundaries.
- Documented Phase 0 roadmap, stack decisions, repo boundaries, initial contracts, and test strategy in `docs/monster-rpg/phase-0-foundation.md`.
- Added initial shared TypeScript contracts for the monster RPG simulation/network boundary.
- Registered `gameit-monsters` in the portal default game catalog.
- Updated game seeding so missing default games are merged into existing localStorage data without overwriting user-edited games.

## 2026-06-13 - Phase 1 Playable Client Slice

- Installed Phaser and embedded `gameit-monsters` into the existing `/game/:gameId` route.
- Added local character creation with name plus `scout`, `ranger`, and `keeper` avatars.
- Added localStorage-backed Monster RPG profile/save state under `gameit.monsterRpg.profile` and `gameit.monsterRpg.save`.
- Added a handcrafted square-tile home village, pure movement validation, blocked-tile handling, and facing updates.
- Added Phaser boot and village scene that renders placeholder pixel tiles at runtime and follows the player with a camera.
- Added DOM HUD, reset action, and mobile D-pad controls.

## 2026-06-13 - Phase 2 Multiplayer Presence

- Added Colyseus dependencies, local server scripts, and one-command `npm run dev:multiplayer` workflow.
- Added `home_village` room with up to 8 clients, server-owned player state, join/leave handling, and authoritative movement validation.
- Added client network adapter for `joinOrCreate('home_village')`, `moveIntent` messages, room-state conversion, and offline fallback.
- Updated the React host so online movement sends intent to the server while offline mode preserves Phase 1 local movement.
- Updated Phaser village rendering to draw all players keyed by Colyseus session id and follow the local session player.
- Fixed the server entry to use Colyseus' built-in listener so matchmaking HTTP routes and WebSocket transport are both available.
- Fixed Colyseus schema initialization so nested schemas and player maps are assigned through schema descriptors.
- Added a Phaser scene readiness guard so React can update save/room state before the scene has finished `create()`.
- Verified `npm run build`, online browser HUD, remote player rendering, scripted two-client movement sync, blocked-water rejection with facing update, and offline local fallback.

## 2026-06-13 - Phase 2 Input Follow-Up

- Fixed online movement input by making the Phaser action bridge read the latest multiplayer status through a React ref.
- Root cause: Phaser kept the first React callback created during offline startup, so keyboard movement never sent `moveIntent` after the room became online.

## 2026-06-13 - Phase 3 World + Villages

- Added a shared map registry with `home-village`, deterministic `greenway-route`, and `brookhaven-village` maps, including map kinds, exits, route terrain, and spawn metadata.
- Extended movement results so exit tiles return `locationTransition` data while blocked moves still update facing.
- Replaced the hardcoded home room path with generic Colyseus `location` rooms filtered by `mapId`, plus a temporary `home_village` alias.
- Updated server validation for map ids, spawns, terrain, movement, and server-sent map transitions.
- Updated client networking to join `location` rooms per map, handle `locationTransition`, save destination spawns, and reconnect to destination rooms.
- Updated Phaser rendering to redraw the active map, reset camera bounds, render active-room players only, and support route/village terrain colors.
- Updated the DOM HUD with active map name, online/offline player status, and compact location coordinates.
- Verified `npm run build`, scripted Colyseus room-per-map smoke, online browser transitions from Home Village to Greenway Route to Brookhaven Village, refresh persistence, and offline local transitions.

## 2026-06-18 - Phase 4 Overworld Foundation

- Locked the Phase 4 implementation plan in `PLAN.md` before code changes.
- Added schema version `4` for Monster RPG profile/save data, so old Phase 3 localStorage state is reset on version or map mismatch.
- Replaced the active map registry with `world-map`, eight villages, and generated building interiors; `greenway-route` is no longer an active map id.
- Added a deterministic 128x96 overworld at 16px tiles with blocked terrain, roads, bridges, and 2x2 or 3x3 village footprint exits.
- Added Home Village, Brookhaven, and six deterministic template villages with shop, house, clinic, post office, town hall, and tavern entrances.
- Added one deterministic interior template per building type, with pure movement transitions for building entry, interior exit, village return, and blocked terrain.
- Added `npm run check:monster-rpg` focused simulation checks for save reset, overworld village entry, building entry/exit, and blocked movement.

## 2026-06-18 - Phase 4 Rendering Assets

- Added original generated local PNG assets for 2x2 and 3x3 overworld villages, building icons, door/sign markers, and terrain accents.
- Added a stable Monster RPG asset manifest so Phaser loads sprites by manifest keys instead of spreading raw asset paths through rendering code.
- Updated map scale data so the overworld renders at 16px tiles while villages and interiors render at 24px tiles.
- Updated Phaser rendering with sprite overlays for village footprints, building footprints, doors, signs, terrain accents, and map-kind-specific camera/player sizing.
- Reduced world render command count by drawing map grids as line passes and thinning world terrain accent sprites for mobile browser capture.
- Tuned mobile HUD and D-pad sizing so controls stay compact and leave the player area readable.

## 2026-06-18 - Phase 4 Multiplayer Transitions

- Added registry validation for active map ids, spawns, tile terrain, village footprint exits, building door exits, and interior return spawns.
- Hardened `LocationRoom` so invalid map ids are rejected, join positions are not trusted, and movement transitions use server-issued handoff tokens.
- Updated the client transition/reconnect flow to leave old map rooms, join target map rooms with the server token, and keep offline local transitions on the same pure movement path.
- Changed new profiles to start in Home Village per the Phase 4 PRD while preserving world-map, village, and interior room-per-map multiplayer.
- Updated HUD map kind wording to distinguish overworld, village, and interior locations.
- Expanded `npm run check:monster-rpg` with live Colyseus SDK smoke coverage for shared world rooms, village handoff, shared interiors, invalid map rejection, and blocked-terrain facing updates.

## 2026-06-18 - Phase 4 Final QA

- Ran final Phase 4 QA from `PLAN.md` and GitHub issue #3.
- Fixed Home Village travel so the east gate exits to the overworld marker, and entering the 3x3 Home Village marker places the player at that east gate.
- Expanded `npm run check:monster-rpg` to verify entry and exit for all building types: shop, house, clinic, post office, town hall, and tavern.
- Verified `npm run build`, save schema reset/new player start in Home Village, online Home Village east-gate exit, 3x3 Home marker entry, 2x2 Cedar Grove marker entry, Colyseus room-per-map smoke, and offline east-gate transition after stopping the server.
- Captured desktop and mobile viewport screenshots; HUD, world marker, player label, reset control, and mobile D-pad remained readable without blocking the active play area.

## 2026-06-18 - Full Vision Finish Plan

- Stored the full GameIt Monsters finish roadmap in `PLAN.md`.
- Locked current product defaults: creatures first, card/egg acquisition, seasonal deterministic world generation, local-first backend/persistence, and PvP village theft in the MVP.
- Planned remaining phases across creature systems, encounters, real-time battles, village economy, theft, quests/packs, production hardening, polish, and verification.
- Started domain glossary in `CONTEXT.md`; locked `Creature` as the canonical design/code term while leaving the final UI-facing creature name undecided.
- Expanded Card/Egg/Farm domain rules: Cards carry species or farm intent, Creature Cards carry rolled stats, common Cards convert directly with Magic Dust, uncommon+ Cards become Eggs first, and Farm Cards build or upgrade farms.
- Locked `Village Elder` as the canonical NPC/service term for the Town Hall character who grants the Starter Pack, converts Cards/Eggs, and manages Farm construction/upgrades.
- Locked First-Run Onboarding: character creation uses only name and player skin, then the player spawns at or inside Town Hall and must finish the Village Elder starter dialog before free movement.
- Locked Starter Pack behavior: all new players receive the same three common Creature species, but each Creature Card has individually rolled stats.
- Locked onboarding conversion: the player must convert one common Creature Card into a Creature; the other two starter Cards remain optional inventory choices.
- Locked stat inheritance: Creature Card stat rolls persist through direct Creature conversion and through uncommon+ Card-to-Egg-to-Creature conversion.
- Locked direct Egg drops: rare Eggs from defeated Creatures roll stats at drop time for that exact species and preserve those stats until hatching.
- Locked Creature Card conversion consumption: common conversion consumes the Card and Magic Dust for a Creature; uncommon+ conversion consumes the Card and Magic Dust for an Egg.
- Locked Magic Dust for MVP as one generic resource, while preserving room for additional rarity/type-specific material requirements on rarer conversion and hatching flows.
- Locked starter Farm onboarding: the player manually spends the Magic Dust Farm Card through the Village Elder before free movement unlocks.
- Locked `Magic Dust Farm` as the first Farm type: built during onboarding, level 1, produces only Magic Dust.
- Locked Farm production model: farms accrue while the player is offline, capped by storage, and production is resolved lazily from timestamps instead of background timers.
- Locked farm collection input: player stands adjacent to the farm and presses interact; farms are not collected by stepping onto their tile.
- Locked directional Interact: the action targets the adjacent tile in the player's current facing direction for NPCs, farms, chests, theft targets, and similar world objects; door/map exits stay automatic for now.
- Locked canonical Rarity code IDs: `common`, `uncommon`, `rare`, `double-rare`, `ultra-rare`, `unique`, `legendary`, and `mythical`.
- Locked Creature typing: each Creature has one required primary type and may have one optional secondary type; battle effectiveness considers both.
- Locked Attack typing: each Attack has exactly one Creature Type; Creature types influence Attack rolls while off-type Attacks can exist as rare rolls or later rewards.
- Locked Attack creation lifecycle: Creature Cards carry two pre-existing Attacks; Card-made Eggs preserve and display those two Attacks, then roll two more at hatching, while direct-drop Eggs roll all four Attacks at hatching.
- Locked direct-drop Egg visibility: before hatching they show species, Rarity, and Creature Type, but hide stats and Attacks.
- Locked Card-made Egg visibility: inherited rolled stats and the two inherited Attacks remain visible before hatching.
- Locked `Creature Species` as the stable identity behind Cards, Eggs, and Creature Instances; the MVP creature set is `Gen 1`.
- Added requirement for a player-facing book that tracks discovered Creature Species separately from owned Creature Instances.
- Locked `Creature Journal` as the provisional name for the discovered-species book, with room for a later branded UI rename.
- Locked Creature Journal reveal states: fighting a Species adds a silhouette; obtaining its Creature Card immediately marks it discovered, and hatching a direct-drop Egg also marks it discovered.
- Locked Card-made Eggs as inventory/incubation state only; they do not create a new Creature Journal reveal state.
- Locked Starter Pack discovery: opening it grants the three starter Creature Cards and marks those three Species discovered in the Creature Journal.
- Locked Starter Species roles: balanced attacker, sturdy defender, and fast stamina Creature; avoid a fire/water/grass-style starter trio.
- Locked Gen 1 target size at 147 Creature Species, including 2 legendary and 2 mythical Species, with the remaining rarity split chosen in `PLAN.md`.
- Locked MVP Creature art scope: polish 12-15 common, 4-6 uncommon, and 2-4 higher-rarity Species; use original placeholders for the rest of Gen 1.
- Locked Gen 1 catalog approach: scaffold all 147 Species with valid placeholder data, but fully balance only the polished MVP subset first.
- Locked Creature Species identity: every Species has a sequential generation ID plus a readable slug; display names are not used as identity.
- Locked MVP Creature Types: `normal`, `grass`, `bug`, `water`, `ice`, `rock`, `ground`, `flying`, `dragon`, `steel`, `dark`, and `ghost`.
- Locked TypeChart approach: implement the full 12x12 data shape immediately, but start with mostly neutral values and only obvious MVP strengths/weaknesses.
- Locked Mount Traits as species-level MVP capabilities usable only from the active party: `mount`, `mount-swim`, and `mount-fly`; instance-level mount quality can come later.
- Locked Active Party size at five Creature Instances for MVP.
- Locked MVP Battles as 1v1 using the player's first active Creature, with manual player-chosen Attacks and multi-Creature Battles planned later.
- Locked player battle inactivity: if no Attack is chosen, the player's Creature waits; no hidden player auto-attack runs in MVP.
- Locked enemy battle behavior: enemy Creatures choose available Attacks automatically with simple AI weighted by cooldown and type effectiveness.
- Locked cooldown model: each Attack has its own cooldown, and using any Attack also triggers a short global recovery.
- Locked MVP stamina/fatigue model: Attacks add Fatigue, high Fatigue slows global recovery, and Stamina controls Fatigue recovery plus post-battle HP recovery.
- Locked HP recovery rule: HP can recover during battle at half the normal recovery rate, with Stamina affecting both in-battle and out-of-battle recovery.
- Locked battle loss behavior: the battling Creature becomes Fainted at 0 HP, cannot battle or provide Mount Traits, and must be revived with a Revive Item or Hospital service; the player stays in place but cannot re-interact with that wild Creature for a short cooldown.
- Locked battle participant selection: MVP Battles use the first non-Fainted Creature in Active Party order; if all party Creatures are Fainted, battles and Mount Traits are unavailable until reviving.
- Locked Hospital revive as free full heal for MVP; Revive Items still matter away from villages and restore only a small amount of HP.
- Locked Fainted recovery rule: Fainted Creatures do not recover HP over time until revived.
- Locked wild Battle win rewards: Magic Dust, Creature XP, player XP, chance for a Pack, chance for other materials, and a very rare direct-drop Egg of the defeated Species.
- Locked Player Level MVP scope: player XP grants Pack milestones and future unlock hooks, but no player combat stat bonuses.
- Locked player XP reward condition: Battle wins grant player XP; Battle losses do not.
- Locked Creature XP reward condition: Battle wins grant Creature XP; Battle losses do not.
- Locked Pack contents: Packs always contain five Cards, and MVP Card categories are Creature, Farm, Material, and Buff.
- Locked Card activation paths: Creature and Farm Cards are used through the Village Elder; Material and Buff Cards activate manually.
- Locked Material Card behavior: activation grants fixed material amounts, with two or three Material Card rarity tiers for MVP.
- Locked MVP Buff Types as `battle` and `drop-chance`, with one active Buff Card per Buff Type and more types later.
- Locked drop-chance Buff Card duration: one Battle reward roll.
- Locked Buff Card timing: Buff Cards can be activated before or during Battle, with server validation of Buff Type slots.
- Locked in-battle Buff activation cost: short item-use recovery that briefly prevents attacking but does not trigger Attack cooldowns.
- Locked same-type Buff activation behavior: activating a second Buff Card of an already-active Buff Type is blocked for MVP.
- Locked Farm Card definitions: ID, slug, Rarity, farm type, build cost, upgrade use, production material, base production rate, and base storage cap.
- Locked farm uniqueness: MVP allows one Farm per farm type, and extra matching Farm Cards are used for upgrades.
- Locked Farm placement: MVP uses fixed home-village farm plots, with no free placement UI.
- Locked village ownership boundary: each Village Owner manages that village's buildings, farms, upgrades, guards, and collectable resources.
- Locked village ownership scope: MVP players own one home village only; multi-village ownership is deferred.
- Locked Village Visitor permissions: visitors may use public services such as Hospital, but cannot manage another village's buildings, farms, upgrades, guards, or Village Elder construction services.
- Locked farm interaction ownership rule: owners collect from farms; visitors stealing from farms triggers Theft semantics.
- Locked unguarded Theft behavior: visitors can steal immediately from unguarded Farms, subject to caps, cooldowns, and logs.
- Locked Guard Battle loss behavior: visitor loss uses normal Fainted rules for the battling Creature and steals no resources.
- Locked Guard Battle win behavior: the owner's guard Creature becomes Fainted and cannot defend again until revived.
- Locked Guard Assignment constraint: only non-Fainted owned Creatures can be assigned as Farm guards.
- Locked inactive guard behavior: Fainted assigned guards remain assigned for the owner but act like no guard for visitors.
- Locked Theft limits: MVP steals up to 25% of currently stored farm resources, minimum 1 when available, and each successful Theft starts a visible 24-hour Theft Cooldown per visitor, farm type, and village.
- Locked future Theft Cooldown extension point: special buffs or player-level skills may reduce cooldown later.
- Locked Theft Log: all Theft attempts are recorded for the owner with attacker, farm type, outcome, stolen amount if any, and guard result.
- Locked Theft Log MVP scope as read-only; retaliation/revenge actions are deferred.
- Locked Station discovery: entering another village once adds it to the player's Station teleport list.
- Locked Station use location: teleport starts only from the player's home-village Station in MVP.
- Locked Station destination scope: MVP Station destinations are discovered player villages only; big cities may be added later.
- Captured post-MVP Big City direction: public non-player settlements with tasks, tournaments, shops/farms, theft, City Reputation, guard/merchant consequences, and possible City Bans.
- Locked City Reputation as per-city standing, not global reputation.
- Locked City Reputation recovery as explicit actions only, such as tasks, fines, or donations; no passive recovery by default.
- Locked City Guard Battle loss behavior: normal Battle/Fainted rules apply, and losing to a city guard kicks the player to the nearest outside-city overworld entrance tile.
- Locked Big City tournaments as PvE first; PvP tournaments are deferred until multiplayer competition rules are designed.
- Locked City Tasks as the main explicit City Reputation recovery path and reward source.
- Locked MVP Wild Encounters as visible world entities; low random movement-chance encounters are deferred.
- Locked Wild Encounter ownership as shared server entities, not client-personal spawns.
- Locked Wild Encounter claim rule: first valid server interaction claims the encounter; no group battles in MVP.
- Locked Wild Battle loss cooldown: losing creates a 30-second per-player, per-entity re-interaction cooldown while other players can still fight the wild entity.
- Locked defeated Wild Encounter respawn behavior: respawn after 90-120 seconds by rerolling from the zone table.
- Locked Encounter Zone/Hotspot behavior: zones remain stable for a season, while hotspot Species and placement reroll after each respawn within the same zone.
- Locked map Creature visibility: Hotspot markers and map creatures use normal Species display regardless of Creature Journal discovery state; silhouettes stay a Journal concept.
- Locked visible wild Creature labels: sprite/icon only by default, with a player setting to show or hide names.
- Added Tap-to-Walk requirement: players can tap reachable map tiles to walk through validated grid movement.
- Added Run Away battle action requirement: after a wild Battle starts, the player has a button or equivalent control to attempt escape.
- Locked Run Away as chance-based, influenced by active Creature speed or mobility versus wild Creature speed, with a minimum success chance.
- Locked failed Run Away behavior: it consumes short recovery while enemy actions continue, but the player can try again immediately after the failure resolves.
- Locked successful Run Away behavior: the wild entity stays on the map, and the player receives the same 30-second per-entity cooldown as after a Wild Battle loss.
- Locked Run Away scope: available only in wild Battles, not Guard Battles or future City Guard Battles.
- Locked Station teleport cost direction: cost is based on traveler home Village Level versus target Village Level, with higher-level villages paying more to teleport to lower-level villages.
- Locked Village Level source: derive it from village development such as farm levels, unlocked buildings, and future village upgrades, not owner Player Level.
- Locked Station teleport payment resource: Magic Dust for MVP, changeable later.
- Locked Station cost scope: level-gap Magic Dust cost applies only to Station teleport; manual overworld travel remains free.
- Locked Station confirmation UI: show target village name, owner, Village Level, Magic Dust cost, and active Theft Cooldowns before teleport.
- Locked Creature Level MVP scope: Creature XP modestly improves battle stats; the battling Creature gets full XP, all other non-Fainted Active Party Creatures get 80%, Fainted or stored Creatures get none, and evolution/transformation is a definite later feature.
- Added ADRs for the Card/Egg acquisition model and shared server-owned Wild Encounter model, with links referenced from `PLAN.md`.
- Added ADR for server-authoritative Farm economy and Theft validation.
- Added ADR for local-first persistence behind repository interfaces until gameplay loops are proven.
- Re-checked current multiplayer implementation and updated `PLAN.md` to clarify that future multiplayer work extends the existing Colyseus server with map-scoped `location` rooms, authoritative movement, handoff tokens, shared presence, and offline fallback.
- Locked battle networking boundary: add separate Colyseus `battle` rooms; keep `location` rooms focused on map presence, movement, transitions, and encounter claims.
- Locked in-battle presence: players remain connected to Location Rooms while in Battle Rooms, are marked `inBattle`, cannot move, and cannot be attacked by other players.
- Locked in-battle map presentation: show a small battle indicator and slightly transparent player sprite, without exposing opponent stats.
- Locked Battle spectating out of MVP.
- Locked Battle disconnect handling: 30-second paused grace period, reconnect resumes, timeout counts as loss with normal Fainted rules.
- Locked Battle reconnect identity: reconnect uses stable `playerId`, not Colyseus session id, with server-issued battle reconnect token if needed.
- Locked Location Room disconnect behavior: outside Battle, disconnect removes presence normally; no special grace window in MVP.
- Locked Battle Room simulation model: deterministic server ticks, defaulting to 10 ticks/sec for MVP.
- Added ADR for separating Location Rooms and Battle Rooms.
- Locked MVP identity model: domain records use stable `playerId`; local-first MVP generates/persists it locally, and production auth will provide or claim it later.
- Locked account/profile scope: one Player Profile and one home village per account for MVP and first production version.
- Added local-first save export/import requirement before public testing.
- Consolidated `PLAN.md` into an implementation roadmap with current baseline, ADR references, architecture rules, phases, acceptance checks, and test plan.
- Published the GameIt Monsters MVP PRD to GitHub issue #4 with the `ready-for-agent` label and saved the PRD text in `docs/monster-rpg/prd-gameit-monsters-mvp.md`.
- Published the approved MVP implementation breakdown to GitHub issues #5-#22, all linked to parent issue #4 and labeled `ready-for-agent`.
- Completed the first TDD tracer for issue #5: added explicit `playerId` ownership to the Monster RPG profile domain, introduced save export/import round-trip behavior, kept Colyseus profile `id` as an internal wire adapter field, and covered the behavior with a public-interface Vitest.
- Continued issue #5 TDD with import failure behavior: invalid JSON imports now preserve the current save, and unsupported save schema versions return a clear `unsupported-schema` failure reason.
- Finished issue #5 save foundation: added repository-style local persistence, owned save containers for inventory, creatures, village, farms, journal, and progression, strict import validation for ownership/IDs/quantities/cooldowns, and manual HUD export/import controls.
- Implemented issue #6 catalog and Journal shell: added a 147-record Gen 1 Species catalog with 22 polished MVP Species, validation for IDs/slugs/rarity/type/attack pools, Journal unseen/silhouette/discovered transitions, save import validation for known Species, and a collapsible Creature Journal HUD panel.
- Implemented issue #7 first-run Village Elder onboarding: new players spawn at Home Village Town Hall, receive a one-time Starter Pack, convert three common Creature Cards with Magic Dust, build the first Magic Dust Farm, persist onboarding flags, and see a forced Elder panel until setup completes.
- Resolved PR #2 conflicts against `main` by keeping the current Snake portal shell, wiring GameIt Monsters into the active registry and routes, preserving Monster RPG styles/docs/server pieces, and validating build/tests/phase checks.

## 2026-06-20 - Issue #8: Inventory Cards and Pack Opening Tracer

- Added card-domain simulation for Creature, Farm, Material, and Buff card types plus five-card pack generation.
- Added pack tracer with deterministic output (ordered card pulls + rarity counts) for reproducible assertions.
- Added manual card actions: Material and Buff cards activate from inventory, Creature and Farm cards route through Village Elder actions.
- Added Buff activation guard to enforce one active card per buff type and server-side persistence support for active card buffs.
- Added HUD inventory panel showing card type/rarity/quantity and action labels (`Activate` vs `Use Elder`), plus pack-open summary.
- Added deterministic domain tests for pack drawing, Material/Buff activation, Elder routing, and farm uniqueness behavior.

## 2026-06-20 - Issue #9: Creature Card, Egg, and Creature Lifecycle

- Added per-card Creature Card instances with rolled stats and two known Attacks generated from Species, Rarity, type, and stat tendencies.
- Added Creature/Egg lifecycle simulation: common Creature Cards convert directly into Creatures, while uncommon-or-higher Creature Cards become Eggs with inherited stats and Attacks.
- Added direct-drop Egg creation and hatching; direct-drop Eggs keep Attacks hidden until hatching and roll all four Attacks when the Creature is created.
- Added Magic Dust creation/hatching requirements with scoped rarity/type/species metadata for future material expansion.
- Added save schema version 6 validation for Creature Card instances, Eggs, stat rolls, Attack records, and Creature records with four Attacks.
- Updated Starter Pack onboarding to grant per-card Creature Card instances and preserve their rolled stats/Attacks through starter conversion.
- Updated the HUD inventory panel to show Creature Card stat/Attack details, card-made Egg inherited Attacks, direct-drop Egg descriptions, and Egg hatching actions.
- Added deterministic domain tests for Creature Card conversion, card-made Eggs, direct-drop Egg hatching, and scoped Magic Dust requirements.

## 2026-06-20 - Issue #10: Active Party, Storage, Fainted, Hospital, And Revive Item

- Added active party/storage simulation with a five-Creature active cap, storage fallback for overflow creation/hatching, party transfer helpers, and strict save import validation.
- Added Fainted and recovery rules: 0 HP marks Fainted, Fainted Creatures cannot battle/guard/mount, new saves start with a Revive Item, Hospital full-heals for free, and Revive Items restore small HP.
- Added Creature HUD detail rows showing species, rarity, HP, Fainted status, stats, attacks, active/storage location, and recovery/transfer actions.
- Verified with focused party tests, full Vitest suite, production build, and Monster RPG phase checks.

## 2026-06-20 - Issue #11: Visible Shared Wild Encounter Claim Flow

- Added server-owned Wild Encounter state to Location Rooms, with map-scoped visible Creature spawns, 90-120 second natural reroll timers, 30-second claim/defeat respawn timers, and 30-second per-player loss/run cooldowns.
- Added encounter zone/spawn simulation helpers, directional target validation, Colyseus claim/release messages, and shared unavailable state when one player claims an encounter.
- Added Phaser wild Creature icon rendering plus keyboard/mobile Interact input for claiming visible encounters.
- Added focused simulation tests and SDK checks for shared encounter visibility, claim contention, release after loss, and cooldown rejection.

## 2026-06-20 - Issue #12: Tap-to-Walk and Creature Label Setting

- Added shared grid pathfinding for tap-to-walk, including blocked-tile, boundary, transition-tile, and Creature interaction-distance handling.
- Wired Phaser map clicks/taps to emit existing `move` actions so online play still sends server-authoritative `moveIntent` messages and offline play stays on the pure movement path.
- Added persistent Monster RPG settings with Creature label mode defaulting to icon-only and an HUD segmented control for icon-only vs icon-plus-name.
- Updated wild Creature rendering with optional Species name labels that hide near reserved HUD and mobile D-pad areas.
- Added focused pathfinding/settings tests and expanded Monster RPG phase checks for tap-to-walk behavior.

## 2026-06-20 - Issue #13: Battle Room Tracer With Manual Attacks And Enemy AI

- Added a separate Colyseus Battle Room tracer created from claimed visible wild encounters, with join tokens, no spectating, disconnect grace, and once-only battle result recording.
- Added server-side 1v1 battle simulation for manual player attacks, enemy AI attack choice, HP resolution, and fatigue costs that block repeated strong attacks.
- Marked Location Room players as `inBattle`, blocked movement and repeat encounter claims while battling, verified battle results before releasing or respawning encounters, and rendered in-battle overworld sprites translucent.
- Added a DOM battle panel with HP/fatigue meters, attack buttons, Run, and battle log, plus client wiring to apply server HP/Fainted results back into the local save.
- Added focused battle simulation tests and expanded Monster RPG SDK checks for battle room join, no-spectator rejection, in-battle movement blocking, run resolution, location release, and cooldown rejection.

## 2026-06-20 - Issue #14: Run Away And Wild Battle Exit Outcomes

- Added server-owned Run Away attempt rules for wild Battle Rooms, including first-turn attempts, failed attempts that keep the battle active, enemy response turns, retry scaling, and successful exits with no rewards.
- Added explicit `canRun` and `runAttempts` battle state so the DOM battle panel only exposes Run for supported battle types.
- Preserved existing wild encounter cleanup: successful run releases the encounter, clears in-battle player state, and applies the same per-player encounter cooldown as a loss.
- Added focused simulation coverage for failed run, retry, successful run, unsupported run rejection, and expanded SDK checks to retry until a run resolves.

## 2026-06-20 - Issue #15: Wild Battle Rewards, XP, And Direct-Drop Eggs

- Added deterministic server-generated wild Battle reward bundles on wins only, covering Magic Dust, player XP, Creature XP, Pack chance, material chance, and rare exact-Species direct-drop Eggs.
- Added idempotent local save application for Battle rewards, including full XP for the non-Fainted battling Creature, 80% XP for other non-Fainted active party Creatures, no XP for Fainted or stored Creatures, and duplicate-result protection.
- Wired reward payloads through Battle Room results and the React save path, with HUD readouts for player XP, Creature XP, and material currencies.
- Added focused reward generation/application coverage and verified with full tests, production build, and Monster RPG phase checks.

## 2026-06-20 - Issue #16: Magic Dust Farm Production And Owner Collection

- Added persisted Farm records with owner, village plot, produced resource, production rate, storage cap, stored amount, and production timestamp under save schema version 7.
- Added Magic Dust Farm production helpers that accrue capped resources over elapsed time and keep the model generic for future farm resource types.
- Wired adjacent facing Interact collection so the owner can collect stored Magic Dust, reset farm storage, and persist the updated wallet/farm state.
- Rendered built farms as Phaser village overlays and added tap-to-walk interaction-distance targeting for farm plots.
- Added a compact Farm HUD panel showing stored amount, cap, production rate, and readiness/full/producing status.
- Added focused farm simulation tests, updated save validation coverage, and verified with full tests, production build, Monster RPG phase checks, and browser smoke.

## 2026-06-20 - Issue #17: Farm Upgrades And Guard Assignment

- Added Farm upgrade plans with visible requirements, matching Farm Card consumption, Magic Dust costs, higher production rates, and higher storage caps.
- Added persisted Farm guard assignment to owned non-Fainted Creatures, plus inactive-guard checks when assigned guards later become Fainted.
- Wired Farm HUD upgrade controls and guard selection while keeping Farm simulation, React UI, and save validation separate.
- Added focused Farm upgrade/guard tests and save import coverage for persisted guard references.

## 2026-06-20 - Issue #18: Visitor Permissions And Theft From Unguarded Farms

- Added visitor farm theft simulation with Magic Dust attempt costs, deterministic success checks, 25% stored-resource cap, and 24-hour cooldowns keyed per visitor.
- Preserved owner-only Farm management for upgrades and guard assignment while allowing visitor-held farm records for theft checks.
- Added theft attempt logging for later activity feed work, recording attacker, defender, farm type, outcome, stolen amount, cost, and unguarded result.
- Wired adjacent facing Interact so owners collect and visitors attempt theft, with Farm HUD text for visitor cost/cooldown state.
- Added focused farm tests for successful theft, cooldown blocking, failed attempts, level-scaled costs, and owner-only management.

## 2026-06-21 - Issue #19: Guard Battle Theft Flow

- Added guard-theft Battle claims that reuse the Battle Room attack/fatigue/HP rules while disabling Run and wild rewards.
- Wired guarded Farm theft attempts to start a guard battle when the visitor has a ready Creature and the assigned guard is active.
- Added guarded-theft settlement so visitor losses faint the battling Creature and steal nothing, while visitor wins steal capped resources, start cooldown, log guard outcome, and faint the guard when present in save state.
- Added focused battle/farm tests plus production build and Monster RPG SDK verification.

## 2026-06-21 - Issue #20: Station Discovery And Travel

- Added a station save container with generic destination records for player villages and future cities, including future reputation, guard, and ban hook keys without implementing those systems.
- Added player-village discovery when villages are entered, while preserving the existing discovered village list for current MVP flows.
- Added Magic Dust station travel quotes and confirmation-only teleport execution with safe destination spawns.
- Implemented the reversed level-difference travel cost: higher-level player/village context pays more when traveling to lower-level targets.
- Added a compact Station HUD panel that lists discovered destinations and requires Travel then Confirm before charging Magic Dust.
- Added focused station simulation tests plus save validation coverage for future city-shaped destinations.

## 2026-06-21 - Issue #21: Player Level, Pack Milestones, And Reward Tables

- Added data-driven player XP thresholds and level reward definitions for Pack milestones plus future skill/unlock hooks.
- Added persisted level reward claim IDs and unlocked player skill IDs under save schema version 9 so milestone rewards cannot be duplicated after reload.
- Reworked card Pack generation through reusable reward tables shared by manual Packs, quest, level, monster-drop, and special-building sources.
- Wired wild Battle player XP through the progression service so wins can increase player level and auto-claim milestone Packs.
- Updated the HUD level readout and Pack trace display for level-up Pack rewards.
- Added deterministic tests for level thresholds, reward claiming/idempotency, future unlock representation, Battle XP leveling, and reward-table rarity/type boundaries.

## 2026-06-21 - Issue #22: MVP Art And HUD Polish Pass

- Improved character creation skin choices with distinct sprite-like body, head, feet, gear text, and clearer selected-state presentation.
- Added readable Phaser map labels for Town Hall/Village Elder, Hospital, Station, and Magic Dust Farm while preserving original local pixel-style assets.
- Reworked visible wild encounter markers from plain dots into simple creature-like icons with body, crest, shine, shadow, and optional species labels.
- Tightened first-run onboarding layout so desktop and mobile hide lower HUD drawers while the Village Elder panel is active, avoiding HUD/control overlap.
- Improved the Battle button copy to `Run Away` and kept HP/fatigue meters plus battle log in a bounded panel.
- Added Farm HUD storage bars and clearer stored/cap, production, guard, access, cooldown/upgrade readouts.
- Reworked inventory card rows with type, rarity, quantity badges, scannable details, and bounded scroll so opened packs do not push UI past the playfield.

## 2026-06-21 - GitHub Pages CI Diagnosis

- Checked the failing `Deploy GitHub Pages` workflow on `main`: build and artifact upload pass, deploy fails because GitHub Pages is not enabled for the repository (`has_pages: false`).
- Fixed the live Pages configuration by switching `sapogov/gameit` from branch publishing to GitHub Actions publishing, reran the Pages workflow successfully, and verified `https://sapogov.github.io/gameit/` serves the built Vite assets.

## 2026-06-21 - HUD Cleanup, 2x2 Farms, And Click-Walk

- Reduced persistent Monster RPG HUD chrome to a compact status panel, collapsed menu dock, and small action log so normal play keeps most of the map visible.
- Moved Farm, Station, Creatures, Inventory, Journal, Settings, and Save controls behind drawers, with Inventory now summarizing materials, items, Creature Cards, and Eggs before listing cards.
- Added a 2x2 farm footprint helper used by collection/theft checks, rendering, click targeting, and local movement blocking.
- Updated tap-to-walk pathfinding to avoid farm footprints, walk to the nearest interaction edge, face the target, and auto-interact after clicking farms or encounters.
- Replaced burst click movement with a timed tile-step queue so clicked destinations move the character across grid squares instead of jumping.
- Added focused farm/pathfinding regression tests plus desktop/mobile browser smoke checks and production client build verification.

## 2026-06-22 - AI Art Approval Sheets

- Generated high-quality pixel-art approval sheets for overworld environment/building sprites, farm variants, player animation seed poses, and six creature seed concepts.
- Saved the generated review sheets under `docs/monster-rpg/art-approval/` so approved directions can be iterated into normalized production sprites later.
- Noted that player and creature sheets are approval mood boards only; final production strips still need seed-frame selection, originality review, chroma-key/alpha cleanup, fixed frame slots, and sprite-pipeline normalization.
- Added follow-up approval sheets for animated creature strips plus terrain corrections: straight road tiles, road end/curve, plain water tiles, shoreline, and bridge-over-water.
- Sliced the approved sheets into local game assets, wired new terrain/water/road PNGs through the Monster RPG asset manifest, and switched Phaser wild encounters to animated creature sprites from a 6-row, 4-frame spritesheet.
- Verified the client build and browser rendering with local Vite plus Colyseus: roads render from the new straight-road tile assets, and online wild encounters render animated creature sprite markers.
- Added deterministic terrain sprite variants for grass, fields, forest, trees, and mountains, with stable tile-coordinate selection in Phaser so maps look less repetitive without inflating world-map render cost.
- Increased rendered wild encounter creature size for village and overworld views while preserving the existing 64px spritesheet source.

## 2026-06-27 - Mobile HUD And Tap Movement Polish

- Reworked the mobile Monster RPG HUD so status, menu chips, action log, D-pad, and back navigation use much less screen space during normal play.
- Bounded opened mobile menu drawers to a small scrollable overlay instead of allowing farm/save/inventory panels to cover most of the playfield.
- Added paced tap-to-walk dispatch and adjacent-tile Phaser tweens so clicked destinations move through visible grid steps instead of visually teleporting.

## 2026-07-02 - Portal Kinetic Design Pass

- Restyled the active GameIt portal home route toward the `design.html` kinetic mock with fixed glass navigation, generated image-backed hero, neon CTA, section tags, and bento-style game cards.
- Replaced emoji toolbar actions with inline SVG icons and preserved existing game routes, leaderboard modal, admin route, and local sprite-sheet logo usage.
- Kept shared game-screen styling compatible by retaining legacy UI variables used by Snake and Monster RPG surfaces.
- Validated portal usability against UI/UX guidance and added a skip link, real navigation targets, clearer card labels, keyboard focus treatment, and reduced-motion safeguards.

## Next Work

- Start Phase 5 with Creature Foundation: original creature catalog, type/rarity data, inventory, party/storage state, and DOM party/inventory panels.
- Keep production persistence behind repository interfaces until core gameplay loops are proven.
