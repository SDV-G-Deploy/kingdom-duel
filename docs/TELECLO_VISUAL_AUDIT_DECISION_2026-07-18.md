# Kingdom Duel TeleClo Visual Audit Decision 2026-07-18

Source: forwarded TeleClo visual audit file `visual-audit-and-pack-plan---de4eaee8-9f4d-4f9d-8f61-97b3bf8f8495.md`
Status: accepted as graphics intake direction, not as permission for broad production

## Accepted Findings

TeleClo classified the work as `ui_pack`, which matches the current project need. Kingdom Duel does not need character animation, a full decorative reskin, or arena/world art as the first graphics step.

The first valuable layer is gameplay readability:

- Aether is an active special tile and needs its own bitmap sprite.
- Player spell buttons need stronger icon literacy at compact mobile sizes.
- State overlays are useful, but should follow after the first tile/spell language is approved.
- Result, reward, portrait variants, arena frame, and enemy spell icons are lower priority.

## Approved Batch Order

Batch 1 is the only active graphics scope:

1. `public/assets/gems/aether.webp`
2. `public/assets/spells/glass-ward.webp`
3. `public/assets/spells/sun-bloom.webp`
4. `public/assets/spells/crown-strike.webp`

Generate and review `aether.webp` first. Do not generate the three player spell icons until the Aether style language is accepted.

## Production Boundaries

- Keep runtime format as WebP.
- Use square source composition, ideally 512x512 or larger.
- No embedded text.
- No baked UI chrome or button frame.
- Prioritize silhouettes that survive 36-44px for gems and 22-32px for spell icons.
- Avoid a one-note purple/blue pack.
- Do not change combat rules, layout, or balance as part of asset intake.

## TeleClo Pipeline Gate

Before new live production, the TeleClo asset-pack v9 post-apply no-generation smoke gate must be green or explicitly reported as already green for this route.

If that gate is not green yet, the next TeleClo step is a no-generation `ui_pack` routing smoke and a short status report. If green, proceed only to the single Aether candidate.

## UI-Pack Smoke Result

Forwarded TeleClo status at 2026-07-18 13:05 UTC:

- v9 post-apply UI-pack smoke had not previously been recorded as green;
- TeleClo ran a dry UI-pack routing smoke with no generation;
- active skill: `asset-pack-pipeline` v9;
- route: `ui_pack`;
- Kingdom Duel scope: ordinary 2D UI/gameplay asset, not character animation;
- no spell icons, overlays, full pack, or broad production started.

Decision: treat the route classification as correct. The next safe TeleClo action is to record the dry `ui_pack` routing smoke as green, then generate only `1-3` Aether candidates for review.

## Review Gate

The next artifact expected from TeleClo is a review artifact for `aether.webp`, not a full pack.

Acceptable review artifact:

- one or a few Aether candidates;
- thumbnail/contact view showing readability near 36-44px;
- file dimensions and alpha/background note;
- proposed final path: `public/assets/gems/aether.webp`.

Do not accept broad package delivery or multiple categories before this first style slice is reviewed.
