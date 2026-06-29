## Ability Chip Tactility Pass

Date: 2026-06-29
Status: implemented
Scope: spell chip desirability, command-deck tactility, mobile screenshot QA; no mechanics changes

## Goal

Make the command deck feel more like a premium console control bank and less like three flat info cards.

Target:

- clearer ready / locked / active desirability;
- more tactile chip/button feel;
- stronger deck identity under the board;
- preserve current information density.

## What Changed

- Gave the command deck a clearer console-bank feel through a stronger deck panel material for idle guidance states.
- Reworked spell buttons toward a more tactile object read:
  - deeper base shadow;
  - stronger pressed/raised ready and active states;
  - softer locked state instead of just looking disabled;
  - slightly more sculpted left rails and bottom shelf shadow.
- Added a small amount of hover/raise behavior in CSS so the chips read like pressable controls rather than flat info cards.

## Screenshot Evidence

- `screenshots/research/ability-chip-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless local mobile capture at `390x844`

## Remaining Risk

The deck now reads better as a control bank in static view, but the next meaningful jump likely comes from richer active/locked copy hierarchy or a more explicit spell economy read, not from adding more surface styling alone.
