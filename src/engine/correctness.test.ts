import { strict as assert } from 'node:assert';
import { findLegalMoves, findMatches, setTile } from './board';
import { applySwap, castSpell, createDuel, previewSwap, runEnemyTurn } from './duel';
import { DEFAULT_DUEL_RULES } from './rules';
import type { AbilityId, Board, Cell, DuelRules, TileKind } from './types';

type CorrectnessCase = {
  name: string;
  run: () => void;
};

function patternedBoard(width = 8, height = 8): Board {
  const kinds: TileKind[] = ['sun', 'shield', 'sword', 'moon', 'crown', 'shade'];
  return {
    width,
    height,
    tiles: Array.from({ length: width * height }, (_, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      return kinds[(x + y * 2) % kinds.length];
    }),
  };
}

function customRules(): DuelRules {
  return {
    ...DEFAULT_DUEL_RULES,
    actors: {
      player: {
        ...DEFAULT_DUEL_RULES.actors.player,
        id: 'test_hero',
        name: 'Test Hero',
        hp: 20,
        guard: 0,
      },
      enemy: {
        ...DEFAULT_DUEL_RULES.actors.enemy,
        id: 'test_rival',
        name: 'Test Rival',
        hp: 100,
        guard: 0,
      },
    },
    tiles: {
      ...DEFAULT_DUEL_RULES.tiles,
      sword: {
        ...DEFAULT_DUEL_RULES.tiles.sword,
        effect: { type: 'damage', amountPerTile: 7 },
      },
      shield: {
        ...DEFAULT_DUEL_RULES.tiles.shield,
        effect: { type: 'guard', amountPerTile: 0 },
      },
      shade: {
        ...DEFAULT_DUEL_RULES.tiles.shade,
        effect: { type: 'risky_damage', amountPerTile: 0, playerBacklashPerTile: 0 },
      },
    },
    match: { ...DEFAULT_DUEL_RULES.match, maxCascades: 0 },
    abilities: {
      ...DEFAULT_DUEL_RULES.abilities,
      crown_strike: {
        ...DEFAULT_DUEL_RULES.abilities.crown_strike,
        name: 'Test Crown',
        cost: { crown: 1 },
      },
    },
    openingLog: [],
  };
}

function testCrownStrikeUsesActiveRulesAndNames(): void {
  const rules = customRules();
  const base = createDuel(2007, rules);
  const board = patternedBoard();
  for (let x = 0; x < board.width; x++) setTile(board, { x, y: 0 }, 'shield');
  setTile(board, { x: 0, y: 0 }, 'sword');
  const state = { ...base, board, player: { ...base.player, crown: 1 }, seed: 99 };

  const result = castSpell(state, 'crown_strike', { x: 0, y: 0 }, rules);

  assert.equal(result.state.enemy.hp, 93, 'Crown Strike must use the active sword damage rule');
  assert.match(result.state.history[0]?.summary ?? '', /Test Hero casts Test Crown/);
  assert.ok(result.state.history[0]?.events.some((line) => line.includes('cast Test Crown')));
  assert.ok(result.state.history[0]?.events.some((line) => line.includes('Test Hero dealt')));

  const enemyState = { ...createDuel(44, rules), current: 'enemy' as const };
  const enemyResult = runEnemyTurn(enemyState, rules);
  const intent = enemyResult.events.find((event) => event.type === 'enemy_intent');
  assert.ok(intent?.type === 'enemy_intent');
  assert.match(intent.text, /Test Rival takes/);
}

function testCrossMatchCountsUniqueCellsOnce(): void {
  const board = patternedBoard(5, 5);
  for (const cell of [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 3 },
  ]) {
    setTile(board, cell, 'sun');
  }

  const sunMatches = findMatches(board).filter((match) => match.tile === 'sun');
  const keys = sunMatches.flatMap((match) => match.cells.map((cell) => `${cell.x},${cell.y}`));

  assert.equal(sunMatches.length, 1, 'intersecting runs must form one match group');
  assert.equal(keys.length, 5, 'the intersection must contribute exactly once');
  assert.equal(new Set(keys).size, 5);
}

function testDamageEventReportsBlockedAndHpDamage(): void {
  const rules = customRules();
  const base = createDuel(2007, rules);
  const board = patternedBoard();
  for (let x = 0; x < board.width; x++) setTile(board, { x, y: 0 }, 'shield');
  setTile(board, { x: 0, y: 0 }, 'sword');
  const state = {
    ...base,
    board,
    player: { ...base.player, crown: 1 },
    enemy: { ...base.enemy, hp: 1, guard: 3 },
    seed: 99,
  };

  const result = castSpell(state, 'crown_strike', { x: 0, y: 0 }, rules);
  const damage = result.events.find((event) => event.type === 'damage');

  assert.ok(damage && damage.type === 'damage');
  assert.equal(damage.amount, 7);
  assert.equal(damage.blocked, 3);
  assert.equal(damage.hpDamage, 1);
}

function testEnemyNoMoveActuallyRefillsBoard(): void {
  const rules: DuelRules = { ...DEFAULT_DUEL_RULES, board: { width: 3, height: 3 }, openingLog: [] };
  const base = createDuel(91, rules);
  const board: Board = {
    width: 3,
    height: 3,
    tiles: ['sun', 'moon', 'crown', 'moon', 'crown', 'sun', 'crown', 'sun', 'moon'],
  };
  assert.equal(findLegalMoves(board).length, 0);
  const state = { ...base, board, current: 'enemy' as const, seed: 12345 };

  const result = runEnemyTurn(state, rules);

  assert.ok(result.events.some((event) => event.type === 'board_refilled'));
  assert.notDeepEqual(result.state.board.tiles, board.tiles);
  assert.ok(findLegalMoves(result.state.board).length > 0);
  assert.notEqual(result.state.seed, state.seed);
  assert.equal(result.state.current, 'player');
  assert.equal(result.state.turn, state.turn + 1);
}

function testInvalidCoordinatesCannotResolveActions(): void {
  const base = createDuel(2007);
  const board = { ...base.board, tiles: [...base.board.tiles] };
  setTile(board, { x: 1, y: 0 }, 'sun');
  setTile(board, { x: 2, y: 0 }, 'sun');
  setTile(board, { x: 3, y: 0 }, 'sun');
  const state = { ...base, board, player: { ...base.player, sun: 8 } };
  const outside = { x: -1, y: 0 };
  const inside = { x: 0, y: 0 };

  const swap = applySwap(state, outside, inside);
  assert.equal(swap.events[0]?.type, 'invalid_swap');
  assert.match(swap.state.history[0]?.summary ?? '', /outside board/);

  const preview = previewSwap(board, outside, inside);
  assert.equal(preview.valid, false);
  if (!preview.valid) assert.match(preview.reason, /outside board/);

  const fractionalTarget = { x: 0.5, y: 0 } as Cell;
  const spell = castSpell(state, 'sun_bloom' as AbilityId, fractionalTarget);
  assert.equal(spell.events[0]?.type, 'invalid_spell');
  assert.equal(spell.state.player.sun, state.player.sun);

  const unknownSpell = castSpell(state, 'unknown_spell' as AbilityId, inside);
  assert.equal(unknownSpell.events[0]?.type, 'invalid_spell');
  if (unknownSpell.events[0]?.type === 'invalid_spell') {
    assert.equal(unknownSpell.events[0].reason, 'unknown ability');
  }
  assert.equal(unknownSpell.state.player.sun, state.player.sun);
}

function testSameSeedAndActionsProduceSameState(): void {
  type RecordedAction = { type: 'swap'; from: Cell; to: Cell } | { type: 'enemy' };
  const actions: RecordedAction[] = [];
  let original = createDuel(707);

  for (let index = 0; index < 16 && !original.winner; index++) {
    if (original.current === 'player') {
      const move = findLegalMoves(original.board)[0];
      actions.push({ type: 'swap', from: move.from, to: move.to });
      original = applySwap(original, move.from, move.to).state;
    } else {
      actions.push({ type: 'enemy' });
      original = runEnemyTurn(original).state;
    }
  }

  let replay = createDuel(707);
  for (const action of actions) {
    replay =
      action.type === 'enemy'
        ? runEnemyTurn(replay).state
        : applySwap(replay, action.from, action.to).state;
  }

  assert.deepEqual(replay, original);
}

const cases: CorrectnessCase[] = [
  { name: 'active rules and content names', run: testCrownStrikeUsesActiveRulesAndNames },
  { name: 'unique cross-match cells', run: testCrossMatchCountsUniqueCellsOnce },
  { name: 'actual damage event values', run: testDamageEventReportsBlockedAndHpDamage },
  { name: 'real no-move refill', run: testEnemyNoMoveActuallyRefillsBoard },
  { name: 'action coordinate validation', run: testInvalidCoordinatesCannotResolveActions },
  { name: 'deterministic action replay', run: testSameSeedAndActionsProduceSameState },
];

let failures = 0;
for (const correctnessCase of cases) {
  try {
    correctnessCase.run();
  } catch (error) {
    failures++;
    console.error(`FAIL: ${correctnessCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  throw new Error(`${failures} correctness regression test(s) failed`);
}

console.log('correctness tests passed');
