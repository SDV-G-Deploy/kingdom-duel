## Aurora / Shade Intent Pass

Date: 2026-06-29
Status: implemented
Scope: side-fantasy read, enemy intent clarity, mobile screenshot QA; no mechanics changes

## Goal

Make Aurora and Shade feel slightly more like opposing forces again, while making Shade intent easier to parse before action resolves.

## What Changed

- Upgraded side role titles from generic duel labels toward more force-specific reads:
  - Aurora: `Dawn glass knight`
  - Shade: `Veil nightbreaker`
- Promoted enemy intent from a plain preview summary into a more readable omen/threat line:
  - `Veil omen`
  - `cuts …`
  - `braces …`
  - `claims …`
  - `keeps turn`
- Reused the clearer omen phrasing both in the pre-action intent strip and the short enemy action cue after Shade acts.
- Added a small omen crest and stronger veil tinting so the enemy-intent strip reads more like hostile prophecy than a neutral status pill.

## Screenshot Evidence

- `screenshots/research/aurora-shade-intent-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless local mobile capture at `390x844`

## Remaining Risk

Aurora and Shade now separate more clearly in copy/state language, but the next real fantasy jump would likely need stronger portrait/emblem treatment or unique faction-specific effect framing, not more label changes alone.
