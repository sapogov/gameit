# Graph Report - gameit-issue-60  (2026-07-19)

## Corpus Check
- 130 files · ~320,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1264 nodes · 3342 edges · 61 communities (54 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47ac252f`
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
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
- `checkSaveReset()` --calls--> `loadProfile()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts
- `checkGen1SpeciesCatalog()` --calls--> `validateSpeciesCatalog()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/speciesCatalog.ts

## Import Cycles
- None detected.

## Communities (61 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.27
Nodes (14): appendGameLogEntry(), beginImportedSaveGameLogSession(), beginProfileGameLogSession(), createGameLogState(), formatGameLogEntry(), GameLogEntry, GameLogKind, gameLogKindLabel (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (57): sanitizeBattleCreature(), checkCreatureJournalStates(), checkGen1SpeciesCatalog(), createWildBattleCreature(), hashString(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered() (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (14): App(), ComingSoonPage, MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage, portalNavigationItems (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (33): BalanceVersionMismatchError, BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectRoomLifecycle(), connectToBattle(), connectToLocation() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (35): canCreatureUseRole(), assignFarmGuard(), attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry() (+27 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (16): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (3): loadMonsterRpgFonts(), VillageScene, WildEncounterState

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (24): GameCard(), Layout(), LayoutProps, getPortalImageSrc(), defaultGames, AdminGameConfigPage(), Props, AdminPage() (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (39): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason (+31 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (14): provider, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges, entriesByRange (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (23): MAGIC_DUST_CURRENCY_ID, createFarmSaveRecord(), buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack(), getStarterCreatureConversionCost() (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): getCreatureCardById(), createProfileState(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isCreatureFainted(), moveCreatureToActiveParty() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (49): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+41 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): PlayerProfileSchema, AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 16 - "Community 16"
Cohesion: 0.23
Nodes (8): Home(), GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), LeaderboardPage(), ComingSoonGamePage()

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (8): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, isAtVillageHospital(), clearProgress(), loadProfile(), loadSaveResult, MovementResult

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (52): checkSaveReset(), isValidCreatureContainerLayout(), hasUnsupportedSchemaVersion(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isCooldownRecord(), isCreatureCardRecord() (+44 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (19): MultiplayerConnection, avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute, generatedTown (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (26): abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack(), choosePlayerBattleAttack() (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (17): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (27): getFarmDefinition(), getFarmTheftAttemptCost(), getFarmUpgradePlan(), getFarmUpgradePreview(), isFarmGuardActive(), isFarmGuardBlockingTheft(), getNextPlayerLevelThreshold(), CardRow (+19 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (20): portalCoverAssetKeys, portalImageAssets, isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride() (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (11): BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, BattleKind, BattleParticipantKind (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (23): getVillageDefinition(), isValidStation(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel() (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (41): ApplyBattleRewardsResult, CardRewardTable, getCardRewardTable(), PackOpenTrace, FarmDefinition, applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards() (+33 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (14): LocationTransitionMessage, PendingTransition, LocationPlayerSchema, LocationStateSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition, Direction (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.27
Nodes (11): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.26
Nodes (11): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPage() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (12): Direction, dirVec, Effects, Item, ItemKind, Point, SnakeEngine, SnakeSnapshot (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (12): BattleClaim, battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getResolvedBattleOutcome() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (8): balanceConfigIssues, BalanceValidationIssue, CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG, GameBalanceConfig, getPath(), validateGameBalanceConfig(), validateNumber()

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (79): resolveJoinPosition(), assertBalanceReject(), checkBalanceCompatibility(), checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkBuildingEntryAndExit(), checkGeneratedMapSdkFlow(), checkHomeVillageEastGateExit() (+71 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (15): assertBalanceVersion(), BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), markBattleClaimResolved() (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.31
Nodes (3): getEncounterCooldownKey(), LocationRoom, onBattleClaimResolved()

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (19): bootGame(), BootGameOptions, MonsterRpgGameRuntime, getGeneratedMapForClient(), VillageSceneOptions, defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings (+11 more)

### Community 65 - "Community 65"
Cohesion: 0.38
Nodes (9): applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString(), updateBattleCreatureOutcome() (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (3): assertBalanceVersion(), sanitizeProfile(), JoinLocationOptions

## Knowledge Gaps
- **211 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 64`, `Community 66`, `Community 35`, `Community 71`, `Community 48`, `Community 21`, `Community 30`, `Community 63`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 63` to `Community 64`, `Community 65`, `Community 1`, `Community 4`, `Community 7`, `Community 9`, `Community 11`, `Community 12`, `Community 48`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 27`, `Community 29`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `FarmSaveRecord` connect `Community 71` to `Community 4`, `Community 12`, `Community 45`, `Community 18`, `Community 19`, `Community 21`, `Community 23`, `Community 29`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06346153846153846 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06859903381642513 - nodes in this community are weakly interconnected._