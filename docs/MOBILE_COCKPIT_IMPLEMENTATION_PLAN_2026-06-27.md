# Kingdom Duel Mobile Cockpit Implementation Plan

Date: 2026-06-27

Based on:

- `docs/MOBILE_FIRST_UX_UI_RESEARCH_2026-06-27.md`
- current public Pages build: https://sdv-g-deploy.github.io/kingdom-duel/

## Implementation Corrections

Updated after the first mobile implementation and Samsung S25 testing:

- Keep 390x844 as a reference viewport, but include 390x700 QA because browser chrome can reduce usable height.
- The play route should allow vertical page movement if the browser viewport is cramped; the board itself keeps `touch-action: none`.
- First tap should show all adjacent movement directions. Do not style only match-producing neighbors as the only apparent legal targets.
- Enemy action feedback is required before the asset pass: the player must see when the enemy turn happens and which board cells were involved.

## Position

I agree with the direction: the next work should be UX/UI structure, not more gameplay rules.

The game already has a playable engine loop. The mobile experience is the weak point:

- too much vertical scroll;
- board is not dominant enough;
- actor cards are too large;
- text/log/UI chrome consumes the screen;
- touch input is ambiguous;
- hero/enemy/gems are still placeholders.

We should not polish the current vertical layout. We should reshape the play route into a mobile-first battle cockpit.

## Non-Goals For The Next Pass

Do not do these yet:

- campaign map;
- relic progression UI;
- inventory;
- more enemies;
- full animation/VFX system;
- final economy/balance pass;
- generating final art before stable asset slots exist.

## Milestone 1: Mobile Duel Cockpit

Goal:

Make the default mobile play view feel like a game screen, not a long responsive page.

### Scope

Create a new play layout with these pieces:

- `GameShell`
- `TopGameBar`
- `CombatStrip`
- `BoardFrame`
- `ActionDock`
- `LatestEvent`
- `InfoSheet` or simple mobile panels

### Mobile Layout

Target first viewport on 390px width:

1. compact top bar;
2. combat strip with hero/enemy state;
3. dominant square board;
4. bottom action dock with preview and spells;
5. one latest event line.

The full combat log, hero details, enemy details, and moodboard should move out of the inline play scroll.

### Acceptance

- At 390x844, the player can see:
  - hero/enemy HP or compact state,
  - board,
  - current action/preview,
  - spell controls or a compact spell tray.
- Normal play does not require scrolling through 2-3 screens.
- Board is visually larger and more central than actor/log cards.
- Moodboard is no longer a first-viewport gameplay tab on mobile.
- Desktop still works.

## Milestone 2: Touch Control Model

Goal:

Make phone control obvious and tactile.

### Scope

Primary gesture:

- drag/swipe a gem toward an adjacent cell.

Fallback:

- tap gem, then tap highlighted adjacent target.

### Rules

On first tap:

- selected gem gets a strong ring;
- legal adjacent targets get obvious hints;
- action dock says what to do next.

On second tap:

- legal adjacent target swaps;
- invalid adjacent target gets snap-back/bump feedback;
- non-adjacent target moves selection instead of producing confusing invalid feedback.

On drag:

- pointerdown stores origin;
- movement over threshold chooses direction;
- pointerup attempts swap;
- board input locks during resolve/enemy turn.

### Technical Notes

- Use Pointer Events, not separate mouse/touch implementations.
- Set `touch-action: none` only on the board surface.
- Keep page/sheet scrolling outside the board.
- Avoid full visual layout shifts on selection.

### Acceptance

- Swipe works on a phone.
- Tap-tap remains usable.
- The board does not scroll the page while swiping gems.
- First tap does not feel like the whole screen refreshed.
- Invalid move feedback is visual, not just a log entry.

## Milestone 3: Art Slots Before Final Art

Goal:

Prepare the UI to receive real portraits and tile sprites without layout churn.

### Scope

Add stable asset slots:

- hero portrait slot;
- enemy portrait slot;
- gem sprite slot per tile kind;
- CSS fallback for each slot.

### Acceptance

- Layout does not change when a portrait or tile image loads.
- Fallback still looks acceptable if an asset fails.
- All image slots have fixed dimensions/aspect ratio.
- Mobile screenshots prove no layout shift.

## Milestone 4: First Asset Pass

Goal:

Replace primitive placeholders with bounded art assets.

### Assets

Portraits:

- Aurora Knight;
- Shade Knight.

Tile sprites:

- sword;
- shield;
- sun;
- moon;
- crown;
- shade.

### Art Direction

Style:

- AeroCandy 2007;
- Frutiger Aero / Windows Aero inspired;
- glossy optimistic 2000s;
- readable game assets, not noisy illustrations.

Avoid:

- medieval grimdark;
- flat minimal icons;
- realistic photo textures;
- tiny unreadable details;
- black/cyberpunk/horror treatment.

### Acceptance

- Hero/enemy readable at mobile portrait size.
- Every gem readable at 48px.
- Shade reads as risky.
- Assets are optimized before deploy.

## Milestone 5: Mobile QA + Deploy

Goal:

Ship the redesigned mobile play experience to GitHub Pages.

### Checks

Run:

- `npm test`
- `npm run build`
- `git diff --check`

Capture:

- 390x844 mobile first viewport;
- 390x1200 mobile full-page;
- 1440 desktop;
- one selected/touch-preview state;
- one spell-targeting state.

Verify:

- no horizontal overflow;
- no broken asset paths on GitHub Pages;
- URL returns 200;
- JS/CSS assets return 200;
- touch controls work manually on phone.

## Recommended Next Implementation Order

Do one implementation pass now:

1. Mobile cockpit shell.
2. Touch control model.
3. Compact latest-event/log behavior.
4. Empty asset slots and CSS fallback.
5. Screenshot QA.
6. Deploy.

Then do a second pass:

1. Generate/prepare hero and enemy portraits.
2. Generate/prepare gem sprites.
3. Integrate assets.
4. Optimize asset sizes.
5. Deploy again.

## Why This Order

If we generate art first, we will still have the wrong mobile screen.

If we rebuild the cockpit first, the art has a real home:

- portraits go into combat strip;
- gems go into fixed tile slots;
- spells go into action dock;
- log goes into sheet/latest event.

That means less rework and a better mobile game feel.
