# Kingdom Duel — Architecture

Status: canonical description of the current architecture and intended boundaries
Current implementation: Step 6.1 validation hardening for the short replayable run

## Current Runtime

- TypeScript 5.9;
- Vite 8;
- browser DOM/CSS UI;
- no production runtime framework;
- no backend;
- static GitHub Pages deployment.

## Current Source Map

```text
src/
  content/
    abilities.ts          Ability registry, effects, targeting, and UI presentation data
    passives.ts           Passive registry and visible hero trigger data
    heroes.ts             Hero definitions and equipped ability IDs
    enemies.ts            Enemy definitions and AI profiles
    validation.ts         Runtime schema/content validation
  main.ts                 Browser composition root and duel/UI orchestration
  input.ts                Small input decision helpers
  ui-lifecycle.ts         Cancellable timers and stable focus identities
  styles.css              CSS entrypoint
  run/
    content.ts            Encounter ladder and mechanical prism definitions
    rules.ts              Encounter and selected-upgrade rules composition
    run.ts                Seeded run transitions, rewards, and daily seed
    storage.ts            Versioned run-save validation and persistence port
    types.ts              Run domain types
    version.ts            Pinned schema, rules, content, daily, and storage versions
  ui/
    state.ts              Battle UI store, selectors, and presentation snapshots
    playback.ts           Cancellable resolution-frame playback
    input-controller.ts   Delegated pointer, touch, mouse, and click input
    debug-presets.ts      Deterministic visual/debug states
    assets.ts             Shared asset-backed render helpers
    components/           Board, combatants, ability row, and combat log
    views/                Battle, run reward/result, report, and moodboard composition
  styles/
    base.css              Tokens, reset, shared shell, accessibility utilities
    battle-*.css          Battle shell, actions, board, log, and playback feedback
    moodboard.css         Standalone visual reference view
    responsive.css        Mobile and compact-height adaptations
  engine/
    board.ts              Board generation, matches, swaps, drops, legal moves
    duel.ts               Validated actions, replay, frames, abilities, effects, and logs
    enemy-policy.ts       Content-driven enemy intent and move/ability scoring
    rewards.ts            Match-4/match-5 reward and targeting helpers
    rules.ts              Default tuning values
    rng.ts                Seeded pseudo-random generator
    types.ts              Domain types
scripts/
  sim-battles.ts          Headless balance probe
  sim-player.ts           Shared strategy dispatch for headless player policies
  visible-player-policy.ts Immediate-preview policy without hidden cascade trials
  sim-runs.ts             Multi-encounter build-path probe
  sim-metrics.ts          Structured battle analysis and simulator-v2 aggregation
e2e/
  run-mobile.spec.ts      Mobile run/save/reward/result browser contracts
playwright.config.ts      390×700 and 390×844 Chromium projects
```

The current engine is deterministic and mostly isolated from the DOM. That boundary must be preserved.

## Current Strengths

- seeded board generation;
- pure-data board representation;
- strict TypeScript configuration;
- engine and input regression tests;
- central default ruleset;
- structured duel events;
- content-backed heroes, enemies, and abilities;
- runtime validation for content and rules composition;
- generic ability execution shared by player and enemy actors;
- content-backed passives and visible enemy ability charge;
- distinct match rewards and non-random Aether creation/activation;
- one validated action envelope for swaps, casts, and no-move refills;
- deterministic seed-plus-action replay;
- ordered, detached resolution snapshots for animation playback;
- headless battle simulation;
- UI state isolated from the committed deterministic duel state;
- cancellable, reduced-motion-aware resolution playback;
- delegated input with stable rerender focus and persistent live announcements;
- feature-split battle views, components, and styles;
- small production bundle;
- static deployment with no runtime service dependency;
- deterministic four-encounter run and reward offers;
- enemy policy isolated from duel resolution and driven by content profiles;
- versioned local save validation and pending-turn resume;
- independently pinned save schema, combat rules, run content, and daily contracts;
- standard and UTC daily-seed run modes;
- headless run simulation across build priorities;
- a visible-information player policy that chooses from previews without executing hidden candidate cascades;
- typed mobile browser scenarios for battle persistence, pending turns, rewards, daily identity, results, and restart.

## Correctness Status

Step 1 resolved these audited defects:

- every ability-effect and battle-copy path uses the active ruleset;
- actor and ability display names in engine summaries come from current state/content;
- intersecting same-tile runs merge into one unique-cell match group;
- damage events report incoming, blocked, and actual HP damage;
- a no-move enemy turn generates a new playable board and advances the turn;
- invalid, fractional, out-of-bounds, identical, and unknown actions fail safely;
- enemy-thinking callbacks are cancellable across restart and view changes;
- full rerenders restore focus to the same stable board, spell, action, or view control.

The remaining structural risks are intentionally assigned to later steps:

1. The framework-free UI still replaces the complete app HTML during interaction. Stable control identities preserve focus, but a future measured performance or screen-complexity problem may justify incremental DOM updates.
2. `duel.ts` still owns action dispatch, effect execution, match resolution, event copy, and replay, but enemy selection/scoring is now isolated in `enemy-policy.ts`. Split another domain only when a concrete mechanic would otherwise add a second responsibility to the resolver.
3. `main.ts` is a browser composition root and now also coordinates run-screen transitions and persistence. Game rules remain outside it, but another product screen should trigger extraction of a small application/run-session controller before more branches are added.
4. `battle.ts` remains the largest view composer. Board, combatants, abilities, log, report, and the new run reward/result views are separate modules; keep non-combat screens out of the battle composer.
5. `DuelRules` remains a compatibility aggregate. `buildRunDuelRules` clones and composes encounter/upgrade content without mutating defaults, but a future roster/loadout system may justify an explicit runtime-content context.
6. Passives support one scheduled trigger and Aether is the single special-tile contract. Generalise either only when a second concrete mechanic requires it.
7. Save/resume now rejects mismatched schema, rules, content, and daily contracts. There is no migration or bundled legacy-rules runtime yet, so an incompatible in-progress run is intentionally discarded. User-facing expiry copy, cross-device sync, lifecycle telemetry, installability, and native adapters remain PWA/platform work.
8. Browser E2E covers the current mobile product path, but it still needs to run in CI and against real iOS Safari/Android Chrome devices; Chromium emulation is a regression contour, not device certification.

## Current Content And Effect Model

The playable slice uses registries under `src/content/`:

- `HeroDefinition` owns base stats and equipped ability IDs;
- `EnemyDefinition` owns base stats, equipped ability IDs, and its AI scoring profile;
- `AbilityDefinition` owns cost, targeting, ordered effects, and action-bar presentation copy;
- `PassiveDefinition` owns its visible trigger and effect;
- `validateDuelRules` rejects broken IDs, malformed effects, invalid costs, and target/effect mismatches before a board is created.

The deliberately small effect vocabulary is:

```ts
type AbilityEffect =
  | { type: 'gain_guard'; amount: number }
  | { type: 'convert_tiles'; radius: number; shape?: 'square' | 'cross'; to: BaseTileKind; from?: TileKind }
  | { type: 'clear_row' };
```

`castAbility` executes the same effects for player and enemy actors. `castSpell` remains a player wrapper for compatibility with the current UI. Adding an ordinary ability requires a registry entry and an equipped ability ID, not a resolver edit.

This is intentionally not a universal scripting language. New effect types should be added only when a scheduled playable mechanic cannot be expressed by the existing three.

## Current Action And Resolution Model

All accepted and rejected gameplay commands pass through `dispatchGameAction`. Compatibility wrappers (`applySwap`, `castSpell`, `castAbility`, and `runEnemyTurn`) construct the same action envelopes instead of maintaining separate execution paths.

The serialisable action vocabulary is deliberately small:

```ts
type GameAction =
  | { type: 'swap'; actor: ActorId; from: Cell; to: Cell }
  | { type: 'cast'; actor: ActorId; abilityId: AbilityId; target: Cell }
  | { type: 'refill'; actor: ActorId };
```

Each action appends an `ActionRecord` with its turn, acceptance state, optional rejection, and structured events. `replayDuel` recreates a duel from its initial seed and those actions. The no-move refill is an explicit action so that this rare RNG-consuming branch is replayable too.

Interactive resolutions expose detached board and combatant snapshots for swap, ability, cascade, match, special creation/activation, stat effect, fall, refill, turn transfer, and battle end. Simulation mode uses the same dispatcher and rules but skips frames, rolling log copy, and human-readable battle history. `ResolutionPlaybackController` presents those snapshots in order, locks board input until completion, cancels stale sequences on restart/view changes, and jumps directly to the final frame when reduced motion is requested. The committed duel state stays separate from the transient presentation snapshot, so logs, replay traces, and enemy sequencing always use the final authoritative result.

## Run Version And Release Contract

`src/run/version.ts` pins four independent identities:

- bump `RUN_SCHEMA_VERSION` when serialized run/duel shape or validation compatibility changes;
- bump `RUN_RULES_VERSION` when combat numbers, resolver semantics, rewards, or AI valuation change;
- bump `RUN_CONTENT_VERSION` when encounters, equipped abilities, enemy profiles, or prism offers change;
- bump `DAILY_CHALLENGE_VERSION` when the daily algorithm or schedule policy changes.

The daily seed hashes the daily, rules, and content identities with its UTC date, so two builds with different playable contracts cannot claim the same daily. A rules/content deployment during an active UTC day would create a different challenge under the same visible date; until historical rule bundles exist, deploy those changes at a UTC boundary or explicitly roll the daily version and announce the reset.

Loads require exact identity matches and reject old or structurally inconsistent state. The app currently starts a fresh run when a save is incompatible. Before public live updates, add a user-facing “run expired after update” message; do not silently introduce best-effort migrations for combat state.

## Current Invariants

Changes must preserve these invariants:

- the same seed and action sequence produce the same final state;
- the board is stable and has at least one legal move after resolution;
- normal damage is absorbed by Guard before HP;
- backlash bypasses Guard;
- only a legal adjacent swap that creates a match, or any adjacent Aether swap, may resolve;
- a match of four or more can retain the turn; a match group of five or more creates Aether;
- random generation and refill produce only base tiles;
- all balance values come from the active content/rules context;
- the engine must not read or mutate DOM state;
- simulation must use the same core rules as the playable build.

## Target Boundaries

The refactor should move toward these boundaries without a big-bang rewrite:

```text
src/
  game/
    actions/              GameAction validation and dispatch
    board/                Board operations
    effects/              Generic effect execution
    resolution/           Resolution frames and event timeline
    simulation/           Fast headless policies and metrics
    state/                Versioned game state and serialization
  content/
    heroes/               Hero definitions and passives
    enemies/              Enemy definitions and AI profiles
    abilities/            Ability definitions built from effects
    encounters/           Duel and run composition
  ui/
    components/           Board, combatants, ability bar, log, result
    views/                Battle, result, debug/moodboard
    input/                Pointer, touch, keyboard controllers
    animation/            Resolution-frame playback
    state/                UI store and selectors
  platform/
    web/                  Browser lifecycle and persistence
    pwa/                  Install/offline integration
    native/               Capacitor adapters when justified
```

## Target Core API

```ts
type GameAction =
  | { type: 'swap'; actor: ActorId; from: Cell; to: Cell }
  | { type: 'cast'; actor: ActorId; abilityId: AbilityId; target: Cell }
  | { type: 'refill'; actor: ActorId };

type Resolution = {
  state: DuelState;
  events: DuelEvent[];
  frames: ResolutionFrame[];
  rejection?: ActionRejection;
};
```

This API is implemented by the engine and consumed by the UI playback layer. Animation timing remains outside the resolver and compatibility wrappers.

## Change Rules

1. Keep every intermediate commit buildable and testable.
2. Separate behavioural refactors from visual redesigns.
3. Add regression coverage before fixing a confirmed engine bug.
4. Do not migrate to a UI framework unless a measured requirement justifies it.
5. Do not introduce a universal effect language beyond the effects needed by the next playable milestone.
6. Preserve public asset paths and the mobile baseline unless a task explicitly changes them.
7. Any rules change must update `BALANCE.md` and run the seeded probe.
8. Any screen change must be checked at 390×700 and 390×844.

## Verification

Primary local gate:

```bash
npm run check
```

Additional balance probe:

```bash
npm run sim:balance -- --seeds=500
npm run sim:run -- --seeds=100 --policy=visible
```

Mobile browser gate:

```bash
npm run test:e2e:install
npm run test:e2e
```

Before a change is declared complete:

- inspect the diff independently of the implementation pass;
- run `npm run check`;
- run `git diff --check`;
- confirm deterministic regression tests;
- perform targeted mobile/runtime QA when UI or input changes.

The Step 6.1 E2E suite type-checks and discovers ten tests locally. In the 2026-07-14 workspace, the Chromium binary could not be installed because the Playwright CDN returned an empty/truncated archive, so browser execution remains an explicit environment gate rather than a claimed pass.
