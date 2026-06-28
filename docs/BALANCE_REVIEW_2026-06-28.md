# Kingdom Duel Balance Review

Date: 2026-06-28
Range: `300b5b4`
Command: `npm run sim:balance -- --seeds=500`

## Purpose

This pass adds a first repeatable balance instrument before tuning rules by feel. The simulator is engine-only and compares two simple player policies against the current Shade Knight move picker:

- `greedy`: player chooses the best visible board swap by immediate engine result.
- `spell-aware`: player can choose swaps or affordable spells by immediate engine result.

These are not final AI policies. They are probes for volatility, spell value, and current rule pressure.

## Results

| Strategy | Aurora wins | Shade wins | Aurora win rate | Avg turns | Avg actions | Avg max actor chain | Avg extra turns Aurora / Shade | Avg spells | Avg backlash | Avg unspent mana on Aurora death |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| greedy | 384 | 116 | 76.8% | 7.41 | 19.90 | 3.23 | 2.69 / 3.16 | 0.00 | 12.70 | 43.84 |
| spell-aware | 492 | 8 | 98.4% | 3.79 | 11.00 | 3.44 | 2.78 / 1.62 | 2.41 | 14.08 | 15.38 |

## Read

1. **Spells are probably overtuned when used rationally.**
   The player jumps from 76.8% to 98.4% win rate when spells are considered as immediate-value actions. This matches play logs where Sun Bloom and Crown Strike can convert stored mana into big cascades, damage, and extra turns.

2. **The human problem is comprehension, not raw spell weakness.**
   Serg's logs showed confusion about what buttons do. The sim shows that using spells well is very strong, but the UI still does not predict target-specific outcomes before spending mana.

3. **Extra-turn chains remain a volatility signal.**
   Average max actor chain is above 3 for both strategies. That is not automatically bad in a Puzzle Quest-like duel, but it confirms why some fights feel like one side watches the other play for too long.

4. **Greedy losses die with huge mana float.**
   When greedy Aurora loses, she averages 43.84 unspent mana. That supports the earlier log diagnosis: if the player does not understand or trust spell conversion, mana becomes a false comfort.

5. **Backlash deaths are not common under these policies.**
   The simulator found 0% backlash deaths in this sample because both policies avoid obviously losing self-KO actions. Human play still needs fatal backlash warning because that failure mode is memorable and easy to hit.

## Tuning Guidance

- Do not buff spells yet.
- Do not add new spells yet.
- Do not raise Aurora HP as a first response.
- Do not remove extra turns; measure and soften chains only if repeated human logs keep showing agency loss.

## Next Recommended Changes

1. **Spell target preview**
   Show expected value before spending mana:
   - Crown Strike: row damage, guard, mana, backlash, fatal risk.
   - Glass Ward: guard gain and count of shade converted.
   - Sun Bloom: affected area and likely immediate sun match/extra-turn setup.

2. **Simulation v2**
   Add richer metrics:
   - spell cast breakdown by spell;
   - damage split by sword, shade, spell collection, and backlash;
   - extra-turn chain histogram;
   - loss seeds and top failure signatures.

3. **Balance tuning after preview**
   Once spell choices are readable to a human, retest. If spell-aware win rate remains near 98%, tune spell costs/effects before touching HP totals.

## Open Questions

- Should spell preview simulate full cascades or only pre-cascade deterministic target effects?
- Should Sun Bloom be a mana engine or a risky combo engine?
- Should Crown Strike be allowed to collect shade backlash without an explicit fatal confirmation?
- What target Aurora win rate feels right for this duel slice: 55-65%, 65-75%, or intentionally heroic 75%+?
