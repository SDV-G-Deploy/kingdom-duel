# Kingdom Duel — Current Asset Inventory 2026-07-18

Status: current `origin/main` inventory before Step 7 / Frutiger asset work
Purpose: keep graphics planning based on the validated run shell, not the older `spike/frutiger-aero-duel-screen` branch

## Current Runtime Asset Slots

The current main UI resolves assets through `src/ui/assets.ts`.

Present bitmap assets:

- `public/assets/characters/aurora-knight.webp`
- `public/assets/characters/shade-knight.webp`
- `public/assets/gems/sword.webp`
- `public/assets/gems/shield.webp`
- `public/assets/gems/sun.webp`
- `public/assets/gems/moon.webp`
- `public/assets/gems/crown.webp`
- `public/assets/gems/shade.webp`
- `public/assets/gems/aether.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/crown-strike.webp`

Declared but missing:

- `public/assets/spells/veil-rift.webp`
- `public/assets/spells/lunar-lock.webp`
- `public/assets/spells/eclipse-surge.webp`

Aether and the three player spell icons are now integrated TeleClo runtime exports. They are still the first visual slice, not a broad reskin.

Enemy spell icon slots are still intentionally declared with CSS/text fallbacks. Missing files do not block play, but TeleClo output can be dropped into those exact paths and enabled in `src/ui/assets.ts` after QA.

## What Was Not Carried From The Old Spike Branch

The older Frutiger spike branch contains useful art/handoff work, but it is not synchronized with the current run implementation. In particular, the current main branch does not include the spike's spell `.webp` assets:

- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/crown-strike.webp`

Those old spike files should still not be merged wholesale. The current branch
now contains fresh TeleClo exports for those same runtime paths. Treat the spike
files only as historical references unless a later visual review explicitly asks
to compare them.

## Step 2 Graphics Planning Notes

Recommended asset order after Step 6.1 human/playtest gates:

1. Validate Aether plus `Glass Ward`, `Sun Bloom`, and `Crown Strike` in-game at phone sizes.
2. If `Crown Strike` reads noisy at 22px, request a simplified TeleClo revision before broadening the pack.
3. Enemy spell icons for `Veil Rift`, `Lunar Lock`, and `Eclipse Surge`.
4. Distinct enemy silhouettes for Moon Warden and Eclipse Regent, because both currently reuse Shade Knight's portrait with CSS variants.
5. World/frame art for the glass arena, only after the gameplay-critical tiles/spells remain readable at 390×700 and 390×844.

Acceptance for any asset batch:

- no layout shift when the asset loads or fails;
- 390×700 and 390×844 remain fully playable;
- asset paths work under the GitHub Pages relative base;
- `npm run test:e2e` remains green;
- visual QA checks both default battle and spell-targeting states.
