import { strict as assert } from 'node:assert';
import { areAdjacent, createBoard, findLegalMoves, findMatches, setTile, swapTiles } from './board';
import { applySwap, castSpell, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './duel';
import { DEFAULT_DUEL_RULES } from './rules';
import type { Board, DuelRules, TileKind } from './types';

function testBoardGeneration(): void {
  const { board } = createBoard(8, 8, 42);
  assert.equal(findMatches(board).length, 0, 'new board should not start with matches');
  assert.ok(findLegalMoves(board).length > 0, 'new board should have legal moves');
}

function testAdjacency(): void {
  assert.equal(areAdjacent({ x: 0, y: 0 }, { x: 1, y: 0 }), true);
  assert.equal(areAdjacent({ x: 0, y: 0 }, { x: 1, y: 1 }), false);
}

function testInvalidSwapDoesNotChangeTurn(): void {
  const state = createDuel(100);
  const result = applySwap(state, { x: 0, y: 0 }, { x: 7, y: 7 });
  assert.equal(result.state.current, 'player');
  assert.equal(result.events[0]?.type, 'invalid_swap');
}

function testLegalMoveResolves(): void {
  const state = createDuel(2007);
  const move = findLegalMoves(state.board)[0];
  const result = applySwap(state, move.from, move.to);
  assert.ok(result.events.some((event) => event.type === 'match'), 'legal swap should produce match events');
}

function testManualMatchDetection(): void {
  const state = createDuel(300);
  const board = { ...state.board, tiles: [...state.board.tiles] };
  board.tiles[0] = 'sun';
  board.tiles[1] = 'sun';
  board.tiles[2] = 'shield';
  board.tiles[3] = 'sun';
  swapTiles(board, { x: 2, y: 0 }, { x: 3, y: 0 });
  const matches = findMatches(board);
  assert.ok(matches.some((match) => match.tile === 'sun' && match.cells.length >= 3));
}

function testEnemyTurn(): void {
  let state = createDuel(707);
  for (let i = 0; i < 30 && state.current === 'player'; i++) {
    const move = findLegalMoves(state.board)[0];
    state = applySwap(state, move.from, move.to).state;
  }
  if (state.current === 'enemy') {
    const result = runEnemyTurn(state);
    assert.ok(result.events.length > 0, 'enemy should produce events');
    assert.ok(result.state.current === 'player' || result.state.current === 'enemy');
  }
}

function testResolvedBoardRemainsPlayable(): void {
  let state = createDuel(2007);
  for (let i = 0; i < 12 && !state.winner; i++) {
    if (state.current === 'player') {
      const move = findLegalMoves(state.board)[0];
      state = applySwap(state, move.from, move.to).state;
    } else {
      state = runEnemyTurn(state).state;
    }
    assert.ok(findLegalMoves(state.board).length > 0, 'resolved board should remain playable');
  }
}

function testRulesCanConfigureActorsAndBoard(): void {
  const rules: DuelRules = {
    ...DEFAULT_DUEL_RULES,
    board: { width: 6, height: 6 },
    actors: {
      player: { name: 'Test Hero', hp: 12, guard: 1 },
      enemy: { name: 'Test Enemy', hp: 9, guard: 0 },
    },
  };
  const state = createDuel(44, rules);
  assert.equal(state.board.width, 6);
  assert.equal(state.board.height, 6);
  assert.equal(state.player.name, 'Test Hero');
  assert.equal(state.player.hp, 12);
  assert.equal(state.enemy.hp, 9);
}

function testPreviewRejectsBadSwap(): void {
  const state = createDuel(2007);
  const preview = previewSwap(state.board, { x: 0, y: 0 }, { x: 7, y: 7 });
  assert.equal(preview.valid, false);
}

function testPreviewReportsLegalMoveEffects(): void {
  const state = createDuel(2007);
  const move = findLegalMoves(state.board)[0];
  const preview = previewSwap(state.board, move.from, move.to);
  assert.equal(preview.valid, true);
  if (preview.valid) {
    assert.ok(preview.matches.length > 0);
    assert.ok(preview.summary.length > 0);
    assert.ok(preview.score > 0);
  }
}

function testOverMatchBonusAppliesToPreviewAndSwap(): void {
  const tiles: TileKind[] = Array.from({ length: 64 }, (_, index) => {
    const x = index % 8;
    const y = Math.floor(index / 8);
    return ['sun', 'shield', 'sword', 'moon', 'crown', 'shade'][(x + y) % 6] as TileKind;
  });
  const board: Board = { width: 8, height: 8, tiles };
  setTile(board, { x: 0, y: 0 }, 'sun');
  setTile(board, { x: 1, y: 0 }, 'sun');
  setTile(board, { x: 2, y: 0 }, 'shield');
  setTile(board, { x: 3, y: 0 }, 'sun');
  setTile(board, { x: 2, y: 1 }, 'sun');

  const preview = previewSwap(board, { x: 2, y: 1 }, { x: 2, y: 0 });
  assert.equal(preview.valid, true);
  if (preview.valid) {
    assert.equal(preview.effects.find((effect) => effect.label === 'sun')?.value, 5);
    assert.equal(preview.extraTurn, true);
  }

  const state = { ...createDuel(2007), board, seed: 99 };
  const result = applySwap(state, { x: 2, y: 1 }, { x: 2, y: 0 });
  assert.equal(result.state.player.sun, 5);
}

function testShadePreviewShowsBacklashBeforeSwap(): void {
  const tiles: TileKind[] = Array.from({ length: 64 }, (_, index) => {
    const x = index % 8;
    const y = Math.floor(index / 8);
    return ['sun', 'shield', 'sword', 'moon', 'crown', 'shade'][(x + y) % 6] as TileKind;
  });
  const board: Board = { width: 8, height: 8, tiles };
  setTile(board, { x: 0, y: 0 }, 'shade');
  setTile(board, { x: 1, y: 0 }, 'shade');
  setTile(board, { x: 2, y: 0 }, 'sun');
  setTile(board, { x: 3, y: 0 }, 'shade');
  setTile(board, { x: 2, y: 1 }, 'shade');

  const preview = previewSwap(board, { x: 2, y: 1 }, { x: 2, y: 0 });
  assert.equal(preview.valid, true);
  if (preview.valid) {
    assert.equal(preview.effects.find((effect) => effect.label === 'shade damage')?.value, 10);
    assert.equal(preview.effects.find((effect) => effect.label === 'backlash')?.value, 5);
    assert.match(preview.summary, /-5 backlash/);
  }
}

function testEnemyIntentUsesLegalPreview(): void {
  const state = createDuel(2007);
  const intent = getEnemyIntent(state.board);
  assert.ok(intent, 'enemy intent should exist on a playable board');
  assert.equal(intent?.preview.valid, true);
}

function testSpellRejectsMissingMana(): void {
  const state = createDuel(2007);
  const result = castSpell(state, 'sun_bloom', { x: 3, y: 3 });
  assert.equal(result.events[0]?.type, 'invalid_spell');
  assert.equal(result.state.current, 'player');
}

function testSunBloomCastsAndConvertsTiles(): void {
  const state = createDuel(2007);
  const result = castSpell({ ...state, player: { ...state.player, sun: 6 } }, 'sun_bloom', { x: 3, y: 3 });
  assert.ok(result.events.some((event) => event.type === 'spell_cast'));
  assert.ok(result.events.some((event) => event.type === 'tiles_converted'));
}

function testGlassWardAddsGuardAndConvertsShade(): void {
  const state = createDuel(2007);
  const board = { ...state.board, tiles: [...state.board.tiles] };
  setTile(board, { x: 3, y: 3 }, 'shade');
  const result = castSpell({ ...state, board, player: { ...state.player, moon: 5 } }, 'glass_ward', { x: 3, y: 3 });
  assert.ok(result.events.some((event) => event.type === 'guard'));
  assert.ok(result.events.some((event) => event.type === 'tiles_converted'));
}

function testCrownStrikeClearsTargetRow(): void {
  const state = createDuel(2007);
  const result = castSpell({ ...state, player: { ...state.player, crown: 6 } }, 'crown_strike', { x: 2, y: 4 });
  assert.ok(result.events.some((event) => event.type === 'spell_cast'));
  assert.ok(result.events.some((event) => event.type === 'row_cleared'));
}

testBoardGeneration();
testAdjacency();
testInvalidSwapDoesNotChangeTurn();
testLegalMoveResolves();
testManualMatchDetection();
testEnemyTurn();
testResolvedBoardRemainsPlayable();
testRulesCanConfigureActorsAndBoard();
testPreviewRejectsBadSwap();
testPreviewReportsLegalMoveEffects();
testOverMatchBonusAppliesToPreviewAndSwap();
testShadePreviewShowsBacklashBeforeSwap();
testEnemyIntentUsesLegalPreview();
testSpellRejectsMissingMana();
testSunBloomCastsAndConvertsTiles();
testGlassWardAddsGuardAndConvertsShade();
testCrownStrikeClearsTargetRow();

console.log('engine tests passed');
