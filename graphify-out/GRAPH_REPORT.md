# Graph Report - gameit-publish-main  (2026-07-02)

## Corpus Check
- 114 files · ~294,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1159 nodes · 2956 edges · 84 communities (47 shown, 37 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c29d233d`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Wild Encounter Spawning|Wild Encounter Spawning]]
- [[_COMMUNITY_Battle Rewards and Updates|Battle Rewards and Updates]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Battle Claim and Resolution|Battle Claim and Resolution]]
- [[_COMMUNITY_Game Initialization and Settings|Game Initialization and Settings]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Admin and Snake Config|Admin and Snake Config]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Location and Player Schema|Location and Player Schema]]
- [[_COMMUNITY_Farm and Creature Actions|Farm and Creature Actions]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_TypeScript Compiler Settings|TypeScript Compiler Settings]]
- [[_COMMUNITY_Battle State and Schema|Battle State and Schema]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Save State Management|Save State Management]]
- [[_COMMUNITY_Asset Generation Scripts|Asset Generation Scripts]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Node TypeScript Config|Node TypeScript Config]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_UI Logo and Sprites|UI Logo and Sprites]]
- [[_COMMUNITY_Farm Definitions and Upgrades|Farm Definitions and Upgrades]]
- [[_COMMUNITY_Location Join and Profile|Location Join and Profile]]
- [[_COMMUNITY_Mobile Controls|Mobile Controls]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Coming Soon Page|Coming Soon Page]]
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
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `Monster RPG Work Summary` - 39 edges
3. `MonsterRpgSaveState` - 36 edges
4. `getGameMap()` - 35 edges
5. `canEnterTile()` - 24 edges
6. `getSpeciesById()` - 24 edges
7. `createInitialSave()` - 23 edges
8. `convertCreatureCardViaElder()` - 20 edges
9. `MapId` - 20 edges
10. `LocationRoom` - 18 edges

## Surprising Connections (you probably didn't know these)
- `checkInitialSaveStartsInHomeVillage()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkOverworldVillageEntry()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkOverworldVillageEntry()` --calls--> `movePlayer()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/movement.ts
- `checkHomeVillageEastGateExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkHomeVillageEastGateExit()` --calls--> `movePlayer()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/movement.ts

## Import Cycles
- None detected.

## Communities (84 total, 37 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.13
Nodes (38): checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkCreatureJournalStates(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected(), checkOverworldVillageEntry(), checkSdkMultiplayerFlow() (+30 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.05
Nodes (17): MonsterRpgAssetKey, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgSpriteSheetManifest, avatarColors, directionDeltas, EncounterView, FarmView (+9 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, portalCoverAssetKeys, RegistryOverride, writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.08
Nodes (37): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes (+29 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, AdminGameConfigPage(), Props, AdminPage(), Props, GamePage() (+15 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.10
Nodes (26): CardDefinition, FarmUpgradePlan, getFarmDefinition(), getFarmUpgradePlan(), getFarmUpgradePreview(), getNextPlayerLevelThreshold(), MovementResult, CardRow (+18 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.08
Nodes (24): createEmptySaveContainers(), hasUnsupportedSchemaVersion(), isAvatarId(), isFarmTheftLog(), isValidFarms(), isValidProfile(), localMonsterRpgSaveRepository, parseSavePayload() (+16 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.07
Nodes (58): sanitizeBattleCreature(), checkGen1SpeciesCatalog(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+50 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.19
Nodes (17): VillageSceneOptions, checkBuildingEntryAndExit(), checkTapToWalkPathing(), findPath(), findPathToAdjacentFacing(), canEnterTile(), getExitAt(), getTileAt() (+9 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.05
Nodes (64): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+56 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.19
Nodes (18): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+10 more)

### Community 12 - "Game Outcome Formatting"
Cohesion: 0.33
Nodes (5): PortalLogo(), Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.12
Nodes (25): MultiplayerConnection, avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition() (+17 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.08
Nodes (40): attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+32 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.05
Nodes (39): 2026-06-13 - Phase 0 Foundation, 2026-06-13 - Phase 1 Playable Client Slice, 2026-06-13 - Phase 2 Input Follow-Up, 2026-06-13 - Phase 2 Multiplayer Presence, 2026-06-13 - Phase 3 World + Villages, 2026-06-18 - Full Vision Finish Plan, 2026-06-18 - Phase 4 Final QA, 2026-06-18 - Phase 4 Multiplayer Transitions (+31 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.10
Nodes (5): MonsterRpgGame(), moveDeltaByDirection, isAtVillageHospital(), isVillageElderDialogComplete(), clearProgress()

### Community 17 - "Type Definitions and States"
Cohesion: 0.09
Nodes (25): applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap(), createWorldMap() (+17 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.12
Nodes (16): LeaderboardModal(), provider, readLocal(), buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm (+8 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (15): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, PortalShell(), SnakeGamePage, portalNavigationItems (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (23): getCreatureCardById(), MAGIC_DUST_CURRENCY_ID, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost() (+15 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.24
Nodes (11): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+3 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.14
Nodes (27): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital() (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.31
Nodes (9): bootGame(), BootGameOptions, MonsterRpgGameRuntime, CardActionResult, OpenPackResult, MonsterRpgSaveRepository, CreatureLabelMode, LocationRoomState (+1 more)

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.33
Nodes (11): isAccent(), isKnownValue(), isRecord(), loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText(), resetRegistryOverride() (+3 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (18): confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId(), getStationContextLevel() (+10 more)

### Community 28 - "Community 28"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 29 - "Location and Player Schema"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, PRD: GameIt Monsters MVP, Problem Statement, Solution, Testing Decisions, User Stories

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.25
Nodes (7): Architecture Boundaries, GameIt Monster RPG Phase 0 Foundation, Initial Contracts, Roadmap, Stack Decisions, Summary, Test Strategy

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (12): BattleClaim, battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getResolvedBattleOutcome(), removeBattleClaim() (+4 more)

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.11
Nodes (18): PendingTransition, LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition, AvatarId (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.24
Nodes (11): toLocationRoomState(), isValidCreatureContainerLayout(), getMapById(), isMapId(), isBooleanRecord(), isCardBuffRecord(), isUniqueStringArray(), isValidCreatures() (+3 more)

### Community 35 - "Save State Management"
Cohesion: 0.22
Nodes (7): getInitialState(), checkSaveReset(), exportSave(), importSavePayload(), loadProfile(), loadSave(), saveProgress()

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (11): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+3 more)

### Community 38 - "Node TypeScript Config"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.13
Nodes (26): GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalImageAssets, RegistryOverrideEntry (+18 more)

### Community 41 - "Farm Definitions and Upgrades"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 44 - "Community 44"
Cohesion: 0.31
Nodes (3): getEncounterCooldownKey(), LocationRoom, onBattleClaimResolved()

### Community 45 - "Coming Soon Page"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, CardRarity

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): InputAction, controls, MobileDpad(), MobileDpadProps

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (4): isValidStation(), isNonEmptyString(), isValidFutureHooks(), isValidStationDestination()

## Knowledge Gaps
- **256 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `Onboarding and Starter Packs`, `Community 82`, `Battle State and Schema`, `Community 23`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 23` to `Map and Movement Logic`, `Village Scene and Assets`, `Card Activation and Types`, `Creature Journal and Profile`, `State Validation and Schema`, `Save State and Rewards`, `Onboarding and Starter Packs`, `Creature Lifecycle and Attacks`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Colyseus Client Connections`, `Community 20`, `Battle Rewards and Updates`, `Community 26`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Multiplayer Connection Handling` to `Map and Movement Logic`, `Village Scene and Assets`, `Community 34`, `Onboarding and Starter Packs`, `UI Components and Formatting`, `Colyseus Client Connections`, `Type Definitions and States`, `Wild Encounter Spawning`, `Battle Rewards and Updates`, `Community 23`, `Community 26`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.12513842746400886 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.054385964912280704 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.1140819964349376 - nodes in this community are weakly interconnected._