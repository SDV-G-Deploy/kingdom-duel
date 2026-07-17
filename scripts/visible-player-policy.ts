import { cloneBoard, findLegalMoves, findMatches, getTile, setTile } from '../src/engine/board';
import { dispatchGameAction, previewSwap } from '../src/engine/duel';
import { cellsAround, matchReward } from '../src/engine/rewards';
import type {
  AbilityDefinition,
  ActorId,
  Cell,
  DuelRules,
  DuelState,
  GameAction,
  MovePreview,
  SwapResult,
  TileEffect,
  TileKind,
} from '../src/engine/types';

type VisibleTally = {
  damage: number;
  guard: number;
  mana: number;
  backlash: number;
  setup: number;
  extraTurn: boolean;
};

type Candidate = { action: GameAction; score: number };

export function chooseVisiblePlayerAction(state: DuelState, rules: DuelRules): SwapResult {
  const candidates: Candidate[] = [];

  for (const move of findLegalMoves(state.board)) {
    const preview = previewSwap(state.board, move.from, move.to, rules, 'player');
    if (!preview.valid) continue;
    candidates.push({
      action: { type: 'swap', actor: 'player', from: move.from, to: move.to },
      score: scoreSwapPreview(state, preview),
    });
  }

  for (const abilityId of state.player.abilityIds) {
    const ability = rules.abilities[abilityId];
    if (!ability || !canPayAbility(state, ability)) continue;
    for (const target of abilityTargets(state, ability)) {
      candidates.push({
        action: { type: 'cast', actor: 'player', abilityId, target },
        score: scoreVisibleAbility(state, ability, target, rules),
      });
    }
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  return best ? dispatchGameAction(state, best.action, rules) : { state, events: [], frames: [] };
}

function scoreSwapPreview(state: DuelState, preview: Extract<MovePreview, { valid: true }>): number {
  const tally = emptyTally();
  for (const effect of preview.effects) {
    if (effect.tone === 'damage') tally.damage += effect.value;
    else if (effect.tone === 'guard') tally.guard += effect.value;
    else if (effect.tone === 'mana') tally.mana += effect.value;
    else tally.backlash += effect.value;
  }
  tally.extraTurn = preview.extraTurn;
  return scoreTally(state, tally);
}

function scoreVisibleAbility(
  state: DuelState,
  ability: AbilityDefinition,
  target: Cell,
  rules: DuelRules,
): number {
  const board = cloneBoard(state.board);
  const tally = emptyTally();
  tally.mana -= Object.values(ability.cost).reduce((sum, amount) => sum + (amount ?? 0), 0);
  let boardWasConverted = false;
  let rowWasCleared = false;

  for (const effect of ability.effects) {
    if (effect.type === 'gain_guard') {
      tally.guard += effect.amount;
    } else if (effect.type === 'convert_tiles') {
      const cells = cellsAround(board, target, effect.radius).filter((cell) =>
        (effect.shape !== 'cross' || cell.x === target.x || cell.y === target.y) &&
        (effect.from === undefined || getTile(board, cell) === effect.from),
      );
      for (const cell of cells) {
        if (getTile(board, cell) === effect.to) continue;
        setTile(board, cell, effect.to);
        tally.setup += 0.4;
        boardWasConverted = true;
      }
    } else {
      rowWasCleared = true;
      const counts = new Map<TileKind, number>();
      for (let x = 0; x < board.width; x++) {
        const tile = getTile(board, { x, y: target.y });
        counts.set(tile, (counts.get(tile) ?? 0) + 1);
      }
      for (const [tile, amount] of counts) addTileValue(tally, tile, amount, rules, 'player');
    }
  }

  if (boardWasConverted && !rowWasCleared) {
    for (const match of findMatches(board)) {
      const reward = matchReward(match, rules);
      addTileValue(tally, match.tile, reward.effectAmount, rules, 'player');
      if (reward.extraTurn) tally.extraTurn = true;
      if (reward.createsSpecial) tally.setup += 8;
    }
  }

  return scoreTally(state, tally);
}

function addTileValue(
  tally: VisibleTally,
  tile: TileKind,
  amount: number,
  rules: DuelRules,
  actor: ActorId,
): void {
  const effect = rules.tiles[tile].effect;
  if (effect.type === 'damage') tally.damage += amount * effect.amountPerTile;
  else if (effect.type === 'guard') tally.guard += amount * effect.amountPerTile;
  else if (effect.type === 'mana') tally.mana += amount * effect.amountPerTile;
  else if (effect.type === 'risky_damage') {
    tally.damage += amount * effect.amountPerTile;
    if (actor === 'player') tally.backlash += amount * effect.playerBacklashPerTile;
  } else {
    tally.damage += specialDamage(effect, actor);
  }
}

function specialDamage(effect: Extract<TileEffect, { type: 'special' }>, actor: ActorId): number {
  return effect.actorModifiers?.[actor]?.damage ?? effect.damage;
}

function scoreTally(state: DuelState, tally: VisibleTally): number {
  if (tally.backlash >= state.player.hp) return -100000;
  const guardBroken = Math.min(state.enemy.guard, tally.damage);
  const hpDamage = Math.max(0, tally.damage - state.enemy.guard);
  if (hpDamage >= state.enemy.hp) return 100000;
  return hpDamage * 16 + guardBroken * 3 + tally.guard * 4 + tally.mana * 2 -
    tally.backlash * 18 + tally.setup + (tally.extraTurn ? 12 : 0);
}

function canPayAbility(state: DuelState, ability: AbilityDefinition): boolean {
  return state.player.sun >= (ability.cost.sun ?? 0) &&
    state.player.moon >= (ability.cost.moon ?? 0) &&
    state.player.crown >= (ability.cost.crown ?? 0);
}

function abilityTargets(state: DuelState, ability: AbilityDefinition): Cell[] {
  if (ability.target === 'row') {
    return Array.from({ length: state.board.height }, (_, y) => ({ x: 0, y }));
  }
  return Array.from({ length: state.board.width * state.board.height }, (_, index) => ({
    x: index % state.board.width,
    y: Math.floor(index / state.board.width),
  }));
}

function emptyTally(): VisibleTally {
  return { damage: 0, guard: 0, mana: 0, backlash: 0, setup: 0, extraTurn: false };
}
