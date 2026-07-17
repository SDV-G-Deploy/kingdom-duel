## State-Specific UX QA Pass

Date: 2026-06-29
Status: implemented
Scope: spell aim, spell armed, backlash risk, invalid snap-back; state-debug screenshots; no mechanics changes

## Goal

Make the key tactical states readable at a glance on mobile, not only through copy:

- spell aim should feel like a targeting mode;
- spell armed should feel committed and one tap away from cast;
- backlash risk should feel dangerous before the move is taken;
- invalid snap-back should feel like a rejected test, not a broken input.

## What Changed

- Added bounded debug presets for direct state QA:
  - `?debug=state-spell-aim`
  - `?debug=state-spell-armed`
  - `?debug=state-backlash`
  - `?debug=state-snapback`
- Added separate board-status materials for:
  - spell aim;
  - spell armed;
  - backlash risk;
  - snap-back failure.
- Added matching command-deck panel variants so the lower decision card supports the same state read instead of repeating neutral shell styling.
- Used a deterministic backlash debug board so fatal backlash can be reviewed without random hunting.

## Screenshot Evidence

- `screenshots/research/state-spell-aim-390x700.png`
- `screenshots/research/state-spell-armed-390x700.png`
- `screenshots/research/state-backlash-390x844.png`
- `screenshots/research/state-snapback-390x844.png`

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- local Chromium headless mobile captures for the four debug states above

## Remaining Risk

These states now separate more clearly in static mobile views, but live touch feel still needs a real-phone pass. The next meaningful check should verify whether tap-confirm for spells and snap-back feedback feel fast enough under actual thumb input and browser chrome.
