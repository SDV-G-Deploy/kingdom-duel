# Duel Scene Cohesion Pass

Date: 2026-06-28
Status: implemented after commercial/design DNA synthesis
Scope: CSS, combat copy, and small markup/class changes only

## Goal

Make one mobile screenshot communicate the product DNA more clearly:

> tactical match-3 duel in a bright glass-future world.

This pass does not change mechanics, board layout, spell costs, or balance.

## What Changed

### Commercial Design DNA

Added `docs/KINGDOM_DUEL_DESIGN_DNA_2026-06-28.md`.

The design target is now explicit:

- not casual match-3 candy;
- not dark fantasy Puzzle RPG;
- not generic Frutiger nostalgia;
- yes: premium tactical match-3 battler in a light glass market gap.

### Duel Header Cohesion

- Aurora and Shade labels now read as sides, not generic glass cards.
- Actor panels receive side rails, strengthening the left/right duel read.
- Winner and defeated actor states now have distinct visual treatment.
- The center medallion keeps the compact `Move / Aurora / 6 moves` read from the previous pass.

### Combat Copy

Primary combat labels moved further away from system language:

- `Spell preview` -> `Spell aim`
- `Spell targeting` -> `Aim spell`
- `Preview` -> `Strike preview`
- `Board locked` -> `Arena locked`
- `Target confirmed` -> `Spell armed`

### State Grammar

- Valid swap target marker moved toward lime/aqua gel instead of pure cyan.
- Backlash preview now affects the whole board frame, not only the small status strip.
- Ready ability chips get a small physical top highlight.
- Locked ability chips become more pearly/desaturated.

## Screenshot Evidence

- `screenshots/research/duel-scene-cohesion-390x700.png`
- `screenshots/research/duel-scene-cohesion-390x844.png`

## Verification

- `npm test`
- `npm run build`
- Chromium screenshots at 390x700 and 390x844

## Remaining Design Risk

The screen is more coherent, but the next major leap should probably not be another generic CSS polish pass.
The highest-value next work is either:

1. state-specific screenshot QA for selected/valid/threat/spell-armed cases; or
2. a hero/side-capsule identity pass with stronger Aurora/Shade emblems.

