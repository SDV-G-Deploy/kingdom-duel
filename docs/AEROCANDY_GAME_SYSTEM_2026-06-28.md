# AeroCandy Game System

Date: 2026-06-28
Status: unified design-system direction before implementation
Scope: mobile-first Kingdom Duel play screen

## One-Line Direction

**Frutiger Space optimism + Wii Sports Resort cleanliness + Super Mario Galaxy toy magic, compressed into a one-screen match-3 duel.**

The game should feel like a glossy plastic-glass mobile duel toy, not a pastel web dashboard with match-3 tiles.

## Design Goal

The player should read the screen as one physical game object:

1. Aurora and Shade face each other.
2. The board is the glass arena between them.
3. The current command explains what to do next.
4. Ability chips belong to Aurora and are charged by board gems.
5. The whole screen shares one optimistic Frutiger/Web 2.0 material world.

## Preserve

- Bright AeroCandy 2007 identity.
- Readable 8x8 board and current input model.
- Current generated portrait and gem slots.
- Clear enemy intent and move/spell previews.
- Mobile-first single-screen cockpit structure.

## Reduce

- Generic translucent panels.
- Cyan/pink outline on every container.
- Broad gradient as the main visual event.
- System/debug copy in the primary combat path.
- Equal visual weight across top bar, HUD, board, action dock, and log.

## Kill

- `Style` as visible combat-screen text.
- `BOARD READY`, `SHADE PLAN`, `NEXT ACTION` as primary labels.
- Thin frosted-glass cards as the universal UI answer.
- Background gradients that do not explain light, water, depth, or material.
- More mechanics before the battle screen feels unified.

## Core System Rules

### Rule 1 - Material Before Decoration

No element gets gloss just because "Frutiger Aero".
Every glossy effect must express a material:

- water-glass;
- pearl plastic;
- candy gem;
- gold foil;
- violet obsidian;
- lime gel;
- chrome rim.

### Rule 2 - One Light Source

Light comes from top-left.
Every major object uses:

- strong white upper highlight;
- saturated middle color;
- darker lower inner edge;
- contact shadow;
- white inner rim plus colored/chrome outer rim.

### Rule 3 - The Board Is The Arena

The board is not a card.
It is the physical arena tray.

The combat header and command ribbon should visually grip it from top and bottom.

### Rule 4 - Game Language, Not System Language

The screen should sound like a duel:

- command;
- strike;
- charge;
- guard;
- enemy prepares;
- backlash risk;
- moves left.

Keep engine/debug language inside logs and dev views.

### Rule 5 - Utility Controls Leave The Battle Hierarchy

Restart/log/style/debug controls are useful, but they are not part of the dramatic read.
They should become small icon utilities, visually secondary to combat.

## Material Palette

### Aqua Glass

Use for:

- board tray;
- Aurora-side active frames;
- selected tile rim;
- water-glass background details.

Visual recipe:

- base: `#25d7f2`, `#7ddfff`, `#f8ffff`;
- top-left white crescent;
- lower blue inner shadow;
- chrome-white rim;
- low blue contact shadow.

### Pearl Plastic

Use for:

- quiet HUD backing;
- top utility bar;
- low-priority sheets.

Visual recipe:

- mostly opaque, not fully frosted;
- soft white top face;
- slight aqua lower edge;
- very low blur.

### Candy Gem

Use for:

- board tiles;
- ability chips;
- charge badges.

Visual recipe:

- saturated hue;
- hard top highlight;
- darker lower edge;
- sprite/contact shadow;
- rounded toy silhouette.

### Gold Foil

Use for:

- turn medallion;
- Crown Strike;
- ready-state accent;
- rare/high-value outcomes.

Visual recipe:

- citrus yellow to mango;
- narrow white highlight;
- warm lower edge;
- restrained sparkle.

### Violet Obsidian

Use for:

- Shade side;
- enemy intent;
- backlash/danger states.

Visual recipe:

- royal violet + magenta gem;
- not black fantasy;
- glossy, sharp, dangerous, still candy-like.

### Lime Gel

Use for:

- Guard;
- shield tile;
- protection states.

Visual recipe:

- lime core;
- aqua edge;
- soft inner glow;
- clear protective read.

## Color System

### Brand Core

- `aqua-500`: `#25d7f2`
- `sky-300`: `#7ddfff`
- `pearl-50`: `#f8ffff`
- `lime-400`: `#9bff4f`
- `mint-400`: `#7bf28d`
- `chrome-200`: `#c7dbe8`

### Accent Set

- `sun-400`: `#ffe25c`
- `mango-500`: `#ff9d3d`
- `magenta-400`: `#ff74c8`
- `violet-500`: `#9b83ff`
- `ocean-600`: `#247cff`

### Combat Semantics

- Player/Aurora: aqua glass + sun white.
- Enemy/Shade: violet obsidian + magenta.
- Damage: aqua sword or magenta enemy hit depending on actor.
- Guard: lime gel.
- Sun mana: sun/mango.
- Moon mana: violet/ocean.
- Crown mana: gold foil.
- Risk/backlash: magenta/violet with strong border and dark lower edge.

### Contrast Rule

Primary text remains deep blue `#04304a`.
Small text should not sit on saturated gem color without a pearl/glass backing.
Use shape, icon, copy, and position in addition to color for state differences.

## Layout System

### Mobile First Stack

Target order:

1. **Utility Bar**
   - Small brand, icon utilities only.
   - Visually secondary.

2. **Duel Header**
   - Aurora capsule left.
   - Turn medallion center.
   - Shade capsule right.
   - HP as liquid tubes.
   - Enemy intent anchored to Shade or arena edge.

3. **Arena Tray**
   - Board mounted in a beveled glass/candy tray.
   - Board is the strongest object.
   - Intent/preview should feel attached to the tray, not floating as text lines.

4. **Command Ribbon**
   - One clear current instruction/outcome.
   - Battle language.
   - Stable height to avoid board shifting.

5. **Ability Chips**
   - Three glossy skill chips.
   - Cost gem and ready/locked/armed state.
   - Visually connected to Sun/Moon/Crown.

6. **Latest Event**
   - Quiet, compact.
   - Full log opens as sheet.

### Short Viewport Contract

On 390x700:

- board remains readable and dominant;
- latest event may be compact;
- utilities can compress first;
- command ribbon and skill chips remain tappable;
- no horizontal overflow.

On 390x844:

- no large dead aqua gap between combat header and board;
- board still appears mounted, not floating;
- action area should feel like controls, not documentation.

## Component Specs

### Utility Bar

Purpose:

- identify game and expose low-priority controls.

Anatomy:

- brand text;
- status text;
- restart icon;
- log icon;
- debug/style icon.

Do:

- keep it compact;
- use pearl plastic;
- demote visually.

Do not:

- make Log/Style compete with combat;
- use full text labels if icon buttons fit.

### Duel Header

Purpose:

- make Aurora vs Shade readable as a conflict.

Anatomy:

- side capsule;
- portrait;
- actor name;
- liquid HP tube;
- small guard/mana badges;
- active side rim;
- center turn medallion.

States:

- active actor;
- enemy preparing;
- enemy action cue;
- winner/defeat.

Acceptance:

- top reads as two fighters and one turn object, not three equal dashboard cards.

### Arena Tray

Purpose:

- make the board the physical game object.

Anatomy:

- beveled outer rim;
- inner glass well;
- 8x8 board cells;
- selected/valid/threat/spell states;
- attached intent rail.

States:

- ready;
- move preview;
- spell targeting;
- backlash risk;
- enemy action;
- locked/resolving.

Acceptance:

- board looks embedded in a tray;
- tile states remain distinct at 390px;
- no state relies only on color.

### Command Ribbon

Purpose:

- tell the player what action matters now.

Anatomy:

- command label;
- main action text;
- short result/risk line;
- effect chips when preview exists.

Copy examples:

- `Aurora's move`
- `Choose a tile to swap`
- `Swap to charge Sun`
- `Shade prepares`
- `Backlash risk: -3 HP`

Do:

- use battle verbs;
- keep the component stable in height;
- connect visually to the board.

Do not:

- say `NEXT ACTION`;
- read like a form hint;
- expand into documentation.

### Ability Chips

Purpose:

- make spells feel like game controls owned by Aurora.

Anatomy:

- element badge;
- ability name;
- cost gem;
- ready/locked/armed state;
- one short effect line.

Variants:

- Sun Bloom: sun/mango chip.
- Glass Ward: lime/aqua guard chip.
- Crown Strike: gold chip.

States:

- locked: pearly, desaturated, cost visible.
- ready: saturated, raised, stronger top gloss.
- armed: pressed/selected, linked to board target.
- resolving: input locked, short shine.

Acceptance:

- the player can tell which ability is ready without reading all text;
- chips feel like physical controls, not flat cards.

## Copy System

Replace:

- `BOARD READY` -> `Aurora's move`
- `Swap adjacent tiles` -> `Swap gems to strike`
- `SHADE PLAN` -> `Shade prepares`
- `NEXT ACTION` -> `Command`
- `Select a tile` -> `Choose a tile`
- `Choose a neighbor` -> `Choose a highlighted gem`
- `6 swaps` -> `6 moves left`
- `Spell targeting` -> `Aim spell`
- `Spell preview` -> `Spell aim`
- `Move outcome` -> `Preview`

Rules:

- labels are short;
- main text uses game verbs;
- mechanical detail moves into secondary line/effect chips;
- debug/export language stays only in log sheet.

## Motion And Feedback

Keep motion short and toy-like.

Recommended:

- selected tile raises 2px with thick ring;
- valid target gets pulsing gel rim;
- enemy intent gets one magenta shimmer, not constant neon;
- ability ready gets tiny top-left glint;
- invalid swap snaps back physically;
- turn medallion flips/pulses lightly when turn changes.

Avoid:

- long atmospheric animations;
- full-screen glow;
- layout-shifting text transitions;
- motion that delays input.

## Implementation Sequence

### Pass 1 - Material Foundation

Goal:

- replace neutral gradient/glass with physical Frutiger game materials.

Tasks:

- add CSS variables for material/color/elevation tokens;
- replace broad background gradient with aqua/pearl/water material;
- define reusable rim/highlight/shadow recipes;
- reduce generic frosted cards.

Acceptance:

- screenshot no longer reads as a mint/cyan gradient page.

### Pass 2 - Arena Tray

Goal:

- make board physically dominant.

Tasks:

- rebuild board frame as beveled candy-glass tray;
- add inset cell well language;
- tune selected/valid/threat states to match material system.

Acceptance:

- squint test: board is the first object, not the background or top controls.

### Pass 3 - Duel Header

Goal:

- make Aurora and Shade feel like combatants.

Tasks:

- side capsules;
- liquid HP bars;
- turn medallion;
- enemy intent attached to Shade/arena.

Acceptance:

- top reads as battle, not actor cards plus status widget.

### Pass 4 - Command Ribbon And Ability Chips

Goal:

- make bottom area feel like controls.

Tasks:

- command ribbon copy and shape;
- three physical ability chips;
- ready/locked/armed states.

Acceptance:

- bottom reads as action controls, not documentation.

### Pass 5 - Screenshot QA And System Lock

Goal:

- keep the system from drifting back into generic glass.

Tasks:

- capture 390x700, 390x844, desktop;
- compare against this system doc;
- update screenshots and roadmap;
- write down any exceptions.

Acceptance:

- no horizontal overflow;
- board remains playable;
- visible screen uses one material world;
- utility controls are demoted;
- Frutiger optimism is visible without scenic clutter.

## Final North Star

Kingdom Duel should not look like a fantasy RPG pasted onto a web UI.
It should look like a bright 2007 future-toy battle board:

- watery;
- glossy;
- optimistic;
- physical;
- readable;
- slightly excessive;
- unmistakably a mobile game.

