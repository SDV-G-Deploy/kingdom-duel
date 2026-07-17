# Kingdom Duel — Balance Record

Status: canonical balance record after Step 6.1 validation hardening
Rules baseline: Step 6 short replayable run; Step 5 duel retained as regression cohort
Latest independent probes: 500 single duels and 100 runs from seed 2007, 180-action encounter cap

## Why This Document Exists

Balance changes must be compared against a recorded baseline. This file tracks current rules, simulator limitations, target metrics, and decisions. Historical balance reports live under `docs/archive/` and are evidence, not current instructions.

## Step 5 Result

Command:

```bash
npm run sim:balance -- --seeds=500
```

| Strategy | Aurora wins | Shade wins | Win rate | Avg turns | Avg actions | P50/P90/P99 actions | Aurora/Shade casts |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Greedy swaps | 254 | 246 | 50.8% | 5.06 | 14.42 | 14 / 21 / 30 | 0.00 / 0.87 |
| Visible information | 122 | 378 | 24.4% | 5.93 | 17.54 | 17 / 25 / 37 | 1.34 / 1.33 |
| Spell-aware | 394 | 106 | 78.8% | 4.15 | 11.97 | 12 / 18 / 24 | 1.51 / 0.59 |

| Strategy | Aurora extra turns | Shade extra turns | Avg max actor chain | Aether created/activated | Backlash | Unspent mana on Aurora loss |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Greedy swaps | 2.35 | 2.46 | 3.07 | 2.50 / 1.93 | 9.55 | 27.83 |
| Visible information | 2.83 | 3.14 | 3.25 | 3.49 / 2.53 | 6.73 | 11.55 |
| Spell-aware | 2.53 | 1.93 | 3.09 | 2.64 / 1.78 | 10.94 | 16.04 |

Unresolved battles were 0 in all three policies. Backlash caused 0.2% of greedy battles, 4.0% of visible-information battles, and 0% of spell-aware battles to end in self-KO.

The Step 6 independent regression reran this exact 500-seed cohort after extracting enemy policy and adding run composition. Every headline result above reproduced exactly: 254/246 greedy and 394/106 spell-aware, with unchanged action and turn averages. The default duel therefore did not drift.

## Step 6 Run Result

Command:

```bash
npm run sim:run -- --seeds=100
```

| Build priority | Complete | Avg victories | Avg actions | Most common later stop |
| --- | ---: | ---: | ---: | --- |
| Solar → Aether | 49/100 | 2.82 | 38.75 | Veil Champion (20) |
| Ward → Crown | 53/100 | 2.87 | 42.37 | Veil Champion (21) |
| Veil → Core | 47/100 | 2.87 | 43.06 | Eclipse Crown (22) |

All three plans use the same deterministic three-option offers, so a preferred prism is chosen only when actually offered. Every plan lost 13 runs at Glass Edge before receiving an upgrade. All three routes complete 47–53% of the cohort; this narrow solver spread is a healthy prototype baseline, not proof that human choices are equally legible.

Two parallel 10-seed JSON probes produced byte-identical output. Deterministic reward offers, encounter boards, AI, and run summaries therefore reproduced in an independent execution check.

The average action range is consistent with a 10–14 minute planning estimate at 15–20 seconds per human action, plus two reward choices. It is not proof of phone session length. Human timing remains an acceptance gate.

## Step 6.1 Visible-Information Result

Commands:

```bash
npm run sim:balance -- --seeds=500
npm run sim:run -- --seeds=100 --policy=visible
```

The visible policy scores only the current board, legal swap previews, affordable ability effects, visible matches created by conversions, and direct row contents. It executes only the selected action; it does not resolve every candidate to inspect refill RNG or future cascades.

| Build priority | Complete | Avg victories | Avg actions | Glass Edge losses |
| --- | ---: | ---: | ---: | ---: |
| Solar → Aether | 1/100 | 0.68 | 32.90 | 66 |
| Ward → Crown | 1/100 | 0.65 | 34.65 | 66 |
| Veil → Core | 0/100 | 0.61 | 32.75 | 66 |

This is a major accessibility warning, not a measured human win rate. The policy is deterministic and respects visible information, but its fixed heuristic does not learn long-term setup, denial, or encounter-specific tactics. The exhaustive greedy and spell-aware policies both inspect fully resolved candidate swaps, so neither is a clean lower human bound. Human observation must now determine whether Glass Edge is genuinely too difficult, insufficiently taught, or simply undervalued by the heuristic.

No HP, cost, reward, or enemy value was changed in Step 6.1. Tuning against the visible policy alone would risk making the game trivial for players who understand setup and denial.

### Resource And Pressure Split

Average actual HP damage, after Guard:

| Policy | Aurora sword | Aurora shade | Aurora Aether | Shade sword | Shade shade | Shade Aether |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Greedy swaps | 10.48 | 16.52 | 3.58 | 1.90 | 16.23 | 4.06 |
| Spell-aware | 11.38 | 18.87 | 4.33 | 1.25 | 10.69 | 3.02 |

Average Guard gained / damage blocked / final Guard:

- greedy: Aurora 14.05 / 14.53 / 3.52; Shade 6.10 / 5.95 / 2.15;
- spell-aware: Aurora 16.95 / 12.88 / 8.08; Shade 4.73 / 5.66 / 1.07.

Average mana gained / spent:

- greedy: Aurora 30.03 / 0.00; Shade 16.63 / 4.34;
- spell-aware: Aurora 33.60 / 9.93; Shade 13.15 / 2.96.

### Ability Use And Resolution Value

Average casts per battle under spell-aware play:

- Crown Strike 0.69;
- Sun Bloom 0.56;
- Glass Ward 0.26;
- Veil Rift 0.59.

Simulator v2 attributes the complete resolution of a cast action—including its cascades—to that ability. Per battle, Crown Strike produces 5.22 HP damage and 4.02 mana; Sun Bloom produces 3.41 HP damage, 7.20 mana, 2.54 Guard, and 0.64 Aether; Glass Ward produces 2.63 Guard; Veil Rift produces 6.71 HP damage and 1.53 Guard. These are diagnostic action outcomes, not isolated effect coefficients, because deterministic cascades are intentionally included.

## Change From The Step 4 Baseline

The previous 500-seed baseline was 73.6% greedy and 98.6% spell-aware Aurora wins. Step 5 changes the combat, so exact outcome parity is not expected:

- Shade now spends 5 Moon on the visible Veil Rift ability;
- Moon is worth more to Shade's move scorer because it powers a real threat;
- match-4 retains the turn without the previous hidden +1 tile-effect bonus;
- match-5 also creates Aether;
- Aurora gains 2 Guard from Prism Guard when it creates Aether;
- Sun Bloom costs 8 Sun and creates a controlled five-cell cross instead of a 3×3 square;
- Aether deals fixed 5 damage and clears a radius-1 square when swapped.

Spell-aware Aurora dropped from 98.6% to 78.8%. The current solver remains clairvoyant and exhaustive, so this is a major correction from near-automatic victory, not yet evidence that human first-duel difficulty is final. Greedy Aurora dropped to 50.8%, showing that ignoring abilities and enemy charge is now materially punished.

## Interpretation

1. Enemy mana now changes board value: Shade casts in 59–87% of battles depending on how quickly Aurora ends the duel.
2. The duel now contains all intended trade-offs in aggregate: both actors deal HP damage, gain and consume Guard, gain and spend mana, create and activate Aether, and exchange extra-turn chains.
3. Shade pressure is primarily Shade damage rather than weak Sword matches, which gives Veil Rift a legible identity.
4. Sun Bloom still has the largest mana-engine outcome, but its higher cost and smaller footprint prevent the old near-guaranteed win loop.
5. The three policies do not form a calibrated human skill ladder: greedy and spell-aware inspect resolved cascades, while the visible policy uses a deliberately simple immediate heuristic.
6. The 24.4% visible result and 66% opening-run failure rate make first-encounter accessibility the primary playtest question. Do not nerf or buff combat until human evidence identifies the cause.
7. The spell-aware 78.8% result remains slightly above the provisional 60–75% target for a competent non-clairvoyant player, but it is a solver ceiling rather than a human estimate.

## Simulator V2 Coverage

The simulator now reports:

- win rate, actions, turns, and P50/P90/P99 action counts;
- damage split by tile source;
- Guard gained, damage blocked, and remaining;
- mana gained and spent, plus unspent mana on Aurora losses;
- casts and complete resolution outcomes by ability;
- match-length and actor-chain histograms;
- Aether creation and activation;
- backlash and backlash deaths;
- no-move refills;
- deterministic samples of the longest, shortest, and most one-sided seeds.

Structured metrics are calculated from action events rather than parsing presentation strings and have their own regression test.

## Simulator Limitations

The numbers are diagnostics, not a final difficulty rating.

- The spell-aware player evaluates fully resolved deterministic outcomes, including future cascades.
- It checks many targets and behaves more like an exhaustive solver than a human.
- Shade uses a first-order move/target score; the policies are not symmetric.
- Ability outcome attribution includes the whole cast resolution, so cascade value is correlated with the ability but is not a causal decomposition.
- The simulator measures actions, not real phone play time, comprehension, perceived fairness, or fun.
- The run probe follows three fixed upgrade priorities; it does not discover builds or measure what a human finds legible or enjoyable.
- The visible policy cannot see hidden cascades, but its weights are hand-authored and it has no planning horizon, learning, memory, or model of player discovery.
- It measures encounter actions, not reward-reading time, real session duration, voluntary replay, or retention.
- It does not model permanent progression; that is intentionally absent until the run proves intrinsic replay value.

## Provisional Targets For The First Duel

These remain iteration gates, not permanent product promises:

- normal duel length: 3–5 minutes on a phone;
- unresolved battles: 0%;
- first-enemy Aurora win rate: approximately 60–75% for a competent non-clairvoyant policy;
- no general spell-aware policy near automatic victory;
- Shade regularly spends mana on a visible ability;
- no single player ability is the best action in most eligible states;
- long extra-turn chains are rare highlights rather than the normal exchange pattern;
- lethal backlash is communicated before confirmation;
- seeded replays are stable across repeated runs of the same build.

## Next Balance Work

1. Run the [five-person protocol](PLAYTEST_STEP_6_1.md) and record completion time, first-action comprehension, Veil Rift fairness, Aether discoverability, prism meaning, and voluntary replay.
2. Compare human first-duel outcomes with the 24.4% visible and 78.8% spell-aware diagnostics before choosing a tuning direction.
3. Compare per-ability selection and outcome across encounter profiles in the short run.
4. Tune the smallest encounter-specific value only after policy and human evidence agree on the direction.
5. Preserve this seed range as the Step 5 regression cohort.
6. Use both visible and spell-aware 100-run cohorts as Step 6 baselines; do not tune against a single showcase seed.
