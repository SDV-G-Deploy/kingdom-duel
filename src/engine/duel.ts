import { assertValidDuelRules } from '../content/validation';
import {
  areAdjacent,
  cloneBoard,
  createBoard,
  findLegalMoves,
  findMatches,
  getTile,
  inBounds,
  isLegalSwap,
  removeAndDrop,
  setTile,
  swapTiles,
} from './board';
import { DEFAULT_DUEL_RULES } from './rules';
import { chooseEnemyIntent } from './enemy-policy';
import {
  cellsAround,
  matchReward,
  matchesWithoutSpecialAnchors,
  specialCreations,
} from './rewards';
import type {
  ActionRecord,
  ActionRejection,
  ActionRejectionCode,
  ActorId,
  ActorSnapshot,
  ActorState,
  AbilityDefinition,
  AbilityId,
  BattleLogEntry,
  Board,
  Cell,
  DuelEvent,
  DuelRules,
  DuelRuntimeMode,
  DuelState,
  EnemyIntent,
  GameAction,
  MatchGroup,
  MovePreview,
  PreviewEffect,
  ResolutionFrame,
  ResolutionFrameKind,
  SwapResult,
  TileEffect,
  TileKind,
} from './types';

export function createDuel(
  seed = 2007,
  rules: DuelRules = DEFAULT_DUEL_RULES,
  mode: DuelRuntimeMode = 'interactive',
): DuelState {
  assertValidDuelRules(rules);
  const created = createBoard(rules.board.width, rules.board.height, seed);
  const state: DuelState = {
    initialSeed: seed,
    mode,
    board: created.board,
    player: createActor('player', rules),
    enemy: createActor('enemy', rules),
    current: 'player',
    turn: 1,
    seed: created.seed,
    selected: null,
    winner: null,
    log: mode === 'interactive' ? [...rules.openingLog] : [],
    history: [],
    actionLog: [],
  };
  if (mode === 'simulation') return state;
  return {
    ...state,
    history: rules.openingLog.map((message, index) =>
      createBattleLogEntry(state, state, 'system', message, message, [], index + 1),
    ),
  };
}

export function applySwap(
  state: DuelState,
  from: Cell,
  to: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  return dispatchGameAction(state, { type: 'swap', actor: state.current, from, to }, rules);
}

export function runEnemyTurn(state: DuelState, rules: DuelRules = DEFAULT_DUEL_RULES): SwapResult {
  if (state.current !== 'enemy' || state.winner) return emptyResolution(state);
  const intent = getEnemyIntent(state, rules);
  if (!intent) {
    return dispatchGameAction(state, { type: 'refill', actor: 'enemy' }, rules);
  }

  const intentEvent: DuelEvent = {
    type: 'enemy_intent',
    text: intent.type === 'ability'
      ? `${state.enemy.name} opens ${rules.abilities[intent.abilityId].name}.`
      : `${state.enemy.name} takes ${intent.preview.matches[0] ? rules.tiles[intent.preview.matches[0].tile].label : 'a safe move'}.`,
  };
  const resolved = intent.type === 'ability'
    ? dispatchGameAction(state, {
        type: 'cast',
        actor: 'enemy',
        abilityId: intent.abilityId,
        target: intent.target,
      }, rules)
    : dispatchGameAction(state, { type: 'swap', actor: 'enemy', from: intent.from, to: intent.to }, rules);
  return {
    state: resolved.state,
    events: [intentEvent, ...resolved.events],
    frames: resolved.frames,
    rejection: resolved.rejection,
  };
}

export function castSpell(
  state: DuelState,
  spellId: AbilityId,
  target: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  return dispatchGameAction(state, { type: 'cast', actor: 'player', abilityId: spellId, target }, rules);
}

export function castAbility(
  state: DuelState,
  actor: ActorId,
  abilityId: AbilityId,
  target: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  return dispatchGameAction(state, { type: 'cast', actor, abilityId, target }, rules);
}

export function dispatchGameAction(
  state: DuelState,
  action: GameAction,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  if (state.winner) {
    return rejectAction(state, action, 'battle_ended', 'Battle already ended.', [], rules);
  }
  if (state.current !== action.actor) {
    const message = action.type === 'cast'
      ? action.actor === 'player' ? 'Spell failed: not your turn.' : 'Ability failed: not the enemy turn.'
      : `Action failed: it is ${state.current}'s turn.`;
    const legacy = action.type === 'cast'
      ? [{ type: 'invalid_spell' as const, spell: action.abilityId, reason: action.actor === 'player' ? 'not player turn' : 'not actor turn' }]
      : action.type === 'swap' ? [{ type: 'invalid_swap' as const, from: action.from, to: action.to }] : [];
    return rejectAction(state, action, 'not_actor_turn', message, legacy, rules);
  }

  if (action.type === 'swap') {
    if (!inBounds(state.board, action.from) || !inBounds(state.board, action.to)) {
      return rejectAction(
        state,
        action,
        'target_outside_board',
        'Invalid swap: target outside board.',
        [{ type: 'invalid_swap', from: action.from, to: action.to }],
        rules,
      );
    }
    if (!areAdjacent(action.from, action.to)) {
      return rejectAction(
        state,
        action,
        'tiles_not_adjacent',
        'Invalid swap: tiles must touch.',
        [{ type: 'invalid_swap', from: action.from, to: action.to }],
        rules,
      );
    }
    if (!isLegalSwap(state.board, action.from, action.to)) {
      return rejectAction(
        state,
        action,
        'swap_creates_no_match',
        'Invalid swap: no match created.',
        [{ type: 'invalid_swap', from: action.from, to: action.to }],
        rules,
      );
    }
    return acceptAction(state, action, performSwap(state, action, rules));
  }

  if (action.type === 'cast') {
    if (!inBounds(state.board, action.target)) {
      return rejectAction(
        state,
        action,
        'target_outside_board',
        'Ability failed: target outside board.',
        [{ type: 'invalid_spell', spell: action.abilityId, reason: 'target outside board' }],
        rules,
      );
    }
    const ability = rules.abilities[action.abilityId];
    if (!ability) {
      return rejectAction(
        state,
        action,
        'unknown_ability',
        'Ability failed: unknown ability.',
        [{ type: 'invalid_spell', spell: action.abilityId, reason: 'unknown ability' }],
        rules,
      );
    }
    if (!state[action.actor].abilityIds.includes(action.abilityId)) {
      return rejectAction(
        state,
        action,
        'ability_not_equipped',
        `${state[action.actor].name} does not have ${ability.name} equipped.`,
        [{ type: 'invalid_spell', spell: action.abilityId, reason: 'ability not equipped' }],
        rules,
      );
    }
    if (!canPayCost(state[action.actor], ability.cost)) {
      return rejectAction(
        state,
        action,
        'not_enough_mana',
        `${ability.name} needs more mana.`,
        [{ type: 'invalid_spell', spell: action.abilityId, reason: 'not enough mana' }],
        rules,
      );
    }
    return acceptAction(state, action, performAbility(state, action, ability, rules));
  }

  if (findLegalMoves(state.board).length > 0) {
    return rejectAction(state, action, 'legal_moves_available', 'Board refill requires no legal moves.', [], rules);
  }
  return acceptAction(state, action, performRefill(state, action.actor, rules));
}

export function replayDuel(
  initialSeed: number,
  actions: ReadonlyArray<GameAction | ActionRecord>,
  rules: DuelRules = DEFAULT_DUEL_RULES,
  mode: DuelRuntimeMode = 'interactive',
): DuelState {
  let state = createDuel(initialSeed, rules, mode);
  for (const entry of actions) {
    const action = 'action' in entry ? entry.action : entry;
    state = dispatchGameAction(state, action, rules).state;
  }
  return state;
}

function performSwap(
  state: DuelState,
  action: Extract<GameAction, { type: 'swap' }>,
  rules: DuelRules,
): SwapResult {
  const fromTile = getTile(state.board, action.from);
  const toTile = getTile(state.board, action.to);
  const board = cloneBoard(state.board);
  swapTiles(board, action.from, action.to);
  const swapped = { ...state, board };
  const event: DuelEvent = { type: 'swap', actor: action.actor, from: action.from, to: action.to };
  const events: DuelEvent[] = [event];
  const frames: ResolutionFrame[] = [];
  pushFrame(frames, 'swap', swapped, [event]);

  const specialCell = fromTile === 'aether' ? action.to : toTile === 'aether' ? action.from : null;
  const afterSpecial = specialCell
    ? activateSpecial(swapped, action.actor, specialCell, events, frames, rules)
    : swapped;
  const resolved = resolveBoard(afterSpecial, action.actor, events, frames, rules);
  const summary = eventSummary(resolved.events, action.actor, state, rules);
  return {
    ...resolved,
    state: recordBattleEntry(state, resolved.state, action.actor, summary, resolved.events, rules),
  };
}

function performAbility(
  state: DuelState,
  action: Extract<GameAction, { type: 'cast' }>,
  ability: AbilityDefinition,
  rules: DuelRules,
): SwapResult {
  let next = updateActor(state, action.actor, (unit) => payCost(unit, ability.cost));
  const castEvent: DuelEvent = { type: 'spell_cast', actor: action.actor, spell: action.abilityId, target: action.target };
  const events: DuelEvent[] = [castEvent];
  const frames: ResolutionFrame[] = [];
  pushFrame(frames, 'ability', next, [castEvent]);
  next = executeAbilityEffects(next, action.actor, ability, action.target, events, frames, rules);

  const resolved = resolveBoard(next, action.actor, events, frames, rules);
  const summary = eventSummary(resolved.events, action.actor, state, rules);
  return {
    ...resolved,
    state: recordBattleEntry(state, resolved.state, action.actor, summary, resolved.events, rules),
  };
}

function performRefill(state: DuelState, actor: ActorId, rules: DuelRules): SwapResult {
  const frames: ResolutionFrame[] = [];
  const refilled = createBoard(state.board.width, state.board.height, state.seed);
  const refillEvent: DuelEvent = { type: 'board_refilled' };
  const refilledState = { ...state, board: refilled.board, seed: refilled.seed, selected: null };
  pushFrame(frames, 'refill', refilledState, [refillEvent]);

  const nextActor: ActorId = actor === 'player' ? 'enemy' : 'player';
  const nextTurn = nextActor === 'player' ? state.turn + 1 : state.turn;
  const turnEvent: DuelEvent = { type: 'turn_changed', from: actor, to: nextActor, turn: nextTurn };
  const next = { ...refilledState, current: nextActor, turn: nextTurn };
  pushFrame(frames, 'turn', next, [turnEvent]);
  const events = [refillEvent, turnEvent];
  const summary = `${actorName(state, actor)} found no legal move. Board refilled.`;
  return { state: recordBattleEntry(state, next, actor, summary, events, rules), events, frames };
}

export function previewSwap(
  board: Board,
  from: Cell,
  to: Cell,
  rules: DuelRules = DEFAULT_DUEL_RULES,
  actor: ActorId = 'player',
): MovePreview {
  if (!inBounds(board, from) || !inBounds(board, to)) {
    return { valid: false, from, to, reason: 'target outside board' };
  }
  if (!areAdjacent(from, to)) {
    return { valid: false, from, to, reason: 'tiles must touch' };
  }

  if (!isLegalSwap(board, from, to)) {
    return { valid: false, from, to, reason: 'no match created' };
  }

  const fromTile = getTile(board, from);
  const toTile = getTile(board, to);
  const specialCell = fromTile === 'aether' ? to : toTile === 'aether' ? from : null;
  if (specialCell) {
    const effect = rules.tiles.aether.effect;
    if (effect.type !== 'special') throw new Error('Aether requires a special tile effect');
    const actorEffect = specialEffectForActor(effect, actor);
    const cells = cellsAround(board, specialCell, actorEffect.radius);
    const effects: PreviewEffect[] = [{ label: 'aether damage', value: actorEffect.damage, tone: 'damage' }];
    return {
      valid: true,
      from,
      to,
      matches: [{ tile: 'aether', cells }],
      effects,
      extraTurn: actorEffect.extraTurn,
      summary: `Aether Burst: +${actorEffect.damage} damage, clears ${cells.length} tiles${actorEffect.extraTurn ? ', keeps turn' : ''}`,
      score: actorEffect.damage * rules.tiles.aether.enemyScorePerTile + cells.length +
        (actorEffect.extraTurn ? rules.actors.enemy.ai.extraTurnScore : 0),
    };
  }

  const test = cloneBoard(board);
  swapTiles(test, from, to);
  const matches = findMatches(test);

  const effects = previewEffects(matches, rules);
  const extraTurn = matches.some((match) => matchReward(match, rules).extraTurn);
  const createsSpecial = matches.some((match) => matchReward(match, rules).createsSpecial);
  const score = scorePreview(matches, rules);
  return {
    valid: true,
    from,
    to,
    matches,
    effects,
    extraTurn,
    summary: previewSummary(effects, extraTurn, createsSpecial, rules),
    score,
  };
}

export function getEnemyIntent(state: DuelState, rules: DuelRules = DEFAULT_DUEL_RULES): EnemyIntent | null {
  return chooseEnemyIntent(state, rules, previewSwap);
}

function createActor(id: ActorId, rules: DuelRules): ActorState {
  const template = rules.actors[id];
  return {
    id,
    definitionId: template.id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    guard: template.guard,
    sun: 0,
    moon: 0,
    crown: 0,
    abilityIds: [...template.abilityIds],
    passiveId: template.passiveId,
  };
}

function executeAbilityEffects(
  initial: DuelState,
  actor: ActorId,
  ability: AbilityDefinition,
  target: Cell,
  events: DuelEvent[],
  frames: ResolutionFrame[],
  rules: DuelRules,
): DuelState {
  let next = initial;
  let board = cloneBoard(initial.board);
  let seed = initial.seed;

  for (const effect of ability.effects) {
    switch (effect.type) {
      case 'gain_guard': {
        next = updateActor(next, actor, (unit) => ({ ...unit, guard: unit.guard + effect.amount }));
        const event: DuelEvent = { type: 'guard', actor, amount: effect.amount };
        events.push(event);
        pushFrame(frames, 'guard', next, [event]);
        break;
      }
      case 'convert_tiles': {
        const cells = cellsAround(board, target, effect.radius).filter((cell) =>
          (effect.shape !== 'cross' || cell.x === target.x || cell.y === target.y) &&
          (effect.from === undefined || getTile(board, cell) === effect.from),
        );
        for (const cell of cells) setTile(board, cell, effect.to);
        next = { ...next, board };
        const event: DuelEvent = { type: 'tiles_converted', actor, from: effect.from, to: effect.to, cells };
        events.push(event);
        pushFrame(frames, 'ability_effect', next, [event]);
        break;
      }
      case 'clear_row': {
        const cells = Array.from({ length: board.width }, (_, x) => ({ x, y: target.y }));
        const rowEvent: DuelEvent = { type: 'row_cleared', actor, row: target.y, cells };
        events.push(rowEvent);
        pushFrame(frames, 'ability_effect', { ...next, board }, [rowEvent]);
        const collected = collectTiles(board, cells);
        for (const [tile, amount] of collected) {
          next = applyTileEffect({ ...next, board }, actor, tile, amount, events, frames, rules);
        }
        const dropped = removeAndDrop(board, [{ tile: getTile(board, cells[0]), cells }], seed);
        board = dropped.board;
        seed = dropped.seed;
        next = { ...next, board, seed };
        const fallEvent: DuelEvent = { type: 'tiles_fallen', cells };
        events.push(fallEvent);
        pushFrame(frames, 'fall', next, [fallEvent]);
        break;
      }
      default:
        assertNever(effect);
    }
  }

  return { ...next, board, seed };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled ability effect: ${JSON.stringify(value)}`);
}

function activateSpecial(
  state: DuelState,
  actor: ActorId,
  cell: Cell,
  events: DuelEvent[],
  frames: ResolutionFrame[],
  rules: DuelRules,
): DuelState {
  const effect = rules.tiles.aether.effect;
  if (effect.type !== 'special') throw new Error('Aether requires a special tile effect');
  const actorEffect = specialEffectForActor(effect, actor);

  const cells = cellsAround(state.board, cell, actorEffect.radius);
  const activationEvent: DuelEvent = { type: 'special_activated', actor, tile: 'aether', cell, cells };
  events.push(activationEvent);
  pushFrame(frames, 'special', state, [activationEvent]);

  let next = damage(state, actor, actorEffect.damage, 'aether', events);
  pushFrame(frames, 'damage', next, [events[events.length - 1]]);
  const dropped = removeAndDrop(next.board, [{ tile: 'aether', cells }], next.seed);
  next = { ...next, board: dropped.board, seed: dropped.seed };
  const fallEvent: DuelEvent = { type: 'tiles_fallen', cells };
  events.push(fallEvent);
  pushFrame(frames, 'fall', next, [fallEvent]);
  return next;
}

function applyPassiveTrigger(
  state: DuelState,
  actor: ActorId,
  trigger: 'special_created',
  events: DuelEvent[],
  frames: ResolutionFrame[],
  rules: DuelRules,
): DuelState {
  const passiveId = state[actor].passiveId;
  const passive = passiveId ? rules.passives[passiveId] : null;
  if (!passive || passive.trigger !== trigger) return state;

  let next = state;
  const passiveEvent: DuelEvent = { type: 'passive_triggered', actor, passiveId: passive.id };
  events.push(passiveEvent);
  for (const effect of passive.effects) {
    if (effect.type === 'gain_guard') {
      next = updateActor(next, actor, (unit) => ({ ...unit, guard: unit.guard + effect.amount }));
      const guardEvent: DuelEvent = { type: 'guard', actor, amount: effect.amount };
      events.push(guardEvent);
      pushFrame(frames, 'guard', next, [passiveEvent, guardEvent]);
    }
  }
  return next;
}

function resolveBoard(
  initial: DuelState,
  actor: ActorId,
  events: DuelEvent[],
  frames: ResolutionFrame[],
  rules: DuelRules,
): SwapResult {
  let state = initial;
  let board = state.board;
  let seed = state.seed;
  let extraTurn = events.some((event) => event.type === 'special_activated') &&
    rules.tiles.aether.effect.type === 'special' &&
    specialEffectForActor(rules.tiles.aether.effect, actor).extraTurn;

  for (let cascade = 0; cascade < rules.match.maxCascades; cascade++) {
    const matches = findMatches(board);
    if (!matches.length) break;

    const cascadeEvent: DuelEvent = { type: 'cascade', count: cascade + 1 };
    events.push(cascadeEvent);
    pushFrame(frames, 'cascade', { ...state, board, seed }, [cascadeEvent]);
    const effects = applyMatchEffects({ ...state, board, seed }, actor, matches, frames, rules);
    state = effects.state;
    events.push(...effects.events);
    if (matches.some((match) => matchReward(match, rules).extraTurn)) extraTurn = true;

    const creations = specialCreations(matches, rules);
    if (creations.length) {
      board = cloneBoard(state.board);
      state = { ...state, board };
      for (const creation of creations) {
        setTile(board, creation.cell, 'aether');
        state = { ...state, board };
        const specialEvent: DuelEvent = {
          type: 'special_created',
          actor,
          tile: 'aether',
          cell: creation.cell,
          matchLength: creation.matchLength,
        };
        events.push(specialEvent);
        pushFrame(frames, 'special', state, [specialEvent]);
        state = applyPassiveTrigger(state, actor, 'special_created', events, frames, rules);
      }
    }

    const removedMatches = matchesWithoutSpecialAnchors(matches, creations);
    const dropped = removeAndDrop(board, removedMatches, seed);
    board = dropped.board;
    seed = dropped.seed;
    state = { ...state, board, seed };
    const fallEvent: DuelEvent = {
      type: 'tiles_fallen',
      cells: uniqueCells(removedMatches.flatMap((match) => match.cells)),
    };
    events.push(fallEvent);
    pushFrame(frames, 'fall', state, [fallEvent]);
  }

  state = { ...state, board, seed };

  if (findLegalMoves(state.board).length === 0) {
    const refilled = createBoard(rules.board.width, rules.board.height, state.seed);
    state = { ...state, board: refilled.board, seed: refilled.seed };
    const event: DuelEvent = { type: 'board_refilled' };
    events.push(event);
    pushFrame(frames, 'refill', state, [event]);
  }

  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    const winner: ActorId = state.player.hp <= 0 ? 'enemy' : 'player';
    const event: DuelEvent = { type: 'battle_ended', winner };
    events.push(event);
    const ended = { ...state, winner, current: winner };
    pushFrame(frames, 'battle_end', ended, [event]);
    return { state: ended, events, frames };
  }

  if (extraTurn) {
    const event: DuelEvent = { type: 'extra_turn', actor };
    events.push(event);
    const retained = { ...state, current: actor };
    pushFrame(frames, 'turn', retained, [event]);
    return { state: retained, events, frames };
  }

  const nextActor: ActorId = actor === 'player' ? 'enemy' : 'player';
  const nextTurn = nextActor === 'player' ? state.turn + 1 : state.turn;
  const event: DuelEvent = { type: 'turn_changed', from: actor, to: nextActor, turn: nextTurn };
  events.push(event);
  const transferred = { ...state, current: nextActor, turn: nextTurn };
  pushFrame(frames, 'turn', transferred, [event]);
  return { state: transferred, events, frames };
}

function applyMatchEffects(
  state: DuelState,
  actor: ActorId,
  matches: MatchGroup[],
  frames: ResolutionFrame[],
  rules: DuelRules,
): { state: DuelState; events: DuelEvent[] } {
  let next = state;
  const events: DuelEvent[] = [];

  for (const match of matches) {
    const amount = matchReward(match, rules).effectAmount;
    const event: DuelEvent = { type: 'match', actor, tile: match.tile, cells: match.cells };
    events.push(event);
    pushFrame(frames, 'match', next, [event]);
    next = applyTileEffect(next, actor, match.tile, amount, events, frames, rules);
  }

  return { state: next, events };
}

function applyTileEffect(
  state: DuelState,
  actor: ActorId,
  tile: TileKind,
  amount: number,
  events: DuelEvent[],
  frames: ResolutionFrame[],
  rules: DuelRules = DEFAULT_DUEL_RULES,
): DuelState {
  const effect = rules.tiles[tile].effect;
  if (effect.type === 'damage') {
    const scaled = amount * effect.amountPerTile;
    const next = damage(state, actor, scaled, tile, events);
    pushFrame(frames, 'damage', next, [events[events.length - 1]]);
    return next;
  }
  if (effect.type === 'guard') {
    const scaled = amount * effect.amountPerTile;
    const next = updateActor(state, actor, (unit) => ({ ...unit, guard: unit.guard + scaled }));
    const event: DuelEvent = { type: 'guard', actor, amount: scaled };
    events.push(event);
    pushFrame(frames, 'guard', next, [event]);
    return next;
  }
  if (effect.type === 'mana') {
    const scaled = amount * effect.amountPerTile;
    const next = updateActor(state, actor, (unit) => ({ ...unit, [effect.mana]: unit[effect.mana] + scaled }));
    const event: DuelEvent = { type: 'mana', actor, tile: effect.mana, amount: scaled };
    events.push(event);
    pushFrame(frames, 'mana', next, [event]);
    return next;
  }
  if (effect.type === 'special') {
    const next = damage(state, actor, specialEffectForActor(effect, actor).damage, tile, events);
    pushFrame(frames, 'damage', next, [events[events.length - 1]]);
    return next;
  }

  const scaled = amount * effect.amountPerTile;
  let next = damage(state, actor, scaled, tile, events);
  pushFrame(frames, 'damage', next, [events[events.length - 1]]);
  if (actor === 'player' && effect.playerBacklashPerTile > 0) {
    const backlash = amount * effect.playerBacklashPerTile;
    next = updateActor(next, actor, (unit) => ({ ...unit, hp: Math.max(0, unit.hp - backlash) }));
    const event: DuelEvent = { type: 'backlash', actor, amount: backlash };
    events.push(event);
    pushFrame(frames, 'backlash', next, [event]);
  }
  return next;
}

function specialEffectForActor(
  effect: Extract<TileEffect, { type: 'special' }>,
  actor: ActorId,
): { damage: number; radius: number; extraTurn: boolean } {
  const modifier = effect.actorModifiers?.[actor];
  return {
    damage: modifier?.damage ?? effect.damage,
    radius: modifier?.radius ?? effect.radius,
    extraTurn: modifier?.extraTurn ?? false,
  };
}

function damage(state: DuelState, actor: ActorId, amount: number, source: TileKind, events: DuelEvent[]): DuelState {
  const target = actor === 'player' ? 'enemy' : 'player';
  let blocked = 0;
  let hpDamage = 0;
  const next = updateActor(state, target, (unit) => {
    blocked = Math.min(unit.guard, amount);
    hpDamage = Math.min(unit.hp, amount - blocked);
    return { ...unit, guard: unit.guard - blocked, hp: unit.hp - hpDamage };
  });

  events.push({ type: 'damage', actor, target, source, amount, blocked, hpDamage });
  return next;
}

function updateActor(state: DuelState, actor: ActorId, update: (actor: ActorState) => ActorState): DuelState {
  return actor === 'player' ? { ...state, player: update(state.player) } : { ...state, enemy: update(state.enemy) };
}

function pushFrame(
  frames: ResolutionFrame[],
  kind: ResolutionFrameKind,
  state: DuelState,
  events: DuelEvent[],
): void {
  if (state.mode === 'simulation') return;
  frames.push({
    index: frames.length + 1,
    kind,
    events: cloneSerializable(events),
    snapshot: {
      board: cloneBoard(state.board),
      player: cloneActor(state.player),
      enemy: cloneActor(state.enemy),
      current: state.current,
      turn: state.turn,
      seed: state.seed,
      winner: state.winner,
    },
  });
}

function cloneActor(actor: ActorState): ActorState {
  return { ...actor, abilityIds: [...actor.abilityIds] };
}

function uniqueCells(cells: Cell[]): Cell[] {
  return [...new Map(cells.map((cell) => [`${cell.x},${cell.y}`, cell])).values()];
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function collectTiles(board: Board, cells: Cell[]): Map<TileKind, number> {
  const collected = new Map<TileKind, number>();
  for (const cell of cells) {
    const tile = getTile(board, cell);
    collected.set(tile, (collected.get(tile) ?? 0) + 1);
  }
  return collected;
}

function scorePreview(matches: MatchGroup[], rules: DuelRules): number {
  let score = 0;
  for (const match of matches) {
    const reward = matchReward(match, rules);
    const value = reward.effectAmount;
    const tileRule = rules.tiles[match.tile];
    score += value + value * tileRule.enemyScorePerTile;
    if (reward.extraTurn) score += rules.actors.enemy.ai.extraTurnScore;
    if (reward.createsSpecial) score += rules.tiles.aether.enemyScorePerTile;
  }
  return score;
}

function previewEffects(matches: MatchGroup[], rules: DuelRules): PreviewEffect[] {
  const effects = new Map<string, PreviewEffect>();

  for (const match of matches) {
    const amount = matchReward(match, rules).effectAmount;
    const effect = rules.tiles[match.tile].effect;
    if (effect.type === 'damage') {
      addPreviewEffect(effects, 'damage', amount * effect.amountPerTile, 'damage');
    } else if (effect.type === 'guard') {
      addPreviewEffect(effects, 'guard', amount * effect.amountPerTile, 'guard');
    } else if (effect.type === 'mana') {
      addPreviewEffect(effects, effect.mana, amount * effect.amountPerTile, 'mana');
    } else if (effect.type === 'risky_damage') {
      addPreviewEffect(effects, 'shade damage', amount * effect.amountPerTile, 'damage');
      if (effect.playerBacklashPerTile > 0) {
        addPreviewEffect(effects, 'backlash', amount * effect.playerBacklashPerTile, 'risk');
      }
    } else addPreviewEffect(effects, 'aether damage', effect.damage, 'damage');
  }

  return [...effects.values()];
}

function addPreviewEffect(effects: Map<string, PreviewEffect>, label: string, value: number, tone: PreviewEffect['tone']): void {
  const current = effects.get(label);
  effects.set(label, { label, value: (current?.value ?? 0) + value, tone });
}

function previewSummary(
  effects: PreviewEffect[],
  extraTurn: boolean,
  createsSpecial: boolean,
  rules: DuelRules,
): string {
  const parts = effects.map(
    (effect) => `${effect.tone === 'risk' ? '-' : '+'}${effect.value} ${summaryEffectLabel(effect, rules)}`,
  );
  if (extraTurn) parts.push('keeps turn');
  if (createsSpecial) parts.push('creates Aether');
  return parts.join(', ');
}

function summaryEffectLabel(effect: PreviewEffect, rules: DuelRules): string {
  if (effect.label === 'sun' || effect.label === 'moon' || effect.label === 'crown') return `${effect.label} mana`;
  if (effect.label === 'backlash') return `${rules.actors.player.name} HP backlash`;
  return effect.label;
}

function eventSummary(events: DuelEvent[], actor: ActorId, state: DuelState, rules: DuelRules): string {
  const spell = events.find((event) => event.type === 'spell_cast');
  const special = events.find((event) => event.type === 'special_activated');
  const matches = events.filter((event) => event.type === 'match');
  const extra = events.some((event) => event.type === 'extra_turn');
  const ended = events.find((event) => event.type === 'battle_ended');
  if (ended?.type === 'battle_ended') return `${actorName(state, ended.winner)} wins the duel.`;
  if (spell?.type === 'spell_cast') {
    return `${actorName(state, actor)} casts ${rules.abilities[spell.spell].name}${extra ? ' and keeps the turn' : ''}.`;
  }
  if (special?.type === 'special_activated') {
    return `${actorName(state, actor)} detonates Aether${extra ? ' and keeps the turn' : ''}.`;
  }
  if (!matches.length) return `${actorName(state, actor)} takes a board action.`;
  const first = matches[0];
  if (first.type !== 'match') return `${actorName(state, actor)} takes a turn.`;
  return `${actorName(state, actor)} matches ${tileCombatLabel(first.tile)}${extra ? ' and keeps the turn' : ''}.`;
}

function actorName(state: DuelState, actor: ActorId): string {
  return state[actor].name;
}

function tileCombatLabel(tile: TileKind): string {
  if (tile === 'sword') return 'swords for damage';
  if (tile === 'shield') return 'shields for guard';
  if (tile === 'shade') return 'shade for damage';
  if (tile === 'aether') return 'Aether';
  return `${tile} for mana`;
}

function appendLog(state: DuelState, message: string): DuelState {
  return { ...state, log: [message, ...state.log].slice(0, 6) };
}

function recordBattleEntry(
  before: DuelState,
  after: DuelState,
  actor: ActorId | 'system',
  summary: string,
  events: DuelEvent[],
  rules: DuelRules = DEFAULT_DUEL_RULES,
): DuelState {
  if (before.mode === 'simulation') return { ...after, log: [], history: [] };
  const entry = createBattleLogEntry(
    before,
    after,
    actor,
    summary,
    battleDetail(before, after, events),
    eventLines(events, before, rules),
  );
  return appendLog({ ...after, history: [entry, ...after.history] }, summary);
}

function createBattleLogEntry(
  before: DuelState,
  after: DuelState,
  actor: ActorId | 'system',
  summary: string,
  detail: string,
  events: string[],
  id = before.history.length + 1,
): BattleLogEntry {
  return {
    id,
    turn: before.turn,
    actor,
    summary,
    detail,
    events,
    before: snapshotState(before),
    after: snapshotState(after),
  };
}

function snapshotState(state: DuelState): BattleLogEntry['before'] {
  return {
    player: snapshotActor(state.player),
    enemy: snapshotActor(state.enemy),
  };
}

function snapshotActor(actor: ActorState): ActorSnapshot {
  return {
    hp: actor.hp,
    maxHp: actor.maxHp,
    guard: actor.guard,
    sun: actor.sun,
    moon: actor.moon,
    crown: actor.crown,
  };
}

function battleDetail(before: DuelState, after: DuelState, events: DuelEvent[]): string {
  const ended = events.find((event) => event.type === 'battle_ended');
  if (ended?.type === 'battle_ended') {
    if (after.player.hp <= 0 && after.enemy.hp <= 0) {
      return `${actorName(after, ended.winner)} wins because ${after.player.name} also reached 0 HP.`;
    }
    const loser = ended.winner === 'player' ? 'enemy' : 'player';
    return `${actorName(after, ended.winner)} wins because ${actorName(after, loser)} reached 0 HP.`;
  }

  const deltas = [
    actorDelta(before.player.name, before.player, after.player),
    actorDelta(before.enemy.name, before.enemy, after.enemy),
  ].filter(Boolean);
  return deltas.length ? deltas.join(' | ') : 'Board changed without stat damage.';
}

function actorDelta(name: string, before: ActorState, after: ActorState): string {
  const parts: string[] = [];
  if (before.hp !== after.hp) parts.push(`HP ${before.hp}->${after.hp}`);
  if (before.guard !== after.guard) parts.push(`Guard ${before.guard}->${after.guard}`);
  if (before.sun !== after.sun) parts.push(`Sun ${before.sun}->${after.sun}`);
  if (before.moon !== after.moon) parts.push(`Moon ${before.moon}->${after.moon}`);
  if (before.crown !== after.crown) parts.push(`Crown ${before.crown}->${after.crown}`);
  return parts.length ? `${name}: ${parts.join(', ')}` : '';
}

function eventLines(events: DuelEvent[], state: DuelState, rules: DuelRules): string[] {
  return events
    .map((event) => {
      if (event.type === 'swap') return `swapped (${event.from.x + 1},${event.from.y + 1}) -> (${event.to.x + 1},${event.to.y + 1})`;
      if (event.type === 'spell_cast') return `cast ${rules.abilities[event.spell].name} at (${event.target.x + 1},${event.target.y + 1})`;
      if (event.type === 'match') return `matched ${event.cells.length} ${event.tile}`;
      if (event.type === 'damage' && event.hpDamage === 0) {
        return `${actorName(state, event.target)} blocked all ${event.amount} damage from ${actorName(state, event.actor)}`;
      }
      if (event.type === 'damage') {
        const blocked = event.blocked > 0 ? ` (${event.blocked} blocked)` : '';
        return `${actorName(state, event.actor)} dealt ${event.hpDamage} HP damage${blocked}`;
      }
      if (event.type === 'guard') return `${actorName(state, event.actor)} gained ${event.amount} Guard`;
      if (event.type === 'mana') return `${actorName(state, event.actor)} gained ${event.amount} ${event.tile}`;
      if (event.type === 'backlash') return `${actorName(state, event.actor)} paid ${event.amount} HP backlash`;
      if (event.type === 'extra_turn') return `${actorName(state, event.actor)} kept the turn`;
      if (event.type === 'turn_changed') return `${actorName(state, event.to)} begins turn ${event.turn}`;
      if (event.type === 'tiles_converted') return `converted ${event.cells.length} tiles to ${event.to}`;
      if (event.type === 'row_cleared') return `cleared row ${event.row + 1}`;
      if (event.type === 'tiles_fallen') return `tiles fell after clearing ${event.cells.length} cells`;
      if (event.type === 'board_refilled') return 'board refilled';
      if (event.type === 'special_created') return `forged Aether from a match of ${event.matchLength}`;
      if (event.type === 'special_activated') return `detonated Aether across ${event.cells.length} tiles`;
      if (event.type === 'passive_triggered') return `triggered ${rules.passives[event.passiveId].name}`;
      if (event.type === 'battle_ended') return `${actorName(state, event.winner)} won`;
      if (event.type === 'invalid_swap') return `invalid swap (${event.from.x + 1},${event.from.y + 1}) -> (${event.to.x + 1},${event.to.y + 1})`;
      if (event.type === 'invalid_spell') return `invalid spell: ${event.reason}`;
      if (event.type === 'action_rejected') return `action rejected: ${event.reason}`;
      if (event.type === 'enemy_intent') return event.text;
      return null;
    })
    .filter((line): line is string => !!line);
}

function withLog(
  state: DuelState,
  events: DuelEvent[],
  message: string,
  rules: DuelRules = DEFAULT_DUEL_RULES,
): SwapResult {
  return { state: recordBattleEntry(state, state, state.current, message, events, rules), events, frames: [] };
}

function acceptAction(before: DuelState, action: GameAction, result: SwapResult): SwapResult {
  return appendActionRecord(before, action, result, undefined);
}

function rejectAction(
  state: DuelState,
  action: GameAction,
  code: ActionRejectionCode,
  message: string,
  legacyEvents: DuelEvent[],
  rules: DuelRules,
): SwapResult {
  const rejection: ActionRejection = { code, message };
  const rejectionEvent: DuelEvent = { type: 'action_rejected', action: action.type, code, reason: message };
  const result = withLog(state, [...legacyEvents, rejectionEvent], message, rules);
  return appendActionRecord(state, action, { ...result, rejection }, rejection);
}

function appendActionRecord(
  before: DuelState,
  action: GameAction,
  result: SwapResult,
  rejection: ActionRejection | undefined,
): SwapResult {
  const existing = before.actionLog ?? [];
  const record: ActionRecord = {
    id: existing.length + 1,
    turn: before.turn,
    action: cloneSerializable(action),
    accepted: !rejection,
    ...(rejection ? { rejection: { ...rejection } } : {}),
    events: cloneSerializable(result.events),
  };
  return {
    ...result,
    state: { ...result.state, actionLog: [...existing, record] },
  };
}

function emptyResolution(state: DuelState): SwapResult {
  return { state, events: [], frames: [] };
}
