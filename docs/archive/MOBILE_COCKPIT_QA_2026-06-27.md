# Kingdom Duel Mobile Cockpit QA

Date: 2026-06-27

Public build:

- https://sdv-g-deploy.github.io/kingdom-duel/

Scope: Task 06 mobile QA and deploy review after the mobile cockpit, touch controls, enemy feedback, portrait assets, and gem sprites landed.

## Checks Run

- `npm test`
- `npm run build`
- `git diff --check`
- GitHub Pages deploy workflow
- Public page `200`
- Character asset URLs `200`
- Gem asset URLs `200`

## Screenshots Captured

- `screenshots/mobile-final-390x700.png`
- `screenshots/mobile-final-390x844.png`
- `screenshots/mobile-final-390x1200.png`
- `screenshots/desktop-final.png`

Previously captured state screenshots remain relevant for interaction states:

- `screenshots/mobile-touch-selected.png`
- `screenshots/mobile-touch-swap-preview.png`
- `screenshots/mobile-touch-invalid.png`
- `screenshots/mobile-enemy-cue.png`
- `screenshots/portraits-mobile.png`
- `screenshots/gem-sprites-mobile.png`

## Findings

No release-blocking regressions were found.

The 390x700 target keeps the full board, action dock, and latest event visible. This is the current Samsung S25 browser-chrome proxy target.

The 390x844 and 390x1200 targets leave breathing room without breaking the cockpit composition.

Desktop loads and remains playable. It is functional but visually less dense than the mobile target, which is acceptable for this mobile-first milestone.

Portrait assets read clearly in the compact combat strip. The slot zoom keeps the helmet/head readable at mobile size.

Gem sprites are readable at mobile board size and have distinct silhouettes:

- sword: aqua blade;
- shield: green shield;
- sun: gold sun;
- moon: violet crescent;
- crown: orange crown;
- shade: pink-violet shard.

## Residual Risks

- Physical Samsung S25 browser testing is still the final truth for touch feel across Chrome, Firefox, and DuckDuckGo.
- Current gem sprites are first-pass assets. They are much stronger than CSS-only gems, but can still receive an art-direction polish pass later.
- GitHub Actions reports a Node action deprecation warning. The workflow is green and deploys correctly, so this is technical debt rather than a gameplay blocker.

## Verdict

Task 06 passes for the current milestone.

Next sensible milestone: post-QA phone feedback, then either visual polish on the current asset set or the next gameplay layer.
