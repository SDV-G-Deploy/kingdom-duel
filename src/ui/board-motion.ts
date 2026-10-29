import type { Cell, ResolutionFrame } from '../engine/types';

/**
 * Presentation-only gem motion derived from the ordered resolution frames.
 *
 * Each frame's snapshot is the board *after* that step, so motion is expressed
 * as "where this gem visually comes from": a swap slides the two gems in from
 * each other's cell, a fall drops survivors and fresh gems in from above, a
 * match pops the matched gems (which then stay hollow until the next fall).
 * Everything here is a pure function of frames, so it is deterministic and
 * testable without a DOM.
 */
export type GemMotion =
  | { kind: 'slide'; dx: number; dy: number }
  | { kind: 'drop'; rows: number; fresh: boolean; delay: number }
  | { kind: 'pop' }
  | { kind: 'cleared' }
  | { kind: 'forge' }
  | { kind: 'convert' };

export type BoardMotion = {
  frameIndex: number;
  startedAt: number;
  /** Motion per board index. Indices without motion are absent. */
  cells: Map<number, GemMotion>;
  /** Board indices popped this cascade that are still waiting for the fall. */
  cleared: ReadonlySet<number>;
};

/** Animation lengths (ms); each fits inside the matching playback frame duration. */
export const GEM_MOTION_MS = {
  slide: 170,
  pop: 190,
  drop: 230,
  forge: 260,
  convert: 220,
} as const;

const DROP_STAGGER_MS = 10;

export function nextBoardMotion(previous: BoardMotion | null, frame: ResolutionFrame, now: number): BoardMotion {
  const { width, height } = frame.snapshot.board;
  const indexOf = (cell: Cell): number => cell.y * width + cell.x;
  const cleared = new Set(previous?.cleared ?? []);
  const cells = new Map<number, GemMotion>();

  for (const event of frame.events) {
    if (event.type === 'swap') {
      cells.set(indexOf(event.from), { kind: 'slide', dx: event.to.x - event.from.x, dy: event.to.y - event.from.y });
      cells.set(indexOf(event.to), { kind: 'slide', dx: event.from.x - event.to.x, dy: event.from.y - event.to.y });
    } else if (event.type === 'match' || event.type === 'row_cleared' || event.type === 'special_activated') {
      for (const cell of event.cells) {
        const index = indexOf(cell);
        if (!cleared.has(index)) cells.set(index, { kind: 'pop' });
        cleared.add(index);
      }
    } else if (event.type === 'special_created') {
      const index = indexOf(event.cell);
      cleared.delete(index);
      cells.set(index, { kind: 'forge' });
    } else if (event.type === 'tiles_converted') {
      for (const cell of event.cells) cells.set(indexOf(cell), { kind: 'convert' });
    } else if (event.type === 'tiles_fallen') {
      cleared.clear();
      for (const [index, motion] of computeFallMotion(event.cells, width, height)) cells.set(index, motion);
    } else if (event.type === 'board_refilled') {
      cleared.clear();
      for (let index = 0; index < width * height; index++) {
        const x = index % width;
        const y = Math.floor(index / width);
        cells.set(index, { kind: 'drop', rows: height, fresh: true, delay: (x + (height - 1 - y)) * DROP_STAGGER_MS });
      }
    }
  }

  for (const index of cleared) {
    if (!cells.has(index)) cells.set(index, { kind: 'cleared' });
  }

  return { frameIndex: frame.index, startedAt: now, cells, cleared };
}

/**
 * Mirrors `removeAndDrop`: survivors in each column keep their order and sink
 * to the bottom; fresh gems stack above them and fall the column's gap height.
 */
export function computeFallMotion(removedCells: readonly Cell[], width: number, height: number): Map<number, GemMotion> {
  const motion = new Map<number, GemMotion>();
  const removed = new Set(removedCells.map((cell) => cell.y * width + cell.x));

  for (let x = 0; x < width; x++) {
    const survivors: number[] = [];
    for (let y = height - 1; y >= 0; y--) {
      if (!removed.has(y * width + x)) survivors.push(y);
    }
    const gap = height - survivors.length;
    if (gap === 0) continue;

    for (let slot = 0; slot < height; slot++) {
      const finalY = height - 1 - slot;
      const fresh = slot >= survivors.length;
      const rows = fresh ? gap : finalY - survivors[slot];
      if (rows > 0) {
        motion.set(finalY * width + x, { kind: 'drop', rows, fresh, delay: fresh ? (slot - survivors.length) * DROP_STAGGER_MS : 0 });
      }
    }
  }

  return motion;
}

/** Inline class + style for one gem, continuing an in-flight animation across re-renders. */
export function gemMotionAttributes(
  motion: BoardMotion | null,
  index: number,
  now: number,
): { className: string; style: string } | null {
  const entry = motion?.cells.get(index);
  if (!motion || !entry) return null;
  const elapsed = Math.max(0, now - motion.startedAt);
  if (entry.kind === 'cleared') return { className: 'motion-cleared', style: '' };

  const duration = entry.kind === 'drop' ? GEM_MOTION_MS.drop + entry.delay : GEM_MOTION_MS[entry.kind];
  if (elapsed >= duration) return entry.kind === 'pop' ? { className: 'motion-cleared', style: '' } : null;

  const delay = (entry.kind === 'drop' ? entry.delay : 0) - elapsed;
  const vars = [`--motion-delay:${delay}ms`];
  if (entry.kind === 'slide') vars.push(`--mx:${entry.dx}`, `--my:${entry.dy}`);
  if (entry.kind === 'drop') vars.push(`--drop:${entry.rows}`);
  const fresh = entry.kind === 'drop' && entry.fresh ? ' is-fresh' : '';
  return { className: `motion-${entry.kind}${fresh}`, style: vars.join(';') };
}
