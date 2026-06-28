# Shell Silhouette Research

Date: 2026-06-28
Status: research before any new visual implementation
Question: why does the screen still feel flat, over-safe, and AI-like when the board itself is good?

## Starting Critique

The board is the strongest part of the screen.
It feels like a real match-3 game object.

The rest still feels off:

- too flat;
- too polished and safe;
- too AI-neutral;
- too many rounded rectangles;
- too much "nice UI" and not enough "mobile game machine".

This means the problem is no longer primarily color, gloss, or texture.
The problem is **silhouette and composition archetype**.

## Evidence From Reference Categories

### Puzzle Quest 3

Sources:

- App Store: <https://apps.apple.com/us/app/puzzle-quest-3-match-3-rpg/id1490519951>
- Google Play: <https://play.google.com/store/apps/details?id=com.and.games505.puzzlequest3&hl=en_US>

Useful lesson:

- It frames match-3 as direct combat, not casual clearing.
- The enemy/hero presence is large and theatrical.
- Ability buttons are chunky and iconic, not flat controls.
- The board is embedded in a battle scene with hard edges and weight.

What Kingdom Duel should not copy:

- dark dungeon fantasy mood;
- heavy medieval armor visual language;
- noisy fantasy texture.

What Kingdom Duel should adapt:

- strong combat silhouette;
- board as weapon surface;
- ability controls as powerful objects;
- fewer generic info panels.

### Gems of War

Sources:

- Google Play: <https://play.google.com/store/apps/details?id=air.com.and.games505.gemsofwar&hl=en_US>
- App Store: <https://apps.apple.com/lc/app/gems-of-war-match-3-strategy/id897954560>
- MobyGames screenshots: <https://www.mobygames.com/game/76888/gems-of-war/screenshots/>

Useful lesson:

- It is dense and tactical; resources, troop sides, and board all feel like one battle interface.
- The UI is not "clean" in a modern SaaS sense.
- The battle screen accepts visual weight because tactical RPG players tolerate density when it carries meaning.

What Kingdom Duel should not copy:

- grim fantasy palette;
- skull-heavy category language;
- overloaded side panels.

What Kingdom Duel should adapt:

- asymmetrical tactical density;
- clear side ownership;
- physical gems and troop/ability linkage;
- willingness to look like a game instead of a product UI.

### Empires & Puzzles

Sources:

- Google Play: <https://play.google.com/store/apps/details?id=com.smallgiantgames.empires&hl=en_US>
- App Store: <https://apps.apple.com/sz/app/empires-puzzles-match-3-rpg/id1117841866>

Useful lesson:

- It reads as RPG first, puzzle second: enemies and hero roster are not decorative, they explain why the board matters.
- Hero portraits at the bottom make abilities feel owned by characters.
- The screen is structurally clear: enemies above, board center, hero/ability economy below.

What Kingdom Duel should not copy:

- team-roster bottom row;
- fantasy forest/dark enemy staging;
- F2P content density.

What Kingdom Duel should adapt:

- abilities must feel owned, not like action cards;
- combatants should visually grip the board;
- the screen needs a theatrical battle frame.

### Frutiger / Wii-era Aero References

Sources:

- Frutiger Space Steam page: <https://store.steampowered.com/app/3591510/Frutiger_Space/>
- Wii / Frutiger Aero discussion reference: <https://www.reddit.com/r/FrutigerAero/comments/136kx8i/many_people_have_said_that_the_wii_menu_is/>

Useful lesson:

- The appeal is not just gloss.
- It is optimistic future material: clean white, glass, water, bubbles, green, chrome, sun.
- Good Wii-era UI often uses physical channels, rounded capsules, tabbed trays, toy-like widgets, and strong iconography.

What Kingdom Duel should not copy:

- empty white menu minimalism;
- scenic resort background as the whole solution;
- nostalgia pastiche without game function.

What Kingdom Duel should adapt:

- plastic/glass controls with physical casing;
- non-rectangular surfaces;
- optimistic future-toy material;
- airy but not flat.

## Root Diagnosis

The current screen still feels AI-like because it uses the common generated UI recipe:

1. rounded rectangles;
2. translucent/frosted panels;
3. soft gradients;
4. consistent small pills;
5. even spacing;
6. everything politely aligned.

Those are not inherently bad.
But when every surface uses them, the screen lacks a **game silhouette**.

The board escapes this because it has:

- repeated physical tiles;
- grid gravity;
- strong color objects;
- clear tactile interaction.

The shell fails because it has:

- card logic;
- rounded container logic;
- text-heavy explanation;
- no casing, clamps, notches, rails, tabs, sockets, or mechanical silhouette.

## Design Direction Shift

Do not do:

> more polish on the current panel system.

Do:

> replace the panel system with a physical shell around the board.

The next pass should be called **Shell Silhouette Pass**, not material polish.

## Three Candidate Directions

### Direction A - Aero Arcade Console

The screen becomes a handheld glass arcade machine.

Shape language:

- board sits in a central tray;
- top is a curved duel dashboard;
- bottom is a control deck;
- side rails clamp the board vertically;
- utility controls become small embedded console buttons.

Materials:

- pearl plastic casing;
- aqua glass screen;
- chrome seams;
- gel buttons;
- gold/violet medallion states.

Strength:

- strongest answer to "too many rounded rectangles";
- makes the screen feel like one object;
- keeps board dominant.

Risk:

- can become bulky and reduce vertical space if overbuilt.

Best use:

- mobile battle screen.

### Direction B - Glass Duel Shrine

The screen becomes a bright ritual arena.

Shape language:

- Aurora and Shade are side emblems, not cards;
- center medallion sits like a seal;
- board frame has decorative corner anchors;
- ability chips are relic-like tokens.

Materials:

- aqua glass;
- gold foil;
- violet obsidian;
- luminous enamel.

Strength:

- more premium/fantasy;
- can make Aurora/Shade identity stronger.

Risk:

- may drift toward fantasy UI and lose the clean Frutiger optimism;
- harder to keep from looking decorative.

Best use:

- character identity and victory/defeat states.

### Direction C - Wii-era Future Toy

The screen becomes a playful white/aqua future toy interface.

Shape language:

- fewer panels;
- more capsule channels;
- bubble-like HP tubes;
- clean white casing around bright objects;
- big friendly icons over text.

Materials:

- white pearl plastic;
- blue water glass;
- lime/sun accent;
- soft chrome.

Strength:

- most Frutiger-authentic;
- less AI-pastel if it uses hard physical highlights and casing.

Risk:

- can feel too clean/casual if not paired with tactical threat states.

Best use:

- utility bar, HP, command ribbon, and ability chips.

## Recommended Hybrid

Use **Aero Arcade Console** as the structural base.
Borrow from **Wii-era Future Toy** for material and optimism.
Borrow from **Glass Duel Shrine** only for Aurora/Shade identity and win/loss drama.

In one phrase:

> a pearl-glass handheld battle console with a duel shrine inside it.

## What To Change Next

### 1. Kill Card Silhouette Around The Board

Replace separate header/status/action panels with a shared physical casing.

Implementation idea:

- create one `.battle-console` shell around combat strip, board, and action dock;
- use top/bottom casing bands;
- board frame becomes the central screen/tray;
- remove repeated independent card borders where possible.

### 2. Rebuild Header As Combat Dashboard

Current header: two cards plus medallion.
Target header: dashboard faceplate.

Changes:

- Aurora and Shade sit in slanted/curved side pods;
- portraits become embedded lenses;
- HP becomes liquid tube cut into the pod;
- medallion overlaps the top of the board/tray rather than floating between cards.

### 3. Rebuild Bottom As Control Deck

Current bottom: command panel plus three buttons.
Target bottom: physical control deck.

Changes:

- command is a central readout strip;
- ability chips are socketed buttons;
- ready/locked/armed states use height, glow, and casing, not only color/text.

### 4. Reduce Text Surfaces

Keep tactical text, but remove form-like labels.

Examples:

- `Command` can become a small etched label, not a panel title.
- `Choose a tile` stays, but as a console readout.
- ability effect text should become secondary; icon/cost/readiness must carry more.

### 5. Introduce Shape Variety With Rules

Rule set:

- board: square tray with heavy radius;
- header pods: asymmetric capsules;
- HP: liquid tubes;
- turn: medallion/lens;
- command: long readout slot;
- ability chips: socketed gems/buttons;
- log: tiny drawer.

This creates variety without chaos.

## Acceptance Checks

The next visual pass is successful if:

1. squint test shows one battle console, not stacked panels;
2. the board remains the strongest object;
3. top and bottom feel physically attached to the board;
4. fewer elements look like generic rounded rectangles;
5. the screen still fits 390x700 and 390x844;
6. selected/valid/backlash/spell states remain readable;
7. the first screenshot feels like a premium mobile game, not a polished web prototype.

## Do Not Do

- Do not make the board smaller to fit decoration.
- Do not solve with a new background.
- Do not add a full scenic illustration yet.
- Do not add more text labels to explain the shell.
- Do not make every surface darker or more fantasy.
- Do not chase "expensive" by making it minimal.

The expensive move here is not minimalism.
It is a more authored physical object.

