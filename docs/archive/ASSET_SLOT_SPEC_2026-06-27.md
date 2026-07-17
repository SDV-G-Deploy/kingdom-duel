# Kingdom Duel Asset Slot Spec

Date: 2026-06-27

Purpose: prepare stable UI slots for real character portraits and gem sprites without adding final art yet.

## Rules

- Assets must not change layout when they load.
- Missing assets must keep the CSS fallback visible.
- Assets must be transparent-background WebP or PNG.
- No text, logos, baked UI frames, watermarks, or busy micro-detail inside the asset.
- Keep all source paths stable so later art passes only add files and enable `src`.

## Character Portrait Slots

Paths:

- `public/assets/characters/aurora-knight.webp`
- `public/assets/characters/shade-knight.webp`

Runtime references:

- Hero slot: `data-asset-path="assets/characters/aurora-knight.webp"`
- Enemy slot: `data-asset-path="assets/characters/shade-knight.webp"`

Dimensions:

- Mobile combat strip: 42x42 CSS px.
- Desktop combat strip: 62x62 CSS px.
- Reference/moodboard fighter card: up to 120x120 CSS px.

Asset guidance:

- Export square canvas, transparent background.
- Important silhouette should fit inside 86% of the canvas.
- Readable at 42px without relying on facial detail.
- Keep the same lighting direction as the current gems: strong top-left highlight.

Fallback behavior:

- Current glossy orb remains visible when no portrait asset is enabled.
- When a portrait asset is enabled, it sits above the orb fallback.

## Gem Sprite Slots

Paths:

- `public/assets/gems/sword.webp`
- `public/assets/gems/shield.webp`
- `public/assets/gems/sun.webp`
- `public/assets/gems/moon.webp`
- `public/assets/gems/crown.webp`
- `public/assets/gems/shade.webp`

Runtime references:

- `data-asset-path="assets/gems/<kind>.webp"`

Dimensions:

- Board tile slot: fills the current square gem button.
- Sprite layer: 88% of the tile box, centered.
- Must read at 48x48 CSS px and 96x96 CSS px.

Fallback behavior:

- Current CSS gem body, shine, and symbol remain visible when no sprite asset is enabled.
- When a sprite asset is enabled, it replaces the inner fallback while the button hitbox, states, and board geometry stay unchanged.

## Enablement Pattern

Task 03 leaves `src` empty and records the future path in `data-asset-path`.

Task 04/05 should:

1. Add the optimized file under `public/assets/...`.
2. Set the matching slot `src` to the relative public path, for example `assets/gems/sword.webp`.
3. Capture mobile and desktop screenshots.

This avoids broken-image UI and keeps GitHub Pages clean until the actual files exist.
