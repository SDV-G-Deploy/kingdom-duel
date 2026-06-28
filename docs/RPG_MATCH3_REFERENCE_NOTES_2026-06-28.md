# RPG Match-3 Reference Notes

Date: 2026-06-28

Scope: pass 5 of the night run. Extract only mechanics that fit Kingdom Duel's compact mobile duel, not a full clone of Puzzle Quest or Gems of War.

## Sources Checked

- Puzzle Quest: Challenge of the Warlords gameplay overview: turn-based adjacent swaps, mana gems, skull damage, armour, spells, cascades, extra turn on 4+ matches, board reset when no moves exist. Source: https://en.wikipedia.org/wiki/Puzzle_Quest%3A_Challenge_of_the_Warlords
- Puzzle Quest player writeup: match 4 gives an extra turn; match 5 gives extra turn plus wildcard; colored gems charge abilities; skulls damage. Source: https://greghowley.com/520
- Puzzle Quest mechanics/equipment notes: items and effects often reward matching 4 or 5 gems with added mana/resistance/other bonuses. Source: https://www.yumpu.com/en/document/view/10875026/puzzle-quest-walk-through-d3publisher
- Gems of War glossary: Mana Surge grants more mana than the gems matched; Mana Storm biases future drops toward a color. Source: https://infinityplus2.freshdesk.com/support/solutions/articles/150000208267-gems-of-war-glossary-of-terms

## Mechanics Worth Borrowing

1. **Extra-turn explanation, not just extra-turn rule**
   Kingdom Duel already grants extra turns on long matches. Keep the rule, but make the preview and log more explicit when the player or Shade is about to keep the turn. This is high value because the game is already tactically centered on previewing moves.

2. **Small over-match reward**
   Puzzle Quest and Gems of War both make 4+ matches feel special beyond clearing more tiles. Kingdom Duel can add a modest "focus" or +1 resource reward on 4+ matches. This should stay small so the board does not become a combo casino.

3. **Board-affecting spells**
   Puzzle Quest-style spells that alter rows, colors, or clusters already map well to Sun Bloom, Glass Ward, and Crown Strike. The fit is strong; the next improvements should improve targeting readability before adding more spells.

4. **Mana Surge as a readable bonus, not a random hidden proc**
   Gems of War uses Mana Surge as chance-based extra mana. Kingdom Duel should avoid hidden randomness on a small mobile board. A deterministic version is better: "match 4+ mana gems grants +1 extra of that mana."

5. **Mana Storm as a future advanced state**
   Biased drops are interesting but too opaque for the current prototype. Defer until the player has clearer spell/status language.

## Mechanics To Avoid For Now

- Wildcards. They add board complexity and require new assets/rules before the current six-gem language is fully readable.
- Cooldowns. Mana costs already provide gating; cooldowns add another timer to a cramped mobile cockpit.
- Large item/passive systems. Good for RPG depth later, but too much overhead before the duel loop is fully legible.
- Random surge chance. Hidden chances will make tactical preview less trustworthy.

## Recommended Next Gameplay Step

Add a deterministic **over-match bonus**:

- If a match is length 4 or longer, grant +1 extra resource for the matched tile effect.
- For sword/shade damage this can be +1 damage; for shield +1 guard; for sun/moon/crown +1 mana.
- Keep the existing extra turn on 4+.
- Preview text should show the boosted value naturally, so the player learns "bigger line equals stronger effect."

Why this fits: it is small, tactical, previewable, and uses mechanics already present in the engine. It also gives pass 6 a concrete implementation target.
