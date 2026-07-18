# Kingdom Duel TeleClo Asset Brief 2026-07-18

Status: intake brief for the graphics phase after playtest-sync stabilization
Branch base: `origin/main` at `682d98e`

## Goal

Prepare gameplay-critical bitmap assets for the current mobile run shell without changing combat rules, layout, or balance.

Use TeleClo as a controlled asset-production loop:

1. brief approval;
2. style/reference approval;
3. source lock;
4. production candidates;
5. coverage matrix;
6. in-game QA at 390×700 and 390×844.

Do not use the old `spike/frutiger-aero-duel-screen` branch as an implementation base. It is reference material only.

## Current Runtime Slots

Already present:

- `public/assets/characters/aurora-knight.webp`
- `public/assets/characters/shade-knight.webp`
- `public/assets/gems/sword.webp`
- `public/assets/gems/shield.webp`
- `public/assets/gems/sun.webp`
- `public/assets/gems/moon.webp`
- `public/assets/gems/crown.webp`
- `public/assets/gems/shade.webp`

Declared and ready for future files:

- `public/assets/gems/aether.webp`
- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/crown-strike.webp`
- `public/assets/spells/veil-rift.webp`
- `public/assets/spells/lunar-lock.webp`
- `public/assets/spells/eclipse-surge.webp`

## Batch 1: Gameplay-Readable Assets

### Aether Gem

Path: `public/assets/gems/aether.webp`

Purpose: special tile created by 5+ matches and activated as a board burst. It must read as special at 36-44px without looking like normal Sun/Moon/Crown mana.

Direction:

- magical prism / star-core / rainbow glass charge;
- bright Frutiger Aero candy-glass material;
- strong silhouette at small size;
- transparent or clean non-distracting background inside the tile slot;
- avoid tiny illustration detail.

### Player Spell Icons

Paths:

- `public/assets/spells/glass-ward.webp`
- `public/assets/spells/sun-bloom.webp`
- `public/assets/spells/crown-strike.webp`

Purpose: make first-duel spell literacy stronger. Icons must help the player see spells as survival tools, not decorative bonuses.

Directions:

- `Glass Ward`: moon-blue shield, glass seal, defensive survival cue.
- `Sun Bloom`: gold sun cross or blooming five-tile burst, tempo/engine cue.
- `Crown Strike`: gold crown beam or row strike, finisher/row-clear cue.

## Batch 2: Enemy Spell Icons

Paths:

- `public/assets/spells/veil-rift.webp`
- `public/assets/spells/lunar-lock.webp`
- `public/assets/spells/eclipse-surge.webp`

Purpose: support future enemy/readability work, lower priority than player spells.

Directions:

- `Veil Rift`: violet/magenta shade cross, dangerous breach.
- `Lunar Lock`: cold moon shield lock, defensive enemy control.
- `Eclipse Surge`: dark crown/eclipse square flood, boss threat.

## Production Constraints

- WebP final files.
- Square source composition preferred.
- Must remain readable when displayed around 22-32px inside compact spell buttons.
- No embedded text.
- No UI chrome baked into the image; the app provides button frames.
- Keep colors aligned with the existing palette: cyan/aurora/gold for Aurora tools, violet/magenta/shade for enemy tools, pearl/glass highlights throughout.
- Avoid one-note purple-blue output for the whole set.

## Acceptance

- `npm run check` passes.
- `npm run test:e2e` passes.
- No layout shift when assets load or fail.
- 390×700 and 390×844 remain playable.
- Aether remains distinguishable from Sun/Moon/Crown/Shade.
- Spell icons remain legible in locked, near-ready, ready, and active states.
- GitHub Pages relative paths work after build/deploy.
