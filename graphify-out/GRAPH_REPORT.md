# Graph Report - issue-65  (2026-07-21)

## Corpus Check
- 166 files · ~354,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1635 nodes · 4599 edges · 74 communities (65 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22490f70`
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
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 67 edges
2. `getGameMap()` - 46 edges
3. `MonsterRpgSaveState` - 42 edges
4. `createInitialSave()` - 36 edges
5. `PlayerAuthority` - 30 edges
6. `reduce()` - 28 edges
7. `createPlayerProfile()` - 28 edges
8. `getSpeciesById()` - 27 edges
9. `LocationRoom` - 26 edges
10. `AuthoritySnapshot` - 26 edges

## Surprising Connections (you probably didn't know these)
- `toAttackSchema()` --calls--> `getBattleAttackFatigueCost()`  [EXTRACTED]
  server/rooms/BattleRoom.ts → src/games/monster-rpg/sim/battles.ts
- `CanonicalPlayer` --references--> `AuthoritySnapshot`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/network/authorityProtocol.ts
- `checkSaveReset()` --calls--> `loadProfile()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkHomeVillageEastGateExit()` --calls--> `getVillageDefinition()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/maps.ts

## Import Cycles
- None detected.

## Communities (74 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (27): abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack(), choosePlayerBattleAttack() (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (14): AuthenticatedExportEnvelope, AuthenticatedImportResult, AuthenticatedSaveExport, AuthorityMutationContext, Principal, reduce(), toItemInventory(), toSaveStacks() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (26): BattleCreatureOutcome, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope, CreatureStatGrowthBasis (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (80): movementTransition(), assertBalanceReject(), assertPositionRemains(), assertTerminalBattleRemains(), canonicalPlayerFor(), canonicalPlayersByProfileId, checkBalanceCompatibility(), checkBlockedMovement() (+72 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (42): activateBuffCard(), activateCreatureCardViaElder(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (32): hashString(), sanitizeBattleCreature(), createWildBattleCreature(), attackByPoolId, consumeRequirements(), convertCreatureCardViaElder(), createCreatureRecord(), createDirectDropEgg() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.28
Nodes (8): rosterChanged(), sealGrowthEvents(), simulationContext(), trainerClearFlag(), SaveCommand, SaveCommandResult, AccountConnection, BattleResolution

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (16): battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), clearPendingTrainerExpiry(), cloneCreature(), createBattleClaim(), createGuardBattleClaim(), getBattleStateSeed() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.43
Nodes (4): clearLegacyBrowserSave(), importAuthenticatedRecovery(), RecoveryPanel(), RecoveryState

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (35): now, addStats(), appendStatGrowth(), applyCreatureExperience(), ApplyCreatureExperienceOptions, createLevelGrowthEvent(), getCreatureLevelForExperience(), getGrowth() (+27 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (53): isItemId(), isIsoTimestamp(), isValidRewardBundle(), isValidRewardSourceId(), hasUnsupportedSchemaVersion(), hasValidLegacyCurrencies(), isAvatarId(), isBooleanRecord() (+45 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (15): provider, gameRegistry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (27): getCreatureCardById(), MAGIC_DUST_CURRENCY_ID, createCreatureCardInstance(), CreatureLifecycleOptions, createCommonCreatures(), createFarmSaveRecord(), buildStarterMagicDustFarm(), completeVillageElderDialog() (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (21): battleIdFromGrant(), exactDeltaKeys(), IntentReceipt, isCanonicalEvent(), isCanonicalFreshResetSave(), isValidActiveBattle(), isValidActiveBattleTransition(), isValidAggregate() (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (28): addItem(), createItemInventory(), discardItem(), InventoryResult, ItemInventory, ItemStack, requiredAdditionalSlots(), canonicalDefinitions (+20 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (30): toLocationRoomState(), applyInteriorTemplate(), buildingDefinitions, buildingNames, buildingTiles, createInteriorMap(), createInteriorSpawn(), createVillageMap() (+22 more)

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (26): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (15): FrozenParty, BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, BattleClaim (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (38): AccountReady, BalanceVersionMismatchError, BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectRoomLifecycle(), connectToAccount() (+30 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (21): constantTimeEqual(), GuestCredentialClaims, GuestCredentialKey, issueGuestCredential(), isUuid(), loadGuestCredentialConfig(), loadGuestCredentialTtlSeconds(), sign() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (16): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (42): assignFarmGuard(), attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+34 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (21): getVillageDefinition(), isValidStation(), createInitialStationContainer(), createPlayerVillageStationDestination(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId(), getStationContextLevel(), getStationDestinations() (+13 more)

### Community 29 - "Community 29"
Cohesion: 0.26
Nodes (11): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPage() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (13): attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity(), getSpeciesBySlug() (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (13): growthHash(), growthEventHash(), PlayerAggregate, aggregateWithEvent(), emptyAggregate(), event(), genesis, createProfileState() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (8): getEncounterCooldownKey(), isFacingFarmPosition(), LocationRoom, sanitizeFarm(), sanitizeGuardCreature(), getResolvedBattleOutcome(), ClaimWildEncounterMessage, ResolveWildEncounterMessage

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (7): emptyAggregate(), hasUnsealedGrowth(), isRecord(), matchesPresent(), rebindSave(), validateAuthenticatedOwnershipProjection(), validateAuthenticatedSaveOwnership()

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (33): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital() (+25 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (10): createSecureWebSocketTransport(), installTrustedProxyHttpGuard(), isTrustedProxyRequest(), loadProductionTransport(), parsePublicOrigin(), ProductionTransport, gameServer, port (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (27): activateTrainerBattleClaimWithCompensation(), assertBalanceVersion(), authenticateBattleJoin(), BattleRoom, copyBattleStateToSchema(), isDisconnectedGrace(), BattleLeaveHarness, creature() (+19 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (54): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+46 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (8): deepFreeze(), isBlockedByUnclearedTrainer(), isFacingGeneratedObject(), PlayerAuthority, snapshot(), ActiveTrainerBattle, AuthoritySnapshot, CanonicalPlayer

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (9): AUTHORITY_PROTOCOL_VERSION, AuthorityIntentType, AuthorityRejectCode, CorrelatedAuthorityRequest, CorrelatedAuthorityResult, intentTypes, parseCorrelatedAuthorityRequest(), parseSaveCommand() (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.09
Nodes (33): CardDefinition, getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy(), formatCurrencySummary() (+25 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (4): MonsterRpgAssetKey, VillageScene, FarmSaveRecord, TileType

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (12): bootGame(), BootGameOptions, MonsterRpgGameRuntime, getGeneratedMapForClient(), InputAction, LocationRoomState, MonsterRpgSaveState, GameHudProps (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (7): AuthenticatedTransferEnvelope, canonical(), equal(), isAuthenticatedTransferFresh(), mac(), signAuthenticatedTransfer(), verifyAuthenticatedTransfer()

### Community 51 - "Community 51"
Cohesion: 0.27
Nodes (4): GuestCredentialConfig, clone(), PlayerAuthorityRepository, ProcessLocalPlayerAuthorityRepository

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (6): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings(), CreatureLabelMode

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 56 - "Community 56"
Cohesion: 0.10
Nodes (30): applyBattleRewardsToSave(), applyRewardNumbers(), CLINKS_CURRENCY_ID, COMMON_CLINKS_ENTRIES, generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+22 more)

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (19): assertBalanceVersion(), avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute, generatedTown (+11 more)

### Community 73 - "Community 73"
Cohesion: 0.22
Nodes (13): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+5 more)

### Community 74 - "Community 74"
Cohesion: 0.14
Nodes (10): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, loadGuestCredential(), isFarmTile(), isVillageElderDialogComplete(), clearProgress(), loadProfile() (+2 more)

### Community 78 - "Community 78"
Cohesion: 0.15
Nodes (16): WILD_BATTLE_REWARD_TABLES, AUDIT_BALANCE_CATALOG, balanceConfigIssues, BalanceValidationIssue, creatureTypes, GAME_BALANCE_CONFIG, getPath(), growthStatKeys (+8 more)

### Community 80 - "Community 80"
Cohesion: 0.12
Nodes (17): LocationTransitionMessage, PendingTransition, LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, WorldPositionSchema, LocationTransition (+9 more)

## Knowledge Gaps
- **253 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+248 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MonsterRpgSaveState` connect `Community 48` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 14`, `Community 16`, `Community 17`, `Community 24`, `Community 27`, `Community 28`, `Community 32`, `Community 36`, `Community 40`, `Community 42`, `Community 43`, `Community 47`, `Community 56`, `Community 59`, `Community 72`, `Community 74`, `Community 75`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `VillageScene` connect `Community 47` to `Community 3`, `Community 71`, `Community 75`, `Community 48`, `Community 80`, `Community 53`, `Community 24`, `Community 59`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Community 3` to `Community 32`, `Community 1`, `Community 36`, `Community 39`, `Community 40`, `Community 72`, `Community 74`, `Community 75`, `Community 73`, `Community 48`, `Community 19`, `Community 23`, `Community 24`, `Community 28`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07977207977207977 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06639427987742594 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07215541165587419 - nodes in this community are weakly interconnected._