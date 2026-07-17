## Selected / Valid Swap QA Pass

Date: 2026-06-29
Status: implemented
Scope: selected-tile and valid-swap state QA, bounded mobile screenshot coverage, no mechanics changes

## Goal

Close the remaining gap in state-specific QA by making the earliest board interaction states read cleanly on mobile:

- selected tile should feel claimed and ready to route;
- valid swap should feel confirmed and desirable before commit;
- both states should be reviewable through deterministic debug presets instead of manual hunting.

## What Changed

- Added bounded state-debug presets:
  - `?debug=state-selected`
  - `?debug=state-valid-swap`
- Promoted the selected tile state from a generic neutral deck read into a claimed-routing state:
  - board status now reads `Tile claimed`
  - the deck now explains that bright sockets route the strike from the chosen gem
- Promoted the non-risk valid swap state from a soft analytic read into a ready state:
  - board status now reads `Strike ready`
  - the action deck uses a green-ready treatment when the preview is safe
- Added matching board-status material accents so these early touch states are visually separable before the player reads the full copy.

## Screenshot Evidence

- `screenshots/research/state-selected-390x700.png`
- `screenshots/research/state-valid-swap-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless captures against local preview using the two new debug presets

## Remaining Risk

These states now read better in bounded mobile screenshots, but the next real UX question is animation feel rather than static material language. If night work continues, the next best narrow pass is a final look at whether victory/defeat result drama wants one more board-adjacent polish beat or whether the run should stop until real-device touch QA.
