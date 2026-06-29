# Kingdom Duel Mobile Structure Wireframe

Date: 2026-06-29
Status: rough structural target before implementation
Scope: mobile combat screen layout model; no code changes

## Goal

Define the next mobile combat screen structure before implementation.

The purpose is not to create a final visual mockup. The purpose is to give a coding agent a clear structural target that removes decorative vertical waste while preserving Kingdom Duel's bright magical glass identity.

## Core Target

Current baseline problem:

- the board begins around 290px down a 390x700 viewport;
- the top stack spends too much height on app chrome, profile-card HUD, central oval, duplicate command copy, and a large omen panel.

Target:

- the board should begin around 145-175px;
- the full core loop should fit 390x700 without vertical scroll;
- persistent UI should be compact, numerical, and decision-oriented.

## Proposed 390x700 Stack

Approximate target:

```text
0      ┌──────────────────────────────────────┐
       │ Compact app header                   │ 44-52px
       │ Kingdom Duel · Your move        menu │
52     ├──────────────────────────────────────┤
       │ Aurora HUD      Turn chip    Shade HUD│ 58-72px
       │ HP / Guard / mana       HP / Guard   │
124    ├──────────────────────────────────────┤
       │ Shade next: cuts 3 · braces 3        │ 28-40px
164    ├──────────────────────────────────────┤
       │                                      │
       │                                      │
       │             Shared board             │ 330-370px
       │                                      │
       │                                      │
534    ├──────────────────────────────────────┤
       │ Command cards: Sun / Moon / Crown    │ 78-96px
630    ├──────────────────────────────────────┤
       │ Last event / Full log                │ 0-28px
700    └──────────────────────────────────────┘
```

This is a height budget, not a pixel-perfect design. The key is the ordering and compression.

## Proposed Component Content

### 1. Compact App Header

Content:

- `Kingdom Duel`;
- `Your move`, `Resolving`, `Victory`, or `Defeat`;
- small utility buttons.

Target behavior:

- app-level status only;
- no combat explanation;
- no large round controls if they compete with the combat area.

Implementation notes:

- keep this visually quieter than the combat HUD;
- reduce vertical padding;
- utility buttons can still be glossy, but should be smaller.

### 2. Compact Duel HUD

Content:

Aurora side:

- portrait/crest;
- `Aurora`;
- HP bar + number;
- Guard;
- optional compact resources.

Shade side:

- portrait/crest;
- `Shade`;
- HP bar + number;
- Guard;
- optional compact resources.

Center:

- turn chip such as `Aurora turn · 6 moves`.

Target behavior:

- sides feel like combatants, not profile cards;
- active side is visible;
- no persistent long titles.

Implementation notes:

- remove the large central oval;
- compress side panels into one shared HUD strip;
- keep Aurora/Shade color asymmetry;
- consider using a straight or slightly angled center chip, not a tall medallion.

### 3. Enemy Intent Rail

Content examples:

- `Shade next: cuts 3 · braces 3`;
- `Shade next: 3 damage · +3 guard`;
- icon variant later if verified readable.

Target behavior:

- player sees Shade's next action before committing;
- rail is one row;
- rail is visually connected to Shade but close to the board.

Implementation notes:

- remove `Veil Omen` as a tall persistent capsule;
- keep risk tinting but reduce empty glass volume;
- if there is no intent, show a short neutral state rather than a blank decorative panel.

### 4. Shared Board

Content:

- current 8x8 board;
- selected/valid/risk/spell states.

Target behavior:

- board remains the dominant visible object;
- board starts much higher than baseline;
- no board shrink to satisfy decorative UI.

Implementation notes:

- preserve gem assets and board input behavior;
- preserve existing state classes where possible;
- tune surrounding frame only after structure is correct.

### 5. Bottom Command Cards

Content:

Each card:

- cost/resource;
- command name;
- one short effect;
- state: ready, disabled, selected, risky.

Examples:

- `6 SUN` / `Sun Bloom` / `Create sun`
- `5 MOON` / `Glass Ward` / `+4 guard`
- `6 CROWN` / `Crown Strike` / `Clear row`

Target behavior:

- player sees action options without reading tutorial prose;
- selected command is obvious;
- disabled command communicates charge/missing resource in compact form.

Implementation notes:

- remove persistent instruction paragraph from default state;
- show explanation only in selected/expanded/help states;
- keep command cards tappable and visually distinct.

### 6. Last Event / Log

Content:

- one-line latest result if space allows;
- `Full log` drawer/button.

Target behavior:

- supports learning;
- does not occupy primary combat height.

Implementation notes:

- terminal result screens can expand recap/log;
- active combat should keep log collapsed.

## Copy Model

### Default Active Turn

Use:

- `Aurora turn · 6 moves`
- `Shade next: cuts 3 · braces 3`
- `Sun Bloom · Create sun`
- `Glass Ward · +4 guard`
- `Crown Strike · Clear row`

Avoid:

- `Command the glass board`
- `Pick a strike gem`
- `Select one gem. Bright sockets are safe swaps...`
- long flavor titles in the persistent HUD.

### Selected Command

Use:

- `Aim Sun Bloom`
- `Tap target to preview`
- `Tap again to cast`
- `Backlash risk`
- `Creates sun · keeps turn`

Keep this contextual. Do not make it always visible.

## Shape Model

Preferred persistent shapes:

- compact rectangular glass strips;
- shallow chips;
- thin rails;
- command cards with stable height.

Forbidden persistent shapes:

- large oval medallion;
- large omen capsule;
- profile-card side panels with empty rounded volume;
- nested glass cards inside larger glass cards.

## Implementation Order

1. **Markup structure first**
   Reorganize render output into compact header, duel HUD, intent rail, board, command cards, collapsed log.

2. **Plain layout pass**
   Make the layout fit 390x700 with minimal styling changes.

3. **State preservation pass**
   Ensure selected/valid/risk/spell states still work.

4. **Glass material pass**
   Add compact glass styling after the geometry works.

5. **Screenshot QA**
   Compare against baseline screenshots.

## Acceptance Checklist

- 390x700 core loop fits without vertical scroll.
- Board starts around 145-175px, not around 290px.
- Board remains large and tappable.
- No large central turn oval remains.
- No tall persistent `Veil Omen` panel remains.
- Enemy intent is visible before commit.
- Command cards are visible at bottom.
- No persistent long tutorial copy in active combat.
- Aurora/Shade identity remains visible.
- Glossy magical mood remains, but in compact game components.

## Open Design Questions

1. Should the turn chip live between side HUDs or directly above the intent rail?
2. Should Shade intent use icons now, or text-first until readability is proven?
3. Should Sun/Moon/Crown resources live in side HUD or only on command cards?
4. How much of the latest event should be visible during active combat?
5. Can the app header be visually merged with the duel HUD on very short screens?

These should be answered by screenshot comparison, not preference alone.
