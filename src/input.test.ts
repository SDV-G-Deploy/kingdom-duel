import { strict as assert } from 'node:assert';
import { chooseDragCommitCell, chooseSpellTargetTapAction } from './input';
import type { Board, Cell } from './engine/types';
import { dragTargetCell } from './ui/input-controller';

function key(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function testReleaseCellWinsWhenDirectionalSwipeIsInvalid(): void {
  const start = { x: 3, y: 3 };
  const directional = { x: 4, y: 3 };
  const release = { x: 3, y: 4 };
  const picked = chooseDragCommitCell(start, directional, release, {
    isAdjacent: (from, to) => Math.abs(from.x - to.x) + Math.abs(from.y - to.y) === 1,
    isValidSwap: (_from, to) => key(to) === key(release),
  });

  assert.deepEqual(picked, release);
}

function testDirectionalCellStaysWhenReleaseIsNotAdjacent(): void {
  const start = { x: 3, y: 3 };
  const directional = { x: 4, y: 3 };
  const release = { x: 5, y: 5 };
  const picked = chooseDragCommitCell(start, directional, release, {
    isAdjacent: (from, to) => Math.abs(from.x - to.x) + Math.abs(from.y - to.y) === 1,
    isValidSwap: () => false,
  });

  assert.deepEqual(picked, directional);
}

function testSpellTargetFirstTapOnlyPreviews(): void {
  const target = { x: 2, y: 4 };

  assert.equal(chooseSpellTargetTapAction(null, target), 'preview');
}

function testSpellTargetSecondTapCastsSameCell(): void {
  const target = { x: 2, y: 4 };

  assert.equal(chooseSpellTargetTapAction(target, target), 'cast');
}

function testSpellTargetChangedCellPreviewsAgain(): void {
  const first = { x: 2, y: 4 };
  const second = { x: 3, y: 4 };

  assert.equal(chooseSpellTargetTapAction(first, second), 'preview');
}

function testDragDirectionAndBoardBounds(): void {
  const board: Board = { width: 8, height: 8, tiles: Array(64).fill('sun') };
  assert.equal(dragTargetCell({ x: 3, y: 3 }, 12, 8, board), null, 'small movement stays a tap');
  assert.deepEqual(dragTargetCell({ x: 3, y: 3 }, 30, 4, board), { x: 4, y: 3 });
  assert.deepEqual(dragTargetCell({ x: 3, y: 3 }, -3, -30, board), { x: 3, y: 2 });
  assert.equal(dragTargetCell({ x: 0, y: 0 }, -30, 0, board), null, 'drag cannot leave the board');
}

testReleaseCellWinsWhenDirectionalSwipeIsInvalid();
testDirectionalCellStaysWhenReleaseIsNotAdjacent();
testSpellTargetFirstTapOnlyPreviews();
testSpellTargetSecondTapCastsSameCell();
testSpellTargetChangedCellPreviewsAgain();
testDragDirectionAndBoardBounds();

console.log('input tests passed');
