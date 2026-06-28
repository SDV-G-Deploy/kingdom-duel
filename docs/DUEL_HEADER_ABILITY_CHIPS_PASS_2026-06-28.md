# Duel Header + Ability Chips Pass

Date: 2026-06-28
Status: implemented

## Goal

Continue the Frutiger Game Material System pass without touching board mechanics.

Fix the real-phone issue where the central turn medallion text overflowed, then strengthen the duel header and ability chips.

## Changes

- Simplified the central turn medallion:
  - before: `Aurora move / Aurora turn / 6 moves left`
  - after: `Move / Aurora / 6 moves`
- Added overflow protection to the turn medallion text.
- Shortened actor mana labels from `Mana 0/0/0` to `S0 M0 C0`.
- Made HP bars more liquid/pill-like with stronger rounded tubes.
- Added element gem badges to ability chips:
  - Sun Bloom: `S`
  - Glass Ward: `M`
  - Crown Strike: `C`
- Added ready/locked chip state classes without changing spell mechanics.
- Tuned mobile badge sizing so the chips fit on 390px screens.

## Screenshot Evidence

- `screenshots/research/duel-header-chips-390x700.png`
- `screenshots/research/duel-header-chips-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium screenshots at 390x700 and 390x844

## Remaining Visual Risks

- Header side capsules can still become more characterful in a later pass.
- Ability chips now have element badges, but ready/locked/armed state could become more dramatic.
- Guard/mana badges remain compact text; a future pass can replace them with fuller gem counters if height allows.

