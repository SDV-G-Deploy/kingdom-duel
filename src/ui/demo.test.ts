import { strict as assert } from 'node:assert';
import { findLegalMoves } from '../engine/board';
import { applySwap, createDuel } from '../engine/duel';
import { DEFAULT_DUEL_RULES } from '../engine/rules';
import type { DuelState } from '../engine/types';
import { chooseRunUpgrade, createRun, createRunDuel, resolveRunBattle } from '../run/run';
import { buildRunDuelRules } from '../run/rules';
import {
  chooseCoachTip,
  defaultCoachPreferences,
  markCoachTipSeen,
  parseCoachPreferences,
  type CoachPreferences,
} from './coach';
import { FLOAT_FX_DURATION_MS, activeFloatFx, diffCombatFx, hitDelay, renderFloatFx, type FloatFx } from './fx';
import { BattleUiStore } from './state';
import { createBattleView } from './views/battle';
import { renderTitleView, titleContinueLabel } from './views/title';

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { href: 'https://kingdom-duel.test/' } },
});

function seen(...ids: CoachPreferences['seen']): CoachPreferences {
  return { enabled: true, seen: ids };
}

function testCoachTipOrderAndGating(): void {
  const duel = createDuel(2007);
  const rules = DEFAULT_DUEL_RULES;

  assert.equal(chooseCoachTip(duel, rules, defaultCoachPreferences())?.id, 'first-move');
  assert.equal(chooseCoachTip(duel, rules, { enabled: false, seen: [] }), null, 'disabled hints never show');
  assert.equal(chooseCoachTip({ ...duel, current: 'enemy' }, rules, defaultCoachPreferences()), null, 'only on Aurora turn');
  assert.equal(chooseCoachTip({ ...duel, winner: 'player' }, rules, defaultCoachPreferences()), null, 'never after the duel');

  // Once the player has acted, the first-move tip no longer applies even if never dismissed.
  const move = findLegalMoves(duel.board)[0];
  const acted = applySwap(duel, move.from, move.to, rules).state;
  const afterMove: DuelState = { ...acted, current: 'player', winner: null };
  assert.notEqual(chooseCoachTip(afterMove, rules, defaultCoachPreferences())?.id, 'first-move');

  const charged: DuelState = { ...duel, player: { ...duel.player, moon: 9, sun: 0, crown: 0 } };
  const spellTip = chooseCoachTip(charged, rules, seen('first-move'));
  assert.equal(spellTip?.id, 'spell-ready');
  assert.equal(spellTip?.spellId, 'glass_ward');

  const enemyCharging: DuelState = { ...duel, enemy: { ...duel.enemy, moon: 4 } };
  const threat = chooseCoachTip(enemyCharging, rules, seen('first-move', 'spell-ready'));
  assert.equal(threat?.id, 'enemy-charge');
  assert.match(threat?.title ?? '', /1 Moon from Veil Rift/);
  const enemyReady = chooseCoachTip({ ...duel, enemy: { ...duel.enemy, moon: 5 } }, rules, seen('first-move', 'spell-ready'));
  assert.match(enemyReady?.title ?? '', /can cast Veil Rift/);
  assert.equal(chooseCoachTip({ ...duel, enemy: { ...duel.enemy, moon: 1 } }, rules, seen('first-move', 'spell-ready')), null);

  const tiles = [...duel.board.tiles];
  tiles[10] = 'aether';
  const withAether: DuelState = { ...duel, board: { ...duel.board, tiles } };
  assert.equal(chooseCoachTip(withAether, rules, seen('first-move', 'spell-ready', 'enemy-charge'))?.id, 'aether');
  assert.equal(chooseCoachTip(withAether, rules, seen('first-move', 'spell-ready', 'enemy-charge', 'aether')), null);
}

function testCoachPreferencesParsing(): void {
  assert.deepEqual(parseCoachPreferences(null), { enabled: true, seen: [] });
  assert.deepEqual(parseCoachPreferences('not json'), { enabled: true, seen: [] });
  assert.deepEqual(
    parseCoachPreferences(JSON.stringify({ enabled: false, seen: ['aether', 'bogus', 3] })),
    { enabled: false, seen: ['aether'] },
  );
  const once = markCoachTipSeen(defaultCoachPreferences(), 'aether');
  assert.equal(markCoachTipSeen(once, 'aether'), once, 'marking twice is a no-op');
}

function testCombatFxDiffAndLifetime(): void {
  const duel = createDuel(2007);
  const before = { player: duel.player, enemy: duel.enemy };
  const after = {
    player: { ...duel.player, hp: duel.player.hp - 4, guard: duel.player.guard + 2, sun: duel.player.sun + 3 },
    enemy: { ...duel.enemy, hp: duel.enemy.hp - 7, guard: 0, moon: duel.enemy.moon + 3 },
  };
  const fx = diffCombatFx(before, after);
  assert.deepEqual(fx, [
    { side: 'hero', text: '-4', tone: 'damage' },
    { side: 'hero', text: '+2 Guard', tone: 'guard' },
    { side: 'hero', text: '+3 mana', tone: 'mana' },
    { side: 'enemy', text: '-7', tone: 'damage' },
    { side: 'enemy', text: 'Guard broken', tone: 'guard-break' },
  ]);
  assert.deepEqual(diffCombatFx(before, before), []);

  const live: FloatFx[] = fx.map((entry, index) => ({ ...entry, id: index, startedAt: 1000 }));
  assert.equal(activeFloatFx(live, 1000 + FLOAT_FX_DURATION_MS).length, 0);
  assert.equal(activeFloatFx(live, 1200).length, fx.length);
  assert.match(renderFloatFx(live, 'enemy', 1250), /animation-delay:-250ms/);
  assert.equal(renderFloatFx(live, 'enemy', 5000), '');
  assert.equal(hitDelay(live, 'hero', 1100), 100);
  assert.equal(hitDelay(live, 'hero', 2000), null);
}

function testBattleViewDemoAffordances(): void {
  const run = createRun(2007);
  const duel = createRunDuel(run);
  const rules = buildRunDuelRules(run);
  const ui = new BattleUiStore('play');
  const tip = chooseCoachTip(duel, rules, defaultCoachPreferences());
  const view = createBattleView({ duel, rules, ui: ui.state, run, coachTip: tip });
  assert.match(view.html, /data-coach-tip="first-move"/);
  assert.match(view.html, /data-action="dismiss-coach:first-move"/);
  assert.match(view.html, /data-view="title"/, 'run battles can return to the title');

  const won: DuelState = { ...duel, winner: 'player', enemy: { ...duel.enemy, hp: 0 } };
  ui.update({ terminalFxAt: 1000 });
  const terminal = createBattleView({ duel: won, rules, ui: ui.state, run, now: 1200 });
  assert.match(terminal.html, /class="terminal-banner is-victory"/);
  assert.doesNotMatch(terminal.html, /Arena locked|Resolving cascades/, 'terminal board status names the outcome');
  assert.match(terminal.html, /Shade Knight falls/);
  const later = createBattleView({ duel: won, rules, ui: ui.state, run, now: 9000 });
  assert.doesNotMatch(later.html, /terminal-banner/);
}

function testTitleView(): void {
  const fresh = renderTitleView({ run: null, dailyKey: '2026-10-29', hintsEnabled: true, buildLabel: 'v0 · dev' });
  assert.doesNotMatch(fresh.html, /continue-run-save/);
  assert.match(fresh.html, /data-action="new-standard-run"/);
  assert.match(fresh.html, /data-action="new-daily-run"/);
  assert.match(fresh.html, /2026-10-29/);
  assert.match(fresh.html, /Coach hints: on/);
  assert.doesNotMatch(fresh.html, /<button[^>]*data-cell/, 'how-to-play gems are decorative');

  const run = createRun(2007);
  assert.deepEqual(titleContinueLabel(run), { label: 'Continue run', detail: 'Run 1/4 · Glass Edge' });
  const reward = resolveRunBattle(run, { ...createRunDuel(run), winner: 'player' });
  assert.match(titleContinueLabel(reward)?.detail ?? '', /prism choice after Glass Edge/);
  const next = chooseRunUpgrade(reward, reward.rewardOptions[0]);
  assert.match(titleContinueLabel(next)?.detail ?? '', /Run 2\/4 · Moon Lock/);
  const failed = resolveRunBattle(next, { ...createRunDuel(next), winner: 'enemy' });
  assert.deepEqual(titleContinueLabel(failed), { label: 'Last run recap', detail: 'Path fractured · 1/4 victories' });

  const resumed = renderTitleView({ run: next, dailyKey: '2026-10-29', hintsEnabled: false, buildLabel: 'v0 · dev' });
  assert.match(resumed.html, /data-action="continue-run-save"/);
  assert.match(resumed.html, /Replaces the saved run/);
  assert.match(resumed.html, /Coach hints: off/);
}

testCoachTipOrderAndGating();
testCoachPreferencesParsing();
testCombatFxDiffAndLifetime();
testBattleViewDemoAffordances();
testTitleView();

console.log('demo polish tests passed');
