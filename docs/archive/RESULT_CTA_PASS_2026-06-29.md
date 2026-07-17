## Result CTA Pass

Date: 2026-06-29
Status: implemented
Scope: terminal-state CTA/readiness polish for victory and defeat, mobile screenshot QA, no mechanics changes

## Goal

Keep victory and defeat states feeling complete and actionable after the late-night shell and deck passes:

- terminal recap should still expose a clear next action on short mobile heights;
- victory should feel ceremonially closed;
- defeat should feel readable and reviewable, not only pink and final.

## What Changed

- Added a dedicated `recap-actions` row inside the terminal recap instead of relying only on the separate `latest-event` strip.
- Victory and defeat now carry their own next-step copy:
  - victory frames the result as banked and worth reviewing;
  - defeat frames the result as a readable break worth studying.
- Added an in-recap `toggle-log` button so the terminal log CTA still exists when `latest-event.is-terminal` is hidden on short mobile heights.
- Matched the CTA row material to each result state so it reads as part of the finish composition rather than as a generic footer.

## Verification

- `npm test`
- `npm run build`
- `git diff --check`
- Chromium headless screenshots via local `dist` preview:
  - `screenshots/research/result-cta-victory-390x700.png`
  - `screenshots/research/result-cta-defeat-390x844.png`

## Remaining Risk

This makes the result state more complete as a terminal mobile composition, but the next likely gain is no longer textual. The next real jump would come from a dedicated continue/rematch flow or real-device validation of whether the recap-to-log transition feels worth tapping.
