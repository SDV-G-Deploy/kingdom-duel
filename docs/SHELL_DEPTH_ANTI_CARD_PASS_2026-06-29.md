## Shell Depth / Anti-Card Pass

Date: 2026-06-29
Status: implemented
Scope: shell surface cohesion, seam depth, anti-card cleanup for cockpit sections; no gameplay or board logic changes

## Goal

Reduce the feeling that the play screen is a stack of separate web cards.

Target:

- stronger sense of one molded duel console;
- clearer top/middle/bottom shell hierarchy;
- less repeated generic card shadowing;
- keep the board as the hero object.

## What Changed

- Introduced shell-wide top / mid / bottom surface roles instead of reusing one generic pearl-card treatment everywhere.
- Softened repeated drop shadows and shifted section depth toward shared inner rims and seam logic.
- Re-shaped the top bar, combat strip, board frame, action dock, latest-event strip, and log sheet to read as connected shell zones instead of stacked cards.
- Kept the board frame slightly brighter and tighter than surrounding surfaces so the board remains the hero object.

## Screenshot Evidence

- `screenshots/research/shell-depth-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless local mobile capture at `390x844`

## Remaining Risk

The shell now feels less card-like in a static screenshot, but the next meaningful gain likely comes from command-deck tactility or a real-phone pass that checks whether the shell still feels premium under browser chrome and scrolling pressure.
