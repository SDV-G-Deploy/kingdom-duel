import { strict as assert } from 'node:assert';
import { createDuel } from '../engine/duel';
import type { ResolutionFrame, ResolutionFrameKind } from '../engine/types';
import { ResolutionPlaybackController } from './playback';

class FakeTimers {
  private nextId = 1;
  private tasks = new Map<number, () => void>();

  setTimeout(callback: () => void): number {
    const id = this.nextId++;
    this.tasks.set(id, callback);
    return id;
  }

  clearTimeout(id: number): void {
    this.tasks.delete(id);
  }

  flushNext(): void {
    const next = this.tasks.entries().next().value as [number, () => void] | undefined;
    if (!next) return;
    this.tasks.delete(next[0]);
    next[1]();
  }

  get pending(): number {
    return this.tasks.size;
  }
}

function frames(...kinds: ResolutionFrameKind[]): ResolutionFrame[] {
  const duel = createDuel(2007);
  return kinds.map((kind, index) => ({
    index: index + 1,
    kind,
    events: [],
    snapshot: {
      board: { ...duel.board, tiles: [...duel.board.tiles] },
      player: { ...duel.player, abilityIds: [...duel.player.abilityIds] },
      enemy: { ...duel.enemy, abilityIds: [...duel.enemy.abilityIds] },
      current: duel.current,
      turn: duel.turn,
      seed: duel.seed,
      winner: duel.winner,
    },
  }));
}

function testOrderedPlayback(): void {
  const timers = new FakeTimers();
  const controller = new ResolutionPlaybackController(timers);
  const seen: ResolutionFrameKind[] = [];
  let completions = 0;

  controller.play(frames('swap', 'match', 'fall', 'turn'), {
    onFrame: (frame) => seen.push(frame.kind),
    onComplete: () => completions++,
  });

  assert.deepEqual(seen, ['swap']);
  assert.equal(controller.isPlaying, true);
  timers.flushNext();
  timers.flushNext();
  timers.flushNext();
  timers.flushNext();
  assert.deepEqual(seen, ['swap', 'match', 'fall', 'turn']);
  assert.equal(completions, 1);
  assert.equal(controller.isPlaying, false);
}

function testCancelInvalidatesScheduledCallbacks(): void {
  const timers = new FakeTimers();
  const controller = new ResolutionPlaybackController(timers);
  const seen: ResolutionFrameKind[] = [];
  let completed = false;
  controller.play(frames('swap', 'match'), {
    onFrame: (frame) => seen.push(frame.kind),
    onComplete: () => { completed = true; },
  });

  controller.cancel();
  timers.flushNext();
  assert.deepEqual(seen, ['swap']);
  assert.equal(completed, false);
  assert.equal(timers.pending, 0);
}

function testReducedMotionFinishesImmediatelyAtFinalFrame(): void {
  const timers = new FakeTimers();
  const controller = new ResolutionPlaybackController(timers);
  const seen: ResolutionFrameKind[] = [];
  let completed = false;
  controller.play(
    frames('swap', 'damage', 'turn'),
    {
      onFrame: (frame) => seen.push(frame.kind),
      onComplete: () => { completed = true; },
    },
    { reducedMotion: true },
  );

  assert.deepEqual(seen, ['turn']);
  assert.equal(completed, true);
  assert.equal(timers.pending, 0);
}

testOrderedPlayback();
testCancelInvalidatesScheduledCallbacks();
testReducedMotionFinishesImmediatelyAtFinalFrame();

console.log('resolution playback tests passed');
