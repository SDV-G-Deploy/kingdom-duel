import { strict as assert } from 'node:assert';
import { findLegalMoves } from '../../engine/board';
import { applySwap, createDuel } from '../../engine/duel';
import { DEFAULT_DUEL_RULES } from '../../engine/rules';
import { createRun, createRunDuel, resolveRunBattle } from '../../run/run';
import { createDebugSession } from '../debug-presets';
import { BattleUiStore, duelForPresentation } from '../state';
import { createBattleView } from './battle';
import { renderMoodboard } from './moodboard';
import { renderRewardView, renderRunResult, runRouteNodeState } from './run';

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { href: 'https://kingdom-duel.test/' } },
});

function count(source: string, token: string): number {
  return source.split(token).length - 1;
}

function testBattleAndMoodboardMarkupContracts(): void {
  const duel = createDuel(2007);
  const ui = new BattleUiStore('play');
  const battle = createBattleView({ duel, rules: DEFAULT_DUEL_RULES, ui: ui.state });

  assert.match(battle.html, /class="aero-shell play-shell/);
  assert.match(battle.html, /aria-label="Glass battle console"/);
  assert.match(battle.html, /aria-label="Playable match-3 board"/);
  assert.ok(battle.announcement.length > 0);
  assert.match(battle.html, /Aurora passive/);
  assert.match(battle.html, /Prism Guard/);
  assert.match(battle.html, /Veil Rift M0\/5/);
  assert.equal(count(battle.html, ' data-cell="'), 64);
  assert.equal(count(battle.html, ' data-spell="'), duel.player.abilityIds.length);
  assert.equal(count(battle.html, '<button'), 71, 'the full core loop remains keyboard-activatable');

  ui.update({ selectedCell: { x: 2, y: 1 }, logOpen: true });
  const interactive = createBattleView({ duel, rules: DEFAULT_DUEL_RULES, ui: ui.state });
  assert.match(interactive.html, /gem[^\n]*is-selected/);
  assert.match(interactive.html, /aria-label="Full combat log"/);
  assert.match(interactive.html, /data-action="copy-battle-report"/);
  assert.match(interactive.html, /data-action="copy-battle-log"/);
  assert.match(interactive.html, /data-action="copy-battle-trace"/);

  const moodboard = renderMoodboard('moodboard');
  assert.match(moodboard, /class="aero-shell moodboard-shell"/);
  assert.match(moodboard, /class="is-active"[^>]*>Moodboard/);
  assert.equal(count(moodboard, ' data-cell="'), 64);
  assert.match(moodboard, /aria-label="Aether tile"/);
}

function testResolutionFrameIsPresentedWithoutMutatingCommittedDuel(): void {
  const duel = createDuel(2007);
  const move = findLegalMoves(duel.board)[0];
  const resolution = applySwap(duel, move.from, move.to);
  const ui = new BattleUiStore('play');
  const frame = resolution.frames.find((candidate) => candidate.kind === 'match') ?? resolution.frames[0];
  ui.beginResolution(resolution.frames);
  ui.presentFrame(frame);

  const presented = duelForPresentation(resolution.state, ui.state.presentedSnapshot);
  const battle = createBattleView({ duel: presented, rules: DEFAULT_DUEL_RULES, ui: ui.state });

  assert.match(battle.html, new RegExp(`data-resolution-frame="${frame.kind}"`));
  assert.match(battle.html, /play-shell is-resolving/);
  assert.notEqual(battle.announcement, 'Battle ready. Select a tile to begin.');
  assert.equal(resolution.state.actionLog.length, 1, 'presentation must preserve committed action state');
}

function testDebugTraceUsesStructuredActionsAndFrames(): void {
  const duel = createDuel(2007);
  const ui = new BattleUiStore();
  const trace = JSON.parse(createBattleView({ duel, rules: DEFAULT_DUEL_RULES, ui: ui.state }).debugBattleTrace());
  assert.equal(trace.traceSchemaVersion, 1);
  assert.equal(trace.contract.rulesVersion, 'rules-2026.07-step6');
  assert.equal(trace.contract.contentVersion, 'content-2026.07-step6');
  assert.equal(trace.contract.dailyVersion, null);
  assert.equal(typeof trace.build.dirty, 'boolean');
  assert.equal(trace.run, null);
  assert.equal(trace.initialSeed, 2007);
  assert.deepEqual(trace.actions, []);
  assert.deepEqual(trace.resolutionFrames, []);

  const run = createRun(4242);
  const runDuel = createRunDuel(run);
  const runTrace = JSON.parse(createBattleView({ duel: runDuel, rules: DEFAULT_DUEL_RULES, ui: ui.state, run }).debugBattleTrace());
  assert.equal(runTrace.run.encounterIndex, 0);
  assert.equal(runTrace.run.phase, 'battle');
  assert.equal(runTrace.contract.rulesVersion, run.rulesVersion);
}

function testRunBattleRewardAndResultContracts(): void {
  const run = createRun(4242);
  const ui = new BattleUiStore();
  const duel = createDuel(2007);
  const battle = createBattleView({ duel, rules: DEFAULT_DUEL_RULES, ui: ui.state, run });
  assert.match(battle.html, /Run 1\/4 · Glass Edge/);
  assert.doesNotMatch(battle.html, /data-action="restart"/, 'run encounters must not expose a free reset');

  const terminal = createDebugSession('result-victory', DEFAULT_DUEL_RULES).duel;
  const terminalBattle = createBattleView({ duel: terminal, rules: DEFAULT_DUEL_RULES, ui: ui.state, run });
  assert.match(terminalBattle.html, /data-action="continue-run"/);
  assert.match(terminalBattle.html, /Choose a prism/);
  assert.doesNotMatch(terminalBattle.html, /data-action="restart"/, 'a finished encounter must not expose a free retry');

  const runDuel = createRunDuel(run);
  const reward = resolveRunBattle(run, {
    ...runDuel,
    winner: 'player',
    enemy: { ...runDuel.enemy, hp: 0 },
  });
  const rewardView = renderRewardView(reward);
  assert.equal(count(rewardView.html, 'data-action="choose-upgrade:'), 3);
  assert.match(rewardView.html, /Build, don't grind/);
  assert.equal(runRouteNodeState(reward, 0), 'is-complete');

  const completed = { ...reward, phase: 'complete' as const, encounterIndex: 3 };
  const resultView = renderRunResult(completed);
  assert.match(resultView.html, /Run complete/);
  assert.match(resultView.html, /data-action="new-daily-run"/);

  const failed = { ...run, phase: 'failed' as const, battles: [{
    encounterId: 'glass_edge', winner: 'enemy' as const, turns: 4, actions: 8, playerHp: 0,
  }] };
  assert.equal(runRouteNodeState(failed, 0), 'is-failed');
}

testBattleAndMoodboardMarkupContracts();
testResolutionFrameIsPresentedWithoutMutatingCommittedDuel();
testDebugTraceUsesStructuredActionsAndFrames();
testRunBattleRewardAndResultContracts();

console.log('UI view contract tests passed');
