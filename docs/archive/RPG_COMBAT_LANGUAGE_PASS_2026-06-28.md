# RPG Combat Language Pass

Date: 2026-06-28
Pass: 9

## Scope

Make the existing duel UI read more like RPG combat without changing mechanics.

## Language Rules

- Keep `HP` as the primary life label because it is compact and genre-familiar.
- Spell out `Guard`, `Sun`, `Moon`, and `Crown` in combat meters instead of using bare initials.
- Use direct combat verbs for previews and logs:
  - sword and shade effects: `damage`
  - shield effects: `guard`
  - mana effects: `mana`
  - long matches: `keeps turn`
- Name the enemy action as Shade Knight taking a turn, not as a generic board movement.
- Keep danger text concrete: backlash costs Aurora HP after shade damage.

## Deferred

- Richer per-event combat log lines can wait until the log stores structured events instead of summary strings.
- Guard-blocked damage detail needs the damage event to preserve applied/blocked amounts.
