import type { Cell } from './engine/types';

type DragSwapEvaluator = {
  isAdjacent: (from: Cell, to: Cell) => boolean;
  isValidSwap: (from: Cell, to: Cell) => boolean;
};

export function chooseDragCommitCell(
  startCell: Cell,
  directionalCell: Cell | null,
  releaseCell: Cell | null,
  evaluator: DragSwapEvaluator,
): Cell {
  const releaseIsAdjacent = !!releaseCell && evaluator.isAdjacent(startCell, releaseCell);

  if (releaseIsAdjacent && (evaluator.isValidSwap(startCell, releaseCell) || !directionalCell)) {
    return releaseCell;
  }

  if (directionalCell) {
    if (!evaluator.isValidSwap(startCell, directionalCell) && releaseIsAdjacent) {
      return releaseCell;
    }
    return directionalCell;
  }

  return releaseCell ?? startCell;
}
