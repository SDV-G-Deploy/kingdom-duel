import { areAdjacent } from '../engine/board';
import type { AbilityId, Board, Cell } from '../engine/types';
import { choosePointerReleaseAction } from '../input';
import { cellFromBoardIndex, sameCell } from './assets';
import type { AppView } from './state';

export type BattleInputContext = {
  app: HTMLElement;
  getBoard(): Board;
  canUseBoard(): boolean;
  getHoverCell(): Cell | null;
  hasActiveAbility(): boolean;
  isValidSwap(from: Cell, to: Cell): boolean;
  onView(view: AppView): void;
  onAction(action: string): void;
  onAbility(abilityId: AbilityId): void;
  onCellTap(cell: Cell): void;
  onSwapCommit(from: Cell, to: Cell): void;
  onDragPreview(from: Cell, to: Cell): void;
  onHover(cell: Cell | null): void;
};

type DragState = {
  pointerId: number;
  startCell: Cell;
  startX: number;
  startY: number;
};

export function bindBattleInput(
  context: BattleInputContext,
  windowTarget: Window = window,
  documentTarget: Document = document,
): () => void {
  let dragState: DragState | null = null;
  let suppressNextCellClick = false;

  const cellFromIndex = (index: number): Cell => cellFromBoardIndex(index, context.getBoard().width);
  const cellAtPoint = (x: number, y: number): Cell | null => {
    const value = documentTarget.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
    return value === undefined ? null : cellFromIndex(Number(value));
  };

  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const nextView = target.closest<HTMLElement>('[data-view]')?.dataset.view;
    if (nextView === 'play' || nextView === 'moodboard' || nextView === 'title') {
      context.onView(nextView);
      return;
    }

    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action) {
      context.onAction(action);
      return;
    }

    const abilityId = target.closest<HTMLElement>('[data-spell]')?.dataset.spell;
    if (abilityId) {
      context.onAbility(abilityId);
      return;
    }

    const cellValue = target.closest<HTMLElement>('[data-cell]')?.dataset.cell;
    if (cellValue === undefined || !context.canUseBoard()) return;
    if (suppressNextCellClick) {
      suppressNextCellClick = false;
      return;
    }
    context.onCellTap(cellFromIndex(Number(cellValue)));
  };

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement | null;
    const gem = target?.closest<HTMLElement>('[data-cell]');
    const cellValue = gem?.dataset.cell;
    if (!gem || cellValue === undefined || !context.canUseBoard()) return;

    event.preventDefault();
    try {
      gem.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile browsers reject capture during synthetic or interrupted touches.
    }
    dragState = {
      pointerId: event.pointerId,
      startCell: cellFromIndex(Number(cellValue)),
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragState || dragState.pointerId !== event.pointerId || !context.canUseBoard()) return;
    event.preventDefault();
    const target = dragTargetCell(
      dragState.startCell,
      event.clientX - dragState.startX,
      event.clientY - dragState.startY,
      context.getBoard(),
    );
    if (!target || sameCell(context.getHoverCell(), target)) return;
    context.onDragPreview(dragState.startCell, target);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (!context.canUseBoard()) {
      dragState = null;
      return;
    }
    event.preventDefault();
    suppressNextCellClick = true;
    windowTarget.setTimeout(() => { suppressNextCellClick = false; }, 0);

    const endedDrag = dragState;
    dragState = null;
    const targetCell = dragTargetCell(
      endedDrag.startCell,
      event.clientX - endedDrag.startX,
      event.clientY - endedDrag.startY,
      context.getBoard(),
    );
    const releaseCell = cellAtPoint(event.clientX, event.clientY);
    const action = choosePointerReleaseAction(
      endedDrag.startCell,
      targetCell,
      releaseCell,
      context.hasActiveAbility(),
      {
        isAdjacent: areAdjacent,
        isValidSwap: context.isValidSwap,
      },
    );

    if (action.kind === 'tap' || action.kind === 'ability') {
      context.onCellTap(action.cell);
      return;
    }
    context.onSwapCommit(action.from, action.to);
  };

  const onPointerCancel = (event: PointerEvent): void => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    dragState = null;
    context.onHover(null);
  };

  const onPointerOver = (event: PointerEvent): void => {
    const target = event.target as HTMLElement | null;
    const cellValue = target?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
    if (dragState || cellValue === undefined || !context.canUseBoard()) return;
    const nextHover = cellFromIndex(Number(cellValue));
    if (!sameCell(context.getHoverCell(), nextHover)) context.onHover(nextHover);
  };

  const onPointerOut = (event: PointerEvent): void => {
    const target = event.target as HTMLElement | null;
    const related = event.relatedTarget as HTMLElement | null;
    if (target?.closest('.play-board') && !related?.closest('.play-board') && context.getHoverCell()) {
      context.onHover(null);
    }
  };

  context.app.addEventListener('click', onClick);
  context.app.addEventListener('pointerdown', onPointerDown);
  context.app.addEventListener('pointerover', onPointerOver);
  context.app.addEventListener('pointerout', onPointerOut);
  windowTarget.addEventListener('pointermove', onPointerMove);
  windowTarget.addEventListener('pointerup', onPointerUp);
  windowTarget.addEventListener('pointercancel', onPointerCancel);

  return () => {
    context.app.removeEventListener('click', onClick);
    context.app.removeEventListener('pointerdown', onPointerDown);
    context.app.removeEventListener('pointerover', onPointerOver);
    context.app.removeEventListener('pointerout', onPointerOut);
    windowTarget.removeEventListener('pointermove', onPointerMove);
    windowTarget.removeEventListener('pointerup', onPointerUp);
    windowTarget.removeEventListener('pointercancel', onPointerCancel);
  };
}

export function dragTargetCell(from: Cell, deltaX: number, deltaY: number, board: Board): Cell | null {
  const threshold = 22;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return null;

  const next = Math.abs(deltaX) > Math.abs(deltaY)
    ? { x: from.x + Math.sign(deltaX), y: from.y }
    : { x: from.x, y: from.y + Math.sign(deltaY) };

  if (next.x < 0 || next.x >= board.width || next.y < 0 || next.y >= board.height) return null;
  return next;
}
