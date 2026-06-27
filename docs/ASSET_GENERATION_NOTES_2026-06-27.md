# Kingdom Duel Asset Generation Notes

Date: 2026-06-27

Scope: Task 04 character portrait asset pass.

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
