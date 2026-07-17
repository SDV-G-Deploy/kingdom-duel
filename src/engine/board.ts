import { randomInt } from './rng';
import type { BaseTileKind, Board, Cell, MatchGroup, TileKind } from './types';

export const TILE_KINDS: BaseTileKind[] = ['sword', 'shield', 'sun', 'moon', 'crown', 'shade'];

export function createBoard(width = 8, height = 8, seed = 1207): { board: Board; seed: number } {
  let currentSeed = seed;

  for (let attempts = 0; attempts < 80; attempts++) {
    const tiles: TileKind[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const candidates = TILE_KINDS.filter((tile) => !wouldCreateStartingMatch(tiles, width, x, y, tile));
        const pick = randomInt(currentSeed, candidates.length);
        currentSeed = pick.seed;
        tiles.push(candidates[pick.value]);
      }
    }

    const board = { width, height, tiles };
    if (findLegalMoves(board).length > 0) return { board, seed: currentSeed };
  }

  throw new Error('Unable to create a playable board');
}

export function cloneBoard(board: Board): Board {
  return { width: board.width, height: board.height, tiles: [...board.tiles] };
}

export function indexFor(board: Board, cell: Cell): number {
  return cell.y * board.width + cell.x;
}

export function inBounds(board: Board, cell: Cell): boolean {
  return (
    Number.isInteger(cell.x) &&
    Number.isInteger(cell.y) &&
    cell.x >= 0 &&
    cell.x < board.width &&
    cell.y >= 0 &&
    cell.y < board.height
  );
}

export function getTile(board: Board, cell: Cell): TileKind {
  assertInBounds(board, cell);
  return board.tiles[indexFor(board, cell)];
}

export function setTile(board: Board, cell: Cell, tile: TileKind): void {
  assertInBounds(board, cell);
  board.tiles[indexFor(board, cell)] = tile;
}

export function areAdjacent(a: Cell, b: Cell): boolean {
  return (
    Number.isInteger(a.x) &&
    Number.isInteger(a.y) &&
    Number.isInteger(b.x) &&
    Number.isInteger(b.y) &&
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
  );
}

export function swapTiles(board: Board, a: Cell, b: Cell): void {
  assertInBounds(board, a);
  assertInBounds(board, b);
  const ai = indexFor(board, a);
  const bi = indexFor(board, b);
  const tmp = board.tiles[ai];
  board.tiles[ai] = board.tiles[bi];
  board.tiles[bi] = tmp;
}

export function findMatches(board: Board): MatchGroup[] {
  const runs: MatchGroup[] = [];

  for (let y = 0; y < board.height; y++) {
    let runStart = 0;
    for (let x = 1; x <= board.width; x++) {
      const current = x < board.width ? getTile(board, { x, y }) : null;
      const previous = getTile(board, { x: x - 1, y });
      if (current === previous) continue;
      const length = x - runStart;
      if (length >= 3) {
        const cells = Array.from({ length }, (_, offset) => ({ x: runStart + offset, y }));
        runs.push({ tile: previous, cells });
      }
      runStart = x;
    }
  }

  for (let x = 0; x < board.width; x++) {
    let runStart = 0;
    for (let y = 1; y <= board.height; y++) {
      const current = y < board.height ? getTile(board, { x, y }) : null;
      const previous = getTile(board, { x, y: y - 1 });
      if (current === previous) continue;
      const length = y - runStart;
      if (length >= 3) {
        const cells = Array.from({ length }, (_, offset) => ({ x, y: runStart + offset }));
        runs.push({ tile: previous, cells });
      }
      runStart = y;
    }
  }

  return mergeIntersectingRuns(runs);
}

export function removeAndDrop(board: Board, matches: MatchGroup[], seed: number): { board: Board; seed: number } {
  const next = cloneBoard(board);
  const removed = new Set(matches.flatMap((group) => group.cells.map((cell) => indexFor(next, cell))));
  let currentSeed = seed;

  for (let x = 0; x < next.width; x++) {
    const column: TileKind[] = [];
    for (let y = next.height - 1; y >= 0; y--) {
      const index = indexFor(next, { x, y });
      if (!removed.has(index)) column.push(next.tiles[index]);
    }

    while (column.length < next.height) {
      const pick = randomInt(currentSeed, TILE_KINDS.length);
      currentSeed = pick.seed;
      column.push(TILE_KINDS[pick.value]);
    }

    for (let y = next.height - 1; y >= 0; y--) {
      setTile(next, { x, y }, column[next.height - 1 - y]);
    }
  }

  return { board: next, seed: currentSeed };
}

export function findLegalMoves(board: Board): Array<{ from: Cell; to: Cell }> {
  const moves: Array<{ from: Cell; to: Cell }> = [];

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const from = { x, y };
      const candidates = [
        { x: x + 1, y },
        { x, y: y + 1 },
      ];

      for (const to of candidates) {
        if (!inBounds(board, to)) continue;
        if (isLegalSwap(board, from, to)) moves.push({ from, to });
      }
    }
  }

  return moves;
}

export function isLegalSwap(board: Board, from: Cell, to: Cell): boolean {
  if (!inBounds(board, from) || !inBounds(board, to) || !areAdjacent(from, to)) return false;
  if (getTile(board, from) === getTile(board, to)) return false;
  if (getTile(board, from) === 'aether' || getTile(board, to) === 'aether') return true;

  const test = cloneBoard(board);
  swapTiles(test, from, to);
  return findMatches(test).some((match) => match.cells.some((cell) => sameCell(cell, from) || sameCell(cell, to)));
}

function mergeIntersectingRuns(runs: MatchGroup[]): MatchGroup[] {
  const merged: MatchGroup[] = [];

  for (const run of runs) {
    const overlapping = merged
      .map((group, index) => ({ group, index }))
      .filter(({ group }) => group.tile === run.tile && groupsOverlap(group, run));

    if (!overlapping.length) {
      merged.push({ tile: run.tile, cells: [...run.cells] });
      continue;
    }

    const primaryIndex = overlapping[0].index;
    const cells = new Map<string, Cell>();
    for (const cell of run.cells) cells.set(cellKey(cell), cell);
    for (const { group } of overlapping) {
      for (const cell of group.cells) cells.set(cellKey(cell), cell);
    }
    merged[primaryIndex] = { tile: run.tile, cells: [...cells.values()] };

    for (const { index } of overlapping.slice(1).reverse()) merged.splice(index, 1);
  }

  return merged;
}

function groupsOverlap(a: MatchGroup, b: MatchGroup): boolean {
  const aCells = new Set(a.cells.map(cellKey));
  return b.cells.some((cell) => aCells.has(cellKey(cell)));
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function assertInBounds(board: Board, cell: Cell): void {
  if (!inBounds(board, cell)) {
    throw new RangeError(`Cell (${cell.x},${cell.y}) is outside the ${board.width}x${board.height} board`);
  }
}

function wouldCreateStartingMatch(tiles: TileKind[], width: number, x: number, y: number, tile: TileKind): boolean {
  const leftOne = x >= 1 ? tiles[y * width + x - 1] : null;
  const leftTwo = x >= 2 ? tiles[y * width + x - 2] : null;
  const upOne = y >= 1 ? tiles[(y - 1) * width + x] : null;
  const upTwo = y >= 2 ? tiles[(y - 2) * width + x] : null;

  return (leftOne === tile && leftTwo === tile) || (upOne === tile && upTwo === tile);
}
