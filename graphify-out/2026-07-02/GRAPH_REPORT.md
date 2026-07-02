# Graph Report - gameit-publish-main  (2026-07-02)

## Corpus Check
- 114 files · ~293,927 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1157 nodes · 2948 edges · 82 communities (45 shown, 37 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77f45035`
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
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkGen1SpeciesCatalog()` --calls--> `validateSpeciesCatalog()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/speciesCatalog.ts
- `createState()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `BattleClaim` --references--> `MapId`  [EXTRACTED]
  server/battleRegistry.ts → src/games/monster-rpg/sim/types.ts

## Import Cycles
- None detected.

## Communities (82 total, 37 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.25
Nodes (21): checkBlockedTerrainRejectedOnline(), checkInvalidMapIdRejected(), checkSdkMultiplayerFlow(), checkSharedWildEncounterClaimFlow(), checkTwoClientsShareBuildingInterior(), checkTwoClientsShareWorldMap(), checkWorldToVillageRoomHandoff(), createProfile() (+13 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.05
Nodes (21): MonsterRpgAssetKey, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgSpriteSheetManifest, avatarColors, directionDeltas, EncounterView, FarmView (+13 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.11
Nodes (28): AdminPage(), AdminPageProps, portalCoverAssetKeys, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig (+20 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.08
Nodes (37): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes (+29 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.07
Nodes (43): FarmUpgradePlan, createEmptySaveContainers(), isValidStation(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation() (+35 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.08
Nodes (46): isValidCreatureContainerLayout(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isCooldownRecord(), isCreatureCardRecord(), isEggRecord() (+38 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.06
Nodes (59): sanitizeBattleCreature(), checkGen1SpeciesCatalog(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+51 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.16
Nodes (22): checkBlockedMovement(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkOverworldVillageEntry(), checkTapToWalkPathing(), createState(), findPath(), findPathToAdjacentFacing() (+14 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.05
Nodes (69): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+61 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.17
Nodes (20): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), MultiplayerConnection (+12 more)

### Community 12 - "Game Outcome Formatting"
Cohesion: 0.33
Nodes (5): PortalLogo(), Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.14
Nodes (19): avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, getEncounterCooldownKey(), hashString(), isFacingFarmPosition() (+11 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.09
Nodes (37): attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmSaveRecord(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+29 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.05
Nodes (39): 2026-06-13 - Phase 0 Foundation, 2026-06-13 - Phase 1 Playable Client Slice, 2026-06-13 - Phase 2 Input Follow-Up, 2026-06-13 - Phase 2 Multiplayer Presence, 2026-06-13 - Phase 3 World + Villages, 2026-06-18 - Full Vision Finish Plan, 2026-06-18 - Phase 4 Final QA, 2026-06-18 - Phase 4 Multiplayer Transitions (+31 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.08
Nodes (10): MonsterRpgGame(), moveDeltaByDirection, isAtVillageHospital(), clearFarmGuard(), isVillageElderDialogComplete(), clearProgress(), AvatarId, avatarOptions (+2 more)

### Community 17 - "Type Definitions and States"
Cohesion: 0.08
Nodes (29): toLocationRoomState(), applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap() (+21 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.12
Nodes (16): LeaderboardModal(), provider, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPage(), LeaderboardPageViewModel, LeaderboardRowVm (+8 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (15): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, PortalShell(), SnakeGamePage, portalNavigationItems (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (20): MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getVillageElderOnboardingStep() (+12 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.27
Nodes (11): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+3 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.15
Nodes (16): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards(), ClaimedPlayerLevelReward, ClaimLevelRewardsResult (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (13): bootGame(), BootGameOptions, MonsterRpgGameRuntime, VillageSceneOptions, CardActionResult, OpenPackResult, MonsterRpgSaveRepository, InputAction (+5 more)

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.33
Nodes (11): isAccent(), isKnownValue(), isRecord(), loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText(), resetRegistryOverride() (+3 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.36
Nodes (9): checkCreatureJournalStates(), checkInitialSaveStartsInHomeVillage(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState(), createInitialSave() (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.27
Nodes (8): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode, MovementResult, GameHudProps

### Community 29 - "Location and Player Schema"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, PRD: GameIt Monsters MVP, Problem Statement, Solution, Testing Decisions, User Stories

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.25
Nodes (7): Architecture Boundaries, GameIt Monster RPG Phase 0 Foundation, Initial Contracts, Roadmap, Stack Decisions, Summary, Test Strategy

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (3): sanitizeProfile(), normalizeMapId(), JoinLocationOptions

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.14
Nodes (14): LocationTransitionMessage, PendingTransition, LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (4): getStarterCreatureConversionCost(), starterCreatureCards, VillageElderOnboarding(), VillageElderOnboardingProps

### Community 35 - "Save State Management"
Cohesion: 0.13
Nodes (24): sanitizeGuardCreature(), createProfileState(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isCreatureFainted() (+16 more)

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (4): getInitialState(), checkSaveReset(), loadProfile(), loadSave()

### Community 38 - "Node TypeScript Config"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.15
Nodes (23): GameTile(), gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalImageAssets, RegistryOverrideEntry, defaultLibraryFilters (+15 more)

### Community 41 - "Farm Definitions and Upgrades"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (5): LocationRoom, removeBattleClaim(), gameServer, port, ResolveWildEncounterMessage

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, CardRarity

## Knowledge Gaps
- **255 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+250 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `Community 28`, `Community 23`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 23` to `Map and Movement Logic`, `Village Scene and Assets`, `Community 34`, `Card Activation and Types`, `Save State Management`, `Creature Journal and Profile`, `State Validation and Schema`, `Save State and Rewards`, `Onboarding and Starter Packs`, `Creature Lifecycle and Attacks`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Colyseus Client Connections`, `Community 20`, `Battle Rewards and Updates`, `Community 26`, `Community 28`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Onboarding and Starter Packs` to `Map and Movement Logic`, `Village Scene and Assets`, `Save State Management`, `Creature Journal and Profile`, `UI Components and Formatting`, `Multiplayer Connection Handling`, `Colyseus Client Connections`, `Type Definitions and States`, `Wild Encounter Spawning`, `Community 23`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _255 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.05308641975308642 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.10810810810810811 - nodes in this community are weakly interconnected._
- **Should `Card Activation and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08478513356562137 - nodes in this community are weakly interconnected._