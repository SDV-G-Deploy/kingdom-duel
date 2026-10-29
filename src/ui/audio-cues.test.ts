import { strict as assert } from 'node:assert';
import { findLegalMoves } from '../engine/board';
import { applySwap, createDuel } from '../engine/duel';
import { DEFAULT_DUEL_RULES } from '../engine/rules';
import type { ResolutionFrame } from '../engine/types';
import { cuesForFrame, parseAudioPreferences, summaryCues, type SfxId } from './audio-cues';

function cueIds(frames: readonly ResolutionFrame[]): SfxId[] {
  let cascade = 1;
  return frames.flatMap((frame) => {
    const result = cuesForFrame(frame, cascade);
    cascade = result.cascade;
    return result.cues.map((cue) => cue.id);
  });
}

function testPreferencesParse(): void {
  assert.deepEqual(parseAudioPreferences(null), { muted: false, music: false });
  assert.deepEqual(parseAudioPreferences('{"muted":true}'), { muted: true, music: false });
  assert.deepEqual(parseAudioPreferences('{"muted":"yes","music":true}'), { muted: false, music: true });
  assert.deepEqual(parseAudioPreferences('not json'), { muted: false, music: false });
}

function testSwapResolutionCues(): void {
  const duel = createDuel(2007);
  const move = findLegalMoves(duel.board)[0];
  const result = applySwap(duel, move.from, move.to);
  const ids = cueIds(result.frames);
  assert.equal(ids[0], 'swap', 'the swap sound leads');
  assert.ok(ids.includes('match'), 'a match chimes');
  // Deterministic: the same frames always produce the same cue list.
  assert.deepEqual(cueIds(applySwap(duel, move.from, move.to).frames), ids);
}

function testCascadeStepsPitchUp(): void {
  let checked = 0;
  for (let seed = 1; seed <= 200 && checked < 3; seed++) {
    const duel = createDuel(seed);
    for (const move of findLegalMoves(duel.board)) {
      const frames = applySwap(duel, move.from, move.to).frames;
      if (!frames.some((frame) => frame.events.some((event) => event.type === 'cascade' && event.count > 1))) continue;
      let cascade = 1;
      const matchSteps: number[] = [];
      for (const frame of frames) {
        const result = cuesForFrame(frame, cascade);
        cascade = result.cascade;
        matchSteps.push(...result.cues.filter((cue) => cue.id === 'match').map((cue) => cue.step));
      }
      assert.equal(matchSteps[0], 1);
      assert.ok(Math.max(...matchSteps) > 1, `seed ${seed}: later cascades step the match pitch`);
      checked++;
      break;
    }
  }
  assert.ok(checked > 0, 'found a cascading move');
}

function testTerminalAndSummary(): void {
  const duel = createDuel(2007);
  const lethal = { ...duel, enemy: { ...duel.enemy, hp: 1, guard: 0 } };
  const move = findLegalMoves(lethal.board).find((candidate) => {
    const result = applySwap(lethal, candidate.from, candidate.to, DEFAULT_DUEL_RULES);
    return result.state.winner === 'player';
  });
  assert.ok(move, 'a lethal move exists');
  const frames = applySwap(lethal, move.from, move.to).frames;
  assert.ok(cueIds(frames).includes('victory'));
  assert.deepEqual(summaryCues(frames).map((cue) => cue.id), ['victory'], 'reduced-motion summary keeps only the fanfare');

  const ordinary = applySwap(duel, findLegalMoves(duel.board)[0].from, findLegalMoves(duel.board)[0].to).frames;
  const summary = summaryCues(ordinary);
  assert.equal(summary[0].id, 'swap');
  assert.ok(summary.length <= 4);
  assert.equal(new Set(summary.map((cue) => cue.id)).size, summary.length, 'summary cues are unique');
}

testPreferencesParse();
testSwapResolutionCues();
testCascadeStepsPitchUp();
testTerminalAndSummary();

console.log('audio cue tests passed');
