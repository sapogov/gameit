# Graph Report - gameit  (2026-06-21)

## Corpus Check
- 102 files · ~202,263 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1058 nodes · 2705 edges · 75 communities (41 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f7e9144c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Map and Movement Logic|Map and Movement Logic]]
- [[_COMMUNITY_Village Scene and Assets|Village Scene and Assets]]
- [[_COMMUNITY_Battle Room Management|Battle Room Management]]
- [[_COMMUNITY_Card Activation and Types|Card Activation and Types]]
- [[_COMMUNITY_Game and Admin Pages|Game and Admin Pages]]
- [[_COMMUNITY_Creature Journal and Profile|Creature Journal and Profile]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_State Validation and Schema|State Validation and Schema]]
- [[_COMMUNITY_Save State and Rewards|Save State and Rewards]]
- [[_COMMUNITY_Onboarding and Starter Packs|Onboarding and Starter Packs]]
- [[_COMMUNITY_Creature Lifecycle and Attacks|Creature Lifecycle and Attacks]]
- [[_COMMUNITY_UI Components and Formatting|UI Components and Formatting]]
- [[_COMMUNITY_Game Outcome Formatting|Game Outcome Formatting]]
- [[_COMMUNITY_Multiplayer Connection Handling|Multiplayer Connection Handling]]
- [[_COMMUNITY_Farm Management and Theft|Farm Management and Theft]]
- [[_COMMUNITY_Species Catalog and Stats|Species Catalog and Stats]]
- [[_COMMUNITY_Colyseus Client Connections|Colyseus Client Connections]]
- [[_COMMUNITY_Type Definitions and States|Type Definitions and States]]
- [[_COMMUNITY_Main App and UI Pages|Main App and UI Pages]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Snake Game Engine|Snake Game Engine]]
- [[_COMMUNITY_Wild Encounter Spawning|Wild Encounter Spawning]]
- [[_COMMUNITY_Battle Rewards and Updates|Battle Rewards and Updates]]
- [[_COMMUNITY_Leaderboard Management|Leaderboard Management]]
- [[_COMMUNITY_Battle Claim and Resolution|Battle Claim and Resolution]]
- [[_COMMUNITY_Game Initialization and Settings|Game Initialization and Settings]]
- [[_COMMUNITY_Creature Party Management|Creature Party Management]]
- [[_COMMUNITY_Admin and Snake Config|Admin and Snake Config]]
- [[_COMMUNITY_Location Room and Encounters|Location Room and Encounters]]
- [[_COMMUNITY_Location and Player Schema|Location and Player Schema]]
- [[_COMMUNITY_Farm and Creature Actions|Farm and Creature Actions]]
- [[_COMMUNITY_Snake Engine Core Logic|Snake Engine Core Logic]]
- [[_COMMUNITY_TypeScript Compiler Settings|TypeScript Compiler Settings]]
- [[_COMMUNITY_Battle State and Schema|Battle State and Schema]]
- [[_COMMUNITY_Data Validation Utilities|Data Validation Utilities]]
- [[_COMMUNITY_Save State Management|Save State Management]]
- [[_COMMUNITY_Asset Generation Scripts|Asset Generation Scripts]]
- [[_COMMUNITY_Farm Theft Handling|Farm Theft Handling]]
- [[_COMMUNITY_Node TypeScript Config|Node TypeScript Config]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_UI Logo and Sprites|UI Logo and Sprites]]
- [[_COMMUNITY_Farm Definitions and Upgrades|Farm Definitions and Upgrades]]
- [[_COMMUNITY_Location Join and Profile|Location Join and Profile]]
- [[_COMMUNITY_Mobile Controls|Mobile Controls]]
- [[_COMMUNITY_TypeScript Project References|TypeScript Project References]]
- [[_COMMUNITY_Card and Egg Model ADR|Card and Egg Model ADR]]
- [[_COMMUNITY_Wild Encounter Server ADR|Wild Encounter Server ADR]]
- [[_COMMUNITY_Economy and Theft ADR|Economy and Theft ADR]]
- [[_COMMUNITY_Local Persistence ADR|Local Persistence ADR]]
- [[_COMMUNITY_Location and Battle Rooms ADR|Location and Battle Rooms ADR]]
- [[_COMMUNITY_GitHub Pages Deployment|GitHub Pages Deployment]]
- [[_COMMUNITY_Design System HTML|Design System HTML]]
- [[_COMMUNITY_Portal Index HTML|Portal Index HTML]]
- [[_COMMUNITY_Pixel Art Building Clinic|Pixel Art Building Clinic]]
- [[_COMMUNITY_Pixel Art Building House|Pixel Art Building House]]
- [[_COMMUNITY_Pixel Art Building Post Office|Pixel Art Building Post Office]]
- [[_COMMUNITY_Pixel Art Building Shop|Pixel Art Building Shop]]
- [[_COMMUNITY_Pixel Art Building Tavern|Pixel Art Building Tavern]]
- [[_COMMUNITY_Pixel Art Building Town Hall|Pixel Art Building Town Hall]]
- [[_COMMUNITY_Pixel Art Marker Door|Pixel Art Marker Door]]
- [[_COMMUNITY_Pixel Art Marker Sign|Pixel Art Marker Sign]]
- [[_COMMUNITY_Pixel Art Terrain Field|Pixel Art Terrain Field]]
- [[_COMMUNITY_Pixel Art Terrain Forest|Pixel Art Terrain Forest]]
- [[_COMMUNITY_Pixel Art Terrain Mountain|Pixel Art Terrain Mountain]]
- [[_COMMUNITY_Pixel Art Terrain Tree|Pixel Art Terrain Tree]]
- [[_COMMUNITY_Pixel Art Large Village|Pixel Art Large Village]]
- [[_COMMUNITY_Pixel Art Small Village|Pixel Art Small Village]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 53 edges
2. `MonsterRpgSaveState` - 36 edges
3. `getGameMap()` - 35 edges
4. `Monster RPG Work Summary` - 27 edges
5. `getSpeciesById()` - 24 edges
6. `canEnterTile()` - 23 edges
7. `createInitialSave()` - 23 edges
8. `convertCreatureCardViaElder()` - 20 edges
9. `MapId` - 20 edges
10. `GameIt Portal MVP` - 20 edges

## Surprising Connections (you probably didn't know these)
- `GameIt Portal MVP` --references--> `UI Sprite Sheet`  [EXTRACTED]
  README.md → public/assets/assets.png
- `GameIt Portal MVP` --references--> `GameIt Logo Sheet`  [EXTRACTED]
  README.md → public/assets/logos.png
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkGen1SpeciesCatalog()` --calls--> `validateSpeciesCatalog()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/speciesCatalog.ts
- `createState()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts

## Import Cycles
- None detected.

## Communities (75 total, 34 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.06
Nodes (75): toLocationRoomState(), resolveJoinPosition(), sanitizeProfile(), checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage() (+67 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.05
Nodes (62): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+54 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.09
Nodes (33): activateBuffCard(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason, cardBuffTypes (+25 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.11
Nodes (25): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+17 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.17
Nodes (20): createEmptySaveContainers(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId() (+12 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.09
Nodes (31): isValidCreatureContainerLayout(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isFarmTheftLog(), isIsoDate(), isUniqueStringArray() (+23 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.14
Nodes (26): getCardRewardTable(), getCardRewardTableForSource(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isCreatureFainted() (+18 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.13
Nodes (28): MonsterRpgGame(), MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, isAtVillageHospital(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards() (+20 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.06
Nodes (64): sanitizeBattleCreature(), checkCreatureJournalStates(), checkGen1SpeciesCatalog(), createWildBattleCreature(), hashString(), activateCreatureCardViaElder(), getCardCatalog(), getCreatureCardById() (+56 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.10
Nodes (27): CardDefinition, FarmUpgradePlan, getFarmDefinition(), getFarmTheftAttemptCost(), getFarmUpgradePlan(), getFarmUpgradePreview(), isFarmGuardActive(), isFarmGuardBlockingTheft() (+19 more)

### Community 12 - "Game Outcome Formatting"
Cohesion: 0.08
Nodes (10): PlayerProfileSchema, clearProgress(), AvatarId, InputAction, avatarOptions, CharacterCreator(), CharacterCreatorProps, controls (+2 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.13
Nodes (16): avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition(), pendingTransitions (+8 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.08
Nodes (34): attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+26 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.07
Nodes (27): 2026-06-13 - Phase 0 Foundation, 2026-06-13 - Phase 1 Playable Client Slice, 2026-06-13 - Phase 2 Input Follow-Up, 2026-06-13 - Phase 2 Multiplayer Presence, 2026-06-13 - Phase 3 World + Villages, 2026-06-18 - Full Vision Finish Plan, 2026-06-18 - Phase 4 Final QA, 2026-06-18 - Phase 4 Multiplayer Transitions (+19 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.17
Nodes (20): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), MultiplayerConnection (+12 more)

### Community 17 - "Type Definitions and States"
Cohesion: 0.10
Nodes (24): LocationTransitionMessage, PendingTransition, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition, BattleCreatureState, BattleMaterialReward (+16 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.15
Nodes (13): App(), ComingSoonPage, Home(), MonsterRpgGame, SnakeGamePage, GameTile(), IconCircleButton(), Props (+5 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 20 - "Snake Game Engine"
Cohesion: 0.16
Nodes (15): Direction, dirVec, Effects, Item, ItemKind, Point, SnakeSnapshot, colors (+7 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.22
Nodes (13): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+5 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.21
Nodes (15): ApplyBattleRewardsResult, applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString() (+7 more)

### Community 23 - "Leaderboard Management"
Cohesion: 0.24
Nodes (8): provider, readLocal(), LeaderboardProvider, LocalStorageLeaderboardProvider, RemoteLeaderboardProviderStub, GameId, LeaderboardEntry, LeaderboardRange

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.14
Nodes (14): monsterRpgAssetKeys, monsterRpgAssetManifest, avatarColors, EncounterView, FarmView, getSpeciesAccentColor(), getSpeciesIconColor(), MapRenderMetrics (+6 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.20
Nodes (13): bootGame(), BootGameOptions, MonsterRpgGameRuntime, MonsterRpgSaveRepository, defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings() (+5 more)

### Community 27 - "Admin and Snake Config"
Cohesion: 0.33
Nodes (9): AdminPage(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema, loadSnakeConfig(), resetSnakeConfig(), saveProfile() (+1 more)

### Community 28 - "Location Room and Encounters"
Cohesion: 0.22
Nodes (5): getEncounterCooldownKey(), LocationRoom, removeBattleClaim(), JoinLocationOptions, ResolveWildEncounterMessage

### Community 29 - "Location and Player Schema"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, PRD: GameIt Monsters MVP, Problem Statement, Solution, Testing Decisions, User Stories

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.25
Nodes (7): Architecture Boundaries, GameIt Monster RPG Phase 0 Foundation, Initial Contracts, Roadmap, Stack Decisions, Summary, Test Strategy

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 34 - "Data Validation Utilities"
Cohesion: 0.31
Nodes (10): isCooldownRecord(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord(), isValidFarmPosition() (+2 more)

### Community 35 - "Save State Management"
Cohesion: 0.25
Nodes (6): getInitialState(), checkSaveReset(), importSavePayload(), loadProfile(), loadSave(), saveProgress()

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 38 - "Node TypeScript Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 39 - "Project Documentation"
Cohesion: 0.11
Nodes (17): Monster RPG Client README, Monster RPG UI README, UI Sprite Sheet, GameIt Logo Sheet, Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview (+9 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.33
Nodes (5): PortalLogo(), Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 41 - "Farm Definitions and Upgrades"
Cohesion: 0.67
Nodes (4): isValidStation(), isNonEmptyString(), isValidFutureHooks(), isValidStationDestination()

## Knowledge Gaps
- **227 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `Map and Movement Logic`, `Farm Theft Handling`, `Game Outcome Formatting`, `Battle Claim and Resolution`, `Game Initialization and Settings`, `Creature Party Management`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Game Initialization and Settings` to `Map and Movement Logic`, `Village Scene and Assets`, `Battle Room Management`, `Card Activation and Types`, `Creature Journal and Profile`, `State Validation and Schema`, `Save State and Rewards`, `Onboarding and Starter Packs`, `Creature Lifecycle and Attacks`, `UI Components and Formatting`, `Game Outcome Formatting`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Type Definitions and States`, `Battle Rewards and Updates`, `Battle Claim and Resolution`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Map and Movement Logic` to `Village Scene and Assets`, `Creature Journal and Profile`, `Save State and Rewards`, `Onboarding and Starter Packs`, `Game Outcome Formatting`, `Multiplayer Connection Handling`, `Colyseus Client Connections`, `Wild Encounter Spawning`, `Battle Claim and Resolution`, `Game Initialization and Settings`, `Location Room and Encounters`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _227 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05515832482124617 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.12096774193548387 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05479059093516925 - nodes in this community are weakly interconnected._