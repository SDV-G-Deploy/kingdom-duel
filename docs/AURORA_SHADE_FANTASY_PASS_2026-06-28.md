# Aurora/Shade Fantasy Pass

Date: 2026-06-28
Status: implemented after Combat Read + Copy pass
Scope: faction naming, duel medallion language, braced/critical state styling, mobile screenshots; no mechanics changed

## Goal

Move Aurora and Shade from "left UI color vs right UI color" toward two readable forces in the duel.

## What Changed

- Renamed side labels in the combat header:
  - `Aurora Glass`;
  - `Shade Veil`.
- Added compact role titles:
  - `Dawn duelist`;
  - `Night duelist`.
- Updated center medallion language toward duel-fantasy terms:
  - `Duel seal`;
  - `Command`;
  - `Scheme`;
  - `Strike`.
- Added a small tri-color seal mark inside the duel medallion.
- Added a distinct braced guard-chip treatment so guard feels like a state, not just a number.
- Result recap now names the winning force as `Aurora Glass` or `Shade Veil`.

## Screenshot Evidence

- `screenshots/research/aurora-shade-fantasy-390x700.png`
- `screenshots/research/aurora-shade-fantasy-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium CDP screenshots at 390x700 and 390x844

## Remaining Risk

This is still a copy/component pass, not an art pass. The next real jump in character fantasy likely needs either stronger portrait treatment, faction emblems, or a dedicated victory/defeat result composition.
