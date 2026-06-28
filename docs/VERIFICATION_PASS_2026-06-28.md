# Verification Pass 2026-06-28

Pass 14 checks the current `main` branch after the playable, visual, screenshot, and roadmap passes.

## Scope

- Local test/build health.
- Whitespace and patch hygiene.
- Public GitHub Pages response and built asset availability.
- GitHub Actions deploy workflow state.

## Result

Passed.

## Local Verification

- `npm test` passed: engine and input tests.
- `npm run build` passed: TypeScript plus Vite production build.
- `git diff --check` passed.

## Public Page Check

- Public URL returned `HTTP 200`.
- Public HTML `last-modified`: `Sun, 28 Jun 2026 05:43:24 GMT`.
- Public HTML references the current built assets:
  - `assets/index-D_-JIr60.js` returned `HTTP 200`, `application/javascript`, `31748` bytes.
  - `assets/index-On4MqLnh.css` returned `HTTP 200`, `text/css`, `30000` bytes.
- Public mobile smoke screenshot captured at `390x844`:
  - `screenshots/night-run/pass-14-public-mobile.png`

## CI / Deploy State

- Latest GitHub Actions run:
  - Workflow: `Deploy GitHub Pages`
  - Run: `28312858815`
  - Commit: `6f6314d4c3bd2af028dcba9e2fae76675fd21523`
  - Status: `completed`
  - Conclusion: `success`
  - URL: `https://github.com/SDV-G-Deploy/kingdom-duel/actions/runs/28312858815`

## Notes

- The deployed page is serving the same hashed asset names produced by the local build.
- No cleanup candidates were found that were worth changing during this verification pass.
- Recommended closeout focus: summarize landed passes, remaining risks, and the next single useful task.
