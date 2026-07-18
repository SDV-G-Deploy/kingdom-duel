# Kingdom Duel — Playtest Review 2026-07-18

Status: Step 0 evidence recorded; trace metadata follow-up completed in this branch
Source: one player debug trace copied from a real playtest export
Outcome: Aurora defeat on turn 7 against Glass Edge / Shade Knight
Verification follow-up: Chromium mobile E2E passed after installing the Playwright browser binary

## Executive Finding

The trace is internally deterministic and explains the defeat, but the old debug export did not include enough identity metadata to prove its replay contract from the file alone.

Important correction: the `32 HP / 1 Guard` Shade in the trace is consistent with the current run encounter contract for Glass Edge. The base Shade Knight definition is `38 HP / 2 Guard`, and Glass Edge applies `-6 HP / -1 Guard`. Replaying a run trace as a standalone default duel can therefore create a false `32/1` versus `38/2` mismatch.

The fix is not a balance change. The export needs to say which build, run mode, encounter index, rules version, content version, and daily version produced the trace.

## Trace Summary

| Field | Observed value |
| --- | --- |
| Initial seed | `1559489438` |
| Final RNG seed | `1575049450` |
| Final turn | `7` |
| Winner | `enemy` |
| Player | Aurora Knight, `0/42 HP`, `0 Guard`, `3 Sun / 3 Moon / 0 Crown` |
| Enemy | Shade Knight, `14/32 HP`, `5 Guard`, `3 Sun / 2 Moon / 11 Crown` |
| Player spell casts | `0` |
| Enemy spell casts | `2 x Veil Rift` |

The defeat is not random noise in the action log. The turning point is Shade's turn-3 chain:

- a five-Crown match created Aether and retained the turn;
- Shade cast `veil_rift`;
- the converted Shade cluster matched seven tiles for 10 HP damage after Guard;
- that match created another Aether and retained the turn;
- Shade activated Aether for another 5 HP damage.

The terminal turn repeated the pattern at higher pressure:

- Shade cast a second `veil_rift`;
- a nine-Shade match dealt 15 HP damage after Guard and created Aether;
- cascades then added Shield, Crown, and a five-Sword match;
- the Sword damage removed Aurora's last 3 HP.

## Product Interpretation

The strongest evidence is first-duel spell literacy, not a confirmed engine bug.

Aurora made legal board moves and collected enough mana to have meaningful options, but never cast `Glass Ward`, `Sun Bloom`, or `Crown Strike`. The visible-policy simulator already warned that immediate board play loses heavily while spell-aware play survives far more often. This trace is a real example of that failure mode.

Do not tune combat numbers from this single trace. First confirm whether players can see spells as survival tools before Veil Rift snowballs.

## Contract Risk

The old export included seed, actors, actions, frames, and history, but omitted:

- trace schema;
- build commit or build id;
- dirty build flag;
- run mode and encounter index;
- run schema version;
- rules version;
- content version;
- daily version.

Without those fields, a valid Glass Edge run trace can be replayed or inspected against the wrong default duel contract. That makes future playtest analysis slower and easier to mislabel.

## Required Follow-Up

1. Record frozen build URL and commit before each real-phone cohort.
2. Keep the current Glass Edge balance unchanged until at least the Step 6.1 protocol distinguishes difficulty from clarity, input, and spell-literacy failure.
3. In the next UX pass, inspect whether affordable or near-affordable spells are visually framed as survival tools rather than optional bonus buttons.
4. Keep Frutiger/asset work separate from this stabilization branch until the current `origin/main` contract is documented and verified.
