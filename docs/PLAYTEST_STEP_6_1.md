# Kingdom Duel — Step 6.1 Mobile Playtest Protocol

Status: ready to run; no five-person protocol sessions have been recorded
Decision under test: whether the short run is understandable, appropriately paced, and intrinsically replayable before Step 7 or metaprogression expands scope

## Research Questions

1. Can a first-session player make a meaningful legal move without coaching?
2. Do mana, enemy charge, Shade backlash, Aether, and prism choices change decisions in ways the player can explain?
3. Is Glass Edge a fair introduction, or does it eliminate players before they learn the run?
4. Does a successful phone run land near 10–15 minutes without rushed reading?
5. Does the player voluntarily start again, and does the second build feel meaningfully different?

The visible-information simulator is a diagnostic lower model, not a human proxy. Its 24.4% first-duel win rate and 0–1% run completion make first-encounter accessibility the primary risk to observe. Numeric tuning must wait until the human evidence identifies whether the cause is difficulty, comprehension, interaction, or simulator weakness.

## Participants And Devices

Recruit five people who have not played this build and did not contribute to it. Prefer a mixed sample:

- at least two players familiar with casual match-3 games;
- at least two players unfamiliar with match-3 RPGs;
- at least two iOS Safari sessions and two Android Chrome sessions;
- at least one compact-height phone close to 390×700 CSS pixels.

Use participant IDs `P01`–`P05`; do not put names or contact details in the repository. Obtain explicit consent before screen/audio recording.

## Build Freeze And Preflight

Before the first session, record one immutable build identity for the entire cohort:

| Field | Frozen value |
| --- | --- |
| Git commit | _fill before session 1_ |
| Build URL | _fill before session 1_ |
| Save schema | `2` |
| Rules version | `rules-2026.07-step6` |
| Content version | `content-2026.07-step6` |
| Daily version | `daily-v1` |
| Trace schema | `1` |
| Debug export metadata | build, dirty flag, contract, run context required |

For each phone:

1. Open the frozen build in a normal browser tab.
2. Clear the Kingdom Duel site data so the participant starts at Glass Edge.
3. Confirm the board has 64 cells, the three spell controls exist, and the page has no horizontal overflow.
4. Confirm tap-tap input; test swipe only before the participant arrives, then reset again.
5. Record device, OS, browser/version, CSS viewport, orientation, and network type.
6. Do not mix daily and standard seeds within the five-person first-session cohort. Use one fixed test seed if the build exposes it; otherwise record every generated seed.
7. Before accepting a copied trace as evidence, confirm it includes `traceSchemaVersion`, `build`, `contract`, and `run`. For the frozen cohort build, `build.dirty` must be `false` or the dirty diff must be archived with the trace.

## Moderator Script

Read only this introduction:

> “This is an unfinished tactical match-3 game. Please play as you naturally would and say what you expect before important moves. I am testing the game, not you. For the first two minutes I will not explain its rules, but you can still ask questions.”

Do not mention the legal-move highlights, enemy intent, backlash, Aether trigger, prism persistence, or desired run length before the player encounters them.

## Session Procedure

### 1. Silent first contact — 2 minutes

- Start the timer when the battle screen becomes interactive.
- Do not coach.
- Mark time to first attempted action and first accepted action.
- Count invalid swaps and note what the player looked at before moving.
- Record the first element the player describes as the goal.

If the player is completely blocked for 60 seconds, ask only: “What do you think the game is asking you to do?” Do not give the answer.

### 2. Natural run — up to 20 minutes

- Let the player continue until the run ends or 20 minutes elapse.
- After the first accepted move, answer direct control questions but do not recommend a move or build.
- Record duel start/end times, result, accepted action count, first spell cast, first enemy ability, first Aether creation/activation, and every prism choice.
- At each prism screen ask: “What do you expect each option to change?” Record the answer before selection.
- If the first run fails, leave the result screen untouched for 15 seconds and observe whether the player restarts without prompting.
- If the first run completes, use the same 15-second observation window.

### 3. One replay opportunity — up to 10 minutes

If the player restarts voluntarily, let the second attempt proceed naturally. If they do not, ask once: “Would you want to start another run now?” Record the answer, but do not count a prompted restart as voluntary.

After the second prism choice or ten minutes, ask:

- “What did your build change about the moves you wanted?”
- “What did this enemy make you value differently?”
- “What felt fair or unfair?”
- “What would make you return tomorrow?”

### 4. Comprehension check — 5 minutes

Without showing tooltips, ask the player to explain:

- how to damage and defend;
- what the three mana colours do;
- why Moon can be valuable to deny;
- what Shade backlash does and whether Guard blocks it;
- how Aether is created and activated;
- whether a selected prism lasts for one duel or the full run;
- how the boss differs from a larger HP bar.

Score each answer `0 = not understood`, `1 = partial`, or `2 = correct enough to guide a decision`.

## Observation Record

Use one row per participant. Keep raw notes separately and distinguish observed behaviour from moderator interpretation.

| ID | Device/browser | Seed | First accepted move | Invalid attempts | Glass Edge result/time | Furthest encounter | Total time | Prism comprehension (0–2) | Backlash (0–2) | Aether (0–2) | Voluntary restart | Critical observation |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| P01 |  |  |  |  |  |  |  |  |  |  |  |  |
| P02 |  |  |  |  |  |  |  |  |  |  |  |  |
| P03 |  |  |  |  |  |  |  |  |  |  |  |  |
| P04 |  |  |  |  |  |  |  |  |  |  |  |  |
| P05 |  |  |  |  |  |  |  |  |  |  |  |  |

For each observed problem, append:

| Observation | Frequency | Severity | Evidence | Hypothesis | Smallest testable change |
| --- | ---: | --- | --- | --- | --- |
|  |  |  |  |  |  |

Severity is `P0` data loss/soft lock, `P1` cannot progress or understand the core decision, `P2` material pacing/clarity friction, or `P3` polish.

## Decision Gates

With only five participants, treat counts as directional evidence rather than statistical proof.

- **Interaction:** at least 4/5 make an accepted move within 60 seconds; no P0/P1 touch, layout, save, or resume defect occurs.
- **First encounter:** at least 2/5 and no more than 4/5 beat Glass Edge without coaching. A 0–1/5 result is a clear accessibility warning; 5/5 is a signal to examine whether the introduction has meaningful pressure.
- **Core comprehension:** at least 4/5 can explain damage/Guard and one spell; at least 3/5 score `2` for backlash and enemy charge after seeing them.
- **Build expression:** at least 4/5 understand that a prism changes the remaining run, and at least 3/5 describe a selected prism as changing board value rather than only “making me stronger.”
- **Pacing:** if at least two players complete, median successful run time should be 10–15 minutes. Otherwise the timing gate remains inconclusive, not failed.
- **Replay intent:** at least 3/5 voluntarily restart or explicitly request an immediate second run. Only an unprompted button press counts as a voluntary restart.
- **Meaningful replay:** among players who see two builds, at least 3 describe a different move priority, enemy response, or risk trade-off. Cosmetic preference alone does not pass this gate.

## Decision Matrix

| Human result | Visible-policy result | Decision |
| --- | --- | --- |
| First encounter fails | Fails | Fix first-duel clarity or pressure, then rerun the same cohort protocol before Step 7 scope grows |
| Passes | Fails | Do not nerf combat from simulator data alone; improve the policy model and preserve the human-observed play pattern |
| Fails | Passes | Treat onboarding, legibility, input, and decision overload as primary suspects before changing numbers |
| Passes | Passes | Freeze the Step 6 balance cohort and begin Step 7 game-feel work |

If players understand the system but Glass Edge is consistently too punishing, tune the smallest encounter-specific value first (opening enemy HP/Guard, intent pacing, or tutorial seed) instead of globally buffing Aurora. If players cannot explain why they lost, improve consequence previews and feedback before balance.

## Exit Report

The completed report must include:

1. frozen commit and version contract;
2. participant/device coverage;
3. the filled observation table;
4. P0–P2 issues with reproduction steps;
5. gate-by-gate pass/fail/inconclusive status;
6. simulator-versus-human comparison;
7. one bounded next change, or an explicit decision to begin Step 7;
8. trace export identity for any copied battle logs;
9. a note that no result was inferred for absent participants or incomplete sessions.
