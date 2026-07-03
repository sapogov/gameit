# Graph Report - gameit  (2026-07-03)

## Corpus Check
- 106 files · ~286,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1118 nodes · 2943 edges · 73 communities (43 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `777b0c2e`
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
- [[_COMMUNITY_Community 12|Community 12]]
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
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Asset Generation Scripts|Asset Generation Scripts]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_UI Logo and Sprites|UI Logo and Sprites]]
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
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `MonsterRpgSaveState` - 36 edges
3. `getGameMap()` - 35 edges
4. `canEnterTile()` - 24 edges
5. `getSpeciesById()` - 24 edges
6. `createInitialSave()` - 23 edges
7. `convertCreatureCardViaElder()` - 20 edges
8. `MapId` - 20 edges
9. `LocationRoom` - 18 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `checkInitialSaveStartsInHomeVillage()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkTapToWalkPathing()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkGen1SpeciesCatalog()` --calls--> `validateSpeciesCatalog()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/speciesCatalog.ts

## Import Cycles
- None detected.

## Communities (73 total, 30 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.07
Nodes (8): MonsterRpgAssetKey, VillageScene, FarmSaveRecord, GameMap, LocationPlayerState, RoomPlayerId, TileType, WildEncounterState

### Community 2 - "Battle Room Management"
Cohesion: 0.21
Nodes (14): AdminPageProps, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema, provider, SnakeGamePage() (+6 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.08
Nodes (39): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason (+31 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.13
Nodes (22): GameCard(), Layout(), LayoutProps, AdminGameConfigPage(), Props, AdminPage(), Props, GamePage() (+14 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.07
Nodes (41): CardDefinition, getVillageDefinition(), getNextPlayerLevelThreshold(), createEmptySaveContainers(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination() (+33 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.11
Nodes (22): MonsterRpgGame(), getCreatureCardById(), createProfileState(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital() (+14 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.07
Nodes (54): toLocationRoomState(), isValidCreatureContainerLayout(), getMapById(), isMapId(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord() (+46 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.06
Nodes (59): sanitizeBattleCreature(), checkGen1SpeciesCatalog(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+51 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.07
Nodes (49): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+41 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.19
Nodes (18): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.11
Nodes (23): avatarIds, directions, hashString(), isFacingFarmPosition(), pendingTransitions, registryErrors, sanitizeFarm(), sanitizeGuardCreature() (+15 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.08
Nodes (39): setCreatureHp(), attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason (+31 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.21
Nodes (15): cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), resolveJoinPosition(), schemaToProfile(), checkBlockedMovement(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit() (+7 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.10
Nodes (6): getInitialState(), moveDeltaByDirection, checkSaveReset(), clearProgress(), loadProfile(), loadSave()

### Community 17 - "Type Definitions and States"
Cohesion: 0.24
Nodes (22): checkBlockedTerrainRejectedOnline(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected(), checkSdkMultiplayerFlow(), checkSharedWildEncounterClaimFlow(), checkTwoClientsShareBuildingInterior(), checkTwoClientsShareWorldMap(), checkWorldToVillageRoomHandoff() (+14 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.14
Nodes (14): provider, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges, entriesByRange (+6 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (21): App(), ComingSoonPage, MonsterRpgGame, navIcons, PortalShell(), SnakeGamePage, portalNavigationItems, PortalNavigationRoute (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (23): MAGIC_DUST_CURRENCY_ID, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost(), getVillageElderOnboardingStep() (+15 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.18
Nodes (17): PendingTransition, LocationTransition, MapId, WorldPosition, canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng (+9 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.15
Nodes (24): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, FarmDefinition, FarmUpgradePreview (+16 more)

### Community 23 - "Community 23"
Cohesion: 0.36
Nodes (6): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.20
Nodes (17): AdminPage(), isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride() (+9 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (19): directionDelta, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, BuildingDefinition, BuildingType, CardType (+11 more)

### Community 27 - "Admin and Snake Config"
Cohesion: 0.12
Nodes (12): Direction, dirVec, Effects, Item, ItemKind, Point, SnakeEngine, SnakeSnapshot (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.19
Nodes (11): monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgSpriteSheetManifest, avatarColors, directionDeltas, EncounterView, FarmView, MapRenderMetrics (+3 more)

### Community 29 - "Location and Player Schema"
Cohesion: 0.31
Nodes (10): checkTapToWalkPathing(), findPath(), findPathToAdjacentFacing(), canEnterTile(), canStandOnTile(), findWalkPath(), findWalkPathToInteractionDistance(), PathOptions (+2 more)

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.47
Nodes (7): checkCreatureJournalStates(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState(), JournalSpeciesViewState

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.19
Nodes (8): LocationPlayerSchema, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, Direction, MapKind, WildEncounterStatus, GameHudProps

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): PlayerProfileSchema, AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (5): numberOrZero(), toArray(), toBattleParticipant(), toBattleRoomState(), toBattleStatus()

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.12
Nodes (25): Home(), GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys (+17 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (7): getEncounterCooldownKey(), LocationRoom, sanitizeProfile(), gameServer, port, normalizeMapId(), JoinLocationOptions

### Community 45 - "Coming Soon Page"
Cohesion: 0.11
Nodes (21): applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap(), createWorldMap() (+13 more)

### Community 82 - "Community 82"
Cohesion: 0.26
Nodes (10): bootGame(), BootGameOptions, MonsterRpgGameRuntime, VillageSceneOptions, InputAction, LocationRoomState, MonsterRpgSaveState, controls (+2 more)

## Knowledge Gaps
- **204 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `Battle State and Schema`, `Community 82`, `Community 23`, `Community 28`, `Location and Player Schema`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 82` to `Village Scene and Assets`, `Battle State and Schema`, `Card Activation and Types`, `Creature Journal and Profile`, `Project Dependencies`, `State Validation and Schema`, `Save State and Rewards`, `Creature Lifecycle and Attacks`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Colyseus Client Connections`, `Type Definitions and States`, `Community 20`, `Battle Rewards and Updates`, `Community 26`, `Community 28`, `Farm and Creature Actions`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Species Catalog and Stats` to `Village Scene and Assets`, `Creature Journal and Profile`, `Project Dependencies`, `State Validation and Schema`, `UI Components and Formatting`, `Community 44`, `Multiplayer Connection Handling`, `Coming Soon Page`, `Colyseus Client Connections`, `Type Definitions and States`, `Community 82`, `Wild Encounter Spawning`, `Battle Rewards and Updates`, `Community 28`, `Location and Player Schema`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.06634615384615385 - nodes in this community are weakly interconnected._
- **Should `Card Activation and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._