# Shell Silhouette Pass

Date: 2026-06-28
Status: implemented after shell silhouette research
Scope: CSS and one structural wrapper, no mechanics or board-layout changes

## Goal

Move the mobile play screen away from stacked rounded-card UI and toward one physical pearl-glass battle console around the already-strong board.

## What Changed

### Battle Console Shell

- Added a `battle-console` wrapper around:
  - duel header;
  - board frame;
  - command/ability dock or battle recap.
- The wrapper creates one shared pearl/glass casing instead of several unrelated page sections.
- Added subtle aqua and violet side rails to suggest Aurora/Shade sides clamping the board.

### Header Silhouette

- Combat strip now has a dashboard-like trapezoid silhouette.
- Aurora and Shade actor panels are no longer pure rounded rectangles:
  - Aurora pod points inward from the left;
  - Shade pod mirrors it from the right.
- The center medallion remains compact and untouched.

### Bottom Control Deck

- Action dock and battle recap now share the console bottom silhouette.
- The bottom area should read more like a control deck socketed into the same object, not an unrelated card below the board.

## What Did Not Change

- Board mechanics.
- Board tile layout.
- Spell costs or effects.
- Input model.
- The current generated portraits and gem assets.

## Screenshot Evidence

- `screenshots/research/shell-silhouette-390x700.png`
- `screenshots/research/shell-silhouette-390x844.png`

## Verification

- `npm test`
- `npm run build`
- Chromium screenshots at 390x700 and 390x844

## Design Read

This pass is intentionally structural rather than decorative.

It does not solve the entire "expensive mobile game" problem yet, but it makes the next design question more concrete:

- do we push harder into console casing and reduce inner panel borders;
- or do we now strengthen Aurora/Shade identity inside the new casing?

## Remaining Risk

The shell is more authored, but still conservative.
The safest next review should be from real phone screenshots, because the browser chrome and physical viewport will decide whether the new casing feels premium or just tighter.

