import {
  areAdjacent,
  cloneBoard,
  createBoard,
  findLegalMoves,
  findMatches,
  getTile,
  inBounds,
  removeAndDrop,
  setTile,
  swapTiles,
} from './board';
import { DEFAULT_DUEL_RULES } from './rules';
import type {
  ActorId,
  ActorState,
  Board,
  Cell,
  DuelEvent,
  DuelRules,
  DuelState,
  EnemyIntent,
  MatchGroup,
  MovePreview,
  PreviewEffect,
  SpellId,
  SwapResult,
  TileKind,
} from './types';

export function createDuel(seed = 2007, rules: DuelRules = DEFAULT_DUEL_RULES): DuelState {
  const created = createBoard(rules.board.width, rules.board.height, seed);
  return {
    board: created.board,
    player: createActor('player', rules),
    enemy: createActor('enemy', rules),
    current: 'player',
    turn: 1,
    seed: created.seed,
    selected: null,
    winner: null,
    log: rules.openingLog,
  };
}

export function applySwap(
  state: DuelState,
  from: Cell,
  to: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
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
  const resolved = resolveBoard({ ...state, board }, state.current, events, rules);
  return {
    state: appendLog(resolved.state, eventSummary(resolved.events, state.current)),
    events: resolved.events,
  };
}

export function runEnemyTurn(state: DuelState, rules: DuelRules = DEFAULT_DUEL_RULES): SwapResult {
  if (state.current !== 'enemy' || state.winner) return { state, events: [] };
  const move = chooseEnemyMove(state.board, rules);
  if (!move) {
    return withLog({ ...state, current: 'player' }, [{ type: 'board_refilled' }], 'Enemy found no move. Board breathes.');
  }

  const intent = scoreMove(state.board, move.from, move.to, rules);
  const intentEvent: DuelEvent = { type: 'enemy_intent', text: `${rules.enemy.name} takes ${intent.label}.` };
  const swapped = applySwap(state, move.from, move.to, rules);
  return {
    state: swapped.state,
    events: [intentEvent, ...swapped.events],
  };
}

export function castSpell(
  state: DuelState,
  spellId: SpellId,
  target: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  if (state.winner) return { state, events: [] };
  if (state.current !== 'player') {
    return withLog(state, [{ type: 'invalid_spell', spell: spellId, reason: 'not player turn' }], 'Spell failed: not your turn.');
  }
  if (!inBounds(state.board, target)) {
    return withLog(state, [{ type: 'invalid_spell', spell: spellId, reason: 'target outside board' }], 'Spell failed: target outside board.');
  }

  const spell = rules.spells[spellId];
  if (!canPayCost(state.player, spell.cost)) {
    return withLog(state, [{ type: 'invalid_spell', spell: spellId, reason: 'not enough mana' }], `${spell.name} needs more mana.`);
  }

  let next = updateActor(state, 'player', (unit) => payCost(unit, spell.cost));
  const actor: ActorId = 'player';
  const events: DuelEvent[] = [{ type: 'spell_cast', actor, spell: spellId, target }];
  let board = cloneBoard(next.board);
  let seed = next.seed;

  if (spell.id === 'sun_bloom') {
    const cells = cellsInRadius(board, target, spell.radius);
    for (const cell of cells) setTile(board, cell, spell.convertTo);
    events.push({ type: 'tiles_converted', actor, to: spell.convertTo, cells });
    next = { ...next, board };
  } else if (spell.id === 'glass_ward') {
    next = updateActor(next, actor, (unit) => ({ ...unit, guard: unit.guard + spell.guard }));
    events.push({ type: 'guard', actor, amount: spell.guard });
    const cells = cellsInRadius(board, target, spell.radius).filter((cell) => getTile(board, cell) === spell.fromTile);
    for (const cell of cells) setTile(board, cell, spell.convertTo);
    events.push({ type: 'tiles_converted', actor, from: spell.fromTile, to: spell.convertTo, cells });
    next = { ...next, board };
  } else {
    const cells = Array.from({ length: board.width }, (_, x) => ({ x, y: target.y }));
    const collected = collectTiles(board, cells);
    for (const [tile, amount] of collected) {
      next = applyTileEffect(next, actor, tile, amount, events);
    }
    const dropped = removeAndDrop(board, [{ tile: getTile(board, cells[0]), cells }], seed);
    board = dropped.board;
    seed = dropped.seed;
    events.push({ type: 'row_cleared', actor, row: target.y, cells });
    next = { ...next, board, seed };
  }

  const resolved = resolveBoard(next, actor, events, rules);
  return {
    state: appendLog(resolved.state, eventSummary(resolved.events, actor)),
    events: resolved.events,
  };
}

export function previewSwap(board: Board, from: Cell, to: Cell, rules: DuelRules = DEFAULT_DUEL_RULES): MovePreview {
  if (!areAdjacent(from, to)) {
    return { valid: false, from, to, reason: 'tiles must touch' };
  }

  const test = cloneBoard(board);
  swapTiles(test, from, to);
  const matches = findMatches(test);
  if (!matches.length) {
    return { valid: false, from, to, reason: 'no match created' };
  }

  const effects = previewEffects(matches, rules);
  const extraTurn = matches.some((match) => match.cells.length >= rules.match.extraTurnLength);
  const score = scorePreview(matches, rules);
  return {
    valid: true,
    from,
    to,
    matches,
    effects,
    extraTurn,
    summary: previewSummary(effects, extraTurn),
    score,
  };
}

export function getEnemyIntent(board: Board, rules: DuelRules = DEFAULT_DUEL_RULES): EnemyIntent | null {
  const moves = findLegalMoves(board);
  if (!moves.length) return null;

  const ranked = moves
    .map((move) => {
      const preview = previewSwap(board, move.from, move.to, rules);
      return preview.valid ? { ...move, preview } : null;
    })
    .filter((move): move is { from: Cell; to: Cell; preview: Extract<MovePreview, { valid: true }> } => !!move)
    .sort((a, b) => b.preview.score - a.preview.score);

  const best = ranked[0];
  return best ? { from: best.from, to: best.to, preview: best.preview } : null;
}

function createActor(id: ActorId, rules: DuelRules): ActorState {
  const template = rules.actors[id];
  return {
    id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    guard: template.guard,
    sun: 0,
    moon: 0,
    crown: 0,
  };
}

function resolveBoard(initial: DuelState, actor: ActorId, events: DuelEvent[], rules: DuelRules): SwapResult {
  let state = initial;
  let board = state.board;
  let seed = state.seed;
  let extraTurn = false;

  for (let cascade = 0; cascade < rules.match.maxCascades; cascade++) {
    const matches = findMatches(board);
    if (!matches.length) break;

    events.push({ type: 'cascade', count: cascade + 1 });
    const effects = applyMatchEffects(state, actor, matches, rules);
    state = effects.state;
    events.push(...effects.events);
    if (matches.some((match) => match.cells.length >= rules.match.extraTurnLength)) extraTurn = true;
    const dropped = removeAndDrop(board, matches, seed);
    board = dropped.board;
    seed = dropped.seed;
  }

  state = { ...state, board, seed };

  if (findLegalMoves(state.board).length === 0) {
    const refilled = createBoard(rules.board.width, rules.board.height, state.seed);
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

function applyMatchEffects(state: DuelState, actor: ActorId, matches: MatchGroup[], rules: DuelRules): SwapResult {
  let next = state;
  const events: DuelEvent[] = [];

  for (const match of matches) {
    const amount = match.cells.length;
    events.push({ type: 'match', actor, tile: match.tile, cells: match.cells });
    next = applyTileEffect(next, actor, match.tile, amount, events, rules);
  }

  return { state: next, events };
}

function applyTileEffect(
  state: DuelState,
  actor: ActorId,
  tile: TileKind,
  amount: number,
  events: DuelEvent[],
  rules: DuelRules = DEFAULT_DUEL_RULES,
): DuelState {
  const effect = rules.tiles[tile].effect;
  const scaled = amount * effect.amountPerTile;
  if (effect.type === 'damage') {
    return damage(state, actor, scaled, events);
  }
  if (effect.type === 'guard') {
    const next = updateActor(state, actor, (unit) => ({ ...unit, guard: unit.guard + scaled }));
    events.push({ type: 'guard', actor, amount: scaled });
    return next;
  }
  if (effect.type === 'mana') {
    const next = updateActor(state, actor, (unit) => ({ ...unit, [effect.mana]: unit[effect.mana] + scaled }));
    events.push({ type: 'mana', actor, tile: effect.mana, amount: scaled });
    return next;
  }

  let next = damage(state, actor, scaled, events);
  if (actor === 'player' && effect.playerBacklashPerTile > 0) {
    const backlash = amount * effect.playerBacklashPerTile;
    next = updateActor(next, actor, (unit) => ({ ...unit, hp: Math.max(0, unit.hp - backlash) }));
    events.push({ type: 'backlash', actor, amount: backlash });
  }
  return next;
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

function canPayCost(actor: ActorState, cost: Partial<Record<'sun' | 'moon' | 'crown', number>>): boolean {
  return (actor.sun >= (cost.sun ?? 0) && actor.moon >= (cost.moon ?? 0) && actor.crown >= (cost.crown ?? 0));
}

function payCost(actor: ActorState, cost: Partial<Record<'sun' | 'moon' | 'crown', number>>): ActorState {
  return {
    ...actor,
    sun: actor.sun - (cost.sun ?? 0),
    moon: actor.moon - (cost.moon ?? 0),
    crown: actor.crown - (cost.crown ?? 0),
  };
}

function cellsInRadius(board: Board, target: Cell, radius: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = target.y - radius; y <= target.y + radius; y++) {
    for (let x = target.x - radius; x <= target.x + radius; x++) {
      const cell = { x, y };
      if (inBounds(board, cell)) cells.push(cell);
    }
  }
  return cells;
}

function collectTiles(board: Board, cells: Cell[]): Map<TileKind, number> {
  const collected = new Map<TileKind, number>();
  for (const cell of cells) {
    const tile = getTile(board, cell);
    collected.set(tile, (collected.get(tile) ?? 0) + 1);
  }
  return collected;
}

function chooseEnemyMove(board: Board, rules: DuelRules): { from: Cell; to: Cell } | null {
  const moves = findLegalMoves(board);
  if (!moves.length) return null;
  return moves
    .map((move) => ({ move, score: scoreMove(board, move.from, move.to, rules).score }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function scoreMove(board: Board, from: Cell, to: Cell, rules: DuelRules): { score: number; label: string } {
  const test = cloneBoard(board);
  swapTiles(test, from, to);
  const matches = findMatches(test);
  const score = scorePreview(matches, rules);
  const labels: string[] = [];

  for (const match of matches) {
    const tileRule = rules.tiles[match.tile];
    labels.push(tileRule.label);
  }

  return { score, label: labels[0] ?? 'a safe move' };
}

function scorePreview(matches: MatchGroup[], rules: DuelRules): number {
  let score = 0;
  for (const match of matches) {
    const value = match.cells.length;
    const tileRule = rules.tiles[match.tile];
    score += value + value * tileRule.enemyScorePerTile;
    if (match.cells.length >= rules.match.extraTurnLength) score += rules.enemy.extraTurnScore;
  }
  return score;
}

function previewEffects(matches: MatchGroup[], rules: DuelRules): PreviewEffect[] {
  const effects = new Map<string, PreviewEffect>();

  for (const match of matches) {
    const amount = match.cells.length;
    const effect = rules.tiles[match.tile].effect;
    if (effect.type === 'damage') {
      addPreviewEffect(effects, 'damage', amount * effect.amountPerTile, 'damage');
    } else if (effect.type === 'guard') {
      addPreviewEffect(effects, 'guard', amount * effect.amountPerTile, 'guard');
    } else if (effect.type === 'mana') {
      addPreviewEffect(effects, effect.mana, amount * effect.amountPerTile, 'mana');
    } else {
      addPreviewEffect(effects, 'shade damage', amount * effect.amountPerTile, 'damage');
      if (effect.playerBacklashPerTile > 0) {
        addPreviewEffect(effects, 'backlash', amount * effect.playerBacklashPerTile, 'risk');
      }
    }
  }

  return [...effects.values()];
}

function addPreviewEffect(effects: Map<string, PreviewEffect>, label: string, value: number, tone: PreviewEffect['tone']): void {
  const current = effects.get(label);
  effects.set(label, { label, value: (current?.value ?? 0) + value, tone });
}

function previewSummary(effects: PreviewEffect[], extraTurn: boolean): string {
  const parts = effects.map((effect) => `${effect.tone === 'risk' ? '-' : '+'}${effect.value} ${effect.label}`);
  if (extraTurn) parts.push('extra turn');
  return parts.join(', ');
}

function eventSummary(events: DuelEvent[], actor: ActorId): string {
  const spell = events.find((event) => event.type === 'spell_cast');
  const matches = events.filter((event) => event.type === 'match');
  const extra = events.some((event) => event.type === 'extra_turn');
  const ended = events.find((event) => event.type === 'battle_ended');
  if (ended?.type === 'battle_ended') return `${label(actor)} wins the duel.`;
  if (spell?.type === 'spell_cast') return `${label(actor)} cast ${DEFAULT_DUEL_RULES.spells[spell.spell].name}${extra ? ' and keeps the turn' : ''}.`;
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
