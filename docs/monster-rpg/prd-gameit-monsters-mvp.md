# PRD: GameIt Monsters MVP

## Problem Statement

GameIt Monsters has a working multiplayer movement foundation, but it is not yet a complete monster-collecting RPG loop. A player can create a profile, move through maps, see other players online, and transition between locations, but the core reasons to play are missing: Creatures, Cards, Eggs, Packs, Battles, progression, Farms, Theft, Station travel, and durable ownership rules.

The player needs a coherent MVP where the first session teaches the fantasy, the world contains shared visible Wild Encounters, Battles produce meaningful rewards, Cards and Eggs create Creatures, Farms produce resources, and visiting other villages creates a clear collect/steal/defend loop.

## Solution

Build GameIt Monsters into a server-authoritative browser RPG MVP on top of the existing React/Vite, Phaser, and Colyseus foundation.

The MVP starts with First-Run Onboarding: character creation, a Village Elder dialog, a Starter Pack, one required Creature Card conversion, and construction of the starter Magic Dust Farm. From there, players explore a seasonal world, interact with visible shared Wild Encounters, fight 1v1 Battles in separate Battle Rooms, earn Packs and resources, grow Creature and Player Levels, collect from Farms, steal from other player villages, assign guards, and use the Station to return to discovered player villages.

Local-first persistence remains acceptable until gameplay loops are proven, but all domain records must use stable `playerId` ownership keys and repository boundaries so production auth and account-backed persistence can be added later.

## User Stories

1. As a new player, I want to enter my name, so that the game can address me personally.
2. As a new player, I want to choose a player skin, so that my character feels like mine.
3. As a new player, I want to start at or inside the Town Hall, so that the first session has clear direction.
4. As a new player, I want the Village Elder to explain my first steps, so that I understand Cards, Creatures, and Farms.
5. As a new player, I want to receive a Starter Pack, so that I can begin without grinding.
6. As a new player, I want the Starter Pack to contain three fixed common Starter Species Cards, so that onboarding is predictable.
7. As a new player, I want each starter Creature Card to have rolled stats, so that my copy still feels unique.
8. As a new player, I want to convert one common Creature Card into a Creature, so that I learn the core acquisition loop.
9. As a new player, I want to keep the other two starter Creature Cards, so that I can decide later whether to convert them.
10. As a new player, I want to build the Magic Dust Farm through the Village Elder, so that I learn Farm Card construction.
11. As a player, I want free movement to unlock only after onboarding, so that the early game does not leave me confused.
12. As a player, I want Creatures to belong to stable Creature Species, so that Cards, Eggs, Journal entries, and owned Creatures refer to the same identity.
13. As a player, I want Gen 1 to contain 147 Creature Species, so that the collection goal feels substantial.
14. As a player, I want the first polished Creature subset to be smaller than all 147 Species, so that the MVP can ship with placeholders while content quality improves over time.
15. As a player, I want a Creature Journal, so that I can track Species I have fought, discovered, or obtained.
16. As a player, I want fought Species to appear as silhouettes in the Creature Journal, so that battles reveal useful information even without acquisition.
17. As a player, I want Species to become discovered when I obtain a Creature Card, so that the Journal reflects my collection progress.
18. As a player, I want Species to become discovered when I hatch a direct-drop Egg, so that rare Egg drops matter even without Cards.
19. As a player, I want a five-Creature Active Party, so that I can make meaningful battle and traversal choices.
20. As a player, I want stored Creatures separate from my Active Party, so that collection can grow beyond battle slots.
21. As a player, I want Mount Traits to work from non-Fainted Active Party Creatures, so that party composition affects exploration.
22. As a player, I want Fainted Creatures to be unable to battle or provide Mount Traits, so that defeat has meaningful consequences.
23. As a player, I want Hospital revival to be free and fully heal Creatures in MVP, so that early testing and recovery are not punishing.
24. As a player, I want Revive Items to remove Fainted and restore small HP, so that I can recover away from villages.
25. As a player, I want Packs to always open into five Cards, so that Pack rewards are easy to understand.
26. As a player, I want Packs to contain Creature Cards, Farm Cards, Material Cards, or Buff Cards, so that Packs support multiple progression paths.
27. As a player, I want Creature Cards to preserve rolled stats, so that individual Cards matter.
28. As a player, I want Creature Cards to include two pre-existing Attacks, so that Cards have more identity than simple unlock tokens.
29. As a player, I want common Creature Cards to convert directly into Creatures with Magic Dust, so that early acquisition is simple.
30. As a player, I want uncommon and rarer Creature Cards to convert into Card-made Eggs first, so that rarer Creatures feel more involved.
31. As a player, I want Card-made Eggs to show inherited stats and two inherited Attacks, so that I do not lose information I already saw on the Card.
32. As a player, I want direct-drop Eggs to hide stats and Attacks until hatching, so that rare drops feel mysterious.
33. As a player, I want Material Cards to activate manually into fixed material amounts, so that I control when resources enter my wallet.
34. As a player, I want Buff Cards to activate before or during Battle, so that they can be tactical.
35. As a player, I want only one active Buff Card per Buff Type, so that stacking rules are clear.
36. As a player, I want the MVP Buff Types to be battle and drop-chance, so that buffs start focused.
37. As an explorer, I want visible wild Creatures on the map, so that Battles feel intentional instead of random.
38. As an explorer, I want walking past a wild Creature not to start a Battle automatically, so that movement stays under my control.
39. As an explorer, I want to Interact with a visible wild Creature to start a Battle, so that encounter intent is explicit.
40. As an explorer, I want Wild Encounters to be shared server entities, so that other players see the same world state.
41. As an explorer, I want first interaction to claim a Wild Encounter, so that two players cannot farm the same entity.
42. As an explorer, I want defeated wild entities to respawn after 90-120 seconds, so that the world refills without instant farming.
43. As an explorer, I want respawns to reroll from the Encounter Zone table, so that the area has variety.
44. As an explorer, I want Hotspots to move within their Encounter Zone after respawn, so that exploration remains active.
45. As an explorer, I want Hotspot markers to show normal Species display, so that the map is readable regardless of Journal state.
46. As an explorer, I want a setting to show or hide wild Creature names on the map, so that I can choose clarity or visual quiet.
47. As a mobile player, I want Tap-to-Walk, so that I can move comfortably without relying only on a D-pad.
48. As a player in Battle, I want to choose Attacks manually, so that combat feels active.
49. As a player in Battle, I want my Creature to wait if I do not choose an Attack, so that there is no hidden auto-battle.
50. As a player in Battle, I want enemy Creatures to attack with simple AI, so that there is pressure.
51. As a player in Battle, I want per-Attack cooldowns and global recovery, so that Attacks have pacing and cannot be spammed instantly.
52. As a player in Battle, I want Fatigue to slow global recovery, so that heavy attacking has a cost without becoming a mana bar.
53. As a player in Battle, I want Stamina to affect Fatigue and HP recovery, so that the stat matters across combat and recovery.
54. As a player in a wild Battle, I want a Run Away button, so that I can attempt to leave a bad fight.
55. As a player in a wild Battle, I want Run Away to be chance-based, so that escape has risk.
56. As a player in a wild Battle, I want to retry Run Away after a failed attempt, so that I am not hard-blocked by one bad roll.
57. As a player, I want Guard Battles to disallow Run Away, so that Theft consequences cannot be bypassed.
58. As a nearby player, I want to see when another player is in Battle, so that their map state is understandable.
59. As a nearby player, I want in-battle players to be slightly transparent with a battle indicator, so that I know they are unavailable.
60. As a nearby player, I do not want to spectate Battles in MVP, so that the first version stays simpler.
61. As a player with a bad connection, I want a short Battle reconnect grace period, so that a brief disconnect does not unfairly kill my Creature.
62. As a player, I want timeout during Battle disconnect grace to count as loss, so that disconnecting cannot be abused.
63. As a player, I want Battle reconnect to use stable Player ID, so that reconnect works even if my Colyseus session changes.
64. As a Battle winner, I want Magic Dust, Creature XP, player XP, Pack chance, material chance, and rare direct-drop Egg chance, so that Battles are rewarding.
65. As a player, I want Player XP only on wins, so that progression rewards success.
66. As a player, I want Creature XP only on wins, so that Battle outcomes matter.
67. As a player, I want non-Fainted Active Party Creatures to receive 80% XP, so that party development is not too narrow.
68. As a player, I want Fainted and stored Creatures to receive no Battle XP, so that party state matters.
69. As a player, I want Creature Level to modestly improve stats in MVP, so that leveling feels useful without adding evolution yet.
70. As a player, I want future evolution/transformation to remain planned, so that Creature progression can deepen later.
71. As a Village Owner, I want one home village in MVP, so that my building and defense scope is clear.
72. As a Village Owner, I want Farm Cards to build Farms through the Village Elder, so that construction is explicit.
73. As a Village Owner, I want one Farm per farm type in MVP, so that village layout stays manageable.
74. As a Village Owner, I want extra matching Farm Cards to upgrade Farms, so that duplicate Cards remain useful.
75. As a Village Owner, I want fixed farm plots, so that I do not need free placement tools in MVP.
76. As a Village Owner, I want Farms to accrue resources while I am offline up to a cap, so that they remain useful without background timers.
77. As a Village Owner, I want to collect from a Farm by standing adjacent and pressing Interact, so that collection fits grid movement.
78. As a Village Owner, I want to assign a non-Fainted Creature as a Farm guard, so that I can defend resources.
79. As a Village Owner, I want Fainted guards to remain assigned but inactive, so that I can see what needs revival.
80. As a Village Visitor, I want public services such as Hospital to work in other villages, so that visiting is not only hostile.
81. As a Village Visitor, I want Farm interaction in another player's village to be treated as Theft, so that ownership rules are clear.
82. As a Village Visitor, I want unguarded Farms to be stealable immediately, so that guards matter.
83. As a Village Visitor, I want guarded Theft to start a Guard Battle, so that stealing has consequences.
84. As a Village Visitor, I want losing a Guard Battle to Faint my battling Creature and steal nothing, so that the risk is clear.
85. As a Village Owner, I want my guard to become Fainted if the visitor wins, so that defense has maintenance cost.
86. As a Village Owner, I want Theft capped at 25% of stored resources, so that theft hurts but is not devastating.
87. As a Village Visitor, I want successful Theft to start a visible 24-hour cooldown per farm type per village, so that limits are clear.
88. As a Village Owner, I want all Theft attempts logged, so that I know who attacked and what happened.
89. As a player, I want the Theft Log to be read-only in MVP, so that revenge systems can wait.
90. As a player, I want the Station to list player villages I have entered, so that I can return to discovered villages.
91. As a player, I want Station teleport to start only from my home Station, so that travel still matters.
92. As a player, I want Station teleport to cost Magic Dust in MVP, so that the resource economy has another sink.
93. As a player, I want higher-level villages to pay more to teleport to lower-level villages, so that powerful villages cannot cheaply raid weaker ones.
94. As a player, I want to see Station target owner, Village Level, cost, and active Theft Cooldowns before teleporting, so that spending is not surprising.
95. As a local-first tester, I want stable local Player ID, so that ownership records are not rewritten later.
96. As a local-first tester, I want JSON export/import before public testing, so that progress can survive local persistence resets.
97. As a maintainer, I want imported saves validated, so that corrupted or manipulated data cannot enter the game state.
98. As a future production player, I want one Player Profile and home village per account at launch, so that economy abuse is limited.
99. As a future city visitor, I want Big Cities to offer City Tasks and PvE tournaments later, so that the world can expand beyond player villages.
100. As a future city visitor, I want City Reputation to be per city, so that consequences are local.
101. As a future city thief, I want city theft to lower City Reputation, so that city crime has separate consequences from player-village Theft.
102. As a future city visitor, I want City Reputation recovery through explicit actions, so that consequences are meaningful.
103. As a future city offender, I want losing to a City Guard Battle to kick me outside the city, so that enforcement is tangible without account punishment.

## Implementation Decisions

- Respect the accepted ADRs for Card/Egg acquisition, shared server Wild Encounters, server-authoritative economy/Theft, local-first persistence, and separate Location/Battle Rooms.
- Build on the existing Colyseus multiplayer server. Existing Location Rooms remain responsible for map presence, movement, transitions, and interaction claims.
- Add separate Battle Rooms for deterministic combat simulation. Battle Rooms use server ticks, own HP/Fatigue/cooldowns/rewards, and handle Battle reconnect grace.
- Preserve existing offline fallback for movement while MVP gameplay is local-first, but do not let client-side state authoritatively grant rewards, Theft, Farm resources, Battle outcomes, or cooldown changes.
- Use stable Player ID for ownership records now, even before production auth exists.
- First production account model is one Player Profile and one home village per account.
- Add repository interfaces for profile, Creature, inventory, village, and Battle persistence before real database work.
- Keep Phaser rendering thin. It renders maps, player sprites, visible wild Creatures, Hotspots, and battle presentation; it does not own source-of-truth simulation state.
- Keep React DOM responsible for onboarding, Village Elder UI, inventory, Creature Journal, Pack opening, Battle controls, Station UI, Farm/Theft panels, settings, and export/import.
- Use directional Interact for NPCs, Farms, chests, Theft targets, and world objects. Door/map exits remain automatic on exit tiles for now.
- Add Tap-to-Walk as validated grid movement, not teleport.
- Use Gen 1 as the first Creature Species set, with 147 Species and stable `gen1-###` IDs plus readable slugs.
- Use Creature Journal reveal states: silhouette after fight, discovered after Creature Card acquisition or direct-drop Egg hatching.
- Start with visible shared Wild Encounters, not random movement encounters. Low-chance random movement encounters are deferred.
- Use visible normal Species display on the map regardless of Journal state. Silhouettes are only a Journal concept.
- Use sprite/icon-only wild Creature display by default, with a setting to show names.
- Use 1v1 Battles for MVP. Multi-Creature Battles and party switching are deferred.
- Use manual player Attack selection. Enemy AI chooses Attacks automatically.
- Use Fatigue as battle pressure, not mana. Fatigue slows global recovery; Stamina controls Fatigue and HP recovery.
- Use Fainted as the hard defeat state. Fainted Creatures cannot Battle, provide Mount Traits, or passively recover HP.
- Use free full Hospital revive in MVP. Revive Items restore only small HP.
- Use one Farm per farm type. Extra matching Farm Cards upgrade that Farm.
- Use fixed Farm plots in the home village. No free placement UI in MVP.
- Use 25% Theft cap with minimum 1 when available.
- Use visible 24-hour Theft Cooldown only after successful Theft.
- Use Station teleport cost formula based on traveler home Village Level versus target Village Level.
- Keep Big Cities out of MVP, but preserve the recorded post-MVP direction.

## Testing Decisions

- Test highest useful seams: domain simulation functions and Colyseus room behavior. Avoid testing Phaser internals or React component implementation details when a higher behavior seam exists.
- Simulation tests should cover catalog validation, TypeChart shape, Card rolls, Card conversion, Egg hatching, Pack contents, Journal reveal states, Interact targeting, Tap-to-Walk validation, movement/mount traversal, Fatigue, Fainted, revive, Farm accrual, Theft caps, cooldowns, Station cost, and save import validation.
- Colyseus SDK tests should cover shared Location Room presence, Wild Encounter claim contention, Battle Room lifecycle, reconnect grace, reward grants, Farm collection, Theft/Guard Battle, Station teleport, and invalid intent rejection.
- Browser playtests should cover First-Run Onboarding, movement, Tap-to-Walk, visible Wild Encounter, Battle controls, Run Away, inventory, Pack opening, Card/Egg surfaces, Farm collection, Theft, and desktop/mobile HUD readability.
- Existing prior art includes the current Monster RPG check script for map validation, transitions, blocked movement, Colyseus room sharing, handoff, shared interiors, invalid map rejection, and online blocked-terrain rejection.
- Every completed work item should run `npm run check:monster-rpg` and `npm run build`, unless the change is docs-only.
- Canvas-heavy and HUD-heavy changes require browser verification because DOM assertions alone will miss playfield and overlay regressions.

## Out of Scope

- Pokemon names, art, icons, music, or protected IP.
- Wild catching as the default MVP acquisition path.
- Multi-Creature Battles and party switching.
- Battle spectating.
- PvP tournaments.
- Big Cities in MVP.
- City Reputation implementation in MVP.
- Multi-village ownership.
- Multiple Player Profiles per account.
- Production auth/database migration before core gameplay loops are proven.
- Full polished art for all 147 Gen 1 Species.
- Free placement UI for Farms.
- Retaliation actions from Theft Log.
- Passive City Reputation recovery.

## Further Notes

- Use the project domain glossary as the domain language source.
- Keep the implementation roadmap as the execution source of truth.
- Keep ADRs short and authoritative when a future agent might otherwise flatten a major boundary.
- Update the work summary after each completed work item.
