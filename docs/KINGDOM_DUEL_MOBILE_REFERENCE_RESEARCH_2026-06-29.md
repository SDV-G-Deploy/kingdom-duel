# Kingdom Duel Mobile Reference Research

Date: 2026-06-29
Status: research and planning notes after external design-system brief
Scope: mobile combat UI references, critique, and implementation planning; no code changes

## Objective

Validate the proposed Kingdom Duel mobile design direction against real mobile game UI patterns before any implementation work.

The central question:

**How should Kingdom Duel preserve its bright magical glass identity while replacing decorative web-like combat layout with a denser, more credible mobile puzzle duel cockpit?**

## Sources Checked

- Gems of War - Google Play: <https://play.google.com/store/apps/details?id=air.com.and.games505.gemsofwar>
- Gems of War - App Store: <https://apps.apple.com/us/app/gems-of-war-match-3-strategy/id897954560>
- Gems of War - MobyGames screenshots: <https://www.mobygames.com/game/76888/gems-of-war/screenshots/>
- Magic: Puzzle Quest - Google Play: <https://play.google.com/store/apps/details?id=com.d3p.olympic>
- Magic: Puzzle Quest - App Store: <https://apps.apple.com/co/app/magic-puzzle-quest/id1031755344?l=en-GB>
- Marvel Puzzle Quest - App Store: <https://apps.apple.com/us/app/marvel-puzzle-quest-hero-rpg/id618349779>
- Marvel Puzzle Quest - Google Play: <https://play.google.com/store/apps/details?id=com.d3p.mpq>
- Marvel Puzzle Quest - MobyGames screenshots: <https://www.mobygames.com/game/68932/marvel-puzzle-quest/screenshots/>
- Puzzle Quest 3 enemy spell visibility discussion: <https://community.puzzlequest3.com/t/enemy-spell-mana-fill-amount-on-battle-screen/2549>
- MARVEL SNAP - Google Play: <https://play.google.com/store/apps/details?id=com.nvsgames.snap>
- MARVEL SNAP - App Store: <https://apps.apple.com/us/app/marvel-snap-hero-card-game/id1592081003>
- Apple Developer, Behind the Design: MARVEL SNAP: <https://developer.apple.com/news/?id=sosm2p7q>
- Slay the Spire intent reference: <https://slay-the-spire.fandom.com/wiki/Intent>
- Slay the Spire-like enemy intent discussion: <https://forums.rpgmakerweb.com/threads/forecasting-enemy-intent-slay-the-spire-like-battle-flow.113080/>

## Key Research Findings

### 1. The Brief Is Directionally Correct

The strongest external support is for **board-first density**.

Gems of War and Marvel Puzzle Quest both sell themselves as match-3 RPG/battle games where the puzzle board is the core combat surface. Their public descriptions emphasize matching gems/tiles to power attacks, abilities, spells, and RPG battle outcomes. This supports the proposed Kingdom Duel rule: the board is the primary gameplay object and must not be sacrificed for decorative HUD.

For Kingdom Duel, this means:

- preserve the large shared 8x8 board;
- reduce decorative height above it;
- make every HUD element justify its space through combat information;
- do not solve the problem by making the board smaller.

### 2. Magic: Puzzle Quest Supports The Command/Mana Fantasy

Magic: Puzzle Quest explicitly frames mana gems as the source of spell power: matching gems collects power to cast spells and creatures.

For Kingdom Duel, this validates:

- Sun/Moon/Crown as command resources;
- spell/action cards in the bottom bar;
- short command labels like `Create sun`, `+4 guard`, `Clear row`;
- a "casting a move" feeling rather than generic match instructions.

This does not validate long persistent tutorial text. It validates compact magical commands.

### 3. Marvel Puzzle Quest Supports Dense Portrait Combat, But Warns Against Tiny Text

Marvel Puzzle Quest references show and describe team-vs-team match-3 RPG combat with powers charged by tile matching. It is useful for portrait readability and for the idea that character/ability identity can exist without turning the screen into a profile-card layout.

However, community accessibility discussion around Marvel Puzzle Quest points to a known risk: power text can become too small in combat.

For Kingdom Duel, this means:

- dense is good;
- tiny persistent prose is not;
- command cards should show one short effect line;
- detailed explanation should be expanded, not always visible.

### 4. Puzzle Quest 3 Is Useful Mechanically, Not Visually

Puzzle Quest 3 supports move economy, spells charging through board action, and battle pacing. A community request specifically asks for enemy spell mana requirements to be visible during battle, reinforcing the importance of enemy-side actionable information.

For Kingdom Duel, this supports:

- `Aurora turn · 6 moves`;
- command/spell charge visibility;
- enemy intent values visible before commit.

It does **not** support copying Puzzle Quest 3's visual layout or character-heavy RPG screen.

### 5. Slay The Spire Strongly Supports Enemy Intent As A Compact Decision Tool

Slay the Spire intent is a clear UX pattern: symbols above enemies tell the player what the enemy will do next, often with damage numbers. Discussions around intent systems emphasize that visible enemy intention creates informed turn-by-turn decisions.

For Kingdom Duel, this supports replacing the large `Veil Omen` panel with a compact rail:

- `Shade next: cuts 3 · braces 3`;
- `Next: 3 damage + 3 guard`;
- icon + values, not paragraph + giant capsule.

The intent rail should be readable before the player commits a move.

### 6. MARVEL SNAP Supports "Cut The Fluff" Action Density

MARVEL SNAP official/app materials repeatedly frame the game as fast, mobile-first, and short-session. Google Play copy explicitly says card games last about three minutes and "cut the fluff to focus only on strategy and gameplay." Apple Developer's design story emphasizes intuitive touch controls, speedy gameplay, and a simple surface with deep combinations.

For Kingdom Duel, this supports:

- compact bottom command cards;
- removing persistent tutorial blocks;
- fast-reading labels and action states;
- only enough chrome to make the action desirable.

## What We Should Keep

- The bright glass-fantasy differentiation.
- Aurora/cyan/gold versus Shade/magenta/violet faction contrast.
- Colorful readable gems.
- Board state vocabulary: selected, valid target, risk, spell aim, spell armed, snap-back.
- The idea of commands/spells being charged by board play.
- The idea of Shade intent being visible before commit.

## What We Should Remove Or Replace

- Large central oval turn medallion.
- Large persistent `Veil Omen` capsule/panel.
- Large hero profile-card blocks with long titles.
- Repeated nested glass containers.
- Persistent long instructional copy in the active combat loop.
- Any shape whose main role is "looks glossy" rather than "helps the next decision".

## Where I Agree With The External Brief

### Board First

Strong agreement. This is the main correction. The current design drifted into making the UI shell compete with the board.

### Enemy Intent Rail

Strong agreement. A compact rail is the right pattern. The current `Veil Omen` panel is too large for the amount of information it carries.

### Turn Chip Instead Of Central Oval

Strong agreement. The current central oval is visually memorable but not worth its vertical cost. The same information can live in a compact chip.

### Bottom Command Cards

Strong agreement. The bottom should become a game action bar, not a web instruction panel. Magic: Puzzle Quest and MARVEL SNAP both support fast, legible action affordances.

### 390x700 As A Hard Gate

Strong agreement. If the core combat loop does not fit in 390x700 without scrolling, the screen is not yet mobile-game ready.

## Where I Would Be Careful

### Do Not Overcorrect Into A Flat Utility HUD

The current UI is too decorative, but the answer is not a plain dashboard. Kingdom Duel still needs a magical, physical, glossy world. The replacement components should be compact glass instruments, not dry SaaS rows.

### Do Not Hide Combat State In The Name Of Density

Compression is only good if it makes the next decision faster. HP, Guard, moves, Shade next, selected command, and target state must remain visible.

### Do Not Copy One Game's Layout

The references provide principles:

- Gems of War: density and board dominance;
- Magic: Puzzle Quest: spells/mana fantasy;
- Marvel Puzzle Quest: portrait battle readability;
- Slay the Spire: enemy intent;
- MARVEL SNAP: fast action bar.

Kingdom Duel should synthesize these into its own light-glass duel interface.

## What Needs More Research Before Code

### 1. Actual Screen Geometry

Collect 10-15 mobile screenshots and estimate:

- percentage of height given to board;
- height of top HUD;
- height of bottom action area;
- whether enemy/action information is persistent or contextual;
- how much text appears during active combat.

### 2. Enemy Intent Patterns

Research 5-8 examples of enemy intent / next action telegraphing:

- Slay the Spire;
- Monster Train-like combat;
- puzzle RPG enemy preview;
- card battler opponent action hints.

Goal: decide whether Kingdom Duel should use icon-only, text + icons, or text-first rail.

### 3. Bottom Action Bar Density

Compare:

- Magic: Puzzle Quest card/spell surfaces;
- Marvel Snap hand/action readability;
- Marvel Puzzle Quest ability buttons/power info.

Goal: define exact command card content and max text length.

### 4. Glossy Physical Material Without Decorative Waste

Find examples where glossy/fantasy UI is dense and game-like rather than web-like.

Goal: preserve Kingdom Duel's bright glass identity while changing shape grammar.

## Proposed Redesign Plan

### Phase 0: Freeze Current Screen As Baseline

Before any redesign:

- capture current live 390x700 and 390x844 screenshots;
- mark current top HUD, turn oval, enemy omen panel, board, command deck, log;
- record vertical height budget for each.

Acceptance:

- one baseline screenshot sheet exists before code changes.

### Phase 1: Wireframe The New Combat Stack

No CSS polish yet. Define layout blocks:

1. compact app header;
2. compact Aurora/Shade duel HUD;
3. turn chip + Shade intent rail;
4. board;
5. command cards;
6. collapsed last-event/log.

Acceptance:

- on paper or rough CSS, the core loop fits 390x700 without vertical scroll;
- no large central oval;
- no large omen panel.

### Phase 2: Implement Structural Compression

Change only structure and persistent copy:

- replace central oval with compact turn chip;
- replace `Veil Omen` panel with intent rail;
- compress side HUDs;
- remove persistent long flavor titles;
- collapse log.

Do not redesign gems. Do not change mechanics.

Acceptance:

- board size is preserved or improved;
- `npm test`, `npm run build`, `git diff --check` pass;
- screenshots at 390x700 and 390x844 show the full core loop.

### Phase 3: Reapply Glass Material To The New Structure

Once the shape grammar is correct:

- apply compact glass rectangles;
- retain Aurora/Shade asymmetry;
- use glow only for selected/risk/ready states;
- reduce nested borders.

Acceptance:

- screen still feels magical and glossy;
- no decorative empty capsules return;
- each persistent panel carries decision value.

### Phase 4: State QA

Verify:

- idle;
- selected tile;
- valid swap;
- risky Shade tile;
- spell aim;
- spell armed;
- snap-back/no match;
- victory/defeat.

Acceptance:

- each state is readable on 390x700 and 390x844;
- selected/valid/risk priority order is clear.

## Implementation Brief For Later Coding Agent

Do not start with CSS prettification.

Goal:

Rebuild the active mobile combat screen around a compact puzzle-duel HUD while preserving Kingdom Duel's bright glass fantasy identity and current gameplay behavior.

Constraints:

- no gameplay logic changes;
- no input behavior changes;
- no board shrinkage to make room for decorative HUD;
- no large ovals/capsules as persistent combat elements;
- no long persistent tutorial copy;
- preserve current gem readability and board states.

Tasks:

1. Replace central turn oval with compact turn chip.
2. Replace `Veil Omen` / enemy prepares panel with one-row Shade intent rail.
3. Compress Aurora/Shade panels into active side HUDs.
4. Convert command deck into compact action cards with cost/name/effect/state.
5. Collapse combat log to one-line latest event or drawer.
6. Rebalance vertical spacing so the full core loop fits 390x700.
7. Preserve glossy/material feel using compact rectangles, rails, chips, and state accents.
8. Capture before/after screenshots at 390x700 and 390x844.
9. Run `npm test`, `npm run build`, and `git diff --check`.

Hard acceptance checks:

- 390x700 requires no vertical scroll for core loop;
- no large central oval remains;
- no large enemy omen panel remains;
- board remains dominant;
- enemy intent is visible before commit;
- bottom commands are visible and readable;
- UI reads as mobile game combat, not a decorated webpage.

## Short Verdict

The external design brief is right and useful. It should become the controlling direction for the next UI pass.

The only correction is tone: do not throw away the bright glass magic. Throw away the decorative waste. Kingdom Duel should become a dense magical puzzle-duel cockpit, not a flat utility UI and not the current glossy web-card stack.
