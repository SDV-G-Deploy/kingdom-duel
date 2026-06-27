import { areAdjacent, cloneBoard, createBoard, findLegalMoves, findMatches, removeAndDrop, swapTiles } from './board';
import type { ActorId, ActorState, Board, Cell, DuelEvent, DuelState, MatchGroup, SwapResult, TileKind } from './types';

export function createDuel(seed = 2007): DuelState {
  const created = createBoard(8, 8, seed);
  return {
    board: created.board,
    player: createActor('player', 'Aurora Knight', 42),
    enemy: createActor('enemy', 'Shade Knight', 38),
    current: 'player',
    turn: 1,
    seed: created.seed,
    selected: null,
    winner: null,
    log: [
      'Aurora Knight enters the glass board.',
      'Match 4+ for an extra turn. Do not leave shade chains for the enemy.',
    ],
  };
}

export function applySwap(state: DuelState, from: Cell, to: Cell): SwapResult {
  if (state.winner) return { state, events: [] };
  if (!areAdjacent(from, to)) {
    return withLog(state, [{ type: 'invalid_swap', from, to }], 'Invalid swap: tiles must touch.');
  }

  const board = cloneBoard(state.board);
  swapTiles(board, from, to);
  if (findMatches(board).length === 0) {
    return withLog(state, [{ type: 'invalid_swap', from, to }], 'Invalid swap: no match created.');
  }

  const events: DuelEvent[] = [{ type: 'swap', actor: state.current, from, to }];
  const resolved = resolveBoard({ ...state, board }, state.current, events);
  return {
    state: appendLog(resolved.state, eventSummary(resolved.events, state.current)),
    events: resolved.events,
  };
}

export function runEnemyTurn(state: DuelState): SwapResult {
  if (state.current !== 'enemy' || state.winner) return { state, events: [] };
  const move = chooseEnemyMove(state.board);
  if (!move) {
    return withLog({ ...state, current: 'player' }, [{ type: 'board_refilled' }], 'Enemy found no move. Board breathes.');
  }

  const intent = scoreMove(state.board, move.from, move.to);
  const intentEvent: DuelEvent = { type: 'enemy_intent', text: `Shade Knight takes ${intent.label}.` };
  const swapped = applySwap(state, move.from, move.to);
  return {
    state: swapped.state,
    events: [intentEvent, ...swapped.events],
  };
}

function createActor(id: ActorId, name: string, hp: number): ActorState {
  return { id, name, hp, maxHp: hp, guard: id === 'player' ? 4 : 2, sun: 0, moon: 0, crown: 0 };
}

function resolveBoard(initial: DuelState, actor: ActorId, events: DuelEvent[]): SwapResult {
  let state = initial;
  let board = state.board;
  let seed = state.seed;
  let extraTurn = false;

  for (let cascade = 0; cascade < 16; cascade++) {
    const matches = findMatches(board);
    if (!matches.length) break;

    events.push({ type: 'cascade', count: cascade + 1 });
    const effects = applyMatchEffects(state, actor, matches);
    state = effects.state;
    events.push(...effects.events);
    if (matches.some((match) => match.cells.length >= 4)) extraTurn = true;
    const dropped = removeAndDrop(board, matches, seed);
    board = dropped.board;
    seed = dropped.seed;
  }

  state = { ...state, board, seed };

  if (findLegalMoves(state.board).length === 0) {
    const refilled = createBoard(state.board.width, state.board.height, state.seed);
    state = { ...state, board: refilled.board, seed: refilled.seed };
    events.push({ type: 'board_refilled' });
  }

  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    const winner: ActorId = state.enemy.hp <= 0 ? 'player' : 'enemy';
    events.push({ type: 'battle_ended', winner });
    return { state: { ...state, winner, current: winner }, events };
  }

  if (extraTurn) {
    events.push({ type: 'extra_turn', actor });
    return { state: { ...state, current: actor }, events };
  }

  const nextActor: ActorId = actor === 'player' ? 'enemy' : 'player';
  const nextTurn = nextActor === 'player' ? state.turn + 1 : state.turn;
  return { state: { ...state, current: nextActor, turn: nextTurn }, events };
}

function applyMatchEffects(state: DuelState, actor: ActorId, matches: MatchGroup[]): SwapResult {
  let next = state;
  const events: DuelEvent[] = [];

  for (const match of matches) {
    const amount = match.cells.length;
    events.push({ type: 'match', actor, tile: match.tile, cells: match.cells });

    if (match.tile === 'sword') {
      next = damage(next, actor, amount, events);
    } else if (match.tile === 'shield') {
      next = updateActor(next, actor, (unit) => ({ ...unit, guard: unit.guard + amount }));
      events.push({ type: 'guard', actor, amount });
    } else if (match.tile === 'sun' || match.tile === 'moon' || match.tile === 'crown') {
      const tile = match.tile;
      next = updateActor(next, actor, (unit) => ({ ...unit, [tile]: unit[tile] + amount }));
      events.push({ type: 'mana', actor, tile, amount });
    } else {
      next = damage(next, actor, amount * 2, events);
      if (actor === 'player') {
        next = updateActor(next, actor, (unit) => ({ ...unit, hp: Math.max(0, unit.hp - amount) }));
        events.push({ type: 'backlash', actor, amount });
      }
    }
  }

  return { state: next, events };
}

function damage(state: DuelState, actor: ActorId, amount: number, events: DuelEvent[]): DuelState {
  const target = actor === 'player' ? 'enemy' : 'player';
  let applied = amount;
  let blocked = 0;
  const next = updateActor(state, target, (unit) => {
    blocked = Math.min(unit.guard, applied);
    applied -= blocked;
    return { ...unit, guard: unit.guard - blocked, hp: Math.max(0, unit.hp - applied) };
  });

  events.push({ type: 'damage', actor, target, amount });
  return next;
}

function updateActor(state: DuelState, actor: ActorId, update: (actor: ActorState) => ActorState): DuelState {
  return actor === 'player' ? { ...state, player: update(state.player) } : { ...state, enemy: update(state.enemy) };
}

function chooseEnemyMove(board: Board): { from: Cell; to: Cell } | null {
  const moves = findLegalMoves(board);
  if (!moves.length) return null;
  return moves
    .map((move) => ({ move, score: scoreMove(board, move.from, move.to).score }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function scoreMove(board: Board, from: Cell, to: Cell): { score: number; label: string } {
  const test = cloneBoard(board);
  swapTiles(test, from, to);
  const matches = findMatches(test);
  let score = 0;
  const labels: string[] = [];

  for (const match of matches) {
    const value = match.cells.length;
    score += value;
    if (match.tile === 'shade') {
      score += value * 12;
      labels.push('shade damage');
    } else if (match.tile === 'sword') {
      score += value * 8;
      labels.push('swords');
    } else if (match.tile === 'shield') {
      score += value * 3;
      labels.push('guard');
    } else if (match.tile === 'crown') {
      score += value * 5;
      labels.push('crown charge');
    } else {
      score += value * 4;
      labels.push(`${match.tile} mana`);
    }
    if (match.cells.length >= 4) score += 18;
  }

  return { score, label: labels[0] ?? 'a safe move' };
}

function eventSummary(events: DuelEvent[], actor: ActorId): string {
  const matches = events.filter((event) => event.type === 'match');
  const extra = events.some((event) => event.type === 'extra_turn');
  const ended = events.find((event) => event.type === 'battle_ended');
  if (ended?.type === 'battle_ended') return `${label(actor)} wins the duel.`;
  if (!matches.length) return `${label(actor)} shifts the board.`;
  const first = matches[0];
  if (first.type !== 'match') return `${label(actor)} moves.`;
  return `${label(actor)} matched ${first.tile}${extra ? ' and keeps the turn' : ''}.`;
}

function label(actor: ActorId): string {
  return actor === 'player' ? 'Aurora Knight' : 'Shade Knight';
}

function appendLog(state: DuelState, message: string): DuelState {
  return { ...state, log: [message, ...state.log].slice(0, 6) };
}

function withLog(state: DuelState, events: DuelEvent[], message: string): SwapResult {
  return { state: appendLog(state, message), events };
}
