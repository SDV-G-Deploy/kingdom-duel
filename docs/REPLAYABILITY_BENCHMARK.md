# Kingdom Duel — Replayability Benchmark

Status: Step 6 design reference and validation record
Reviewed: 2026-07-14

## Naming Note

The requested reference was “Puzzle Wars”. No authoritative current title with that exact name was found during the review. This benchmark therefore uses the closest relevant design lineage: **Puzzle Quest / Gems of War-style shared-board RPG combat**, with Marvel Puzzle Quest as a roster-depth reference and short-run puzzle/roguelike games as structure references. This is an explicit interpretation, not a claim that those games are identical.

## Practices Worth Carrying Forward

| Reference practice | Why it supports replayability | Kingdom Duel application |
| --- | --- | --- |
| One shared board fuels damage, mana, defence, and denial | The best move changes with combat state instead of being the largest match every turn | Keep upgrades and enemy profiles board-facing; do not turn abilities into a separate cooldown game |
| Classes, spells, equipment, and companions change how the same board is valued | Build identity creates alternative solutions without requiring a new puzzle ruleset | Compress this breadth into two meaningful prism choices during a 10–15 minute run |
| Distinct opponents value colours and board states differently | The player must re-evaluate familiar gems instead of repeating one script | Moon Warden prioritises Moon/Shield; Eclipse Regent combines Moon/Crown; Shade retains risky pressure |
| A short ladder has normal fights, a difficulty spike, and a boss | Pacing gives the run a readable dramatic arc and a reason to try a new build immediately | Four encounters: normal → normal → elite → boss |
| A fixed daily seed gives all players the same starting conditions | Comparison and conversation add replay value without power creep | UTC date → deterministic seed; daily mode uses the same encounter and reward sequence for everyone |
| A small offered choice is more legible than a huge inventory | The player can form a plan quickly on mobile and remember why a run differed | Offer three rule-changing prisms and choose one; selected options do not repeat |
| Failure should return the player to a fast, comprehensible start | A failed run becomes learning rather than lost account progress | No stamina, repair cost, or run currency; result screen starts another run immediately |

Puzzle Quest demonstrates the durable foundation: colour matches power spells while equipment, class, companions, and board effects alter combat decisions. Marvel Puzzle Quest demonstrates how roster/skill combinations expand possible tactics, but its collection economy is not required for Kingdom Duel’s first product loop. Shovel Knight Pocket Dungeon is a useful short-form reference for characters, Relics, bosses, and run modifiers. Slay the Spire’s fixed-seed daily challenge is the direct precedent for a fair daily foundation.

## Practices Deliberately Rejected For This Milestone

- energy/stamina gates;
- gacha, duplicate covers, and paid power;
- multiple currencies and upgrade sinks;
- a large campaign map before the combat loop proves retention;
- permanent stat inflation presented as build variety;
- dozens of low-impact rewards;
- daily rewards that require notification pressure rather than offering a fair puzzle.

These systems may increase session frequency in established free-to-play products, but they would obscure whether Kingdom Duel’s board and builds are intrinsically replayable.

## Implemented Step 6 Translation

| Replayability lever | Current implementation | Evidence |
| --- | --- | --- |
| Encounter arc | 2 normal fights, elite, boss | `src/run/content.ts` |
| Enemy identity | Per-enemy tile priorities and two new telegraphed enemy abilities | `src/engine/enemy-policy.ts`, `src/content/enemies.ts`, `src/content/abilities.ts` |
| Build expression | Six mechanical prisms; two deterministic choices per run | `src/run/rules.ts`, `src/run/run.ts` |
| Fair variation | Seeded encounters and deterministic reward offers | `src/run/run.ts` |
| Daily comparability | UTC date-derived seed pinned to rules, content, and daily versions | `dailyRunKey`, `dailyRunSeed`, `src/run/version.ts` |
| Continuity | Versioned, validated local run save; incompatible contracts reject; pending enemy turns resume | `src/run/storage.ts`, `src/main.ts` |
| Fast replay | Route/result screens and one-action standard/daily restart | `src/ui/views/run.ts` |
| Balance evidence | Visible-information and spell-aware run policies across three build priorities | `scripts/visible-player-policy.ts`, `scripts/sim-runs.ts` |
| Mobile contour | Run/save/reward/daily/result flows defined at 390×700 and 390×844 | `e2e/run-mobile.spec.ts` |

## Current Quantitative Read

The independent Step 6 probe used 100 seeds from 2007 and a spell-aware exhaustive policy:

| Build priority | Completed | Average victories | Average actions |
| --- | ---: | ---: | ---: |
| Solar → Aether | 49% | 2.82 | 38.75 |
| Ward → Crown | 53% | 2.87 | 42.37 |
| Veil → Core | 47% | 2.87 | 43.06 |

All three priorities are provisionally viable, with only a six-point completion spread. Ward/Crown is currently strongest, but the solver sees hidden cascades and human timing, comprehension, and risk preference are unmeasured.

At roughly 15–20 seconds per human action, 39–43 actions suggest a 10–14 minute successful run before reward decisions. This is only a planning proxy. The 10–15 minute gate remains unproven until phone playtests record real elapsed time.

Step 6.1 added a policy that scores only visible board information and executes only its chosen action:

| Build priority | Visible-policy completion | Average victories | Glass Edge losses |
| --- | ---: | ---: | ---: |
| Solar → Aether | 1% | 0.68 | 66/100 |
| Ward → Crown | 1% | 0.65 | 66/100 |
| Veil → Core | 0% | 0.61 | 66/100 |

The result does not invalidate the spell-aware build comparison: it exposes how much the previous exhaustive policy benefited from hidden cascade resolution. It is an accessibility warning and a reason to test Glass Edge first, not a human retention estimate or an instruction to flatten the game. The hand-authored visible policy has no planning horizon and may undervalue setup, denial, and future mana.

## Validation Gates Before Metagame Expansion

1. Run the five first-session phone sessions in the [Step 6.1 protocol](PLAYTEST_STEP_6_1.md) and record elapsed time, encounter reached, prism comprehension, and restart intent.
2. Confirm that at least two build families are chosen voluntarily and described by players in different tactical terms.
3. Investigate a build only when both human evidence and a visible-information simulator identify it as dominant or non-viable.
4. Keep top-two completion rates within 20 percentage points in the same deterministic solver cohort.
5. Verify that the boss changes move priorities rather than functioning only as an HP wall.
6. Re-run the same seed cohort after every encounter, upgrade, or AI tuning change.
7. Add metaprogression only after players voluntarily start another run; unlock breadth before permanent power.

## Known Presentation Gap

Moon Warden and Eclipse Regent currently reuse the Shade Knight portrait with encounter-specific colour/material treatment. Their mechanics, names, intent, and HUD identity are distinct, but dedicated silhouettes remain Step 7 art work. This placeholder must not be mistaken for content-complete enemy art in a store-facing build.

## Sources

- Gems of War official site (Puzzle Quest lineage): https://gemsofwar.com/
- Puzzle Quest: Challenge of the Warlords gameplay overview: https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords
- Marvel Puzzle Quest gameplay overview: https://en.wikipedia.org/wiki/Marvel_Puzzle_Quest
- Shovel Knight Pocket Dungeon official game page: https://www.yachtclubgames.com/games/shovel-knight-pocket-dungeon/
- Slay the Spire run and daily-challenge overview: https://en.wikipedia.org/wiki/Slay_the_Spire
