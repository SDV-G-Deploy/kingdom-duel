import { randomInt } from './rng';
import type { Board, Cell, MatchGroup, TileKind } from './types';

export const TILE_KINDS: TileKind[] = ['sword', 'shield', 'sun', 'moon', 'crown', 'shade'];

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
  return cell.x >= 0 && cell.x < board.width && cell.y >= 0 && cell.y < board.height;
}

export function getTile(board: Board, cell: Cell): TileKind {
  return board.tiles[indexFor(board, cell)];
}

export function setTile(board: Board, cell: Cell, tile: TileKind): void {
  board.tiles[indexFor(board, cell)] = tile;
}

export function areAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

export function swapTiles(board: Board, a: Cell, b: Cell): void {
  const ai = indexFor(board, a);
  const bi = indexFor(board, b);
  const tmp = board.tiles[ai];
  board.tiles[ai] = board.tiles[bi];
  board.tiles[bi] = tmp;
}

export function findMatches(board: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];
  const seen = new Set<string>();

  for (let y = 0; y < board.height; y++) {
    let runStart = 0;
    for (let x = 1; x <= board.width; x++) {
      const current = x < board.width ? getTile(board, { x, y }) : null;
      const previous = getTile(board, { x: x - 1, y });
      if (current === previous) continue;
      const length = x - runStart;
      if (length >= 3) {
        const cells = Array.from({ length }, (_, offset) => ({ x: runStart + offset, y }));
        groups.push({ tile: previous, cells });
        for (const cell of cells) seen.add(`${cell.x},${cell.y}`);
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
        const novel = cells.filter((cell) => !seen.has(`${cell.x},${cell.y}`));
        groups.push({ tile: previous, cells: novel.length ? cells : [] });
      }
      runStart = y;
    }
  }

  return groups.filter((group) => group.cells.length > 0);
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
        const test = cloneBoard(board);
        swapTiles(test, from, to);
        if (findMatches(test).length > 0) moves.push({ from, to });
      }
    }
  }

  return moves;
}

function wouldCreateStartingMatch(tiles: TileKind[], width: number, x: number, y: number, tile: TileKind): boolean {
  const leftOne = x >= 1 ? tiles[y * width + x - 1] : null;
  const leftTwo = x >= 2 ? tiles[y * width + x - 2] : null;
  const upOne = y >= 1 ? tiles[(y - 1) * width + x] : null;
  const upTwo = y >= 2 ? tiles[(y - 2) * width + x] : null;

  return (leftOne === tile && leftTwo === tile) || (upOne === tile && upTwo === tile);
}

