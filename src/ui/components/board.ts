import { getTile } from '../../engine/board';
import { previewSwap } from '../../engine/duel';
import { abilityTargetCells } from '../../engine/rewards';
import type { Cell, DuelRules, DuelState, EnemyIntent, MovePreview } from '../../engine/types';
import { cellFromBoardIndex, cellKey, gemLabel, renderGem, sameCell } from '../assets';
import type { BattleUiState } from '../state';

export function renderPlayableBoard(
  duel: DuelState,
  rules: DuelRules,
  ui: Readonly<BattleUiState>,
  preview: MovePreview | null,
  intent: EnemyIntent | null,
): string {
  const previewCells = previewCellSet(preview);
  const intentCells = intentCellSet(intent);
  const spellTargetCells = abilityTargetCellSet(duel, rules, ui);
  const neighborCells = ui.activeAbilityId ? new Set<string>() : adjacentCellSet(duel, ui.selectedCell);
  const validSwapCells = ui.activeAbilityId ? new Set<string>() : validSwapCellSet(duel, rules, ui.selectedCell);
  const enemyCueCells = new Set(ui.enemyCue?.cells.map(cellKey) ?? []);

  return `
    <div class="play-board ${ui.activeAbilityId ? 'is-targeting' : ''}" aria-label="Playable match-3 board">
      ${duel.board.tiles
        .map((kind, index) => {
          const cell = cellFromBoardIndex(index, duel.board.width);
          const key = cellKey(cell);
          const classes = [
            sameCell(ui.selectedCell, cell) ? 'is-selected' : '',
            sameCell(ui.hoverCell, cell) ? 'is-hovered' : '',
            sameCell(ui.confirmedAbilityTarget, cell) ? 'is-spell-confirmed' : '',
            neighborCells.has(key) ? 'is-neighbor' : '',
            validSwapCells.has(key) ? 'is-valid-swap' : '',
            sameCell(ui.bumpCell, cell) ? 'is-bumped' : '',
            enemyCueCells.has(key) ? 'is-enemy-action' : '',
            previewCells.has(key) ? 'is-preview' : '',
            intentCells.has(key) ? 'is-threat' : '',
            spellTargetCells.has(key) ? 'is-spell-target' : '',
          ].filter(Boolean);
          return renderGem(kind, index, classes);
        })
        .join('')}
    </div>
  `;
}

export function swapTruthLabel(duel: DuelState, from: Cell, to: Cell): string {
  return `${gemLabel(getTile(duel.board, from))} -> ${gemLabel(getTile(duel.board, to))}`;
}

function adjacentCellSet(duel: DuelState, cell: Cell | null): Set<string> {
  const cells = new Set<string>();
  if (!cell) return cells;

  for (const next of [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ]) {
    if (next.x >= 0 && next.x < duel.board.width && next.y >= 0 && next.y < duel.board.height) {
      cells.add(cellKey(next));
    }
  }

  return cells;
}

function validSwapCellSet(duel: DuelState, rules: DuelRules, cell: Cell | null): Set<string> {
  const cells = new Set<string>();
  if (!cell) return cells;

  for (const targetKey of adjacentCellSet(duel, cell)) {
    const [x, y] = targetKey.split(',').map(Number);
    const target = { x, y };
    if (previewSwap(duel.board, cell, target, rules).valid) cells.add(targetKey);
  }

  return cells;
}

function previewCellSet(preview: MovePreview | null): Set<string> {
  const cells = new Set<string>();
  if (!preview?.valid) return cells;
  cells.add(cellKey(preview.from));
  cells.add(cellKey(preview.to));
  for (const match of preview.matches) {
    for (const cell of match.cells) cells.add(cellKey(cell));
  }
  return cells;
}

function intentCellSet(intent: EnemyIntent | null): Set<string> {
  const cells = new Set<string>();
  if (!intent) return cells;
  if (intent.type === 'ability') {
    for (const cell of intent.cells) cells.add(cellKey(cell));
    return cells;
  }
  cells.add(cellKey(intent.from));
  cells.add(cellKey(intent.to));
  for (const match of intent.preview.matches) {
    for (const cell of match.cells) cells.add(cellKey(cell));
  }
  return cells;
}

function abilityTargetCellSet(
  duel: DuelState,
  rules: DuelRules,
  ui: Readonly<BattleUiState>,
): Set<string> {
  const cells = new Set<string>();
  const target = ui.confirmedAbilityTarget ?? ui.hoverCell;
  if (!ui.activeAbilityId || !target) return cells;
  for (const cell of abilityTargetCells(duel.board, rules.abilities[ui.activeAbilityId], target)) {
    cells.add(cellKey(cell));
  }
  return cells;
}
