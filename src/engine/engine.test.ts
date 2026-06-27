import { strict as assert } from 'node:assert';
import { areAdjacent, createBoard, findLegalMoves, findMatches, swapTiles } from './board';
import { applySwap, createDuel, runEnemyTurn } from './duel';

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

testBoardGeneration();
testAdjacency();
testInvalidSwapDoesNotChangeTurn();
testLegalMoveResolves();
testManualMatchDetection();
testEnemyTurn();
testResolvedBoardRemainsPlayable();

console.log('engine tests passed');
