import { strict as assert } from 'node:assert';
import { findLegalMoves } from './board';
import { createDuel, dispatchGameAction, replayDuel, runEnemyTurn } from './duel';
import { DEFAULT_DUEL_RULES } from './rules';
import type { Board, DuelRules, GameAction } from './types';

function testAcceptedActionProducesLogAndOrderedFrames(): void {
  const state = createDuel(2007);
  const move = findLegalMoves(state.board)[0];
  const action: GameAction = { type: 'swap', actor: 'player', from: move.from, to: move.to };

  const result = dispatchGameAction(state, action);
  const kinds = result.frames.map((frame) => frame.kind);

  assert.equal(result.rejection, undefined);
  assert.equal(result.state.actionLog.length, 1);
  assert.equal(result.state.actionLog[0]?.accepted, true);
  assert.deepEqual(result.state.actionLog[0]?.action, action);
  assert.ok(kinds.indexOf('swap') < kinds.indexOf('cascade'));
  assert.ok(kinds.indexOf('cascade') < kinds.indexOf('match'));
  assert.ok(kinds.indexOf('match') < kinds.indexOf('fall'));
  assert.equal(kinds[kinds.length - 1], 'turn');
  assert.deepEqual(result.frames.map((frame) => frame.index), result.frames.map((_, index) => index + 1));
  assert.doesNotThrow(() => JSON.stringify(result.state.actionLog));
}

function testRejectedActionIsStructuredAndReplayable(): void {
  const state = createDuel(2007);
  const move = findLegalMoves(state.board)[0];
  const action: GameAction = { type: 'swap', actor: 'enemy', from: move.from, to: move.to };

  const result = dispatchGameAction(state, action);

  assert.equal(result.rejection?.code, 'not_actor_turn');
  assert.equal(result.frames.length, 0);
  assert.equal(result.state.actionLog.length, 1);
  assert.equal(result.state.actionLog[0]?.accepted, false);
  assert.equal(result.state.actionLog[0]?.rejection?.code, 'not_actor_turn');
  assert.deepEqual(replayDuel(state.initialSeed, [action]), result.state);
}

function testFrameSnapshotsAreDetachedAndExposeDamage(): void {
  let result: ReturnType<typeof dispatchGameAction> | null = null;

  for (let seed = 1; seed <= 200 && !result; seed++) {
    const state = createDuel(seed);
    for (const move of findLegalMoves(state.board)) {
      const candidate = dispatchGameAction(state, { type: 'swap', actor: 'player', from: move.from, to: move.to });
      if (candidate.frames.some((frame) => frame.kind === 'damage')) result = candidate;
    }
  }

  assert.ok(result, 'expected a deterministic opening move that produces damage');
  const damageFrame = result.frames.find((frame) => frame.kind === 'damage');
  const damageEvent = damageFrame?.events.find((event) => event.type === 'damage');
  assert.ok(damageFrame && damageEvent?.type === 'damage');
  assert.equal(damageFrame.snapshot.enemy.hp, result.state.enemy.maxHp - damageEvent.hpDamage);

  const swapFrame = result.frames.find((frame) => frame.kind === 'swap');
  assert.ok(swapFrame);
  const capturedTile = swapFrame.snapshot.board.tiles[0];
  result.state.board.tiles[0] = capturedTile === 'sun' ? 'moon' : 'sun';
  assert.equal(swapFrame.snapshot.board.tiles[0], capturedTile);
}

function testReplayReproducesInteractiveState(): void {
  let state = createDuel(707);

  for (let index = 0; index < 20 && !state.winner; index++) {
    if (state.current === 'enemy') {
      state = runEnemyTurn(state).state;
      continue;
    }
    const move = findLegalMoves(state.board)[0];
    state = dispatchGameAction(state, { type: 'swap', actor: 'player', from: move.from, to: move.to }).state;
  }

  const replay = replayDuel(state.initialSeed, state.actionLog, DEFAULT_DUEL_RULES, 'interactive');
  const simulationReplay = replayDuel(state.initialSeed, state.actionLog, DEFAULT_DUEL_RULES, 'simulation');
  assert.deepEqual(replay, state);
  assert.deepEqual(comparableCore(simulationReplay), comparableCore(state));
}

function comparableCore(state: ReturnType<typeof createDuel>): object {
  return {
    initialSeed: state.initialSeed,
    board: state.board,
    player: state.player,
    enemy: state.enemy,
    current: state.current,
    turn: state.turn,
    seed: state.seed,
    winner: state.winner,
    actionLog: state.actionLog,
  };
}

function testSimulationModeSkipsPresentationData(): void {
  const state = createDuel(2007, DEFAULT_DUEL_RULES, 'simulation');
  const move = findLegalMoves(state.board)[0];
  const result = dispatchGameAction(state, { type: 'swap', actor: 'player', from: move.from, to: move.to });

  assert.deepEqual(state.log, []);
  assert.deepEqual(state.history, []);
  assert.deepEqual(result.state.log, []);
  assert.deepEqual(result.state.history, []);
  assert.equal(result.frames.length, 0);
  assert.equal(result.state.actionLog.length, 1);
  assert.equal(result.state.actionLog[0]?.accepted, true);
}

function testAbilityAndNoMoveRefillHaveDedicatedFrames(): void {
  const base = createDuel(2007);
  const spellState = { ...base, player: { ...base.player, sun: 8 } };
  const spell = dispatchGameAction(spellState, {
    type: 'cast',
    actor: 'player',
    abilityId: 'sun_bloom',
    target: { x: 3, y: 3 },
  });

  assert.equal(spell.frames[0]?.kind, 'ability');
  assert.equal(spell.frames[0]?.snapshot.player.sun, 0, 'ability frame must show the paid mana cost');
  assert.ok(spell.frames.some((frame) => frame.kind === 'ability_effect'));
  assert.equal(spell.state.actionLog[0]?.action.type, 'cast');

  const rules: DuelRules = { ...DEFAULT_DUEL_RULES, board: { width: 3, height: 3 }, openingLog: [] };
  const refillBase = createDuel(91, rules);
  const board: Board = {
    width: 3,
    height: 3,
    tiles: ['sun', 'moon', 'crown', 'moon', 'crown', 'sun', 'crown', 'sun', 'moon'],
  };
  const refillState = { ...refillBase, board, current: 'enemy' as const, seed: 12345 };
  const refill = dispatchGameAction(refillState, { type: 'refill', actor: 'enemy' }, rules);

  assert.deepEqual(refill.frames.map((frame) => frame.kind), ['refill', 'turn']);
  assert.equal(refill.state.current, 'player');
  assert.equal(refill.state.turn, refillState.turn + 1);
  assert.equal(refill.state.actionLog[0]?.accepted, true);
}

testAcceptedActionProducesLogAndOrderedFrames();
testRejectedActionIsStructuredAndReplayable();
testFrameSnapshotsAreDetachedAndExposeDamage();
testReplayReproducesInteractiveState();
testSimulationModeSkipsPresentationData();
testAbilityAndNoMoveRefillHaveDedicatedFrames();

console.log('action and resolution frame tests passed');
