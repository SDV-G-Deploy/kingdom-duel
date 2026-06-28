# Kingdom Duel Night Run Closeout

Date: 2026-06-28
Session: `kingdom-duel-night-2026-06-28`
Range: `316ffec..41ca278`
Public URL: https://sdv-g-deploy.github.io/kingdom-duel/

## Result

The 15-pass night run moved Kingdom Duel from a working match-3 prototype toward a readable mobile RPG duel slice. The main improvements landed in three areas:

- Playability: mobile drag targeting regression coverage, clearer selected/valid/invalid swap states, snap-back feedback, deterministic 4+ match bonus, and clearer spell targeting.
- RPG readability: enemy intent, shade backlash risk, HP/Guard/mana/damage phrasing, extra-turn language, and Shade action copy are now more explicit before the player commits.
- Visual and deploy confidence: Aurora and Shade have stronger side identity, board rings/threat states are more legible, screenshots were refreshed, roadmap was updated, and the public GitHub Pages build was verified.

## Landed Commits

Primary work commits:

- `bbdbd7c` Add mobile drag target regression test
- `a1c2f24` Improve mobile target affordance
- `3cd3fa6` Clarify invalid swap snap-back
- `4b7be15` Explain enemy intent on board
- `b85c76e` Add RPG match-3 reference notes
- `05fc821` Add over-match effect bonus
- `e2f0cf4` Clarify spell targeting labels
- `556b694` Clarify shade backlash preview
- `1236a33` Sharpen RPG combat language
- `3de63e4` Differentiate duel side identity
- `fdfc3db` Improve board state readability
- `b9c87c9` Refresh playable screenshots
- `0e6d3b3` Update roadmap after night passes
- `e6f8ffb` Record verification pass

Ledger commits were added after each pass to keep the run auditable.

## Durable Artifacts

- `docs/RPG_MATCH3_REFERENCE_NOTES_2026-06-28.md`
- `docs/RPG_COMBAT_LANGUAGE_PASS_2026-06-28.md`
- `docs/VISUAL_IDENTITY_PASS_2026-06-28.md`
- `docs/BOARD_READABILITY_PASS_2026-06-28.md`
- `docs/ROADMAP_2026-06-28.md`
- `docs/VERIFICATION_PASS_2026-06-28.md`
- `screenshots/playable-mobile.png`
- `screenshots/playable-desktop.png`
- `screenshots/night-run/pass-10-mobile.png`
- `screenshots/night-run/pass-11-mobile.png`
- `screenshots/night-run/pass-12-mobile.png`
- `screenshots/night-run/pass-12-desktop.png`
- `screenshots/night-run/pass-14-public-mobile.png`

## Verification State

Latest full verification passed:

- `npm test`
- `npm run build`
- `git diff --check`
- Public URL returned `HTTP 200`
- Public hashed JS/CSS assets returned `HTTP 200`
- Latest Pages run for `41ca278` succeeded: https://github.com/SDV-G-Deploy/kingdom-duel/actions/runs/28313392305

## Unresolved Risks

- Balance is unverified after the over-match bonus; battle length, extra-turn frequency, shade value, and win rate need seeded simulation before further rule tuning.
- Spell value is clearer than before, but spell behavior still needs focused tests and preview polish, especially Crown Strike and Glass Ward.
- Enemy behavior still reads as a scoring model; Shade needs a more explicit profile/affinity layer.
- Public mobile was smoke-tested at 390x844, but physical phone QA is still needed for real browser chrome, touch feel, and text density.
- The prototype is a strong duel slice, not yet a campaign, progression, or content-complete game.

## Best Next Step

Run a balance and battle-length review before adding more features. Use seeded simulations to measure average turns, win rate, extra-turn frequency, shade damage, guard value, and spell usage after the 4+ match bonus. Tune from those numbers rather than from visual feel.

## Morning Report

Kingdom Duel night run finished: 15/15 passes completed and pushed.

What landed: mobile swap regression coverage, stronger selected/valid/invalid board feedback, visible Shade intent, 4+ match over-bonus, clearer spell targeting, explicit shade backlash warnings, RPG combat language, stronger Aurora vs Shade identity, more readable board states, refreshed screenshots, roadmap, and deploy verification.

Current state: local checks pass, public GitHub Pages is live, hashed JS/CSS assets load, and latest Pages workflow succeeded for `41ca278`.

Remaining risk: balance is the big unknown after the 4+ match bonus. Next best task is seeded battle simulation and battle-length tuning before adding campaign/progression.
