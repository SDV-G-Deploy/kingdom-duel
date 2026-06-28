import { strict as assert } from 'node:assert';
import { chooseDragCommitCell, chooseSpellTargetTapAction } from './input';
import type { Cell } from './engine/types';

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

testReleaseCellWinsWhenDirectionalSwipeIsInvalid();
testDirectionalCellStaysWhenReleaseIsNotAdjacent();
testSpellTargetFirstTapOnlyPreviews();
testSpellTargetSecondTapCastsSameCell();
testSpellTargetChangedCellPreviewsAgain();

console.log('input tests passed');
