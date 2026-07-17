# Kingdom Duel — Game Specification

Status: canonical product and gameplay specification
Current implementation: Step 6.1 validation-hardened short replayable run
Platform direction: mobile web first, PWA second, native wrappers only after the short-run loop is validated

## Product Pitch

Kingdom Duel is a premium-feeling tactical match-3 battler set in a bright glass-future world. Two combatants contest one shared board. Every swap should ask the player to choose between immediate damage, defence, mana, denial, tempo, and risk.

The visual direction is **AeroCandy 2007**:

- Frutiger Aero optimism;
- glossy glass and pearl-plastic materials;
- readable candy-gem silhouettes;
- aqua, white, lime, gold, magenta, and royal violet;
- no dark medieval-fantasy default, cyberpunk grime, or generic candy-game presentation.

The core commercial promise is:

> A readable tactical RPG battler in a bright glass world, not a themed match-3 board with RPG numbers attached.

## Current Playable Slice

The current build contains a deterministic four-encounter run:

- Aurora Knight versus Shade Knight;
- one shared 8×8 board;
- six base tile kinds and one created Aether special;
- HP, Guard, and three mana resources;
- legal-swap preview;
- enemy move, mana-charge, and ability intent preview;
- cascades and extra turns;
- three player abilities;
- three enemy profiles with telegraphed abilities and one visible player passive;
- six mechanical run upgrades offered as two choose-one-of-three decisions;
- normal → normal → elite → boss pacing;
- standard and fixed UTC daily seeds pinned to rules/content versions;
- schema/rules/content-validated local save/resume and a run result summary;
- touch, swipe, tap-tap, and mouse input;
- battle log and terminal recap;
- victory by reducing the opponent to 0 HP.

This is a product-shaped replayability prototype. It is not yet a campaign, metaprogression system, content-complete RPG, or store-ready application.

## Current Turn Loop

1. The player reads the board, the current enemy's preferred move, and its visible ability charge.
2. The player previews and commits a legal swap or casts an affordable ability.
3. Matches resolve, tile effects apply, gems drop, and cascades continue.
4. A match of four keeps the active turn; a match group of five or more also forges Aether.
5. Swapping Aether with any adjacent gem detonates its 3×3 area for fixed damage.
6. Otherwise control passes to the opponent. Each enemy casts its equipped ability as soon as its cost is ready.
7. The duel ends when either combatant reaches 0 HP.

Intersecting runs of the same tile form one match group. Their shared cell is counted once, so a three-by-three cross resolves as five unique matched tiles.

## Current Combat Rules

### Combatants

| Combatant | HP | Starting Guard | Current role |
| --- | ---: | ---: | --- |
| Aurora Knight | 42 | 4 | Board-shaping light/glass duelist with Prism Guard |
| Shade Knight | 38 | 2 | Deterministic Moon-seeking opponent with a telegraphed ability |
| Moon Warden | 38 | 5 | Moon/Shield tempo opponent that builds Guard and seals a cross |
| Eclipse Regent | 48 | 6 | Boss profile that combines Moon and Crown into a 3×3 Shade surge |

### Tiles

| Tile | Current effect per tile | Design role |
| --- | --- | --- |
| Sword | 1 damage | Direct pressure |
| Shield | 1 Guard | Defence and tempo |
| Sun | 1 Sun mana | Sun ability charge |
| Moon | 1 Moon mana | Moon ability charge |
| Crown | 1 Crown mana | Crown ability charge |
| Shade | 2 damage; Aurora pays 1 HP backlash per tile | High-value contested risk |
| Aether | 5 fixed damage and clears a radius-1 square when swapped | Created match-5 payoff and delayed board control |

Guard absorbs normal damage before HP. Backlash bypasses Guard.
Only the six base tiles appear in random generation and refills; Aether must be created by play.

### Abilities

| Ability | Cost | Current behaviour |
| --- | --- | --- |
| Sun Bloom | 8 Sun | Converts a five-cell cross around the target to Sun, then resolves the board |
| Glass Ward | 5 Moon | Grants 4 Guard and converts nearby Shade tiles to Shield |
| Crown Strike | 6 Crown | Clears one row, collects its tile effects, then resolves the board |
| Veil Rift (Shade) | 5 Moon | Converts a five-cell cross to Shade, grants Shade 2 Guard, then resolves the board |
| Lunar Lock (Warden) | 5 Moon | Gains 3 Guard and converts a five-cell cross to Shield |
| Eclipse Surge (Regent) | 4 Moon + 3 Crown | Converts a 3×3 field to Shade and gains 3 Guard |

Shade's Moon charge is always visible. This turns Moon-rich board positions into a denial problem instead of an inert enemy resource.

Aurora's visible **Prism Guard** passive grants 2 Guard whenever Aurora forges Aether. It gives match-5 play a defensive identity in addition to tempo and delayed damage.

Heroes, enemies, abilities, and passives are content definitions. The current abilities are composed from three engine effects—gain Guard, convert nearby tiles, and clear/collect a row—so an ordinary new ability does not require a new resolver branch. Passives are deliberately limited to the first scheduled trigger/effect pair rather than a speculative scripting language.

## Input Contract

Primary mobile input:

- swipe a gem toward an adjacent cell;
- tap one gem and then an adjacent target as fallback;
- tap an ability, preview a target, then tap the same target to confirm.

Desktop input:

- click/tap selection;
- pointer hover previews;
- drag swaps.

Board cells, spells, and actions are keyboard-activatable; rerenders restore focus and important battle changes use a live region. Full screen-reader and real-device accessibility certification remains future platform QA.

## Current First Product Loop

The implemented product-shaped milestone is a targeted 10–15 minute run:

1. normal duel;
2. choose one of three mechanical upgrades;
3. second duel with a different enemy profile;
4. another upgrade;
5. elite duel;
6. boss duel and run result.

Aurora restores to full HP between encounters; the run carries build choices, not health attrition. This keeps the first replayability test focused on board valuation instead of requiring healing/economy rewards. The loop is intentionally smaller than a full Puzzle Quest campaign. Exhaustive simulation suggests the intended action budget, while the visible-information diagnostic warns that Glass Edge may be too punishing or insufficiently taught. Real phone timing, comprehension, and voluntary replay must still be proven before inventory, economy, narrative maps, or monetisation are built. See [Replayability Benchmark](REPLAYABILITY_BENCHMARK.md) and [Step 6.1 Mobile Playtest Protocol](PLAYTEST_STEP_6_1.md).

### Mechanical Prisms

| Prism | Board-value change |
| --- | --- |
| Solar Halo | Sun Bloom expands from a cross to a 3×3 field |
| Aether Relay | Aether activation retains the turn |
| Royal Bastion | Crown Strike raises 5 Guard before clearing its row |
| Ward Battery | Glass Ward also converts nearby Moon to Shield |
| Veilbreaker Lens | Shade matches no longer damage Aurora through backlash |
| Wide Aether Core | Aether deals 8 damage and clears a radius-2 field |

## Design Pillars

1. **Shared-board pressure** — an attractive move for the player may expose a stronger move to the enemy.
2. **Visible consequence** — damage, Guard, mana, backlash, and extra-turn outcomes are understandable before commitment.
3. **Board-first abilities** — abilities reshape or consume the puzzle instead of bypassing it.
4. **Short expressive builds** — a few upgrades should materially change how the same hero uses the board.
5. **Bright tactical identity** — Frutiger Aero is part of the world and combat language, not only a UI skin.
6. **Deterministic foundations** — seeds and actions can support replay, testing, simulation, and daily challenges.

## Baseline Evidence

Canonical visual evidence for the current slice:

- `screenshots/research/hud-cleanup-390x700.png`;
- `screenshots/research/hud-cleanup-390x844.png`;
- `screenshots/desktop-final.png`;
- `screenshots/research/state-selected-390x700.png`;
- `screenshots/research/state-valid-swap-390x844.png`;
- `screenshots/research/state-spell-aim-390x700.png`;
- `screenshots/research/result-cta-victory-390x700.png`;
- `screenshots/research/result-cta-defeat-390x844.png`.

New visual work should compare against these images when it changes the combat screen.

## Explicit Non-Goals For The Foundation Phase

- no large campaign map;
- no inventory or crafting;
- no PvP or guild systems;
- no gacha or live economy;
- no native rewrite;
- no framework migration for its own sake;
- no broad asset generation without a defined gameplay slot;
- no additional cosmetic pass before engine correctness and combat variety improve.
