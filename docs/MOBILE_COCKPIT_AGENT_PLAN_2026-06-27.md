# Kingdom Duel Sequential Agent Plan

Date: 2026-06-27

Mode: sequential orchestration.

Main session role: dispatcher and reviewer.

Do not run these as a broad swarm. Each task should land, be reviewed, verified, and deployed before the next task starts unless explicitly marked independent.

## Source Context For Every Agent

Each agent should read:

- `README.md`
- `docs/STYLE_MOODBOARD.md`
- `docs/GAMEPLAY_DESIGN_PASS_2026-06-27.md`
- `docs/MOBILE_FIRST_UX_UI_RESEARCH_2026-06-27.md`
- `docs/MOBILE_COCKPIT_IMPLEMENTATION_PLAN_2026-06-27.md`

Current public build:

- https://sdv-g-deploy.github.io/kingdom-duel/

## Implementation Status

Updated after Samsung S25 feedback on 2026-06-27:

- Task 01 landed as the mobile cockpit shell.
- Task 02 landed with drag/swipe input and tap-tap fallback.
- Follow-up fit work added a stricter 390x700 QA target because real mobile browser chrome leaves less usable height than a clean 390x844 viewport.
- Tap guidance now highlights all adjacent directions, not only match-producing targets, because highlighting only "best" targets looked like a movement restriction.
- Enemy action feedback landed before Task 03 because the turn sequence was unclear without visible enemy cues.
- Task 03 landed with stable portrait/gem slots, path conventions, and CSS fallbacks.
- Task 04 landed with first-pass Aurora Knight and Shade Knight WebP portraits.
- Task 05 landed with first-pass WebP gem sprites.
- Task 06 is the next planned task: mobile QA and deploy review.

Core constraints:

- keep the standalone `kingdom-duel` repo clean;
- do not import old LW2B / Kingdom OS code;
- preserve AeroCandy 2007 direction;
- mobile-first for play route;
- board remains the primary interaction surface;
- no new campaign/relic/inventory scope during this sequence;
- every implementation task must run `npm test`, `npm run build`, and `git diff --check`;
- visual tasks must capture mobile and desktop screenshots.

## Task 01: Mobile Cockpit Shell

Goal:

Convert the play route from a tall responsive page into a mobile-first battle cockpit.

In scope:

- refactor play layout around:
  - `TopGameBar`
  - `CombatStrip`
  - `BoardFrame`
  - `ActionDock`
  - `LatestEvent`
  - simple secondary panels/sheets if needed;
- reduce mobile title/header footprint;
- keep board visually dominant;
- collapse full combat log into latest event + accessible full log panel/sheet;
- move moodboard/debug access out of the first mobile gameplay viewport;
- preserve desktop functionality, even if desktop visual polish is secondary.

Out of scope:

- final hero/enemy art;
- final gem sprites;
- changing combat rules;
- adding new spells/enemies/relics;
- major VFX.

Required artifact:

- implementation commit;
- screenshots:
  - `screenshots/mobile-cockpit-390x844.png`
  - `screenshots/mobile-cockpit-390x1200.png`
  - `screenshots/mobile-cockpit-desktop.png`

Write-early rule:

- If the refactor touches more than `src/main.ts` and `src/styles.css`, write a short checkpoint note in `docs/mobile-cockpit-checkpoint.md` before continuing.

Final report:

- files changed;
- layout decisions;
- screenshots captured;
- verification performed;
- remaining issues.

Acceptance:

- On 390x844, normal play shows combat state, board, action/preview/spells without scrolling through actor cards.
- Board is larger and more central than in the current mobile build.
- No horizontal overflow.
- Desktop still loads and plays.

## Task 02: Touch Controls

Goal:

Make mobile gem movement obvious and tactile.

In scope:

- implement Pointer Events for board input;
- primary gesture: drag/swipe gem toward adjacent cell;
- fallback: tap gem, then tap highlighted adjacent target;
- after first tap, highlight legal adjacent targets;
- non-adjacent tap moves selection instead of producing confusing invalid feedback;
- invalid adjacent move gets visual snap-back/bump feedback;
- lock input during resolving/enemy turn;
- board uses `touch-action: none`; outside board remains scrollable.

Out of scope:

- full animation system;
- changing match/cascade rules;
- adding haptic/browser vibration unless explicitly approved;
- art asset generation.

Required artifact:

- implementation commit;
- screenshots:
  - `screenshots/mobile-touch-selected.png`
  - `screenshots/mobile-touch-swap-preview.png`
  - `screenshots/mobile-touch-invalid.png` if practical;
- note any manual phone test result.

Write-early rule:

- If drag implementation becomes complex, first land tap-adjacent target hints behind clean helper functions, then add drag.

Final report:

- input model implemented;
- files changed;
- tests/build performed;
- screenshots/manual checks;
- known edge cases.

Acceptance:

- A valid swap can be made by swipe on mobile.
- Tap-tap still works.
- First tap clearly shows next possible actions.
- Invalid adjacent swap feels like board feedback, not a text error.
- Swiping on board does not scroll the page.

## Task 03: Asset Slots And Fallbacks

Goal:

Prepare stable UI slots for real character portraits and gem sprites without generating final art yet.

In scope:

- add stable portrait slots for:
  - Aurora Knight;
  - Shade Knight;
- add stable gem image slots for all tile kinds;
- keep current CSS gems as fallback;
- define file/path conventions for assets;
- ensure fixed dimensions/aspect ratios to avoid layout shift;
- optionally add temporary local placeholder files if useful.

Out of scope:

- final generated art;
- changing gameplay layout beyond what slots require;
- adding large background art.

Required artifact:

- implementation commit;
- docs note:
  - `docs/ASSET_SLOT_SPEC_2026-06-27.md`
- screenshots:
  - `screenshots/asset-slots-mobile.png`
  - `screenshots/asset-slots-desktop.png`

Write-early rule:

- Write the asset slot spec before changing code so later art agents know the exact dimensions and constraints.

Final report:

- slot paths and dimensions;
- fallback behavior;
- verification performed;
- remaining asset questions.

Acceptance:

- Missing images do not break the board or combat strip.
- Slots have stable dimensions on mobile and desktop.
- Gem fallback remains readable.

## Task 04: Character Portrait Asset Pass

Goal:

Create and integrate first-pass hero/enemy portraits.

In scope:

- generate or prepare two bounded assets:
  - Aurora Knight;
  - Shade Knight;
- transparent background;
- optimized WebP/PNG;
- integrate into portrait slots;
- preserve CSS fallback.

Out of scope:

- final illustration set;
- animation;
- multiple enemy variants;
- changing cockpit layout except minor fit adjustments.

Required artifact:

- assets under agreed slot paths;
- implementation commit;
- screenshots:
  - `screenshots/portraits-mobile.png`
  - `screenshots/portraits-desktop.png`
- optional source prompt note in `docs/ASSET_GENERATION_NOTES_2026-06-27.md`.

Write-early rule:

- Before generating assets, write the exact prompt and acceptance checks into the notes file.

Final report:

- assets added;
- sizes/formats;
- prompts or source notes;
- screenshots;
- verification performed.

Acceptance:

- Both portraits readable at mobile combat-strip size.
- Portraits fit AeroCandy 2007, not medieval grimdark.
- Page remains performant enough for GitHub Pages.

## Task 05: Gem Sprite Asset Pass

Goal:

Replace primitive CSS-only gems with first-pass readable gem sprites.

In scope:

- create or prepare six tile sprites:
  - sword;
  - shield;
  - sun;
  - moon;
  - crown;
  - shade;
- transparent background;
- readable at 48px and 96px;
- integrate through gem slot system;
- keep CSS fallback.

Out of scope:

- particle effects;
- full animation/VFX;
- changing tile rules;
- adding more tile kinds.

Required artifact:

- assets under agreed slot paths;
- implementation commit;
- screenshots:
  - `screenshots/gem-sprites-mobile.png`
  - `screenshots/gem-sprites-desktop.png`
- asset notes update.

Write-early rule:

- Generate/prepare one style sample first if quality is uncertain, then proceed with the full set.

Final report:

- assets added;
- sizes/formats;
- readability notes;
- screenshots;
- verification performed.

Acceptance:

- Each tile is visually distinct at 48px.
- Shade reads as risky/dangerous.
- Gems are prettier without becoming noisy.
- No text/logos/baked UI in tile images.

## Task 06: Mobile QA And Deploy

Goal:

Review the integrated mobile experience and deploy a stable build.

In scope:

- run all checks;
- inspect public Pages build;
- verify screenshots/states;
- fix regressions from the previous tasks;
- update docs/README if behavior changed.

Out of scope:

- new features;
- new assets unless fixing broken integration;
- balance changes.

Required artifact:

- final QA commit if changes are needed;
- QA note:
  - `docs/MOBILE_COCKPIT_QA_2026-06-27.md`

Write-early rule:

- Write QA notes as defects are found, not only after fixes.

Final report:

- public URL;
- commit hash;
- checks run;
- screenshots checked;
- remaining risks.

Acceptance:

- `npm test` passes.
- `npm run build` passes.
- `git diff --check` clean.
- GitHub Pages workflow green.
- Public URL loads.
- Mobile play route is usable without reading a long page.

## Optional Read-Only Parallel Tasks

These can run in parallel only if we want more confidence before asset generation:

### Optional A: Art Reference Scout

Goal:

Collect 8-12 image references for AeroCandy hero/enemy/gems.

Output:

- `docs/ART_REFERENCE_SCOUT_2026-06-27.md`

No code writes.

### Optional B: Mobile Competitive UI Scout

Goal:

Collect screenshots/notes from Puzzle Quest 3, Gems of War, MARVEL Puzzle Quest, Magic Puzzle Quest, and Candy Crush-style touch controls.

Output:

- `docs/MOBILE_UI_REFERENCE_SCOUT_2026-06-27.md`

No code writes.

## Dispatcher Rule

Main session should review each task before launching the next.

If a task is too large, split it at the checkpoint rather than asking one agent to finish everything silently.

Recommended first launch:

> Task 01: Mobile Cockpit Shell

Do not launch asset generation until Task 03 creates stable slots.
