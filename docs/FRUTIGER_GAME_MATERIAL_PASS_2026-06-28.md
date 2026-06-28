# Frutiger Game Material Pass

Date: 2026-06-28
Status: implemented

## Goal

Apply the first slice of the unified AeroCandy game system without changing mechanics.

Move the play screen from:

> pastel glassmorphism web cockpit

to:

> glossy plastic-glass mobile duel toy

## Changes

- Added CSS material tokens for aqua glass, pearl plastic, candy/glass shadow, chrome rim, and combat accents.
- Replaced the broad gradient-first page feel with a quieter water/pearl material background.
- Reworked shared cockpit surfaces away from generic frosted cards and toward physical pearl/glass objects.
- Strengthened the board frame into a more explicit candy-glass arena tray.
- Made the mobile board tray use thicker rims, inner shadow, and harder highlights.
- Converted utility controls from visible `Log` / `Style` text toward compact icon controls.
- Shifted combat labels from system language toward battle language:
  - `Board ready` -> `Aurora's move`
  - `Swap adjacent tiles` -> `Swap gems to strike`
  - `Shade plan` -> `Shade prepares`
  - `Next action` -> `Command`
  - `Select a tile` -> `Choose a tile`
  - `6 swaps` -> `6 moves left`
- Made the action dock read more like command ribbon plus ability chips while preserving layout and mechanics.
- Removed the tall-phone dead gap between enemy intent and board by changing the mobile cockpit row contract.

## Screenshot Evidence

- `screenshots/research/material-pass-390x700.png`
- `screenshots/research/material-pass-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium screenshots at 390x700 and 390x844

## Remaining Visual Risks

- The header is better, but still not fully a duel scene; the next pass should deepen side capsules, liquid HP, and turn medallion polish.
- Ability chips improved materially, but they still need clearer element badges and ready/locked/armed states.
- The board tray is more physical, but cell wells and selected/valid/threat state grammar can be pushed further.
- A final 390px physical-phone check is still needed after deploy.

