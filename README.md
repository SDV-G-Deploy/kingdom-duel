# Kingdom Duel

Mobile-first tactical match-3 RPG duel in the **AeroCandy 2007** visual language: bright glass, pearl plastic, readable candy gems, and a shared board where damage, defence, mana, denial, and risk compete for every move.

[Play the current GitHub Pages build](https://sdv-g-deploy.github.io/kingdom-duel/).

## Current State

The repository contains a playable deterministic short run:

- Aurora Knight versus Shade Knight on one shared 8×8 board;
- HP, Guard, Sun/Moon/Crown mana, Shade backlash, cascades, and extra turns;
- move outcome plus enemy mana/ability intent previews;
- three board-changing player abilities and three enemy profiles;
- Aurora's visible Prism Guard passive;
- distinct match-4/match-5 rewards and a created Aether special gem;
- mobile swipe and tap-tap input plus mouse controls;
- keyboard-activatable controls with stable focus and live battle announcements;
- ordered swap, match, cascade, damage, refill, and turn playback;
- battle log and victory/defeat recap;
- a four-encounter normal → normal → elite → boss run;
- two choose-one-of-three mechanical prism upgrades;
- schema/rules/content-pinned local save/resume plus standard and fixed daily seeds;
- visible-information and exhaustive balance probes;
- typed mobile browser scenarios at 390×700 and 390×844;
- responsive mobile combat layouts and a static GitHub Pages deployment.

This is not yet a content-complete RPG or store-ready application. The short-run implementation is ready for real phone timing and replay-intent playtests before game-feel work or metaprogression expands the scope.

## Canonical Documentation

- [Game specification](docs/GAME_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Balance baseline](docs/BALANCE.md)
- [Execution roadmap](docs/ROADMAP.md)
- [Replayability benchmark](docs/REPLAYABILITY_BENCHMARK.md)
- [Step 6.1 mobile playtest protocol](docs/PLAYTEST_STEP_6_1.md)
- [2026-07-18 playtest review](docs/PLAYTEST_REVIEW_2026-07-18.md)
- [2026-07-18 asset inventory](docs/FRUTIGER_ASSET_INVENTORY_2026-07-18.md)

Dated research and implementation reports are preserved under `docs/archive/` and are historical evidence rather than current instructions.

Run:

```bash
npm install
npm run dev
```

Checks:

```bash
npm run check
```

Browser E2E (requires a locally installed Playwright Chromium binary):

```bash
npm run test:e2e:install
npm run test:e2e
```

`npm run check` type-checks and discovers the browser scenarios; it does not launch them. A full step handoff must also record `npm run test:e2e` on a machine with the Playwright Chromium binary. The 2026-07-18 stabilization pass installed Chromium locally and passed the 10-scenario mobile suite.

Copied debug traces now include build, dirty flag, rules/content/daily contract, and run context. Treat older trace exports as incomplete evidence unless the frozen build and encounter are recorded separately.

Balance probe:

```bash
npm run sim:balance -- --seeds=500
npm run sim:run -- --seeds=100
npm run sim:run -- --seeds=100 --policy=visible
```

## Contribution Rules

- Work in a dedicated branch; do not make feature changes directly on `main`.
- Keep every intermediate change buildable and testable.
- Add regression coverage before fixing a confirmed engine bug.
- Do not combine an architectural refactor with an unrelated visual redesign.
- Recheck mobile UI changes at 390×700 and 390×844.
- Run an independent diff review and `npm run check` before declaring a step complete.
