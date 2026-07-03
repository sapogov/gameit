# Graph Report - gameit-publish-main  (2026-07-03)

## Corpus Check
- 114 files · ~294,852 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1161 nodes · 2958 edges · 77 communities (40 shown, 37 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b444f8de`
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
- [[_COMMUNITY_Location and Player Schema|Location and Player Schema]]
- [[_COMMUNITY_Farm and Creature Actions|Farm and Creature Actions]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_TypeScript Compiler Settings|TypeScript Compiler Settings]]
- [[_COMMUNITY_Battle State and Schema|Battle State and Schema]]
- [[_COMMUNITY_Asset Generation Scripts|Asset Generation Scripts]]
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
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

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
- `checkHomeVillageEastGateExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkBuildingEntryAndExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkBlockedMovement()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts

## Import Cycles
- None detected.

## Communities (77 total, 37 thin omitted)

### Community 0 - "Map and Movement Logic"
Cohesion: 0.33
Nodes (5): PortalLogo(), Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 1 - "Village Scene and Assets"
Cohesion: 0.05
Nodes (22): MonsterRpgAssetKey, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgSpriteSheetManifest, avatarColors, directionDeltas, EncounterView, FarmView (+14 more)

### Community 2 - "Battle Room Management"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 3 - "Card Activation and Types"
Cohesion: 0.09
Nodes (34): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes (+26 more)

### Community 4 - "Game and Admin Pages"
Cohesion: 0.09
Nodes (30): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+22 more)

### Community 5 - "Creature Journal and Profile"
Cohesion: 0.06
Nodes (46): CardDefinition, getNextPlayerLevelThreshold(), createEmptySaveContainers(), isValidStation(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination() (+38 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+26 more)

### Community 7 - "State Validation and Schema"
Cohesion: 0.07
Nodes (49): cardRarities, isValidCreatureContainerLayout(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isCooldownRecord(), isCreatureCardRecord() (+41 more)

### Community 8 - "Save State and Rewards"
Cohesion: 0.07
Nodes (58): sanitizeBattleCreature(), checkGen1SpeciesCatalog(), applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+50 more)

### Community 9 - "Onboarding and Starter Packs"
Cohesion: 0.50
Nodes (4): PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, CardRarity

### Community 10 - "Creature Lifecycle and Attacks"
Cohesion: 0.06
Nodes (55): BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleAttackSchema, BattleCreatureSchema (+47 more)

### Community 11 - "UI Components and Formatting"
Cohesion: 0.19
Nodes (18): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+10 more)

### Community 13 - "Multiplayer Connection Handling"
Cohesion: 0.13
Nodes (20): avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition(), pendingTransitions (+12 more)

### Community 14 - "Farm Management and Theft"
Cohesion: 0.07
Nodes (44): attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmSaveRecord(), createFarmTheftLogEntry(), FarmCollectionFailureReason (+36 more)

### Community 15 - "Species Catalog and Stats"
Cohesion: 0.05
Nodes (39): 2026-06-13 - Phase 0 Foundation, 2026-06-13 - Phase 1 Playable Client Slice, 2026-06-13 - Phase 2 Input Follow-Up, 2026-06-13 - Phase 2 Multiplayer Presence, 2026-06-13 - Phase 3 World + Villages, 2026-06-18 - Full Vision Finish Plan, 2026-06-18 - Phase 4 Final QA, 2026-06-18 - Phase 4 Multiplayer Transitions (+31 more)

### Community 16 - "Colyseus Client Connections"
Cohesion: 0.09
Nodes (8): MonsterRpgGame(), moveDeltaByDirection, isAtVillageHospital(), clearProgress(), AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 17 - "Type Definitions and States"
Cohesion: 0.07
Nodes (58): getInitialState(), checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkBuildingEntryAndExit(), checkCreatureJournalStates(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected() (+50 more)

### Community 18 - "Main App and UI Pages"
Cohesion: 0.18
Nodes (9): LeaderboardModal(), provider, entriesByRange, LeaderboardProvider, LocalStorageLeaderboardProvider, RemoteLeaderboardProviderStub, GameId, LeaderboardEntry (+1 more)

### Community 19 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (15): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, PortalShell(), SnakeGamePage, portalNavigationItems (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (27): MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost() (+19 more)

### Community 21 - "Wild Encounter Spawning"
Cohesion: 0.18
Nodes (17): PendingTransition, LocationTransition, MapId, WorldPosition, canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng (+9 more)

### Community 22 - "Battle Rewards and Updates"
Cohesion: 0.12
Nodes (31): ApplyBattleRewardsResult, CardActionResult, getCardRewardTable(), OpenPackResult, PackOpenTrace, canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult (+23 more)

### Community 23 - "Community 23"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 24 - "Battle Claim and Resolution"
Cohesion: 0.30
Nodes (12): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+4 more)

### Community 25 - "Game Initialization and Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (18): MultiplayerConnection, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, ClaimGuardedFarmTheftMessage, ClaimWildEncounterMessage (+10 more)

### Community 29 - "Location and Player Schema"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, PRD: GameIt Monsters MVP, Problem Statement, Solution, Testing Decisions, User Stories

### Community 30 - "Farm and Creature Actions"
Cohesion: 0.25
Nodes (7): Architecture Boundaries, GameIt Monster RPG Phase 0 Foundation, Initial Contracts, Roadmap, Stack Decisions, Summary, Test Strategy

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (8): battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getResolvedBattleOutcome(), removeBattleClaim()

### Community 32 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 33 - "Battle State and Schema"
Cohesion: 0.22
Nodes (6): LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, MapKind, WildEncounterStatus

### Community 36 - "Asset Generation Scripts"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 38 - "Node TypeScript Config"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 40 - "UI Logo and Sprites"
Cohesion: 0.12
Nodes (26): GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys, portalImageAssets (+18 more)

### Community 41 - "Farm Definitions and Upgrades"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 44 - "Community 44"
Cohesion: 0.31
Nodes (3): getEncounterCooldownKey(), LocationRoom, onBattleClaimResolved()

### Community 45 - "Coming Soon Page"
Cohesion: 0.09
Nodes (28): toLocationRoomState(), applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap() (+20 more)

### Community 82 - "Community 82"
Cohesion: 0.27
Nodes (9): bootGame(), BootGameOptions, MonsterRpgGameRuntime, CreatureLabelMode, InputAction, LocationRoomState, controls, MobileDpad() (+1 more)

## Knowledge Gaps
- **257 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Village Scene and Assets` to `Type Definitions and States`, `Community 82`, `Battle Rewards and Updates`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Battle Rewards and Updates` to `Village Scene and Assets`, `Card Activation and Types`, `Creature Journal and Profile`, `State Validation and Schema`, `Save State and Rewards`, `Creature Lifecycle and Attacks`, `Multiplayer Connection Handling`, `Farm Management and Theft`, `Colyseus Client Connections`, `Type Definitions and States`, `Community 82`, `Community 20`, `Community 26`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Direction` connect `Village Scene and Assets` to `Battle State and Schema`, `Multiplayer Connection Handling`, `Colyseus Client Connections`, `Type Definitions and States`, `Community 82`, `Wild Encounter Spawning`, `Battle Rewards and Updates`, `Community 26`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Village Scene and Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.051189400782896716 - nodes in this community are weakly interconnected._
- **Should `Battle Room Management` be split into smaller, more focused modules?**
  _Cohesion score 0.1126984126984127 - nodes in this community are weakly interconnected._
- **Should `Card Activation and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.09446693657219973 - nodes in this community are weakly interconnected._