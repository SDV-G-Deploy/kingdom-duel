# Kingdom Duel Mobile Design System

Date: 2026-06-29
Status: design-system direction for a later implementation pass
Scope: mobile combat screen structure only; no gameplay, architecture, or code changes

## 1. Product / UI Identity

Kingdom Duel is a mobile-first magical puzzle duel where Aurora and Shade fight over one shared glass board. It is not a generic match-3 RPG and it is not a decorated web page. The screen should read as: **"I am dueling Shade over this board."** The visual mood may stay glossy, bright, magical, and 2000s glass-inspired, but the combat screen must behave like a dense mobile game cockpit: board first, decisions visible, decoration subordinate to the next move.

## 2. Reference Hierarchy

### Primary Structural References

1. **Gems of War**
   Use for board-first density, compact combat information, stats/abilities arranged around the board, and the feeling of a mobile puzzle battler cockpit. Do not copy its darker fantasy art direction directly.

2. **Magic: Puzzle Quest**
   Use for magical duel feeling, spells/commands layered over match-3, mana fantasy, and the sense that a move is being cast rather than merely swapped. Do not copy its older UI clutter.

### Mechanical Reference Only

3. **Puzzle Quest 3**
   Use only for multiple moves per turn, action-point/move economy, spell charging through board actions, and duel pacing. Do not use it as a visual reference for HUD shape, character presentation, or RPG screen weight.

### Secondary UX References

4. **Marvel Puzzle Quest**
   Use for portrait mobile match-3 RPG readability and keeping the board legible on narrow screens.

5. **Slay the Spire**
   Use for enemy intent clarity: the enemy's next action must be visible before the player commits.

6. **Marvel Snap**
   Use for compact bottom card/action readability and snap-fast command comprehension.

## 3. Anti-References

Avoid using broad "Aero glass" or "glossy web UI" as a structural reference. These are material treatments, not layout models.

Do not use as persistent combat-screen patterns:

- large central ovals or medallions that consume combat height;
- large decorative omen/prepares capsules;
- profile-card hero panels with long titles;
- nested rounded panel inside rounded panel inside rounded panel;
- flavor banners that do not change the immediate move decision;
- oversized circular controls inside the combat area;
- web-page instruction blocks that compete with board/action space.

The current screen's weakest pattern is not color. It is decorative volume: many rounded shapes carry too little decision value.

## 4. Core Design Principles

### Board First

The match-3 board is the main gameplay object and must remain visually dominant. Every persistent UI element must answer:

**"What decision does this help the player make right now?"**

If it does not help the next move, collapse it, shorten it, hide it behind detail, or move it to a secondary state.

### Tactical Density Over Decorative Air

Empty space is allowed only when it improves hierarchy, tap safety, or readability. Empty glass capsules are not premium spacing. On 390px-class mobile screens, persistent UI must be dense, useful, and quickly parsed.

### Preserve The Mood, Replace The Structure

Keep:

- glossy glass;
- bright 2000s magical UI;
- Aurora/cyan/gold versus Shade/magenta/violet;
- colorful readable gems;
- shiny fantasy duel mood.

Replace:

- large central oval turn medallion;
- inflated hero profile cards;
- oversized Veil Omen panel;
- long persistent tutorial copy;
- combat log occupying active-combat space.

### State Before Flavor

Primary combat UI should prioritize turn, moves, HP, Guard, intent, selected command, selected tile, valid target, risk, and expected outcome. Flavor can live in expanded details, onboarding, victory/defeat states, or secondary screens.

## 5. Mobile Vertical Layout Model

Target order from top to bottom:

1. **Compact app header**
   Short title/status row with utility buttons. It must not compete with combat HUD.

2. **Compact duel HUD**
   Aurora and Shade as two active combat sides, with short HP/Guard/resource information.

3. **Compact turn chip and enemy intent rail**
   Turn and moves visible in one compact chip. Shade's next action visible in one row.

4. **Large shared board**
   The board remains the dominant physical object and primary tap target.

5. **Bottom command bar**
   Card/action controls with cost, command name, one short effect, and selected/disabled/risky states.

6. **Collapsed log**
   One-line latest event or a drawer/button. The full log is never a major active-combat block by default.

## 6. Component Rules

### Compact Header

The top game/app header may show:

- `Kingdom Duel`;
- global state such as `Your move`;
- small menu/settings/restart controls.

Rules:

- keep it short;
- keep utility controls compact;
- do not repeat combat state that is already better shown in the duel HUD;
- do not create large circular controls that steal combat height.

### Duel HUD

Aurora and Shade are combat sides, not decorative profile cards.

Each side may show:

- small portrait/icon or crest;
- short name;
- HP bar and HP number;
- Guard/block;
- active statuses only when present;
- active-side emphasis.

Rules:

- avoid persistent long titles like `DAWN GLASS KNIGHT` or `VEIL NIGHTBREAKER`;
- long flavor names may appear in expanded profile/detail/result states;
- portraits should point attention toward the board, not toward isolated cards;
- side styling may be asymmetric, but the component grammar must stay compact.

### Turn Chip

Remove the large central oval turn medallion.

Replace it with a compact turn chip:

- `Aurora turn · 6 moves`
- `Shade resolving`
- `Victory`
- `Defeat`

Placement:

- between side HUDs if it stays small; or
- directly above the board as part of the combat state rail.

Rules:

- no large central oval;
- no tall medallion that forces board/intent/action compression;
- the chip should be readable in one glance and one line whenever possible.

### Enemy Intent Rail

Replace the persistent large `Veil Omen` / `Shade Prepares` panel with a compact one-row rail.

Examples:

- `Shade next: 3 damage + 3 guard`
- `Next: sword 3 · guard 3`
- `Shade next: cuts 3 · braces 3`

Rules:

- visually connect it to Shade;
- keep it readable as part of the shared-board duel;
- keep it short enough for 390px mobile;
- never use a large decorative omen capsule as the default enemy intent display;
- enemy intent must be visible before the player commits.

### Board

The board must remain large, central, and tappable.

Required board states:

- idle;
- command selected;
- tile selected;
- valid targets;
- risky Shade-marked tiles;
- safe Aurora-highlighted tiles;
- match preview;
- resolving;
- snap-back/no match.

Visual priority:

1. selected tile;
2. valid target;
3. enemy/risk marker;
4. safe marker;
5. ambient gloss.

Rules:

- do not shrink the board to make room for decorative HUD;
- keep gem silhouettes and colors distinct;
- preserve tap safety and visible cell boundaries;
- board effects should support decisions, not become background sparkle.

### Command Cards / Bottom Command Bar

The bottom area should feel like a compact mobile action/card bar, not a webpage instruction panel.

Each command card should show:

- cost;
- resource/type;
- name;
- one short effect line;
- selected/disabled/risky state.

Examples:

- `6 SUN` / `Sun Bloom` / `Create sun`
- `5 MOON` / `Glass Ward` / `+4 guard`
- `6 CROWN` / `Crown Strike` / `Clear row`

Rules:

- avoid long persistent tutorial copy;
- command explanations can appear on selection, first-time tutorial, hold/detail, or expanded panel;
- selected command must be obvious;
- disabled command should communicate what is missing without long prose;
- risky command/target states must be visible before commit.

### Combat Log

The combat log should not occupy major active-combat height.

Default state:

- one-line latest event; or
- `Full log` button; or
- collapsed drawer.

Rules:

- full log is secondary;
- event copy should help learning after an action, not compete with choosing the next action;
- terminal/result screens may expand recap/log because the active combat loop has ended.

## 7. Shape Rules

Allowed:

- compact glass rectangles;
- thin rails;
- small chips;
- restrained glow;
- asymmetric Aurora/Shade side accents;
- soft glossy panels where they carry real gameplay information.

Avoid:

- large ovals;
- large capsules;
- decorative cylinders;
- nested rounded panels;
- oversized circular controls in the combat area;
- repeated borders that reduce board/cell size;
- shape variety that makes the screen feel like separate web cards.

Forbidden persistent pattern:

**A large decorative oval/capsule that consumes central combat space without carrying essential decision-making information.**

## 8. Typography Rules

Prioritize numbers and decisions over flavor.

Most important text:

- whose turn;
- moves remaining;
- HP;
- Guard;
- enemy intent values;
- command costs;
- selected command;
- selected tile / target state;
- last combat result.

Use concise combat copy:

- `Aurora turn`
- `6 moves`
- `Shade next`
- `3 damage`
- `+3 guard`
- `Aim Sun Bloom`
- `Backlash risk`
- `Clear row`

Avoid persistent long labels:

- `DAWN GLASS KNIGHT`
- `VEIL NIGHTBREAKER`
- `Command the glass board`
- `Pick a tile, then choose...`
- long explanatory paragraphs in the active combat loop.

These may appear in expanded details, onboarding, flavor screens, or result screens.

## 9. State Visibility Rules

The player must understand at a glance:

1. whose turn it is;
2. how many moves remain;
3. Aurora HP and Guard;
4. Shade HP and Guard;
5. what Shade will do next;
6. which command is selected;
7. which tile is selected;
8. which targets are valid;
9. which tiles are risky;
10. what will happen if the player commits.

If a proposed component does not support one of these ten reads, it should not be persistent in the active combat screen.

## 10. Mobile Acceptance Criteria

### 390x700

The core combat loop must be visible without vertical scrolling.

Required:

- compact header;
- compact duel HUD;
- compact turn chip;
- one-row enemy intent rail;
- large tappable board;
- visible bottom command cards;
- collapsed or one-line log;
- no large central oval medallion;
- no large decorative omen panel;
- no persistent long flavor titles;
- no large empty capsule/panel areas.

Acceptance check:

- a 390x700 screenshot should communicate a mobile puzzle duel, not a web page;
- board must dominate the first screen;
- the player can identify turn, moves, HP, Guard, Shade intent, selected/available commands, and board target states without scrolling.

### 390x844

Use the same structure as 390x700.

Extra height may improve breathing room, but it must not create new decorative empty space.

Required:

- board remains dominant;
- extra height goes first to tap comfort, command readability, or optional one-line event context;
- extra height does not reintroduce large ovals, large omen panels, or decorative profile-card space.

Acceptance check:

- the 390x844 layout should feel like a more comfortable version of the 390x700 combat cockpit, not a different looser webpage layout.

## 11. Final Implementation Checklist For A Later Coding Agent

Do not implement until this design-system direction is accepted.

When implementation begins:

1. Preserve gameplay logic and input behavior.
2. Preserve board size and gem readability.
3. Replace the central oval medallion with a compact turn chip.
4. Replace the large enemy omen/prepares panel with a one-row intent rail.
5. Compress Aurora/Shade into compact combat HUD sides.
6. Remove persistent long flavor titles from the active combat HUD.
7. Convert the bottom area into compact command cards with cost/name/effect/state.
8. Collapse combat log into one-line latest event plus drawer/button.
9. Remove decorative nested capsules and large empty ovals.
10. Keep Aurora/Shade color identity and glossy magical mood.
11. Capture screenshots at 390x700 and 390x844 before and after.
12. Verify no vertical scrolling is required for the core loop at 390x700.
13. Run `npm test`, `npm run build`, and `git diff --check`.
14. Perform a visual review before push.

## Review Notes On The Proposed Direction

### Strong Agreement

The proposal correctly separates art direction from structure. The current problem is not that Kingdom Duel is too glossy or too colorful. The problem is that the mobile combat screen spends too much vertical space on decorative shapes that do not improve the next decision.

The strongest parts of the proposal:

- board-first hierarchy;
- explicit removal of the large turn oval;
- enemy intent as a rail, not a panel;
- compact side HUDs instead of profile cards;
- command cards as action controls, not tutorial text;
- 390x700 as the hard acceptance gate.

### Points To Handle Carefully

The proposal should not flatten the game into a dry dashboard. The glossy fantasy mood is still a differentiator, and the current board/gems are valuable. The implementation pass must remove decorative volume without removing the game's magical identity.

The compact HUD should not hide too much status. HP, Guard, moves, and enemy intent must remain readable. Compression is only successful if the player understands more quickly, not if the screen simply becomes smaller.

### Research Still Worth Doing

Before implementation, collect a small reference board:

- 3-4 Gems of War mobile battle screenshots for density and board/HUD proportion;
- 2-3 Magic: Puzzle Quest screenshots for spell/command fantasy;
- 2 Marvel Puzzle Quest portrait screenshots for board readability;
- 2 compact card/action-bar references such as Marvel Snap;
- 1-2 enemy-intent examples from Slay the Spire or similar combat UI.

The research question is not "what should Kingdom Duel copy?" The question is: **how much vertical height do real mobile combat games spend on persistent HUD above and below the board, and how much information does each persistent element carry?**
