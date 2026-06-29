## Mobile Screenshot QA Pass

Date: 2026-06-29
Status: implemented
Scope: mobile screenshot QA at 390x700 and 390x844, one bounded follow-up fix if needed

## Goal

Check whether the current playable screen still holds together at the two target mobile heights after the recent result, state, shell, deck, and intent passes.

## What Changed

- Captured fresh playable mobile screenshots at both target heights.
- Found one concrete short-height issue:
  - on `390x700`, the command deck compressed spell chips too hard and clipped the lower control bank.
- Applied one bounded fix only for the short-height mobile mode:
  - reduced command-deck height;
  - tightened decision-panel copy;
  - hid the secondary spell action line on short heights;
  - let the spell chips keep their primary label read instead of being cut off.

## Screenshot Evidence

- `screenshots/research/mobile-qa-390x700.png`
- `screenshots/research/mobile-qa-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless local mobile captures at `390x700` and `390x844`

## Remaining Risk

The current playable frame now survives both target heights in static screenshot form. The next QA gain would come from real-device feel testing rather than more screenshot-only compression tweaks.
