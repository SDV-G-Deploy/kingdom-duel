## Victory / Defeat Result Drama Pass

Date: 2026-06-29
Status: implemented
Scope: final duel recap composition, terminal-state hierarchy, mobile screenshot QA; no mechanics changes

## Goal

Make the terminal duel state feel like a premium RPG result beat instead of a compact analytic strip, while preserving the board as the strongest object.

## Target

- stronger winner / loser read;
- clearer cause / turning-point hierarchy;
- more ceremonial victory seal and more dangerous defeat material;
- no overflow on 390x700 and 390x844.

## What Changed

- Rebuilt the recap into a small result composition instead of a single analytic strip.
- Added winner / loser result stands with portrait, faction, stance label, and final HP / guard / reserve read.
- Promoted cause into the main dramatic line and added a compact terminal score line.
- Split recap supporting text into turning-point, pressure, and lesson blocks.
- Gave victory and defeat their own seal material and border accents so defeat reads more dangerous instead of merely pink.
- Added URL debug presets for bounded screenshot QA:
  - `?debug=result-victory`
  - `?debug=result-defeat`
- On very short mobile heights, terminal states now hide the latest-event strip and collapse secondary recap lines so the result composition stays visible.

## Screenshot Evidence

- `screenshots/research/result-drama-victory-390x700.png`
- `screenshots/research/result-drama-defeat-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless screenshots via local `dist` preview using the terminal-state debug presets

## Remaining Risk

The result strip is now materially stronger, but it still lives under the board rather than becoming a full dedicated result scene. The next jump would likely come from character-fantasy finish states or reward/continue CTA treatment, not from more recap text.
