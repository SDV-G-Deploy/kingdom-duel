# Kingdom Duel Mobile Baseline Audit

Date: 2026-06-29
Status: Phase 0 baseline before structural redesign
Scope: current live mobile combat screen; no implementation changes
Live URL: <https://sdv-g-deploy.github.io/kingdom-duel/>
Live assets observed: `assets/index-BL-2mT_W.css`, `assets/index-DNzab551.js`

## Baseline Screenshots

- `screenshots/research/baseline-live-390x700.png`
- `screenshots/research/baseline-live-390x844.png`

These captures represent the current deployed state after `77429ea Add command deck charge meters`.

## Current 390x700 Read

Approximate visible vertical budget:

| Region | Approx. y-range | Approx. height | Read |
| --- | ---: | ---: | --- |
| App header / utility | 0-76 | 76px | Useful, but tall for a combat screen |
| Duel HUD + central oval | 78-178 | 100px | Too tall; central oval consumes premium space |
| Status title rail | 184-219 | 35px | Duplicates turn/board command copy |
| Veil Omen panel | 221-289 | 68px | Too large for `cuts 3 · braces 3` |
| Board | 291-591 | 300px | Strongest object, but starts too low |
| Command deck | 599-691 | 92px | Useful, but squeezed by upstream height |

Key observation:

**The board starts around 290px down the 700px viewport. About 40% of the screen is spent before the main gameplay object appears.**

This is the core structural problem. The current screen claims board-first, but the first visible half is mostly app chrome, hero HUD, turn oval, title copy, and a large omen capsule.

## Current 390x844 Read

The taller viewport is more comfortable, but it hides the real problem rather than solving it.

Approximate visible vertical budget:

| Region | Approx. y-range | Approx. height | Read |
| --- | ---: | ---: | --- |
| App header / utility | 0-76 | 76px | Still prominent |
| Duel HUD + central oval | 80-177 | 97px | Still oversized |
| Status title rail | 184-219 | 35px | Still duplicate copy |
| Veil Omen panel | 221-283 | 62px | Still decorative for its data |
| Board | 285-661 | 376px | Strong and readable |
| Command deck | 669-761 | 92px | Visible |
| Last event / log | 790-827 | 37px | Acceptable only because height is generous |

Key observation:

The 390x844 layout works better because it has extra height, not because the structure is correct. Extra space must not be used to justify decorative ovals or large empty panels.

## What Is Good In The Baseline

- The gem board is colorful, readable, and visually stronger than surrounding UI.
- Aurora/Shade color split is clear.
- HP, Guard, and resources exist and are close to the combatants.
- Shade risk markers on the board are visible.
- The bottom command deck has started to read as action controls rather than pure text.
- The glossy magical mood is distinct from dark fantasy match-3 RPGs.

## What Is Structurally Bad

### 1. Top Stack Is Too Tall

The app header, side HUD, central oval, status rail, and omen panel together consume too much height before the board.

### 2. Central Oval Has Poor Information Density

It carries:

- `Aurora turn`;
- `Command`;
- `6 moves`.

This can fit into one compact chip, but currently occupies the visual center of the duel HUD and creates an oversized decorative silhouette.

### 3. Veil Omen Panel Is Too Large

It carries:

- one purple orb;
- label `Veil Omen`;
- `cuts 3 · braces 3`.

This should become an enemy intent rail. The data is valuable, but the container is not.

### 4. Status Title Rail Duplicates Meaning

`Aurora turn` and `Command the glass board` restate state already shown elsewhere. Persistent combat copy should be shorter and more numerical.

### 5. Command Deck Is Improving But Still Squeezed

The command deck itself is directionally useful. Its problem is that it is forced into the remaining bottom space because the upper stack is too tall.

## Target Height Budget

For 390x700, a future pass should aim for:

| Region | Target height | Direction |
| --- | ---: | --- |
| App header | 44-52px | Short title + utility |
| Duel HUD | 58-72px | Compact side combat stats |
| Turn + intent rail | 28-40px | One compact row or two very tight rows |
| Board | 330-370px | Preserve/improve dominance |
| Command bar | 78-96px | Compact cards |
| Log | 0-28px | One-line or collapsed |

Hard target:

**The board should begin around 145-175px, not around 290px.**

This does not mean everything above the board must be tiny. It means the above-board stack must stop spending height on empty decorative shapes.

## Baseline-To-Target Component Changes

### App Header

Current:

- tall title/utility area with three large circular buttons.

Target:

- shorter app header;
- smaller utility buttons;
- no large circular controls competing with combat.

### Duel HUD

Current:

- two side panels plus large central oval;
- persistent flavor titles;
- dense information spread across decorative cards.

Target:

- side HUDs as compact combat strips;
- short names only;
- HP/Guard/resource numbers prioritized;
- active-side accent without big profile-card feel.

### Turn State

Current:

- large central oval medallion.

Target:

- compact chip: `Aurora turn · 6 moves`;
- placement between side HUDs or above board;
- one line if possible.

### Enemy Intent

Current:

- large `Veil Omen` capsule.

Target:

- one-row intent rail: `Shade next: cuts 3 · braces 3`;
- visually linked to Shade;
- no tall empty panel.

### Board

Current:

- strong, readable, but starts too low.

Target:

- preserve board size and readability;
- move board upward by removing decorative height;
- keep selected/valid/risk priority clear.

### Command Bar

Current:

- useful but compressed;
- still includes web-like instruction panel.

Target:

- compact command cards;
- cost/name/effect/state visible;
- long help copy moved to selected/expanded/tutorial state.

### Combat Log

Current:

- one-line log appears only in taller viewport.

Target:

- collapsed by default;
- one-line last event only when space allows;
- never compete with active board/action space.

## Next Work Plan

### Step 1: Baseline Sheet

Use the two screenshots in this document as the baseline. If desired, create an annotated image later, but do not block implementation on annotation.

### Step 2: Structural Wireframe

Before coding final visuals, create a rough mobile stack:

1. compact header;
2. compact duel HUD;
3. turn chip + Shade intent rail;
4. board;
5. command cards;
6. collapsed log.

Acceptance:

- 390x700 core loop visible without vertical scroll;
- no large central oval;
- no large omen panel;
- board starts materially higher than baseline.

### Step 3: Implementation Pass

Only after the wireframe direction is accepted:

- adjust `src/main.ts` markup for HUD/intent/command structure;
- adjust `src/styles.css` for compact shape grammar;
- do not touch engine/gameplay;
- keep board/gems intact.

### Step 4: Screenshot QA

Capture:

- baseline 390x700 and new 390x700;
- baseline 390x844 and new 390x844;
- state-specific selected/valid/risk/spell aim if the main pass succeeds.

### Step 5: Review Gate

Before push:

- compare before/after;
- verify no new decorative empty panels;
- verify no hidden combat state;
- run `npm test`;
- run `npm run build`;
- run `git diff --check`.

## Decision

The current screen should not receive another cosmetic polish pass.

The next implementation should be a structural mobile combat pass with one purpose:

**move from glossy decorated web-card stack to dense magical puzzle-duel cockpit while preserving the board, gems, and bright glass identity.**
