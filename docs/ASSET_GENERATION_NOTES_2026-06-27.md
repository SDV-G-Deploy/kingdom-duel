# Kingdom Duel Asset Generation Notes

Date: 2026-06-27

Scope: Task 04 character portrait asset pass and Task 05 gem sprite asset pass.

## Output Paths

- `public/assets/characters/aurora-knight.webp`
- `public/assets/characters/shade-knight.webp`

## Shared Acceptance

- Square portrait asset with transparent background after local matte removal.
- Readable at 42x42 CSS px in the mobile combat strip.
- No text, logos, frame, UI chrome, watermark, weapon labels, or baked background.
- Full silhouette stays inside the canvas with enough padding for the rounded portrait slot.
- Style stays AeroCandy 2007: glossy, optimistic, clean early-2000s glass/candy game asset.
- Avoid medieval grimdark, realistic grit, cyberpunk, horror smoke, dark armor, and tiny facial detail.

## Aurora Knight Prompt

Use case: stylized-concept
Asset type: mobile game character portrait sprite for a 42px combat strip slot
Primary request: Aurora Knight, friendly solar glass paladin hero
Subject: upper-body toy-like knight portrait, rounded readable silhouette, aqua glass armor, sun-yellow highlights, white rim lights, lime eco-tech accent, optimistic expression, large simple shapes
Style: AeroCandy 2007, Frutiger Aero and Windows Aero inspired, glossy candy material, clean specular highlights, bright hopeful future
Composition: centered square asset, generous padding, no crop, reads clearly at tiny mobile size
Background for removal: perfectly flat solid #ff00ff chroma-key background, no shadows, no gradients, no reflections, no floor plane
Avoid: text, logo, watermark, dark medieval grit, realism, cyberpunk, black armor, busy micro-detail, #ff00ff in the subject

## Shade Knight Prompt

Use case: stylized-concept
Asset type: mobile game enemy portrait sprite for a 42px combat strip slot
Primary request: Shade Knight, playful but dangerous glass rival knight
Subject: upper-body toy-like rival knight portrait, elegant threatening silhouette, violet and bubble-pink glass armor, candy-like refraction, clean specular highlights, simple readable faceplate, sharp but rounded armor language
Style: AeroCandy 2007, Frutiger Aero and Windows Aero inspired, glossy candy material, bright polished game asset
Composition: centered square asset, generous padding, no crop, reads clearly at tiny mobile size
Background for removal: perfectly flat solid #00ff00 chroma-key background, no shadows, no gradients, no reflections, no floor plane
Avoid: text, logo, watermark, horror, black smoke, dirty fantasy, realistic grit, cyberpunk, #00ff00 in the subject

## Generated Outputs

Built-in image generation was used.

Post-processing:

- `remove_chroma_key.py` with border auto-key, soft matte, and despill.
- Final conversion through `ffmpeg` to 512x512 WebP with alpha.

Files:

- `public/assets/characters/aurora-knight.webp` - 40KB.
- `public/assets/characters/shade-knight.webp` - 37KB.

Source chroma-key and intermediate alpha files were kept under `tmp/imagegen/` for local inspection only.

## Task 05 Gem Output Paths

- `public/assets/gems/sword.webp`
- `public/assets/gems/shield.webp`
- `public/assets/gems/sun.webp`
- `public/assets/gems/moon.webp`
- `public/assets/gems/crown.webp`
- `public/assets/gems/shade.webp`

## Shared Gem Acceptance

- Square transparent-background WebP after local matte removal.
- Strong silhouette readable at 48x48 CSS px and 96x96 CSS px.
- Fits inside the current rounded gem button without changing hitboxes or board geometry.
- Glossy AeroCandy 2007 material, strong top-left white highlight, soft inner glow.
- No text, logos, numbers, UI frame, watermark, or tiny line-art detail.
- Each tile kind must remain visually distinct by shape and color.

## Gem Prompt Template

Use case: stylized-concept
Asset type: match-3 game tile sprite for a mobile board
Primary request: `<kind>` gem sprite
Subject: `<kind-specific subject>`, simple iconic silhouette, large readable form, centered
Style: AeroCandy 2007, Frutiger Aero and Windows Aero inspired, glossy glass candy material, strong top-left white highlight, soft inner glow, polished casual RPG puzzle asset
Composition: centered square sprite, generous padding, no crop, reads clearly at 48px and 96px
Background for removal: perfectly flat solid chroma-key background, no shadows, no gradients, no reflections, no floor plane
Avoid: text, logo, watermark, baked UI frame, busy reflections, dark grunge, realism, cyberpunk, tiny detail

## Gem Prompt Subjects

- `sword`: aqua glass blade drop with a simple diagonal sword silhouette.
- `shield`: lime glass shield with a bold shield silhouette.
- `sun`: golden sun drop with a round sun core and simple rays.
- `moon`: violet pearl crescent with a bold crescent silhouette.
- `crown`: orange-yellow crown gem with a chunky crown silhouette.
- `shade`: pink-violet danger shard with an angular shadow shard silhouette.

## Generated Gem Outputs

Built-in image generation was used, one prompt per tile kind.

Post-processing:

- `remove_chroma_key.py` with border auto-key, soft matte, and despill.
- Final conversion through `ffmpeg` to 512x512 WebP with alpha.

Files:

- `public/assets/gems/sword.webp` - 18KB.
- `public/assets/gems/shield.webp` - 23KB.
- `public/assets/gems/sun.webp` - 24KB.
- `public/assets/gems/moon.webp` - 19KB.
- `public/assets/gems/crown.webp` - 26KB.
- `public/assets/gems/shade.webp` - 24KB.

Source chroma-key and intermediate alpha files were kept under `tmp/imagegen/gems/` for local inspection only.
