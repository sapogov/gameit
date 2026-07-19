# Graph Report - gameit-issue-59  (2026-07-19)

## Corpus Check
- 115 files · ~312,614 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1141 nodes · 3032 edges · 55 communities (49 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c1561b9`
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
- [[_COMMUNITY_Economy and Theft ADR|Economy and Theft ADR]]
- [[_COMMUNITY_Local Persistence ADR|Local Persistence ADR]]
- [[_COMMUNITY_Location and Battle Rooms ADR|Location and Battle Rooms ADR]]
- [[_COMMUNITY_GitHub Pages Deployment|GitHub Pages Deployment]]
- [[_COMMUNITY_Design System HTML|Design System HTML]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `MonsterRpgSaveState` - 36 edges
3. `getGameMap()` - 35 edges
4. `getSpeciesById()` - 24 edges
5. `createInitialSave()` - 23 edges
6. `canEnterTile()` - 22 edges
7. `convertCreatureCardViaElder()` - 20 edges
8. `MapId` - 20 edges
9. `LocationRoom` - 18 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `toAttackSchema()` --calls--> `getBattleAttackFatigueCost()`  [EXTRACTED]
  server/rooms/BattleRoom.ts → src/games/monster-rpg/sim/battles.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkOverworldVillageEntry()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkOverworldVillageEntry()` --calls--> `movePlayer()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/movement.ts

## Import Cycles
- None detected.

## Communities (55 total, 6 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.05
Nodes (71): isValidCreatureContainerLayout(), getMapById(), createEmptySaveContainers(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isCooldownRecord() (+63 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.06
Nodes (28): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, checkSaveReset(), createProfileState(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult (+20 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.08
Nodes (41): attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult, farmDefinitions (+33 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.06
Nodes (26): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage (+18 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.08
Nodes (40): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason (+32 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.09
Nodes (33): CardDefinition, getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy(), formatCurrencySummary() (+25 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.14
Nodes (34): checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkCreatureJournalStates(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected(), checkOverworldVillageEntry(), checkSdkMultiplayerFlow() (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.06
Nodes (35): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+27 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.09
Nodes (27): toLocationRoomState(), applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap() (+19 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.11
Nodes (3): loadMonsterRpgFonts(), VillageScene, WildEncounterState

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (15): provider, gameRegistry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges (+7 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.16
Nodes (24): abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack(), choosePlayerBattleAttack() (+16 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.14
Nodes (27): attackByPoolId, consumeRequirements(), convertCreatureCardViaElder(), createCreatureCardInstance(), createCreatureRecord(), createNextId(), CreatureLifecycleFailureReason, CreatureLifecycleResult (+19 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.11
Nodes (23): MultiplayerConnection, avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition() (+15 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.11
Nodes (21): PendingTransition, LocationPlayerSchema, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition, Direction, MapId (+13 more)

### Community 17 - "Type Definitions and States"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.16
Nodes (22): ApplyBattleRewardsResult, getCardRewardTable(), getCardRewardTableForSource(), PackOpenTrace, PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, FarmDefinition (+14 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.18
Nodes (22): MAGIC_DUST_CURRENCY_ID, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost(), getVillageElderOnboardingStep() (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (19): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+11 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.13
Nodes (17): checkGen1SpeciesCatalog(), attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity() (+9 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.12
Nodes (16): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.21
Nodes (12): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), markBattleClaimResolved(), markBattleDisconnected() (+4 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.22
Nodes (16): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (4): GameMap, LocationPlayerState, MapKind, RoomPlayerId

### Community 27 - "Admin and Snake Config"
Cohesion: 0.14
Nodes (11): BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, BattleKind, BattleParticipantKind (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 29 - "Location and Player Schema"
Cohesion: 0.22
Nodes (13): bootGame(), BootGameOptions, MonsterRpgGameRuntime, VillageSceneOptions, MonsterRpgSaveRepository, CreatureLabelMode, InputAction, MonsterRpgSaveState (+5 more)

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.19
Nodes (5): getEncounterCooldownKey(), LocationRoom, gameServer, port, JoinLocationOptions

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (15): sanitizeBattleCreature(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString() (+7 more)

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.26
Nodes (11): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPage() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (12): BattleClaim, battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), BattleResolution (+4 more)

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.15
Nodes (12): BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope, EggOrigin, FarmTheftOutcome (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (10): resolveJoinPosition(), findPath(), findPathToAdjacentFacing(), canEnterTile(), getAllowedSpawnsForMap(), getGameMap(), isValidSpawnPosition(), isSafeStationSpawn() (+2 more)

### Community 39 - "Project Documentation"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.38
Nodes (7): checkTapToWalkPathing(), canStandOnTile(), findWalkPath(), findWalkPathToInteractionDistance(), PathOptions, positionKey(), steps

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 43 - "Community 43"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 45 - "Coming Soon Page"
Cohesion: 0.33
Nodes (5): PlayerProfileSchema, AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 46 - "Card and Egg Model ADR"
Cohesion: 0.38
Nodes (6): checkBuildingEntryAndExit(), getExitAt(), getTileAt(), directionDelta, movePlayer(), MovementResult

### Community 48 - "Economy and Theft ADR"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

## Knowledge Gaps
- **193 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MonsterRpgSaveState` connect `Location and Player Schema` to `Map and Movement Logic`, `Village Scene and Assets`, `Battle Room Management`, `Game and Admin Pages`, `Asset Generation Scripts`, `Project Dependencies`, `Creature Journal and Profile`, `UI Components and Formatting`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Species Catalog and Stats`, `Card and Egg Model ADR`, `Main App and UI Pages`, `TypeScript Configuration`, `Battle Rewards and Updates`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `VillageScene` connect `UI Components and Formatting` to `Community 35`, `UI Logo and Sprites`, `Wild Encounter Server ADR`, `Colyseus Client Connections`, `Community 20`, `Battle Rewards and Updates`, `Community 26`, `Location and Player Schema`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Direction` connect `Colyseus Client Connections` to `Village Scene and Assets`, `Asset Generation Scripts`, `Project Dependencies`, `UI Logo and Sprites`, `UI Components and Formatting`, `Card and Egg Model ADR`, `Wild Encounter Server ADR`, `Species Catalog and Stats`, `Main App and UI Pages`, `Battle Rewards and Updates`, `Location and Player Schema`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.06352941176470588 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08078231292517007 - nodes in this community are weakly interconnected._