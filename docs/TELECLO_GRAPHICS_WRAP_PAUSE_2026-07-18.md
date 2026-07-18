# Kingdom Duel TeleClo Graphics Wrap Pause 2026-07-18

Status: paused before merge/deploy.

Return key: `KD_ASSET_WRAP`.

## Current Branch

- Worktree: `/tmp/kingdom-duel-graphics`
- Branch: `art/teleclo-asset-prep-2026-07-18`
- Base: `origin/main` at `682d98e fix(ui): clarify locked spell readiness`
- Branch state before this pause: 5 asset-prep commits ahead of `origin/main`

Do not continue from the stale worktree at
`/root/.openclaw/workspace/kingdom-duel` for this wrap. Use
`/tmp/kingdom-duel-graphics`.

## Accepted First Slice

Integrated runtime assets:

- `public/assets/gems/aether.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/crown-strike.webp`

The slice is intentionally narrow. It is not a full reskin and does not include
enemy spell icons, state overlays, portrait variants, or arena/world frame art.

## TeleClo Safety State

TeleClo hardening was completed before this pause:

- Telegram context/RAG is scoped by `telegram:<id>`.
- ZIP/file artifact sends are guarded by manifest ownership checks.
- Kingdom Duel enemy spell icons generated out of gate are quarantined and must
  not be integrated.
- Future enemy spell icons should be requested again only after phone review and
  with a fresh scoped gate.

## Next Wrap Steps

1. Fetch `origin`.
2. Confirm clean status and `origin/main...HEAD` still shows no behind commits.
3. Run `npm run check`.
4. Run `npm run test:e2e`.
5. Run `npm run build`.
6. Smoke the built `dist` via preview:
   - mobile screenshots at `390x700` and `390x844`;
   - HTTP 200 for hashed JS/CSS;
   - HTTP 200 for the four new asset paths.
7. Stop and report before pushing to `main`.

After deploy, do a short real-phone review focused on:

- whether Aether is distinct from Sun, Moon, Crown, and Shade;
- whether the three player spell icons help compact spell readability;
- whether `Crown Strike` is too noisy at 22px.
