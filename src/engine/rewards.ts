import { inBounds } from './board';
import type { AbilityDefinition, Board, Cell, DuelRules, MatchGroup } from './types';

export type MatchReward = {
  effectAmount: number;
  extraTurn: boolean;
  createsSpecial: boolean;
};

export type SpecialCreation = {
  cell: Cell;
  matchLength: number;
};

export function matchReward(match: MatchGroup, rules: DuelRules): MatchReward {
  return {
    effectAmount: match.cells.length,
    extraTurn: match.cells.length >= rules.match.extraTurnLength,
    createsSpecial: match.tile !== 'aether' && match.cells.length >= rules.match.specialCreateLength,
  };
}

export function specialCreations(matches: MatchGroup[], rules: DuelRules): SpecialCreation[] {
  return matches
    .filter((match) => matchReward(match, rules).createsSpecial)
    .map((match) => ({ cell: specialAnchor(match), matchLength: match.cells.length }));
}

export function matchesWithoutSpecialAnchors(
  matches: MatchGroup[],
  creations: SpecialCreation[],
): MatchGroup[] {
  const anchors = new Set(creations.map(({ cell }) => cellKey(cell)));
  return matches.map((match) => ({
    ...match,
    cells: match.cells.filter((cell) => !anchors.has(cellKey(cell))),
  }));
}

export function abilityTargetCells(board: Board, ability: AbilityDefinition, target: Cell): Cell[] {
  if (ability.target === 'row') {
    return Array.from({ length: board.width }, (_, x) => ({ x, y: target.y }));
  }

  const cells = new Map<string, Cell>([[cellKey(target), target]]);
  for (const effect of ability.effects) {
    if (effect.type !== 'convert_tiles') continue;
    for (const cell of cellsAround(board, target, effect.radius)) {
      if (effect.shape === 'cross' && cell.x !== target.x && cell.y !== target.y) continue;
      cells.set(cellKey(cell), cell);
    }
  }
  return [...cells.values()];
}

export function cellsAround(board: Board, target: Cell, radius: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = target.y - radius; y <= target.y + radius; y++) {
    for (let x = target.x - radius; x <= target.x + radius; x++) {
      const cell = { x, y };
      if (inBounds(board, cell)) cells.push(cell);
    }
  }
  return cells;
}

function specialAnchor(match: MatchGroup): Cell {
  const centerX = match.cells.reduce((sum, cell) => sum + cell.x, 0) / match.cells.length;
  const centerY = match.cells.reduce((sum, cell) => sum + cell.y, 0) / match.cells.length;
  return [...match.cells].sort((a, b) => {
    const distanceA = Math.abs(a.x - centerX) + Math.abs(a.y - centerY);
    const distanceB = Math.abs(b.x - centerX) + Math.abs(b.y - centerY);
    return distanceA - distanceB || a.y - b.y || a.x - b.x;
  })[0];
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}
