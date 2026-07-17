# Kingdom Duel — Roadmap

Status: canonical execution order
Current milestone: Step 6.1 implementation complete; browser and human execution gates remain open
Product direction: tactical match-3 duel → short replayable run → PWA → optional native wrappers

## Working Principle

Every step must end with:

- a playable build;
- a bounded diff;
- automated checks;
- an independent review pass;
- an explicit decision about what is still deferred.

Architecture work must quickly convert into visible gameplay value. The project must not disappear into a long infrastructure rewrite.

## Step 0 — Canonical Baseline

Goal: create one reliable source of truth before behavioural work.

- [x] identify the audited commit and visual evidence;
- [x] create canonical game, architecture, balance, and roadmap documents;
- [x] move historical pass reports under `docs/archive/`;
- [x] update the root README;
- [x] add one `npm run check` verification entrypoint;
- [x] complete independent diff and link review;
- [x] commit the verified baseline locally.

No gameplay or visual behaviour should change in this step.

## Step 1 — Engine Correctness

Goal: make the current deterministic core trustworthy before extending it.

Scope:

- [x] active-rules propagation;
- [x] hard-coded actor/ability labels in engine copy;
- [x] intersecting match semantics;
- [x] incoming/blocked/HP damage events;
- [x] real no-move refill;
- [x] action and coordinate validation;
- [x] cancellable enemy timers;
- [x] keyboard-focus regression;
- [x] targeted regression and invariant tests.

Gate:

- existing gameplay remains recognisably identical;
- new tests reproduce every confirmed bug before its fix;
- the same seed/action sequence is stable;
- `npm run check` passes.

## Step 2 — Content And Effect Model

Goal: add normal heroes, enemies, and abilities through content definitions.

Scope:

- [x] `HeroDefinition`;
- [x] `EnemyDefinition`;
- [x] `AbilityDefinition`;
- [x] targeted generic effects needed by the next slice;
- [x] content registries;
- [x] schema and runtime validation;
- [x] remove concrete spell-ID branches from ordinary execution and UI presentation.

Gate:

- current three abilities run through the new model;
- a test ability can be added without modifying the resolver;
- no speculative universal scripting language is introduced.

## Step 3 — Game Actions And Resolution Frames

Goal: support reliable animations, replay, and faster simulation.

Scope:

- [x] validated `GameAction` API;
- [x] ordered `ResolutionFrame` timeline;
- [x] board/stat snapshots needed for animation;
- [x] serialisable action log;
- [x] lightweight simulation mode without human-readable history.

Gate:

- the current duel can replay from seed and actions;
- UI can display swap, match, fall, cascade, damage, and turn transfer separately;
- headless simulation uses the same rules.

## Step 4 — UI Modularisation

Goal: stop growing `main.ts` and `styles.css` without changing the accepted visual baseline.

Scope:

- [x] app state/store and selectors;
- [x] input controller;
- [x] battle/result/debug views;
- [x] board/combatant/ability/log components;
- [x] resolution playback controller;
- [x] CSS tokens and feature files;
- [x] stable focus, keyboard support, and live announcements.

Gate:

- baseline screenshots do not regress unintentionally;
- touch, mouse, and keyboard smoke tests pass;
- 390×700 and 390×844 retain the complete core loop.

## Step 5 — First Combat Expansion

Goal: make the single duel materially more tactical.

Scope:

- [x] Shade spends mana on telegraphed abilities;
- [x] Aurora receives one visible passive;
- [x] match-4 and match-5 rewards diverge;
- [x] one special-gem type;
- [x] first focused spell rebalance;
- [x] simulator v2 metrics.

Gate:

- enemy mana creates real threat and denial decisions;
- spell-aware Aurora no longer approaches automatic victory;
- one duel repeatedly produces damage/defence/mana/denial trade-offs.

## Step 6 — Short Replayable Run

Goal: prove retention with a small product-shaped loop.

Scope:

- [x] normal duel → upgrade → second duel → upgrade → elite → boss;
- [x] one additional enemy profile before the boss;
- [x] mechanical upgrade choices rather than broad percentage inflation;
- [x] run save/resume;
- [x] deterministic daily-seed foundation;
- [x] benchmark the loop against Puzzle Quest-style replayability practices;
- [x] add a deterministic multi-build run simulator.

Gate:

- [ ] a complete run takes roughly 10–15 minutes on a phone (simulation proxy only; human timing required);
- [x] at least two upgrade paths are mechanically different and provisionally viable in the solver cohort;
- [ ] players voluntarily replay and describe the second run as meaningfully different (playtest required).

## Step 6.1 — Validation Hardening

Goal: stop solver confidence, stale saves, or an untested mobile path from being mistaken for product validation.

Scope:

- [x] pin schema, rules, content, and daily versions in run state and save validation;
- [x] reject incompatible and structurally inconsistent run state instead of silently resuming it;
- [x] add a visible-information policy that does not inspect hidden candidate cascades;
- [x] record visible-policy single-duel and full-run cohorts;
- [x] add typed Chromium E2E scenarios at 390×700 and 390×844 for play, save, pending enemy turn, reward, daily contract, result, and restart;
- [x] publish a five-person real-phone protocol with explicit comprehension, pacing, and replay gates;
- [ ] execute the Chromium suite in an environment with a valid browser binary;
- [ ] execute and record the five real-phone sessions.

Decision:

- the 24.4% visible-policy first-duel rate and 0–1% run completion are an accessibility warning, not a human result;
- no combat values change until the human protocol distinguishes difficulty from clarity, interaction, and heuristic weakness;
- Step 7 may begin only after P0/P1 mobile issues are closed and the Step 6 gates are explicitly passed or bounded as inconclusive.

## Step 7 — Game Feel And Frutiger World

Goal: turn readable systems into an emotionally satisfying game.

Scope:

- gem movement and removal;
- cascade rhythm;
- Guard break, HP hit, portrait reactions;
- spell, victory, and defeat transitions;
- sound and optional haptics;
- reduced-motion path;
- light weather/world states connected to rules.

Gate:

- feedback explains the result without slowing repeated play;
- the style reads as a bright glass world, not only glossy interface chrome.

## Step 8 — PWA Foundation

Goal: make the validated run installable and resilient on mobile web.

Scope:

- manifest, icons, theme metadata;
- safe areas and `viewport-fit=cover`;
- offline shell;
- save/resume lifecycle;
- onboarding and settings;
- privacy and basic diagnostics;
- Android Chrome, iOS Safari, and Telegram WebApp QA.

## Step 9 — Optional Android/iOS Packaging

Only after the PWA run is stable:

- Capacitor wrapper;
- native lifecycle and haptics;
- signing, store assets, privacy disclosures;
- internal Android testing;
- TestFlight/iOS review preparation.

## Deferred Until The Run Is Proven

- large campaign map;
- inventory and crafting;
- many heroes;
- PvP, guilds, and live-service systems;
- monetisation economy;
- native rewrite;
- large unscoped art-production passes.

## Immediate Next Step

Run the [Step 6.1 protocol](PLAYTEST_STEP_6_1.md) on the frozen build before numerical tuning: five first-session players, real elapsed time, encounter reached, prism comprehension, boss readability, and voluntary restart intent. Execute `npm run test:e2e` where Chromium is available. Fix critical comprehension, pacing, or mobile-lifecycle failures, then begin **Step 7 — Game Feel And Frutiger World** without adding metaprogression yet.
