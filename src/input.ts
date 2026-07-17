import type { Cell } from './engine/types';

type DragSwapEvaluator = {
  isAdjacent: (from: Cell, to: Cell) => boolean;
  isValidSwap: (from: Cell, to: Cell) => boolean;
};

export type PointerReleaseAction =
  | { kind: 'tap'; cell: Cell }
  | { kind: 'ability'; cell: Cell }
  | { kind: 'swap'; from: Cell; to: Cell };

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

export function choosePointerReleaseAction(
  startCell: Cell,
  directionalCell: Cell | null,
  releaseCell: Cell | null,
  hasActiveAbility: boolean,
  evaluator: DragSwapEvaluator,
): PointerReleaseAction {
  if (!directionalCell) {
    return { kind: 'tap', cell: releaseCell ?? startCell };
  }

  if (hasActiveAbility) {
    return { kind: 'ability', cell: releaseCell ?? directionalCell };
  }

  return {
    kind: 'swap',
    from: startCell,
    to: chooseDragCommitCell(startCell, directionalCell, releaseCell, evaluator),
  };
}

export function chooseSpellTargetTapAction(confirmedCell: Cell | null, tappedCell: Cell): 'preview' | 'cast' {
  return confirmedCell && confirmedCell.x === tappedCell.x && confirmedCell.y === tappedCell.y ? 'cast' : 'preview';
}
