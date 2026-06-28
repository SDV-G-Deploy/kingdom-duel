# Kingdom Duel Design DNA

Date: 2026-06-28
Status: synthesis after commercial research, Frutiger visual research, and the first material/header passes
Scope: product-positioning-to-UI contract for the playable duel screen

## One-Line Product DNA

**A premium tactical match-3 battler in a bright glass-future world that dark fantasy competitors do not occupy.**

Kingdom Duel is not "casual match-3 with nostalgia".
It is a systems-forward duel game using a light Frutiger Aero / Web 2.0 gloss aesthetic as strategic differentiation.

## What Changed After Commercial Research

The design target became sharper.

Before:

- make the screen more Frutiger Aero;
- make the UI less AI-neutral;
- make it feel like one mobile game.

After:

- make every screen communicate **deep battler, light glass world**;
- avoid looking like casual candy match-3;
- avoid looking like dark fantasy Puzzle RPG;
- make the visual white space legible in the first screenshot.

The key market insight is not "Frutiger Aero is trendy".
The key insight is:

> deep match-3 battlers are proven, but their visual field is mostly dark fantasy; Kingdom Duel can own the light/glass/optimistic quadrant.

## Strategic Design Pillars

### 1. Battler First, Match-3 Second

The board is not a candy toy for casual clearing.
It is the tactical weapon surface.

Implications:

- HP, Guard, intent, backlash, and abilities must remain visible.
- The command area must explain consequences, not only instructions.
- Ability chips must feel important, charged, and owned by the hero.
- The UI can be bright, but it cannot become babyish or purely casual.

### 2. Light Glass, Not Cute Candy

Kingdom Duel can use candy-gem surfaces, but the world is closer to:

- aqua glass;
- pearl plastic;
- chrome rim;
- liquid HP tubes;
- jewel-like mana;
- optimistic future toy.

It should not become:

- generic pastel glassmorphism;
- Candy Crush sweetness;
- dark fantasy with brighter colors;
- a dashboard wearing a gloss skin.

### 3. The Screenshot Must Sell The White Space

A first phone screenshot should make the market thesis visible:

- "I understand this is a duel battler";
- "I understand it is not dark fantasy";
- "I understand it is brighter, glassier, and more optimistic than the category";
- "I can still read the tactical state."

If the screenshot only says "nice colorful match-3", the positioning is not visible enough.

### 4. Premium Roguelite Bias

The recommended commercial path is premium roguelite first, not F2P LiveOps first.

Design implications:

- build clarity and perceived depth before collection/meta clutter;
- favor strong battle states and satisfying decisions over shop/event surfaces;
- keep the play screen compact and premium, not monetization-heavy;
- make each duel look like a crafted tactical encounter.

### 5. Organic Channel Requires Iconic Visual Motifs

Frutiger/Aero gives organic shareability only if the visual language is recognizable.

The current strongest motifs:

- glossy 8x8 arena tray;
- Aurora glass vs Shade glass side capsules;
- liquid HP tubes;
- Sun / Moon / Crown gem economy;
- backlash risk as violet-magenta danger.

These need to become signature, not interchangeable UI styling.

## Target Screen Read

The ideal mobile battle screen should read in this order:

1. **Aurora versus Shade**
   - two sides, not two information cards;
   - HP as physical tubes;
   - portraits/emblems visually push toward the board.

2. **Glass Arena**
   - board is the central object and weapon surface;
   - tiles sit in a physical tray;
   - selected, valid, threat, and armed states are materially different.

3. **Current Tactical Command**
   - one sentence tells what matters now;
   - secondary line explains outcome/risk;
   - no debug/system language in the primary path.

4. **Ability Economy**
   - Sun / Moon / Crown chips show cost and readiness at a glance;
   - they look like controls, not info cards;
   - they connect to matching gems and to Aurora's plan.

5. **Quiet Event / Log**
   - recap and log support learning;
   - they do not compete with combat.

## Copy DNA

The language should make the player feel combat, not configuration.

Use:

- `Aurora's move`
- `Swap gems to strike`
- `Shade prepares`
- `Choose a tile`
- `Aim Sun Bloom`
- `Backlash risk`
- `6 moves left`
- `Guard +4`
- `Strike 3`

Avoid in primary combat UI:

- `Board ready`
- `Next action`
- `Shade plan`
- `Select a tile`
- `Spell targeting`
- `Debug`
- `Style`
- long explanatory prose.

Logs may be more mechanical. The combat face should be dramatic and concise.

## Visual DNA

### Materials

- **Aqua Glass:** board tray, Aurora-side active frames, selected rings.
- **Pearl Plastic:** quiet utility and low-priority backing.
- **Candy Gem:** tiles, mana badges, ability readiness.
- **Gold Foil:** turn medallion, Crown value, rare outcomes.
- **Violet Obsidian:** Shade side, danger, backlash, enemy intent.
- **Lime Gel:** Guard and protection.

### Light

Top-left light source.
Every major object needs:

- hard white upper highlight;
- saturated mid-color;
- darker lower edge;
- contact shadow;
- inner white rim plus outer colored/chrome rim.

### Shape

- header: side capsules plus center medallion;
- board: beveled arena tray;
- command: wide ribbon, stable height;
- abilities: compact physical chips;
- log: quiet strip or sheet.

### Palette

Keep the bright Frutiger spectrum:

- aqua;
- pearl white;
- lime;
- sun yellow;
- mango/gold;
- magenta;
- royal violet;
- chrome blue.

Reduce:

- broad mint gradients;
- repeated cyan/pink outlines on every container;
- low-contrast translucent surfaces.

## Current Screen Review

What is now working:

- the board is finally the strongest game object;
- the broad gradient no longer dominates;
- the screen is less AI-neutral and more plastic-glass;
- utility controls are less intrusive;
- the medallion overflow is fixed;
- ability chips have started to become game objects.

What still blocks the full DNA:

1. **Duel header is not yet iconic enough**
   - side capsules are better, but Aurora and Shade still feel like info panels more than combatants;
   - portraits/emblems need stronger side identity;
   - victory/defeat states need a cleaner header grammar.

2. **State grammar is still too textual**
   - selected/valid/threat/armed states are visible, but not yet fully iconic;
   - the player should understand "this is safe", "this is dangerous", "this is spell-armed" before reading.

3. **Ability chips are only halfway physical**
   - element badges help;
   - ready/locked/armed/resolving states need stronger material differences;
   - chips should look like premium controls, not mini cards.

4. **Commercial white space is not yet explicit enough**
   - the screen is bright and game-like;
   - it does not yet scream "deep battler in a light glass world" from one screenshot.

## Next Implementation Pass

Recommended next pass: **Duel Scene Cohesion Pass**

Goal:

Make the battle screen communicate the commercial thesis in one phone screenshot: tactical duel, light glass world, premium match-3 battler.

Scope:

- no new mechanics;
- no board layout rewrite;
- no full-screen art generation;
- CSS, copy, and small markup/class changes only.

Tasks:

1. **Header Identity**
   - make Aurora and Shade side capsules more asymmetrical and combatant-like;
   - give active/winner/defeated states distinct physical treatment;
   - move intent/danger closer to Shade side when possible.

2. **State Grammar**
   - selected tile: raised glass ring + strong white glint;
   - valid swap: lime/aqua gel rim;
   - threat/backlash: violet-magenta danger notch;
   - armed spell target: element-specific badge or linked line.

3. **Ability Chip System**
   - strengthen ready vs locked vs armed;
   - make S/M/C badges more gem-like;
   - add small material differences per spell without adding text.

4. **Combat Copy Tightening**
   - keep command ribbon short;
   - remove remaining form/debug tone;
   - make victory/recap copy reflect battler depth without overflowing.

Acceptance checks:

- 390x700 and 390x844 screenshots show no overflow;
- first read is duel -> arena -> command -> abilities;
- one screenshot visibly differs from dark fantasy Puzzle RPGs and casual candy match-3;
- states remain understandable without reading every label;
- tests/build remain green.

## Risks

- Too much gloss can reduce tactical readability.
- Too much "cute" can push the product toward casual candy match-3.
- Too much text can push it back toward debug cockpit.
- Too much scenic Frutiger reference can distract from the duel screen.

The correct balance is:

> bright enough to own the visual niche, structured enough to sell battler depth.

