# Graph Report - gameit-issue-59  (2026-07-19)

## Corpus Check
- 111 files · ~311,907 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1150 nodes · 2998 edges · 82 communities (47 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `085f73c1`
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
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_UI Logo and Sprites|UI Logo and Sprites]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
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
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
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
- `checkOverworldVillageEntry()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkHomeVillageEastGateExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkBuildingEntryAndExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkBlockedMovement()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts

## Import Cycles
- None detected.

## Communities (82 total, 35 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.06
Nodes (35): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+27 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.14
Nodes (3): MonsterRpgAssetKey, VillageScene, TileType

### Community 2 - "Battle Room Management"
Cohesion: 0.12
Nodes (25): AdminPageProps, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema, Direction, dirVec (+17 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.10
Nodes (31): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes (+23 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.07
Nodes (42): CardDefinition, getNextPlayerLevelThreshold(), createEmptySaveContainers(), importSavePayload(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination() (+34 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.18
Nodes (20): ApplyBattleRewardsResult, getCardRewardTable(), getCardRewardTableForSource(), PackOpenTrace, PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, applyPlayerExperience() (+12 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.11
Nodes (28): toLocationRoomState(), isValidCreatureContainerLayout(), getMapById(), isMapId(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord() (+20 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.14
Nodes (11): BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, BattleKind, BattleParticipantKind (+3 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.05
Nodes (87): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), sanitizeBattleCreature(), BattleClaim (+79 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.27
Nodes (10): PendingTransition, checkTapToWalkPathing(), LocationTransition, canStandOnTile(), findWalkPath(), findWalkPathToInteractionDistance(), PathOptions, positionKey() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (16): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+8 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.07
Nodes (44): attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+36 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.06
Nodes (43): MultiplayerConnection, avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, getEncounterCooldownKey(), hashString() (+35 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.19
Nodes (18): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+10 more)

### Community 17 - "Type Definitions and States"
Cohesion: 0.25
Nodes (21): checkBlockedTerrainRejectedOnline(), checkInvalidMapIdRejected(), checkSdkMultiplayerFlow(), checkSharedWildEncounterClaimFlow(), checkTwoClientsShareBuildingInterior(), checkTwoClientsShareWorldMap(), checkWorldToVillageRoomHandoff(), createProfile() (+13 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.10
Nodes (22): LeaderboardModal(), provider, RegistryOverrideEntry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPage(), LeaderboardPageViewModel (+14 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (17): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (27): MonsterRpgGame(), MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, isAtVillageHospital(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards() (+19 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.16
Nodes (19): WorldPositionSchema, findPath(), findPathToAdjacentFacing(), canEnterTile(), getAllowedSpawnsForMap(), getGameMap(), Direction, MapId (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (6): getInitialState(), checkSaveReset(), exportSave(), loadProfile(), loadSave(), saveProgress()

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.24
Nodes (14): AdminPage(), isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride() (+6 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (17): checkGen1SpeciesCatalog(), attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.28
Nodes (10): checkCreatureJournalStates(), checkInitialSaveStartsInHomeVillage(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState(), createInitialSave() (+2 more)

### Community 29 - "Location and Player Schema"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.33
Nodes (5): PortalLogo(), Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (3): loadMonsterRpgFonts(), VillageSceneOptions, GameMap

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.25
Nodes (10): checkBlockedMovement(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkOverworldVillageEntry(), createState(), getExitAt(), getTileAt(), getVillageDefinition() (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (19): CardActionResult, OpenPackResult, createProfileState(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (22): BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope, CreatureCardInstance, EggOrigin (+14 more)

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (9): bootGame(), BootGameOptions, MonsterRpgGameRuntime, CreatureLabelMode, InputAction, LocationRoomState, controls, MobileDpad() (+1 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.15
Nodes (18): GameTile(), genreLabels, gameRegistry, getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys, portalImageAssets, defaultLibraryFilters (+10 more)

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (11): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 43 - "Community 43"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 45 - "Coming Soon Page"
Cohesion: 0.09
Nodes (25): applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap(), createWorldMap() (+17 more)

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (4): AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

## Knowledge Gaps
- **218 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MonsterRpgSaveState` connect `Community 34` to `Village Scene and Assets`, `Battle State and Schema`, `Card Activation and Types`, `Community 35`, `Creature Journal and Profile`, `Community 38`, `Project Dependencies`, `State Validation and Schema`, `Creature Lifecycle and Attacks`, `Community 12`, `Farm Management and Theft`, `Species Catalog and Stats`, `Type Definitions and States`, `Community 20`, `Battle Rewards and Updates`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `VillageScene` connect `Village Scene and Assets` to `Community 34`, `Community 37`, `Community 38`, `Community 71`, `Community 75`, `Community 12`, `Community 76`, `UI Components and Formatting`, `Wild Encounter Spawning`, `Community 31`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Direction` connect `Wild Encounter Spawning` to `Village Scene and Assets`, `Battle State and Schema`, `Community 35`, `Project Dependencies`, `Community 38`, `Community 75`, `Community 12`, `UI Components and Formatting`, `Species Catalog and Stats`, `Type Definitions and States`, `Battle Rewards and Updates`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._