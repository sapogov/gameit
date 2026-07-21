# Graph Report - issue-64  (2026-07-20)

## Corpus Check
- 142 files · ~330,396 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1384 nodes · 3722 edges · 71 communities (62 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17847a51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `getGameMap()` - 38 edges
3. `MonsterRpgSaveState` - 36 edges
4. `getSpeciesById()` - 27 edges
5. `createInitialSave()` - 25 edges
6. `canEnterTile()` - 23 edges
7. `convertCreatureCardViaElder()` - 20 edges
8. `MapId` - 20 edges
9. `LocationRoom` - 18 edges
10. `GAME_BALANCE_CONFIG` - 17 edges

## Surprising Connections (you probably didn't know these)
- `checkSaveReset()` --calls--> `loadProfile()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkTapToWalkPathing()` --calls--> `findWalkPath()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/pathfinding.ts
- `checkTapToWalkPathing()` --calls--> `findWalkPathToInteractionDistance()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/pathfinding.ts

## Import Cycles
- None detected.

## Communities (71 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (55): assertBalanceVersion(), BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), BattleCreatureSchema (+47 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (48): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (48): BattleClaim, BattleResolution, CardRewardTable, FarmDefinition, MonsterRpgSaveRepository, AttackPoolId, BattleCreatureState, BattleMaterialReward (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (43): assertBalanceReject(), checkBalanceCompatibility(), checkBlockedTerrainRejectedOnline(), checkCreatureJournalStates(), checkGen1SpeciesCatalog(), checkGeneratedMapSdkFlow(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected() (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (43): ApplyBattleRewardsResult, activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (30): applyBattleRewardsToSave(), applyRewardNumbers(), CLINKS_CURRENCY_ID, COMMON_CLINKS_ENTRIES, generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (25): AdminPageProps, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema, Direction, dirVec (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (32): sanitizeBattleCreature(), createWildBattleCreature(), hashString(), attackByPoolId, consumeRequirements(), convertCreatureCardViaElder(), createCreatureCardInstance(), createCreatureRecord() (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (12): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, PlayerProfileSchema, isAtVillageHospital(), clearProgress(), loadProfile(), loadSaveResult (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (27): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, joinWithBalanceError(), LeaveConnection, LifecyclePhase, MultiplayerConnection (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (28): addStats(), appendStatGrowth(), applyCreatureExperience(), createLevelGrowthEvent(), getCreatureLevelForExperience(), getGrowth(), getGrowthDeltas(), getSpeciesPreferredStat() (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (23): createEmptySaveContainers(), exportSave(), hasUnsupportedSchemaVersion(), hasValidLegacyCurrencies(), importSavePayload(), isPlainObject(), localMonsterRpgSaveRepository, migrateCreatureStatGrowth() (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (15): provider, gameRegistry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (23): MAGIC_DUST_CURRENCY_ID, createFarmSaveRecord(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost() (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (25): clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), FarmCollectionFailureReason, FarmCollectionResult, farmDefinitions, FarmGuardAssignmentResult (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (23): addItem(), createItemInventory(), discardItem(), InventoryResult, ItemInventory, ItemStack, requiredAdditionalSlots(), getItemDefinition() (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (21): applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap(), createWorldMap() (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (14): App(), ComingSoonPage, MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage, portalNavigationItems (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (19): CardDefinition, FarmUpgradePlan, getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (14): BalanceVersionMismatchError, connectRoomLifecycle(), connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage, battleHarness(), ErrorHandler (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (19): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (17): assertBalanceVersion(), avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute, generatedTown (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (18): AdminPage(), isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride() (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (17): PendingTransition, LocationTransition, MapId, WorldPosition, canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (16): attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity(), getSpeciesBySlug() (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (13): GameTile(), genreLabels, defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (17): getVillageDefinition(), confirmStationTravel(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId(), getStationContextLevel() (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (17): toLocationRoomState(), checkBlockedMovement(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkOverworldVillageEntry(), checkTapToWalkPathing(), createState(), findPath() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (7): getEncounterCooldownKey(), isFacingFarmPosition(), LocationRoom, sanitizeFarm(), sanitizeGuardCreature(), schemaToProfile(), onBattleClaimResolved()

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (14): appendGameLogEntry(), beginImportedSaveGameLogSession(), beginProfileGameLogSession(), createGameLogState(), formatGameLogEntry(), GameLogEntry, GameLogKind, gameLogKindLabel (+6 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (13): getCardRewardTable(), applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards(), ClaimedPlayerLevelReward, ClaimLevelRewardsResult, getPlayerLevelForExperience(), PLAYER_LEVEL_REWARDS (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (16): isValidCreatureContainerLayout(), getMapById(), isMapId(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isFarmTheftLog(), isUniqueStringArray() (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (10): Home(), getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys, portalImageAssets, LeaderboardPage(), ComingSoonGamePage() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (10): getGeneratedMapForServer(), toSquareGridMap(), moveOnSquareGrid(), canStandOnTile(), findSquareGridPath(), findWalkPath(), findWalkPathToInteractionDistance(), PathOptions (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (9): setCreatureHp(), assignFarmGuard(), getFarmDefinition(), getFarmUpgradePlan(), getFarmUpgradePreview(), isFarmGuardActive(), formatFarmUpgradeRequirement(), formatMaterialId() (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.23
Nodes (9): BattleAttackSchema, BattleParticipantSchema, BattleStateSchema, GameBalanceConfig, BattleKind, BattleParticipantKind, BattleStatus, CreatureStatKey (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (9): battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getBattleStateSeed(), getResolvedBattleOutcome() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.26
Nodes (9): canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isCreatureFainted(), moveCreatureToActiveParty(), moveCreatureToStorage() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (12): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (8): bootGame(), BootGameOptions, MonsterRpgGameRuntime, getGeneratedMapForClient(), InputAction, controls, MobileDpad(), MobileDpadProps

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (6): LocationPlayerSchema, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, Direction, WildEncounterStatus

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 53 - "Community 53"
Cohesion: 0.38
Nodes (10): attemptFacingFarmTheft(), createFarmTheftLogEntry(), getFarmTheftAttemptCost(), getFarmTheftCooldown(), getFarmTheftCooldownKey(), getFarmTheftStolenQuantity(), getTargetVillageLevel(), isFarmGuardBlockingTheft() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (8): canonicalDefinitions, isItemId(), ITEM_CATALOG, ITEM_DEFINITIONS, itemById, ItemDefinition, validateItemCatalog(), isValidItemInventory()

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 56 - "Community 56"
Cohesion: 0.36
Nodes (6): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

## Knowledge Gaps
- **224 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 4`, `Community 39`, `Community 42`, `Community 12`, `Community 49`, `Community 50`, `Community 51`, `Community 24`, `Community 56`, `Community 59`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 22`, `Community 24`, `Community 25`, `Community 31`, `Community 32`, `Community 36`, `Community 47`, `Community 50`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `Direction` connect `Community 51` to `Community 32`, `Community 2`, `Community 3`, `Community 7`, `Community 39`, `Community 11`, `Community 50`, `Community 24`, `Community 25`, `Community 27`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0590990990990991 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07130333138515488 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07918367346938776 - nodes in this community are weakly interconnected._