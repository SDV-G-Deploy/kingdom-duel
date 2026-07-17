# Combat Read + Copy Pass

Date: 2026-06-28
Status: implemented after real-phone screenshot review
Scope: battle UI language, combat meters, ability chips, and recap treatment; no board mechanics changed

## Goal

Move the current shell closer to a premium nostalgic match-3 RPG duel by making the surrounding UI behave like combat instrumentation instead of clean app panels.

## Design Read

The board remains the strongest object. The weak spots were:

- the header meters read as compact labels more than battle instruments;
- command copy sounded like tutorial/debug text;
- ability chips were useful but not tactile enough;
- victory/defeat recap was informative but not dramatic enough.

## What Changed

### Combat Header Read

- Replaced the combined mini-stat text with a two-part combat readout:
  - Guard capsule;
  - Sun/Moon/Crown mana micro-cells.
- Added low-HP/KO pressure classes for stronger danger treatment.
- Kept the header compact so the board still owns the screen.

### Battle Copy

- Replaced generic command text with more game-like action language:
  - `Pick a strike gem`;
  - `Choose a lit socket`;
  - `Strike locked`;
  - `Tempo strike`;
  - `Risk strike`;
  - `No match. Gem snaps back.`
- Removed the most debug-like phrasing from invalid swap and spell hints.

### Ability Chips

- Gave spell buttons a more physical charged-chip treatment:
  - stronger borders;
  - side charge rails;
  - compact spell roles;
  - shorter action labels.
- Updated spell microcopy toward RPG verbs:
  - `Bloom field`;
  - `Raise guard`;
  - `Fire row`.

### Result Screen

- Battle recap now has a result seal and a separate main result plate.
- Victory/defeat styling is more distinct, preparing it for a later full result-screen pass.

## Screenshot Evidence

- `screenshots/research/combat-read-copy-390x700.png`
- `screenshots/research/combat-read-copy-390x844.png`

## Verification

- `npm test`
- `npm run build`
- Chromium CDP screenshots at 390x700 and 390x844

## Remaining Risk

This pass improves combat read and language, but it does not yet solve character fantasy. Aurora/Shade still need stronger identity beyond color and portraits: titles, status states, faction marks, and result-screen drama.
