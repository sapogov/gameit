# Graph Report - gameit  (2026-07-03)

## Corpus Check
- 95 files · ~282,014 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1054 nodes · 2756 edges · 70 communities (44 shown, 26 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb255cd8`
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
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Node TypeScript Config|Node TypeScript Config]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_UI Logo and Sprites|UI Logo and Sprites]]
- [[_COMMUNITY_Community 41|Community 41]]
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
- [[_COMMUNITY_Community 92|Community 92]]

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

## Communities (70 total, 26 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.06
Nodes (73): toLocationRoomState(), checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkBuildingEntryAndExit(), checkGen1SpeciesCatalog(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected() (+65 more)

### Community 1 - "Village Scene and Assets"
Cohesion: 0.05
Nodes (21): MonsterRpgAssetKey, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgSpriteSheetManifest, avatarColors, directionDeltas, EncounterView, FarmView (+13 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.06
Nodes (55): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+47 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.07
Nodes (42): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason (+34 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.11
Nodes (25): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+17 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.11
Nodes (41): sanitizeBattleCreature(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString() (+33 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.09
Nodes (14): bootGame(), BootGameOptions, MonsterRpgGameRuntime, moveDeltaByDirection, VillageSceneOptions, clearProgress(), CreatureLabelMode, InputAction (+6 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.12
Nodes (30): MonsterRpgGame(), MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, createFarmSaveRecord(), getFarmDefinition(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding() (+22 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.13
Nodes (27): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isAtVillageHospital() (+19 more)

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.14
Nodes (24): createEmptySaveContainers(), isValidStation(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel() (+16 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.13
Nodes (22): isValidCreatureContainerLayout(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isFarmTheftLog(), isIsoDate(), isUniqueStringArray() (+14 more)

### Community 12 - "Game Outcome Formatting"
Cohesion: 0.16
Nodes (22): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), MultiplayerConnection (+14 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.13
Nodes (20): avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition(), pendingTransitions (+12 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.11
Nodes (21): clearFarmGuard(), collectFacingFarm(), FarmCollectionFailureReason, FarmCollectionResult, FarmDefinition, farmDefinitions, FarmGuardAssignmentResult, FarmGuardFailureReason (+13 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.13
Nodes (17): FarmUpgradePlan, getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy(), formatCurrencySummary() (+9 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.09
Nodes (21): BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope, CreatureCardInstance, EggOrigin (+13 more)

### Community 17 - "Type Definitions and States"
Cohesion: 0.17
Nodes (16): getInitialState(), checkCreatureJournalStates(), checkSaveReset(), createProfileState(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen() (+8 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.19
Nodes (10): provider, gameRegistry, readLocal(), LeaderboardProvider, LocalStorageLeaderboardProvider, RemoteLeaderboardProviderStub, GameDefinition, GameId (+2 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 20 - "Snake Game Engine"
Cohesion: 0.14
Nodes (15): attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity(), getSpeciesBySlug() (+7 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.16
Nodes (13): LocationTransitionMessage, PendingTransition, LocationPlayerSchema, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition, MapId (+5 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.16
Nodes (15): Direction, dirVec, Effects, Item, ItemKind, Point, SnakeSnapshot, colors (+7 more)

### Community 23 - "Leaderboard Management"
Cohesion: 0.19
Nodes (6): getEncounterCooldownKey(), LocationRoom, getResolvedBattleOutcome(), removeBattleClaim(), gameServer, port

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.16
Nodes (8): setCreatureHp(), consumeFarmCardRequirements(), consumeMaterialRequirements(), getAccruedFarmRecord(), getFarmStoredQuantity(), getFarmUpgradePlan(), getFarmUpgradePreview(), upgradeFarm()

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 26 - "Creature Party Management"
Cohesion: 0.36
Nodes (9): AdminPage(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema, loadSnakeConfig(), resetSnakeConfig(), saveProfile() (+1 more)

### Community 27 - "Admin and Snake Config"
Cohesion: 0.27
Nodes (11): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+3 more)

### Community 29 - "Location and Player Schema"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.20
Nodes (11): sanitizeGuardCreature(), canCreatureUseRole(), assignFarmGuard(), getFarmTheftAttemptCost(), isFarmGuardActive(), isFarmGuardBlockingTheft(), formatDuration(), formatFarmUpgradeRequirement() (+3 more)

### Community 31 - "Snake Engine Core Logic"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.31
Nodes (10): isCooldownRecord(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord(), isValidFarmPosition() (+2 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.43
Nodes (8): attemptFacingFarmTheft(), createFarmTheftLogEntry(), getFarmTheftCooldown(), getFarmTheftCooldownKey(), getFarmTheftStolenQuantity(), getFarmTheftSuccessChance(), getTargetVillageLevel(), resolveGuardedFarmTheft()

### Community 34 - "Data Validation Utilities"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 35 - "Save State Management"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.33
Nodes (5): PlayerProfileSchema, AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 38 - "Node TypeScript Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 39 - "Project Documentation"
Cohesion: 0.11
Nodes (17): Monster RPG Client README, Monster RPG UI README, UI Sprite Sheet, GameIt Logo Sheet, Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview (+9 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.40
Nodes (3): sanitizeProfile(), normalizeMapId(), JoinLocationOptions

### Community 92 - "Community 92"
Cohesion: 0.11
Nodes (11): App(), ComingSoonPage, Home(), MonsterRpgGame, SnakeGamePage, GameTile(), IconCircleButton(), Props (+3 more)

## Knowledge Gaps
- **190 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `State Validation and Schema`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `State Validation and Schema` to `Map and Movement Logic`, `Village Scene and Assets`, `Battle Room Management`, `Card Activation and Types`, `Creature Journal and Profile`, `Save State and Rewards`, `Onboarding and Starter Packs`, `Creature Lifecycle and Attacks`, `UI Components and Formatting`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Species Catalog and Stats`, `Colyseus Client Connections`, `Type Definitions and States`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Map and Movement Logic` to `Village Scene and Assets`, `State Validation and Schema`, `Save State and Rewards`, `UI Logo and Sprites`, `Onboarding and Starter Packs`, `Creature Lifecycle and Attacks`, `Game Outcome Formatting`, `Multiplayer Connection Handling`, `Admin and Snake Config`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map and Movement Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05658263305322129 - nodes in this community are weakly interconnected._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.05308641975308642 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.061754385964912284 - nodes in this community are weakly interconnected._