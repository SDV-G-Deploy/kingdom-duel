import { strict as assert } from 'node:assert';
import { findLegalMoves } from '../engine/board';
import { applySwap, createDuel } from '../engine/duel';
import type { Board, Cell, ResolutionFrame } from '../engine/types';
import { computeFallMotion, gemMotionAttributes, nextBoardMotion, type BoardMotion } from './board-motion';

function tileAt(board: Board, x: number, y: number): string {
  return board.tiles[y * board.width + x];
}

function playAll(frames: readonly ResolutionFrame[]): Array<{ frame: ResolutionFrame; motion: BoardMotion }> {
  let motion: BoardMotion | null = null;
  return frames.map((frame, index) => {
    motion = nextBoardMotion(motion, frame, 1000 + index * 100);
    return { frame, motion };
  });
}

function testSwapSlidesEachGemFromTheOtherCell(): void {
  const duel = createDuel(2007);
  const move = findLegalMoves(duel.board)[0];
  const result = applySwap(duel, move.from, move.to);
  const [first] = playAll(result.frames);
  assert.equal(first.frame.kind, 'swap');
  const width = duel.board.width;
  assert.deepEqual(first.motion.cells.get(move.from.y * width + move.from.x), {
    kind: 'slide',
    dx: move.to.x - move.from.x,
    dy: move.to.y - move.from.y,
  });
  assert.deepEqual(first.motion.cells.get(move.to.y * width + move.to.x), {
    kind: 'slide',
    dx: move.from.x - move.to.x,
    dy: move.from.y - move.to.y,
  });
  assert.equal(first.motion.cells.size, 2);
}

function testMatchPopsThenHoldsClearedUntilFall(): void {
  for (const seed of [2007, 2008, 2009, 31, 77]) {
    const duel = createDuel(seed);
    const move = findLegalMoves(duel.board)[0];
    const played = playAll(applySwap(duel, move.from, move.to).frames);
    const firstMatch = played.find((entry) => entry.frame.kind === 'match');
    assert.ok(firstMatch, `seed ${seed} resolves a match`);
    const matchEvent = firstMatch.frame.events.find((event) => event.type === 'match');
    assert.ok(matchEvent && matchEvent.type === 'match');
    const popped: Cell[] = matchEvent.cells;
    for (const cell of popped) {
      assert.equal(firstMatch.motion.cells.get(cell.y * duel.board.width + cell.x)?.kind, 'pop');
    }

    const matchIndex = played.indexOf(firstMatch);
    const fallIndex = played.findIndex((entry, index) => index > matchIndex && entry.frame.kind === 'fall');
    for (const entry of played.slice(matchIndex + 1, fallIndex)) {
      if (entry.frame.kind === 'match' || entry.frame.kind === 'special') continue;
      for (const cell of popped) {
        const kind: string | undefined = entry.motion.cells.get(cell.y * duel.board.width + cell.x)?.kind;
        assert.ok(kind === 'cleared' || kind === 'forge', `seed ${seed}: popped gem stays hollow until the fall`);
      }
    }
    assert.equal(played[fallIndex].motion.cleared.size, 0, 'the fall frame empties the hollow set');
  }
}

/** Every drop must point at the tile that was really above it before the fall. */
function testFallMotionMatchesEngineDrop(): void {
  let checkedFalls = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const duel = createDuel(seed);
    for (const move of findLegalMoves(duel.board).slice(0, 3)) {
      const frames = applySwap(duel, move.from, move.to).frames;
      frames.forEach((frame, index) => {
        if (frame.kind !== 'fall') return;
        const fallen = frame.events.find((event) => event.type === 'tiles_fallen');
        assert.ok(fallen && fallen.type === 'tiles_fallen');
        const before = frames[index - 1].snapshot.board;
        const after = frame.snapshot.board;
        const motion = computeFallMotion(fallen.cells, after.width, after.height);
        const removed = new Set(fallen.cells.map((cell) => `${cell.x},${cell.y}`));
        for (let y = 0; y < after.height; y++) {
          for (let x = 0; x < after.width; x++) {
            const entry = motion.get(y * after.width + x);
            if (!entry) {
              assert.ok(!removed.has(`${x},${y}`), 'a removed cell always receives a new gem');
              assert.equal(tileAt(after, x, y), tileAt(before, x, y), 'unmoved gems keep their tile');
              continue;
            }
            assert.equal(entry.kind, 'drop');
            if (entry.kind !== 'drop' || entry.fresh) continue;
            assert.equal(tileAt(after, x, y), tileAt(before, x, y - entry.rows), `seed ${seed}: survivor drops ${entry.rows}`);
          }
        }
        checkedFalls++;
      });
    }
  }
  assert.ok(checkedFalls > 50, `checked ${checkedFalls} falls`);
}

function testAttributesContinueAndExpire(): void {
  const duel = createDuel(2007);
  const move = findLegalMoves(duel.board)[0];
  const [first] = playAll(applySwap(duel, move.from, move.to).frames);
  const index = move.from.y * duel.board.width + move.from.x;
  const early = gemMotionAttributes(first.motion, index, first.motion.startedAt + 40);
  assert.ok(early);
  assert.equal(early.className, 'motion-slide');
  assert.match(early.style, /--motion-delay:-40ms/);
  assert.equal(gemMotionAttributes(first.motion, index, first.motion.startedAt + 5000), null, 'finished slides render at rest');
  assert.equal(gemMotionAttributes(null, index, 0), null);
}

testSwapSlidesEachGemFromTheOtherCell();
testMatchPopsThenHoldsClearedUntilFall();
testFallMotionMatchesEngineDrop();
testAttributesContinueAndExpire();

console.log('board motion tests passed');
