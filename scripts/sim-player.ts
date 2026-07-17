import { findLegalMoves, inBounds } from '../src/engine/board';
import { applySwap, castSpell } from '../src/engine/duel';
import type { Cell, DuelRules, DuelState, SwapResult } from '../src/engine/types';
import type { Strategy } from './sim-metrics';
import { chooseVisiblePlayerAction } from './visible-player-policy';

export function choosePlayerAction(state: DuelState, strategy: Strategy, rules: DuelRules): SwapResult {
  if (strategy === 'visible') return chooseVisiblePlayerAction(state, rules);
  const candidates: SwapResult[] = [];

  for (const move of findLegalMoves(state.board)) {
    candidates.push(applySwap(state, move.from, move.to, rules));
  }

  if (strategy === 'spell-aware') {
    for (const spellId of state.player.abilityIds) {
      for (const target of allCells(state)) {
        const result = castSpell(state, spellId, target, rules);
        if (!result.events.some((event) => event.type === 'invalid_spell')) candidates.push(result);
      }
    }
  }

  return candidates.sort((a, b) => scoreResult(state, b.state) - scoreResult(state, a.state))[0]
    ?? { state, events: [], frames: [] };
}

function scoreResult(before: DuelState, after: DuelState): number {
  if (after.winner === 'player') return 100000;
  if (after.winner === 'enemy') return -100000;

  const damageDealt = before.enemy.hp - after.enemy.hp;
  const hpLost = before.player.hp - after.player.hp;
  const guardGain = after.player.guard - before.player.guard;
  const manaGain =
    after.player.sun +
    after.player.moon +
    after.player.crown -
    before.player.sun -
    before.player.moon -
    before.player.crown;
  const enemyGuardLoss = before.enemy.guard - after.enemy.guard;
  const keptTurn = after.current === 'player' ? 1 : 0;

  return damageDealt * 16 - hpLost * 18 + guardGain * 4 + manaGain * 2 + enemyGuardLoss * 3 + keptTurn * 12;
}

function allCells(state: DuelState): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < state.board.height; y++) {
    for (let x = 0; x < state.board.width; x++) {
      const cell = { x, y };
      if (inBounds(state.board, cell)) cells.push(cell);
    }
  }
  return cells;
}
