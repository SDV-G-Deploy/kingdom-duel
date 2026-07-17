# Visual Identity Pass

Date: 2026-06-28
Pass: 10

## Goal

Make Aurora vs Shade readable at a glance in the playable cockpit without adding new assets or clutter.

## Direction

- Aurora side: clean glass, cyan water, sun-gold charge, protective guard.
- Shade side: violet glass, pink danger, sharper shadow edge, hostile action cue.
- Shared board stays bright AeroCandy so the duel still feels playful rather than dark.

## Implementation Notes

- Use side-specific combatant surfaces and small crest marks instead of larger panels.
- Keep portraits as the primary character assets; CSS should frame them, not replace them.
- Keep mobile density stable: no new text nodes and no extra layout rows.

## Acceptance

- At 390px width, left/right combatants should differ by color language before reading text.
- Enemy thinking/action should feel more dangerous than a normal active state.
- The change should not affect gameplay state or board mechanics.
