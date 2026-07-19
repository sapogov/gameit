# Graph Report - gameit-issue-58  (2026-07-19)

## Corpus Check
- 119 files · ~315,885 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1188 nodes · 3153 edges · 63 communities (54 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c834a41`
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

## God Nodes (most connected - your core abstractions)
1. `VillageScene` - 66 edges
2. `MonsterRpgSaveState` - 36 edges
3. `getGameMap()` - 35 edges
4. `createInitialSave()` - 24 edges
5. `getSpeciesById()` - 24 edges
6. `canEnterTile()` - 22 edges
7. `convertCreatureCardViaElder()` - 20 edges
8. `MapId` - 20 edges
9. `LocationRoom` - 18 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `checkInitialSaveStartsInHomeVillage()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `checkGen1SpeciesCatalog()` --calls--> `validateSpeciesCatalog()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/speciesCatalog.ts
- `createState()` --calls--> `createInitialSave()`  [EXTRACTED]
  scripts/monster-rpg-phase4-checks.ts → src/games/monster-rpg/sim/saveState.ts
- `BattleClaim` --references--> `BattleKind`  [EXTRACTED]
  server/battleRegistry.ts → src/games/monster-rpg/sim/types.ts
- `BattleClaim` --references--> `MapId`  [EXTRACTED]
  server/battleRegistry.ts → src/games/monster-rpg/sim/types.ts

## Import Cycles
- None detected.

## Communities (63 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (76): resolveJoinPosition(), assertBalanceReject(), checkBalanceCompatibility(), checkBlockedMovement(), checkBlockedTerrainRejectedOnline(), checkBuildingEntryAndExit(), checkHomeVillageEastGateExit(), checkInitialSaveStartsInHomeVillage() (+68 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (62): sanitizeBattleCreature(), checkCreatureJournalStates(), checkGen1SpeciesCatalog(), createWildBattleCreature(), hashString(), activateCreatureCardViaElder(), getCardCatalog(), createProfileState() (+54 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (26): App(), ComingSoonPage, Home(), MonsterRpgGame, navIcons, popularOrder, PortalShell(), SnakeGamePage (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (32): BalanceVersionMismatchError, BattleConnection, BattleConnectionHandlers, ColyseusRoom, ConnectionHandlers, connectRoomLifecycle(), connectToBattle(), connectToLocation() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (38): attemptFacingFarmTheft(), clearFarmGuard(), collectFacingFarm(), consumeFarmCardRequirements(), consumeMaterialRequirements(), createFarmTheftLogEntry(), FarmCollectionFailureReason, FarmCollectionResult (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (27): AdminPage(), AdminPageProps, RegistryOverride, readLocal(), writeLocal(), defaultSnakeConfig, SnakeConfig, snakeConfigSchema (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (35): dependencies, colyseus, @colyseus/schema, @colyseus/sdk, phaser, react, react-dom, react-router-dom (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (4): loadMonsterRpgFonts(), VillageScene, LocationPlayerState, RoomPlayerId

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): GameCard(), Layout(), LayoutProps, defaultGames, AdminGameConfigPage(), Props, AdminPage(), Props (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (31): activateBuffCard(), activateMaterialCard(), BuffCardDefinition, buildFarmCardViaElder(), CARD_PACK_RARITY_TIERS, CardActionResult, CardActionResultReason, cardBuffTypes (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (15): provider, gameRegistry, buildLeaderboardViewModel(), defaultProvider, getRangeLabel(), LeaderboardPageViewModel, LeaderboardRowVm, ranges (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (25): getCreatureCardById(), MAGIC_DUST_CURRENCY_ID, STARTER_CREATURE_CARD_IDS, buildStarterMagicDustFarm(), completeVillageElderDialog(), completeVillageElderOnboarding(), convertStarterCreatureCards(), decrementStack() (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (26): CardRewardTable, FarmDefinition, FarmUpgradePreview, FarmUpgradeRequirements, PlayerSkillUnlockDefinition, BattleCreatureState, BattleMaterialReward, BattleParticipantState (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (24): hasUnsupportedSchemaVersion(), isAvatarId(), isFarmTheftLog(), isValidFarms(), isValidProfile(), migrateSaveBalance(), parseSavePayload(), SaveBalanceMigrationFailure (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (24): addNoise(), approvalDir, assetDir, blank(), chunk(), crc32(), crcTable, crop() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (19): bootGame(), BootGameOptions, MonsterRpgGameRuntime, VillageSceneOptions, MonsterRpgSaveRepository, defaultMonsterRpgSettings, loadMonsterRpgSettings(), MonsterRpgSettings (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (19): CardDefinition, getEggDescription(), getNextPlayerLevelThreshold(), CardRow, CreatureRow, FarmRow, formatBattleStatus(), formatBlockedBy() (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (6): getInitialState(), MonsterRpgGame(), moveDeltaByDirection, isAtVillageHospital(), clearProgress(), loadSaveResult

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (25): createEmptySaveContainers(), importSavePayload(), isValidStation(), confirmStationTravel(), createInitialStationContainer(), createPlayerVillageStationDestination(), discoverCurrentStationDestination(), discoverPlayerVillageForStation() (+17 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (19): MultiplayerConnection, avatarIds, cleanupExpiredTransitions(), consumePendingTransition(), createPendingTransition(), directions, hashString(), isFacingFarmPosition() (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (20): abandonDisconnectedBattle(), advanceAfterEnemyAction(), appendBattleLog(), applyAttack(), BattleActionResult, canUseBattleAttack(), chooseEnemyAttack(), choosePlayerBattleAttack() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): LicensedAssetMetadata, licensedFontMetadata, licensedPlayerMetadata, monsterRpgAssetKeys, monsterRpgAssetManifest, monsterRpgFontManifest, monsterRpgLicensedAssetMetadata, monsterRpgSpriteSheetManifest (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (12): canCreatureUseRole(), CreaturePartyFailureReason, CreaturePartyResult, CreatureUseRole, healAllCreaturesAtHospital(), isCreatureFainted(), moveCreatureToActiveParty(), moveCreatureToStorage() (+4 more)

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
Cohesion: 0.27
Nodes (14): appendGameLogEntry(), beginImportedSaveGameLogSession(), beginProfileGameLogSession(), createGameLogState(), formatGameLogEntry(), GameLogEntry, GameLogKind, gameLogKindLabel (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): LocationTransitionMessage, PendingTransition, LocationPlayerSchema, LocationStateSchema, PlayerProfileSchema, WildEncounterSchema, LocationTransition, MapId (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (13): ApplyBattleRewardsResult, getCardRewardTable(), PackOpenTrace, applyPlayerExperience(), ApplyPlayerExperienceResult, claimAvailableLevelRewards(), ClaimedPlayerLevelReward, ClaimLevelRewardsResult (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (11): toLocationRoomState(), isValidCreatureContainerLayout(), getMapById(), isMapId(), isBooleanRecord(), isCardBuffRecord(), isUniqueStringArray(), isValidCreatures() (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (12): assertBalanceVersion(), copyBattleStateToSchema(), toAttackSchema(), toBattleStateSchema(), toCreatureSchema(), toParticipantSchema(), createBattleRoomState(), createGuardBattleRoomState() (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (13): canTargetEncounter(), clamp01(), createWildEncounterSpawn(), EncounterRng, getFacingTile(), getWalkableZoneTiles(), getWildEncounterZonesForMap(), isPositionInsideEncounterZone() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (13): Adding a New Game, Admin Access (MVP), Architecture Overview, Build / Preview, Deploy to GitHub Pages, Features, Future Improvements, GameIt Portal MVP (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.26
Nodes (11): defaultLibraryFilters, filterLibraryGames(), formatLibraryLabel(), getLibraryGenres(), LibraryFilters, LibraryGenreFilter, LibraryStatusFilter, LibraryPage() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.27
Nodes (4): getEncounterCooldownKey(), LocationRoom, gameServer, port

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (8): battleClaims, battleResultListeners, cleanupExpiredBattleClaims(), createBattleClaim(), createGuardBattleClaim(), getBattleClaim(), getResolvedBattleOutcome(), removeBattleClaim()

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (11): compilerOptions, experimentalDecorators, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (8): balanceConfigIssues, BalanceValidationIssue, CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG, GameBalanceConfig, getPath(), validateGameBalanceConfig(), validateNumber()

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (11): isCooldownRecord(), isIsoDate(), isNonEmptyString(), isNonNegativeInteger(), isPositiveFiniteNumber(), isValidAttackRecord(), isValidCreationRequirement(), isValidCreatureRecord() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (8): assetDir, buildings, chunk(), crc32(), crcTable, png(), root, write()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (7): BattleClaim, BattleResolution, getFirstBattleReadyCreature(), BattleRewardBundle, CreatureSaveRecord, PlayerProfile, WildEncounterOutcome

### Community 45 - "Community 45"
Cohesion: 0.38
Nodes (9): applyBattleRewardsToSave(), applyRewardNumbers(), generateWildBattleRewards(), getBattleRewardFlag(), getMaterialIdForType(), getRarityRank(), hashString(), updateBattleCreatureOutcome() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, include

### Community 47 - "Community 47"
Cohesion: 0.44
Nodes (4): BattleRoom, markBattleClaimResolved(), markBattleDisconnected(), BattleRoomState

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (6): checkSaveReset(), exportSave(), loadProfile(), loadSave(), localMonsterRpgSaveRepository, saveProgress()

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): Props, logoSpriteSheet, SpriteRegion, uiSpriteSheet

### Community 50 - "Community 50"
Cohesion: 0.38
Nodes (4): assertBalanceVersion(), sanitizeProfile(), normalizeMapId(), JoinLocationOptions

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (7): isCreatureCardRecord(), isEggRecord(), isQuantityRecord(), isStackRecord(), isValidInventory(), isValidJournal(), isKnownSpeciesId()

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (4): AvatarId, avatarOptions, CharacterCreator(), CharacterCreatorProps

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): Artwork attribution, Font notices, Python-Monsters licensed graphics source

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (4): PackOpenTraceCard, CreatureCardDefinitionLike, FarmCardUpgradeRequirement, CardRarity

## Knowledge Gaps
- **203 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VillageScene` connect `Community 7` to `Community 0`, `Community 35`, `Community 42`, `Community 15`, `Community 52`, `Community 21`, `Community 53`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `MonsterRpgSaveState` connect `Community 15` to `Community 0`, `Community 1`, `Community 4`, `Community 7`, `Community 9`, `Community 11`, `Community 44`, `Community 45`, `Community 12`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 29`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `getGameMap()` connect `Community 0` to `Community 32`, `Community 3`, `Community 7`, `Community 12`, `Community 15`, `Community 17`, `Community 50`, `Community 19`, `Community 18`, `Community 21`, `Community 30`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05616509926854754 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05719298245614035 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0647342995169082 - nodes in this community are weakly interconnected._