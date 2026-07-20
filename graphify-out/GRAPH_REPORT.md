# Graph Report - gameit-issue-60  (2026-07-19)

## Corpus Check
- 130 files · ~320,987 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1267 nodes · 3354 edges · 69 communities (60 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8914e459`
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
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
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
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `getGameMap()` - 38 edges
3. `MonsterRpgSaveState` - 36 edges
4. `createInitialSave()` - 24 edges
5. `getSpeciesById()` - 24 edges
6. `canEnterTile()` - 23 edges
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
- `checkHomeVillageEastGateExit()` --calls--> `getGameMap()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts

## Import Cycles
- None detected.

## Communities (69 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (28): toLocationRoomState(), applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (25): attackByPoolId, consumeRequirements(), convertCreatureCardViaElder(), createCreatureRecord(), createDirectDropEgg(), createNextId(), CreatureLifecycleFailureReason, CreatureLifecycleResult (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (15): App(), ComingSoonPage, MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage, portalNavigationItems (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (35): BalanceVersionMismatchError, BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectRoomLifecycle(), connectToBattle(), connectToLocation() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (42): attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult, FarmDefinition (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (3): loadMonsterRpgFonts(), VillageScene, WildEncounterState

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (22): GameCard(), Layout(), LayoutProps, AdminGameConfigPage(), Props, AdminPage(), Props, GamePage() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (35): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes (+27 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (14): provider, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges, entriesByRange (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (24): MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, createFarmSaveRecord(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (7): checkSaveReset(), exportSave(), importSavePayload(), loadProfile(), loadSave(), localMonsterRpgSaveRepository, saveProgress()

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (48): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+40 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (16): checkGen1SpeciesCatalog(), attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity() (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (14): Home(), GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (10): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, clearFarmGuard(), clearProgress(), loadSaveResult, AvatarId, avatarOptions (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (32): isValidCreatureContainerLayout(), createEmptySaveContainers(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isFarmTheftLog(), isIsoDate() (+24 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (25): avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute, generatedTown, hashString() (+17 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (25): abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack(), choosePlayerBattleAttack() (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (34): getNextPlayerLevelThreshold(), MovementResult, CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy(), formatCurrencySummary() (+26 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (16): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (11): BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, BattleKind, BattleParticipantKind (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (18): confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId(), getStationContextLevel() (+10 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (16): AttackPoolId, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope, EggOrigin (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (35): ApplyBattleRewardsResult, getCardRewardTable(), getCardRewardTableForSource(), getCreatureCardById(), PackOpenTrace, createProfileState(), canCreatureUseRole(), CreaturePartyFailureReason (+27 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (6): LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, MapKind, WildEncounterStatus

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (18): LocationTransitionMessage, PendingTransition, LocationTransition, MapId, WorldPosition, canTargetEncounter(), clamp01(), createWildEncounterSpawn() (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (10): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPageProps (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (14): checkBlockedMovement(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkOverworldVillageEntry(), createState(), findPath(), findPathToAdjacentFacing(), SquareGridMapAdapter (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (10): BootGameOptions, CardActionResult, OpenPackResult, MonsterRpgSaveRepository, InputAction, MonsterRpgSaveState, controls, MobileDpad() (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 44 - "Community 44"
Cohesion: 0.35
Nodes (8): checkTapToWalkPathing(), canStandOnTile(), findSquareGridPath(), findWalkPath(), findWalkPathToInteractionDistance(), PathOptions, positionKey(), steps

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (13): BattleClaim, battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getResolvedBattleOutcome() (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (8): balanceConfigIssues, BalanceValidationIssue, CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG, GameBalanceConfig, getPath(), validateGameBalanceConfig(), validateNumber()

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (28): assertBalanceReject(), checkBalanceCompatibility(), checkBlockedTerrainRejectedOnline(), checkGeneratedMapSdkFlow(), checkInitialSaveStartsInHomeVillage(), checkInvalidMapIdRejected(), checkSdkMultiplayerFlow(), checkSharedWildEncounterClaimFlow() (+20 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (14): assertBalanceVersion(), BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), markBattleClaimResolved() (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.31
Nodes (10): isCooldownRecord(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord(), isValidFarmPosition() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (4): getEncounterCooldownKey(), LocationRoom, removeBattleClaim(), ResolveWildEncounterMessage

### Community 53 - "Community 53"
Cohesion: 0.47
Nodes (7): checkCreatureJournalStates(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState(), JournalSpeciesViewState

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (4): isValidStation(), isNonEmptyString(), isValidFutureHooks(), isValidStationDestination()

### Community 63 - "Community 63"
Cohesion: 0.36
Nodes (6): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (13): applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString(), updateBattleCreatureOutcome() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.15
Nodes (17): bootGame(), MonsterRpgGameRuntime, getGeneratedMapForClient(), assertBalanceVersion(), resolveJoinPosition(), sanitizeProfile(), getGeneratedMapForServer(), toSquareGridMap() (+9 more)

## Knowledge Gaps
- **211 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 64`, `Community 66`, `Community 35`, `Community 70`, `Community 71`, `Community 42`, `Community 44`, `Community 21`, `Community 63`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 42` to `Community 1`, `Community 4`, `Community 7`, `Community 9`, `Community 11`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 27`, `Community 28`, `Community 29`, `Community 41`, `Community 48`, `Community 53`, `Community 64`, `Community 65`, `Community 70`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0855614973262032 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13105413105413105 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0673758865248227 - nodes in this community are weakly interconnected._