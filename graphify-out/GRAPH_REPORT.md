# Graph Report - issue-64  (2026-07-21)

## Corpus Check
- 156 files · ~337,676 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1499 nodes · 4134 edges · 70 communities (60 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `687c5f62`
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
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `getGameMap()` - 41 edges
3. `MonsterRpgSaveState` - 41 edges
4. `reduce()` - 27 edges
5. `createInitialSave()` - 27 edges
6. `getSpeciesById()` - 27 edges
7. `canEnterTile()` - 24 edges
8. `convertCreatureCardViaElder()` - 22 edges
9. `LocationRoom` - 21 edges
10. `MapId` - 21 edges

## Surprising Connections (you probably didn't know these)
- `CanonicalPlayer` --references--> `AuthoritySnapshot`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/network/authorityProtocol.ts
- `checkSaveReset()` --calls--> `loadProfile()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkOverworldVillageEntry()` --calls--> `movePlayer()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/movement.ts
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts

## Import Cycles
- None detected.

## Communities (70 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (42): assertBalanceVersion(), authenticateBattleJoin(), BattleRoom, copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (48): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (44): CardRewardTable, FarmDefinition, AttackPoolId, BaseStatTendencies, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (32): assertBalanceReject(), canonicalPlayerFor(), canonicalPlayersByProfileId, checkBalanceCompatibility(), checkBlockedTerrainRejectedOnline(), checkGeneratedMapSdkFlow(), checkInvalidMapIdRejected(), checkSdkMultiplayerFlow() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (14): Home(), GameTile(), genreLabels, gameRegistry, getFeaturedGame(), getPortalImageAsset(), getPortalImageSrc(), portalCoverAssetKeys (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (30): applyBattleRewardsToSave(), applyRewardNumbers(), CLINKS_CURRENCY_ID, COMMON_CLINKS_ENTRIES, generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (3): MonsterRpgAssetKey, VillageScene, TileType

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (22): GameCard(), Layout(), LayoutProps, AdminGameConfigPage(), Props, AdminPage(), Props, GamePage() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (67): sanitizeBattleCreature(), createWildBattleCreature(), activateBuffCard(), activateCreatureCardViaElder(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason (+59 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (26): AuthenticatedExportEnvelope, AuthenticatedImportResult, AuthenticatedSaveExport, FrozenParty, isRecord(), matchesPresent(), Principal, reduce() (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (28): BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, joinWithBalanceError(), LeaveConnection, LifecyclePhase, MultiplayerConnection (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (41): balanceConfigIssues, BalanceValidationIssue, creatureTypes, GAME_BALANCE_CONFIG, getPath(), growthStatKeys, rarities, RewardChanceBalanceEntry (+33 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (37): toLocationRoomState(), isValidCreatureContainerLayout(), getMapById(), isMapId(), hasUnsupportedSchemaVersion(), hasValidLegacyCurrencies(), isAvatarId(), isBooleanRecord() (+29 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (14): provider, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges, entriesByRange (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (49): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, loadGuestCredential(), PlayerProfileSchema, getCreatureCardById(), MAGIC_DUST_CURRENCY_ID, buildStarterMagicDustFarm() (+41 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (59): attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmSaveRecord(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+51 more)

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (13): addItem(), createItemInventory(), discardItem(), InventoryResult, ItemInventory, ItemStack, requiredAdditionalSlots(), getItemDefinition() (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (21): applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap(), createWorldMap() (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (15): App(), ComingSoonPage, MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage, portalNavigationItems (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (14): claimReward(), enqueueReward(), hasOwnRecordKey(), isIsoTimestamp(), isRecord(), isValidRewardBundle(), isValidRewardSourceId(), requiredBundleSlots() (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (16): AccountReady, BalanceVersionMismatchError, connectRoomLifecycle(), connectToAccount(), connectToBattle(), connectToLocation(), getServerUrl(), LocationTransitionMessage (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (19): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (17): constantTimeEqual(), GuestCredentialClaims, GuestCredentialKey, issueGuestCredential(), isUuid(), loadGuestCredentialConfig(), loadGuestCredentialTtlSeconds(), sign() (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (16): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (12): BattleAttackSchema, BattleParticipantSchema, BattleStateSchema, BattleClaim, GameBalanceConfig, MonsterRpgSaveRepository, BattleKind, BattleParticipantKind (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (15): attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity(), getSpeciesBySlug() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (10): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPageProps (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (17): getVillageDefinition(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId() (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (13): checkBlockedMovement(), checkBuildingEntryAndExit(), checkGen1SpeciesCatalog(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkOverworldVillageEntry(), checkSaveReset(), createState() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (56): assertBalanceVersion(), authenticateLocationJoin(), avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute (+48 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (13): emptyAggregate(), PlayerAuthority, rebindSave(), rosterChanged(), snapshot(), validateAuthenticatedSaveOwnership(), AuthoritySnapshot, SaveCommand (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (15): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards(), ClaimedPlayerLevelReward, ClaimLevelRewardsResult (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (10): createSecureWebSocketTransport(), installTrustedProxyHttpGuard(), isTrustedProxyRequest(), loadProductionTransport(), parsePublicOrigin(), ProductionTransport, gameServer, port (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (12): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (13): checkTapToWalkPathing(), SquareGridMapAdapter, canEnterTile(), getExitAt(), getTileAt(), directionDelta, movePlayer(), canStandOnTile() (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (10): deepFreeze(), clone(), IntentReceipt, PlayerAggregate, PlayerAuthorityRepository, ProcessLocalPlayerAuthorityRepository, CardActionResult, OpenPackResult (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (10): AUTHORITY_PROTOCOL_VERSION, AuthorityIntent, AuthorityIntentType, AuthorityRejectCode, CorrelatedAuthorityRequest, CorrelatedAuthorityResult, intentTypes, parseCorrelatedAuthorityRequest() (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.26
Nodes (11): checkCreatureJournalStates(), WILD_BATTLE_REWARD_TABLES, createProfileState(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState() (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (7): GuestCredentialConfig, AuthenticatedTransferEnvelope, canonical(), equal(), mac(), signAuthenticatedTransfer(), verifyAuthenticatedTransfer()

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (8): canonicalDefinitions, isItemId(), ITEM_CATALOG, ITEM_DEFINITIONS, itemById, ItemDefinition, validateItemCatalog(), isValidItemInventory()

### Community 50 - "Community 50"
Cohesion: 0.19
Nodes (12): bootGame(), BootGameOptions, MonsterRpgGameRuntime, getGeneratedMapForClient(), getGeneratedMapForServer(), toSquareGridMap(), moveOnSquareGrid(), findSquareGridPath() (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 56 - "Community 56"
Cohesion: 0.36
Nodes (6): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

## Knowledge Gaps
- **243 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+238 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 39`, `Community 40`, `Community 12`, `Community 45`, `Community 49`, `Community 50`, `Community 53`, `Community 54`, `Community 24`, `Community 56`, `Community 59`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 40` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 24`, `Community 27`, `Community 31`, `Community 33`, `Community 35`, `Community 36`, `Community 39`, `Community 42`, `Community 43`, `Community 50`, `Community 59`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Community 32` to `Community 33`, `Community 2`, `Community 3`, `Community 39`, `Community 11`, `Community 12`, `Community 43`, `Community 14`, `Community 16`, `Community 50`, `Community 19`, `Community 24`, `Community 59`, `Community 31`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07130333138515488 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._