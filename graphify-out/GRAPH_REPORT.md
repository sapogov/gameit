# Graph Report - issue-64  (2026-07-21)

## Corpus Check
- 164 files · ~345,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1565 nodes · 4356 edges · 79 communities (68 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d4967d59`
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
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `getGameMap()` - 45 edges
3. `MonsterRpgSaveState` - 41 edges
4. `createInitialSave()` - 34 edges
5. `reduce()` - 28 edges
6. `getSpeciesById()` - 27 edges
7. `canEnterTile()` - 24 edges
8. `createPlayerProfile()` - 24 edges
9. `LocationRoom` - 23 edges
10. `PlayerAuthority` - 22 edges

## Surprising Connections (you probably didn't know these)
- `FrozenParty` --references--> `CreatureSaveRecord`  [EXTRACTED]
  server/authority/playerAuthority.ts → src/games/monster-rpg/sim/types.ts
- `CanonicalPlayer` --references--> `AuthoritySnapshot`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/network/authorityProtocol.ts
- `checkSaveReset()` --calls--> `loadProfile()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkOverworldVillageEntry()` --calls--> `movePlayer()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/movement.ts

## Import Cycles
- None detected.

## Communities (79 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (29): toAttackSchema(), abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (21): reduce(), canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isAtVillageHospital(), isCreatureFainted() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (27): BattleClaim, MonsterRpgSaveRepository, BattleCreatureState, BattleMaterialReward, BattleParticipantState, BattleTurnLogEntry, CardType, CreationRequirementScope (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (34): authorityRepository, assertBalanceReject(), canonicalPlayerFor(), canonicalPlayersByProfileId, checkBalanceCompatibility(), checkBlockedTerrainRejectedOnline(), checkGeneratedMapSdkFlow(), checkInvalidMapIdRejected() (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (39): activateBuffCard(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResultReason, cardBuffTypes, CardDefinition (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (36): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (35): hashString(), sanitizeBattleCreature(), createWildBattleCreature(), activateCreatureCardViaElder(), attackByPoolId, consumeRequirements(), convertCreatureCardViaElder(), createCreatureCardInstance() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (3): loadMonsterRpgFonts(), VillageScene, WildEncounterState

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (18): resolveWildBattleRewardEntries(), rollWildBattleClinks(), WildBattleRewardTable, applyRewardChanceEntryOverrides(), assertValidEntry(), assertValidMatrix(), hasCompleteContext(), hasValidConstraints() (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (22): getVillageDefinition(), createEmptySaveContainers(), isValidStation(), createInitialStationContainer(), createPlayerVillageStationDestination(), getDefaultVillageStationLevel(), getPlayerVillageStationDestinationId(), getStationContextLevel() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (14): applyBattleRewardsToSave(), applyRewardNumbers(), CLINKS_CURRENCY_ID, COMMON_CLINKS_ENTRIES, generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (35): now, addStats(), appendStatGrowth(), applyCreatureExperience(), ApplyCreatureExperienceOptions, createLevelGrowthEvent(), getCreatureLevelForExperience(), getGrowth() (+27 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (34): hasUnsupportedSchemaVersion(), hasValidLegacyCurrencies(), isAvatarId(), isBooleanRecord(), isCardBuffRecord(), isCreatureCardRecord(), isEggRecord(), isFarmTheftLog() (+26 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (15): provider, gameRegistry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (25): MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, CreatureLifecycleOptions, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (21): growthHash(), addDelta(), battleIdFromGrant(), exactDeltaKeys(), growthEventHash(), IntentReceipt, isCanonicalEvent(), isCanonicalFreshResetSave() (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (24): toItemInventory(), addItem(), createItemInventory(), discardItem(), InventoryResult, ItemInventory, ItemStack, requiredAdditionalSlots() (+16 more)

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
Cohesion: 0.09
Nodes (25): BattleAttackSchema, BattleCreatureSchema, BattleLogEntrySchema, BattleParticipantSchema, BattleStateSchema, BattleStatsSchema, AUDIT_BALANCE_CATALOG, balanceConfigIssues (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (37): AccountReady, BalanceVersionMismatchError, BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectRoomLifecycle(), connectToAccount() (+29 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (21): constantTimeEqual(), GuestCredentialClaims, GuestCredentialKey, issueGuestCredential(), isUuid(), loadGuestCredentialConfig(), loadGuestCredentialTtlSeconds(), sign() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (16): isAccent(), isKnownValue(), isRecord(), LEGACY_REGISTRY_OVERRIDE_KEYS, loadGameRegistry(), loadRegistryOverride(), mergeRegistryOverride(), optionalText() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (42): attemptFacingFarmTheft(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmSaveRecord(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+34 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (9): battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getBattleStateSeed(), getResolvedBattleOutcome() (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.26
Nodes (11): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPage() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (14): attackPoolIds, capitalize(), createPlaceholderSpecies(), creatureRarities, creatureTypes, getPlaceholderAttackPools(), getPlaceholderRarity(), getSpeciesBySlug() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (17): assertBalanceVersion(), avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, generatedRoute, generatedTown (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (8): getEncounterCooldownKey(), isFacingFarmPosition(), LocationRoom, sanitizeFarm(), sanitizeGuardCreature(), schemaToProfile(), onBattleClaimResolved(), MoveIntentMessage

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (16): assertNoRawVendorPathText(), defaultProjectRoot, expectedFontHashes, expectedManifest, validManifest, parseInventory(), readPngSize(), readSfntNames() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (14): GuestCredentialConfig, AuthenticatedExportEnvelope, AuthenticatedImportResult, AuthenticatedSaveExport, AuthorityMutationContext, FrozenParty, hasUnsealedGrowth(), isRecord() (+6 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (19): ApplyBattleRewardsResult, CardActionResult, getCardRewardTable(), OpenPackResult, PackOpenTrace, applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards() (+11 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (10): createSecureWebSocketTransport(), installTrustedProxyHttpGuard(), isTrustedProxyRequest(), loadProductionTransport(), parsePublicOrigin(), ProductionTransport, gameServer, port (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (11): assertBalanceVersion(), BattleRoom, copyBattleStateToSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), markBattleClaimResolved(), markBattleDisconnected() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (48): attr(), canonicalPinnedSourceLocation(), convertMapSet(), convertTmx(), facing(), geometry(), hasUriText(), hasUriValue() (+40 more)

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (10): emptyAggregate(), PlayerAuthority, rebindSave(), rosterChanged(), sealGrowthEvents(), simulationContext(), snapshot(), AuthoritySnapshot (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.11
Nodes (17): clearLegacyBrowserSave(), importAuthenticatedRecovery(), RecoveryPanel(), RecoveryState, AUTHORITY_PROTOCOL_VERSION, AuthorityIntent, AuthorityIntentType, AuthorityRejectCode (+9 more)

### Community 43 - "Community 43"
Cohesion: 0.09
Nodes (33): getEggDescription(), getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy(), formatCurrencySummary() (+25 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (10): bootGame(), BootGameOptions, MonsterRpgGameRuntime, getGeneratedMapForClient(), getGeneratedMapForServer(), toSquareGridMap(), moveOnSquareGrid(), CreatureLabelMode (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (7): AuthenticatedTransferEnvelope, canonical(), equal(), isAuthenticatedTransferFresh(), mac(), signAuthenticatedTransfer(), verifyAuthenticatedTransfer()

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (3): deepFreeze(), clone(), ProcessLocalPlayerAuthorityRepository

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 53 - "Community 53"
Cohesion: 0.39
Nodes (5): defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings, normalizeSettings(), saveMonsterRpgSettings()

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (18): LocationTransitionMessage, PendingTransition, LocationTransition, MapId, WorldPosition, canTargetEncounter(), clamp01(), createWildEncounterSpawn() (+10 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (14): movementTransition(), SquareGridMapAdapter, canEnterTile(), getExitAt(), getTileAt(), directionDelta, movePlayer(), canStandOnTile() (+6 more)

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 58 - "Community 58"
Cohesion: 0.26
Nodes (12): checkCreatureJournalStates(), createProfileState(), assertKnownSpecies(), getJournalSpeciesViewState(), recordCreatureDiscovered(), recordWildCreatureSeen(), withJournalSpeciesState(), createStateWithMagicDust() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

### Community 72 - "Community 72"
Cohesion: 0.22
Nodes (15): checkBlockedMovement(), checkBuildingEntryAndExit(), checkGen1SpeciesCatalog(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage(), checkOverworldVillageEntry(), checkSaveReset(), checkTapToWalkPathing() (+7 more)

### Community 73 - "Community 73"
Cohesion: 0.15
Nodes (11): LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, AvatarId, MapKind, WildEncounterStatus, avatarOptions (+3 more)

### Community 74 - "Community 74"
Cohesion: 0.13
Nodes (12): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, loadGuestCredential(), isFarmTile(), isVillageElderDialogComplete(), clearProgress(), loadProfile() (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (12): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.24
Nodes (8): canonicalDefinitions, isItemId(), ITEM_CATALOG, ITEM_DEFINITIONS, itemById, ItemDefinition, validateItemCatalog(), isValidItemInventory()

### Community 77 - "Community 77"
Cohesion: 0.50
Nodes (4): InputAction, controls, MobileDpad(), MobileDpadProps

## Knowledge Gaps
- **246 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 36`, `Community 71`, `Community 45`, `Community 77`, `Community 47`, `Community 48`, `Community 24`, `Community 56`, `Community 59`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 36` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 11`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 24`, `Community 27`, `Community 32`, `Community 35`, `Community 40`, `Community 42`, `Community 43`, `Community 48`, `Community 56`, `Community 58`, `Community 59`, `Community 73`, `Community 74`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Community 72` to `Community 32`, `Community 1`, `Community 33`, `Community 35`, `Community 3`, `Community 40`, `Community 74`, `Community 11`, `Community 48`, `Community 19`, `Community 54`, `Community 23`, `Community 56`, `Community 24`, `Community 58`, `Community 59`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13257575757575757 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07671957671957672 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08076923076923077 - nodes in this community are weakly interconnected._