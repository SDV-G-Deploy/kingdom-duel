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

Declared but missing:

- `public/assets/gems/aether.webp`
- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/crown-strike.webp`
- `public/assets/spells/veil-rift.webp`
- `public/assets/spells/lunar-lock.webp`
- `public/assets/spells/eclipse-surge.webp`

The Aether tile still falls back to CSS treatment. It is a real gameplay object now and should be treated as a high-priority asset slot before broad decorative work.

Spell icon slots are now intentionally declared with CSS/text fallbacks. Missing files do not block play, but TeleClo output can be dropped into those exact paths and enabled in `src/ui/assets.ts` after QA.

## What Did Not Land In Current Main

The older Frutiger spike branch contains useful art/handoff work, but it is not synchronized with the current run implementation. In particular, the current main branch does not include the spike's spell `.webp` assets:

- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/crown-strike.webp`

Do not merge the spike branch wholesale. Bring over assets only after checking the current `src/ui/views/battle.ts`, `src/ui/components/abilities.ts`, and responsive layout expectations.

## Step 2 Graphics Planning Notes

Recommended asset order after Step 6.1 human/playtest gates:

1. Aether gem sprite, because it is an active special tile with no bitmap asset.
2. Spell icons for `Glass Ward`, `Sun Bloom`, and `Crown Strike`, because the 2026-07-18 trace shows spell literacy is a first-duel risk.
3. Distinct enemy silhouettes for Moon Warden and Eclipse Regent, because both currently reuse Shade Knight's portrait with CSS variants.
4. World/frame art for the glass arena, only after the gameplay-critical tiles/spells remain readable at 390×700 and 390×844.

Acceptance for any asset batch:

- no layout shift when the asset loads or fails;
- 390×700 and 390×844 remain fully playable;
- asset paths work under the GitHub Pages relative base;
- `npm run test:e2e` remains green;
- visual QA checks both default battle and spell-targeting states.
