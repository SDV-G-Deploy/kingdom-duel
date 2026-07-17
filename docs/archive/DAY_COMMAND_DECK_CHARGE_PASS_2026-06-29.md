## Day Command Deck Charge Pass

Date: 2026-06-29
Scope: compact spell charge readability in the mobile command deck; no mechanics changed

## Why

Fresh morning screenshot review showed the board remained the strongest object, while the bottom command deck was carrying too much tiny instructional text on 390px mobile screens.

The goal was not another broad visual polish pass. The target was one bounded improvement: make spells read more like chargeable duel instruments at a glance.

## Changes

- Added per-spell charge calculation from current mana versus spell cost.
- Replaced verbose spell cost labels in the command deck with compact uppercase labels.
- Added a compact charge meter inside each spell chip.
- Kept full spell preview language unchanged when a spell is selected.
- Tightened the short-mobile action dock by a few pixels so the added meter does not steal practical board space.

## Screenshot Evidence

- `screenshots/research/day-command-deck-390x700.png`
- `screenshots/research/day-command-deck-390x844.png`
- `screenshots/research/day-command-deck-spell-aim-390x700.png`

## Verification

- `npm test` passed
- `npm run build` passed
- `git diff --check` passed
- Chromium headless mobile captures taken at 390x700 and 390x844

## Remaining Risk

This improves static readability, but real phone touch feel is still the best next validation. The command deck is now more instrument-like, but physical browser chrome and thumb ergonomics should decide whether to compress further.
