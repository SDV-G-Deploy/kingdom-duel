# Kingdom Duel Gameplay Design Pass

Date: 2026-06-27

## Current Verdict

Kingdom Duel has a good foundation for a standalone match-3 RPG duel, but it is still a playable engine loop, not yet a decision-rich duel.

The core is promising because:

- the player and enemy share one board;
- swaps resolve through deterministic match/cascade rules;
- tile effects already affect HP, guard, and mana;
- the enemy plays the same board rather than using an off-board attack timer;
- tuning has started moving into `DuelRules` instead of being buried in UI code.

The next milestone should not chase more spectacle first. It should make each move feel legible, risky, and intentional.

## Design Target

The first real milestone is a 3-5 minute duel where the player repeatedly asks:

- Do I take damage now?
- Do I deny the enemy a better move?
- Do I charge a spell?
- Do I risk shade for tempo?
- Do I set up an extra turn?

If most turns reduce to "click any legal match", the game is only a themed match-3 board. The duel starts when the player can read threats and make tradeoffs.

## Reference Lessons

Puzzle Quest's durable idea is not just "match-3 with HP". It is the shared-board pressure created by mana, skull damage, extra turns, and spells that reshape the board.

Relevant patterns:

- Match 4 grants another turn; match 5 is usually even more valuable, often through a wildcard or doubled reward.
- Mana is useful because it creates delayed intent: a weak move now may unlock a strong spell later.
- Direct damage tiles are best when they are scarce or contested, otherwise every move becomes an attack race.
- Spells should change the board state, not just act as side buttons that ignore the puzzle.
- Enemy turns work best when the player can anticipate danger before surrendering the board.

Sources checked:

- Puzzle Quest overview and match-4/match-5 description: https://greghowley.com/520
- Puzzle Quest DS mechanic summary: https://www.christcenteredgamer.com/reviews/handhelds/ds/puzzle-quest-challenge-of-the-warlords-ds
- Puzzle Quest 3 mana/spell evolution note: https://puzzlequest3.com/evolving-the-match-3-rpg/
- Puzzle Quest 2 spell examples and board conversion patterns: https://worthplaying.com/article/2010/5/28/news/74564-puzzle-quest-2-all-details-spells-new-screens-trailer/

## Current Findings

### 1. The First Move Needs Preview

Current UI shows how many legal moves exist, but not why any move is good.

Needed:

- hover/selection preview for the candidate swap;
- predicted match tile and count;
- expected damage/guard/mana/backlash;
- clear extra-turn label when relevant.

Good preview copy examples:

- `+3 sword damage`
- `+4 sun, extra turn`
- `+6 shade damage, -3 backlash`
- `bad swap: no match`

This is not just UX polish. It is the core teaching surface.

### 2. Enemy Intent Must Be Visible Before Enemy Acts

Current engine creates an `enemy_intent` event at enemy action time. That is too late for tension.

Needed:

- score the enemy's best visible move during the player's turn;
- show it near the enemy panel;
- highlight or outline the threatened tiles on the board;
- update it after every player move/cascade.

Target feeling:

> "If I ignore that shade chain, Shade Knight will take it."

This turns the shared board into a duel rather than alternating solitaire.

### 3. Spells Should Become Real Before Balance Work

The disabled spell row is a correct placeholder, but game design cannot be judged until spells exist.

First playable spells should be content-defined and board-first:

- `Sun Bloom`: choose a tile; adjacent tiles become sun.
- `Glass Ward`: gain guard and convert selected shade tiles into shield.
- `Crown Strike`: clear a row and collect its tile effects.

Rules:

- spells cost mana from actor state;
- spells should emit normal engine events;
- spells should be deterministic and testable;
- spell targeting rules should live in content/rules config, not component click handlers.

### 4. Shade Is the Best Hook, But It Needs a Stronger Read

Current shade design is good: it gives strong damage and punishes the player with backlash while the enemy values it highly.

Risk:

- the player may not understand why a pretty purple tile hurts them;
- the enemy preference is invisible unless surfaced as intent;
- shade may dominate if it appears too often or scores too high.

Needed:

- distinct "danger candy" silhouette and color treatment;
- preview must show backlash;
- enemy intent should often point at shade;
- later: enemies can have tile affinities so Shade Knight is not the global AI model.

### 5. Extra Turns Are Fun But Need Monitoring

Rough deterministic simulation:

- 80 seeded battles;
- greedy player move selection versus current enemy scoring;
- 38 player wins, 42 enemy wins;
- average battle length: about 26 actions;
- p90 battle length: about 41 actions;
- 553 extra-turn events across 80 battles.

This is not a final balance result, but it shows extra turns are very common. That may feel juicy, or it may collapse turn exchange into chain snowballing.

Do not tune it yet. Re-check after move preview and spells are playable.

## Next Milestone Scope

Recommended milestone name: `Decision Preview + First Spells`.

Ship:

- move preview system;
- visible enemy intent;
- spell content model;
- 3 playable spells;
- shade/backlash preview;
- tests for spell costs, targeting, deterministic board mutations, and enemy intent scoring;
- updated screenshots after the UX pass.

Do not ship yet:

- relic progression;
- campaign map;
- inventory;
- multiple enemies;
- procedural encounter tuning;
- animation-heavy VFX beyond simple readable feedback.

## Suggested Data Shape

Keep development expandable by separating three layers:

### Rules

Global combat and board rules:

- board size;
- tile set;
- match bonuses;
- max cascades;
- refill policy;
- turn rules.

### Content

Reusable game objects:

- actor templates;
- enemy profiles;
- spells;
- relics;
- tile affinities.

### Runtime State

Only current battle data:

- board;
- actor HP/guard/mana;
- current actor;
- selected target;
- turn count;
- log/events;
- winner.

Avoid putting content decisions in DOM rendering. UI should ask the engine what a move or spell will do.

## Open Design Questions

- Should match 5 create a wildcard tile immediately, or should that wait until the board has better visuals?
- Should damage tiles be less common than mana tiles, or should all six tile kinds remain equally weighted for now?
- Should enemy intent show one best move or a broader mood such as `wants shade`, `wants sword`, `protecting guard`?
- Should spells consume the turn by default, or can some spells be free actions later?
- Should shade backlash hit guard first or always pierce directly into HP?

## Recommendation

Build the next gameplay layer before adding more art.

The correct order is:

1. preview what the player's swap will do;
2. show what the enemy wants next;
3. add three board-changing spells;
4. then rebalance tile values, enemy scoring, and extra-turn frequency.

That gives Kingdom Duel a real design spine: every turn has a visible tactical reason.
