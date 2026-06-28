import { findLegalMoves, inBounds } from '../src/engine/board';
import { applySwap, castSpell, createDuel, runEnemyTurn } from '../src/engine/duel';
import type { ActorId, Cell, DuelState, SpellId, SwapResult } from '../src/engine/types';

type Strategy = 'greedy' | 'spell-aware';

type BattleResult = {
  seed: number;
  strategy: Strategy;
  winner: ActorId | 'none';
  actions: number;
  turns: number;
  maxActorChain: number;
  playerExtraTurns: number;
  enemyExtraTurns: number;
  spellsCast: number;
  playerBacklash: number;
  playerBacklashDeaths: number;
  playerUnspentManaOnDeath: number;
  playerFinalHp: number;
  enemyFinalHp: number;
};

type Summary = {
  strategy: Strategy;
  battles: number;
  playerWins: number;
  enemyWins: number;
  unresolved: number;
  playerWinRate: number;
  avgActions: number;
  avgTurns: number;
  avgMaxActorChain: number;
  avgPlayerExtraTurns: number;
  avgEnemyExtraTurns: number;
  avgSpellsCast: number;
  avgPlayerBacklash: number;
  backlashDeathRate: number;
  avgUnspentManaOnDeath: number;
};

const strategies: Strategy[] = ['greedy', 'spell-aware'];
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));

const battleCount = Number(args.get('seeds') ?? 200);
const baseSeed = Number(args.get('base') ?? 2007);
const maxActions = Number(args.get('max-actions') ?? 180);
const json = args.get('json') === 'true';

const results = strategies.flatMap((strategy) =>
  Array.from({ length: battleCount }, (_, index) => simulateBattle(baseSeed + index, strategy, maxActions)),
);
const summaries = strategies.map((strategy) => summarize(strategy, results.filter((result) => result.strategy === strategy)));

if (json) {
  console.log(JSON.stringify({ baseSeed, battleCount, maxActions, summaries }, null, 2));
} else {
  console.log(`Kingdom Duel balance sim: ${battleCount} seeds from ${baseSeed}, max ${maxActions} actions`);
  for (const summary of summaries) {
    console.log('');
    console.log(`${summary.strategy}`);
    console.log(`  wins: Aurora ${summary.playerWins}, Shade ${summary.enemyWins}, unresolved ${summary.unresolved}`);
    console.log(`  Aurora win rate: ${formatPercent(summary.playerWinRate)}`);
    console.log(`  avg turns/actions: ${format(summary.avgTurns)} / ${format(summary.avgActions)}`);
    console.log(`  avg max actor chain: ${format(summary.avgMaxActorChain)}`);
    console.log(`  avg extra turns: Aurora ${format(summary.avgPlayerExtraTurns)}, Shade ${format(summary.avgEnemyExtraTurns)}`);
    console.log(`  avg spells cast: ${format(summary.avgSpellsCast)}`);
    console.log(`  avg backlash paid: ${format(summary.avgPlayerBacklash)}`);
    console.log(`  backlash death rate: ${formatPercent(summary.backlashDeathRate)}`);
    console.log(`  avg unspent mana on Aurora death: ${format(summary.avgUnspentManaOnDeath)}`);
  }
}

function simulateBattle(seed: number, strategy: Strategy, actionLimit: number): BattleResult {
  let state = createDuel(seed);
  let actions = 0;

  while (!state.winner && actions < actionLimit) {
    const result = state.current === 'player' ? choosePlayerAction(state, strategy) : runEnemyTurn(state);
    if (result.state === state && result.events.length === 0) break;
    state = result.state;
    actions += 1;
  }

  return analyzeBattle(seed, strategy, state, actions);
}

function choosePlayerAction(state: DuelState, strategy: Strategy): SwapResult {
  const candidates: SwapResult[] = [];

  for (const move of findLegalMoves(state.board)) {
    candidates.push(applySwap(state, move.from, move.to));
  }

  if (strategy === 'spell-aware') {
    for (const spellId of ['glass_ward', 'crown_strike', 'sun_bloom'] as SpellId[]) {
      for (const target of allCells(state)) {
        const result = castSpell(state, spellId, target);
        if (!result.events.some((event) => event.type === 'invalid_spell')) candidates.push(result);
      }
    }
  }

  return candidates.sort((a, b) => scoreResult(state, b.state) - scoreResult(state, a.state))[0] ?? { state, events: [] };
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

function analyzeBattle(seed: number, strategy: Strategy, state: DuelState, actions: number): BattleResult {
  const history = [...state.history].reverse().filter((entry) => entry.actor !== 'system');
  const playerExtraTurns = history.filter((entry) => entry.actor === 'player' && hasEvent(entry.events, 'kept the turn')).length;
  const enemyExtraTurns = history.filter((entry) => entry.actor === 'enemy' && hasEvent(entry.events, 'kept the turn')).length;
  const spellsCast = history.reduce((sum, entry) => sum + entry.events.filter((event) => event.startsWith('cast ')).length, 0);
  const playerBacklash = history.reduce((sum, entry) => sum + sumNumbers(entry.events, /paid (\d+) HP backlash/), 0);
  const finalEntry = history[history.length - 1];
  const playerBacklashDeaths =
    state.winner === 'enemy' &&
    finalEntry?.actor === 'player' &&
    finalEntry.events.some((event) => event.includes('HP backlash'))
      ? 1
      : 0;
  const playerUnspentManaOnDeath =
    state.winner === 'enemy' ? state.player.sun + state.player.moon + state.player.crown : 0;

  return {
    seed,
    strategy,
    winner: state.winner ?? 'none',
    actions,
    turns: state.turn,
    maxActorChain: maxActorChain(history.map((entry) => entry.actor as ActorId)),
    playerExtraTurns,
    enemyExtraTurns,
    spellsCast,
    playerBacklash,
    playerBacklashDeaths,
    playerUnspentManaOnDeath,
    playerFinalHp: state.player.hp,
    enemyFinalHp: state.enemy.hp,
  };
}

function summarize(strategy: Strategy, entries: BattleResult[]): Summary {
  const playerWins = entries.filter((entry) => entry.winner === 'player').length;
  const enemyWins = entries.filter((entry) => entry.winner === 'enemy').length;
  const unresolved = entries.filter((entry) => entry.winner === 'none').length;
  const deathEntries = entries.filter((entry) => entry.winner === 'enemy');

  return {
    strategy,
    battles: entries.length,
    playerWins,
    enemyWins,
    unresolved,
    playerWinRate: entries.length ? playerWins / entries.length : 0,
    avgActions: average(entries.map((entry) => entry.actions)),
    avgTurns: average(entries.map((entry) => entry.turns)),
    avgMaxActorChain: average(entries.map((entry) => entry.maxActorChain)),
    avgPlayerExtraTurns: average(entries.map((entry) => entry.playerExtraTurns)),
    avgEnemyExtraTurns: average(entries.map((entry) => entry.enemyExtraTurns)),
    avgSpellsCast: average(entries.map((entry) => entry.spellsCast)),
    avgPlayerBacklash: average(entries.map((entry) => entry.playerBacklash)),
    backlashDeathRate: entries.length ? entries.reduce((sum, entry) => sum + entry.playerBacklashDeaths, 0) / entries.length : 0,
    avgUnspentManaOnDeath: average(deathEntries.map((entry) => entry.playerUnspentManaOnDeath)),
  };
}

function maxActorChain(actors: ActorId[]): number {
  let max = 0;
  let current = 0;
  let previous: ActorId | null = null;

  for (const actor of actors) {
    current = actor === previous ? current + 1 : 1;
    previous = actor;
    max = Math.max(max, current);
  }

  return max;
}

function hasEvent(events: string[], text: string): boolean {
  return events.some((event) => event.includes(text));
}

function sumNumbers(lines: string[], pattern: RegExp): number {
  return lines.reduce((sum, line) => {
    const match = line.match(pattern);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function format(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
