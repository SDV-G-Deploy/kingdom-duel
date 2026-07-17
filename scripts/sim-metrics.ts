import type { ActorId, DuelRules, DuelState, TileKind } from '../src/engine/types';

export type Strategy = 'greedy' | 'visible' | 'spell-aware';

type ActorTotals = Record<ActorId, number>;
type DamageTotals = Record<TileKind, number>;

export type AbilityOutcome = {
  casts: number;
  hpDamage: number;
  guardGained: number;
  manaGained: number;
  backlashPaid: number;
  specialsCreated: number;
  specialsActivated: number;
  extraTurns: number;
};

export type BattleResult = {
  seed: number;
  strategy: Strategy;
  winner: ActorId | 'none';
  actions: number;
  turns: number;
  actorChains: number[];
  maxActorChain: number;
  playerExtraTurns: number;
  enemyExtraTurns: number;
  playerSpellsCast: number;
  enemySpellsCast: number;
  castsByAbility: Record<string, number>;
  abilityOutcomes: Record<string, AbilityOutcome>;
  damageBySource: Record<ActorId, DamageTotals>;
  guardGained: ActorTotals;
  damageBlocked: ActorTotals;
  finalGuard: ActorTotals;
  manaGained: ActorTotals;
  manaSpent: ActorTotals;
  matchLengths: number[];
  specialsCreated: number;
  specialsActivated: number;
  boardRefills: number;
  playerBacklash: number;
  playerBacklashDeaths: number;
  playerUnspentManaOnDeath: number;
  playerFinalHp: number;
  enemyFinalHp: number;
};

export type Summary = {
  strategy: Strategy;
  battles: number;
  playerWins: number;
  enemyWins: number;
  unresolved: number;
  playerWinRate: number;
  avgActions: number;
  actionPercentiles: { p50: number; p90: number; p99: number };
  avgTurns: number;
  avgMaxActorChain: number;
  chainHistogram: Record<string, number>;
  avgPlayerExtraTurns: number;
  avgEnemyExtraTurns: number;
  avgPlayerSpellsCast: number;
  avgEnemySpellsCast: number;
  castsPerBattleByAbility: Record<string, number>;
  avgAbilityOutcomesByAbility: Record<string, AbilityOutcome>;
  avgDamageBySource: Record<ActorId, DamageTotals>;
  avgGuardGained: ActorTotals;
  avgDamageBlocked: ActorTotals;
  avgFinalGuard: ActorTotals;
  avgManaGained: ActorTotals;
  avgManaSpent: ActorTotals;
  matchLengthHistogram: Record<string, number>;
  avgSpecialsCreated: number;
  avgSpecialsActivated: number;
  avgBoardRefills: number;
  avgPlayerBacklash: number;
  backlashDeathRate: number;
  avgUnspentManaOnDeath: number;
  sampleSeeds: { longest: number[]; shortest: number[]; mostOneSided: number[] };
};

const DAMAGE_SOURCES: TileKind[] = ['sword', 'shield', 'sun', 'moon', 'crown', 'shade', 'aether'];

export function analyzeBattle(
  seed: number,
  strategy: Strategy,
  state: DuelState,
  actions: number,
  rules: DuelRules,
): BattleResult {
  const accepted = state.actionLog.filter((entry) => entry.accepted);
  const actors = accepted.map((entry) => entry.action.actor);
  const actorChains = chainLengths(actors);
  const castsByAbility: Record<string, number> = {};
  const abilityOutcomes: Record<string, AbilityOutcome> = {};
  const damageBySource = { player: emptyDamageTotals(), enemy: emptyDamageTotals() };
  const guardGained = emptyActorTotals();
  const damageBlocked = emptyActorTotals();
  const manaGained = emptyActorTotals();
  const manaSpent = emptyActorTotals();
  const matchLengths: number[] = [];
  let playerExtraTurns = 0;
  let enemyExtraTurns = 0;
  let playerSpellsCast = 0;
  let enemySpellsCast = 0;
  let specialsCreated = 0;
  let specialsActivated = 0;
  let boardRefills = 0;
  let playerBacklash = 0;

  for (const entry of accepted) {
    const castOutcome = entry.action.type === 'cast'
      ? (abilityOutcomes[entry.action.abilityId] ??= emptyAbilityOutcome())
      : null;
    if (castOutcome) castOutcome.casts += 1;

    for (const event of entry.events) {
      if (event.type === 'extra_turn') {
        if (event.actor === 'player') playerExtraTurns += 1;
        else enemyExtraTurns += 1;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.extraTurns += 1;
      } else if (event.type === 'spell_cast') {
        if (event.actor === 'player') playerSpellsCast += 1;
        else enemySpellsCast += 1;
        castsByAbility[event.spell] = (castsByAbility[event.spell] ?? 0) + 1;
        manaSpent[event.actor] += costTotal(rules.abilities[event.spell].cost);
      } else if (event.type === 'damage') {
        damageBySource[event.actor][event.source] += event.hpDamage;
        damageBlocked[event.target] += event.blocked;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.hpDamage += event.hpDamage;
      } else if (event.type === 'guard') {
        guardGained[event.actor] += event.amount;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.guardGained += event.amount;
      } else if (event.type === 'mana') {
        manaGained[event.actor] += event.amount;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.manaGained += event.amount;
      } else if (event.type === 'match') {
        matchLengths.push(event.cells.length);
      } else if (event.type === 'special_created') {
        specialsCreated += 1;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.specialsCreated += 1;
      } else if (event.type === 'special_activated') {
        specialsActivated += 1;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.specialsActivated += 1;
      } else if (event.type === 'board_refilled') {
        boardRefills += 1;
      } else if (event.type === 'backlash' && event.actor === 'player') {
        playerBacklash += event.amount;
        if (castOutcome && event.actor === entry.action.actor) castOutcome.backlashPaid += event.amount;
      }
    }
  }

  const finalEntry = accepted[accepted.length - 1];
  const playerBacklashDeaths =
    state.winner === 'enemy' &&
    finalEntry?.action.actor === 'player' &&
    finalEntry.events.some((event) => event.type === 'backlash' && event.actor === 'player')
      ? 1
      : 0;

  return {
    seed,
    strategy,
    winner: state.winner ?? 'none',
    actions,
    turns: state.turn,
    actorChains,
    maxActorChain: actorChains.length ? Math.max(...actorChains) : 0,
    playerExtraTurns,
    enemyExtraTurns,
    playerSpellsCast,
    enemySpellsCast,
    castsByAbility,
    abilityOutcomes,
    damageBySource,
    guardGained,
    damageBlocked,
    finalGuard: { player: state.player.guard, enemy: state.enemy.guard },
    manaGained,
    manaSpent,
    matchLengths,
    specialsCreated,
    specialsActivated,
    boardRefills,
    playerBacklash,
    playerBacklashDeaths,
    playerUnspentManaOnDeath: state.winner === 'enemy'
      ? state.player.sun + state.player.moon + state.player.crown
      : 0,
    playerFinalHp: state.player.hp,
    enemyFinalHp: state.enemy.hp,
  };
}

export function summarize(strategy: Strategy, entries: BattleResult[]): Summary {
  const playerWins = entries.filter((entry) => entry.winner === 'player').length;
  const enemyWins = entries.filter((entry) => entry.winner === 'enemy').length;
  const deathEntries = entries.filter((entry) => entry.winner === 'enemy');
  const actionValues = entries.map((entry) => entry.actions);

  return {
    strategy,
    battles: entries.length,
    playerWins,
    enemyWins,
    unresolved: entries.filter((entry) => entry.winner === 'none').length,
    playerWinRate: entries.length ? playerWins / entries.length : 0,
    avgActions: average(actionValues),
    actionPercentiles: {
      p50: percentile(actionValues, 0.5),
      p90: percentile(actionValues, 0.9),
      p99: percentile(actionValues, 0.99),
    },
    avgTurns: average(entries.map((entry) => entry.turns)),
    avgMaxActorChain: average(entries.map((entry) => entry.maxActorChain)),
    chainHistogram: histogram(entries.flatMap((entry) => entry.actorChains)),
    avgPlayerExtraTurns: average(entries.map((entry) => entry.playerExtraTurns)),
    avgEnemyExtraTurns: average(entries.map((entry) => entry.enemyExtraTurns)),
    avgPlayerSpellsCast: average(entries.map((entry) => entry.playerSpellsCast)),
    avgEnemySpellsCast: average(entries.map((entry) => entry.enemySpellsCast)),
    castsPerBattleByAbility: averageNamedCounts(entries.map((entry) => entry.castsByAbility), entries.length),
    avgAbilityOutcomesByAbility: averageAbilityOutcomes(entries),
    avgDamageBySource: {
      player: averageDamage(entries, 'player'),
      enemy: averageDamage(entries, 'enemy'),
    },
    avgGuardGained: averageActorTotals(entries, 'guardGained'),
    avgDamageBlocked: averageActorTotals(entries, 'damageBlocked'),
    avgFinalGuard: averageActorTotals(entries, 'finalGuard'),
    avgManaGained: averageActorTotals(entries, 'manaGained'),
    avgManaSpent: averageActorTotals(entries, 'manaSpent'),
    matchLengthHistogram: histogram(entries.flatMap((entry) => entry.matchLengths)),
    avgSpecialsCreated: average(entries.map((entry) => entry.specialsCreated)),
    avgSpecialsActivated: average(entries.map((entry) => entry.specialsActivated)),
    avgBoardRefills: average(entries.map((entry) => entry.boardRefills)),
    avgPlayerBacklash: average(entries.map((entry) => entry.playerBacklash)),
    backlashDeathRate: entries.length
      ? entries.reduce((sum, entry) => sum + entry.playerBacklashDeaths, 0) / entries.length
      : 0,
    avgUnspentManaOnDeath: average(deathEntries.map((entry) => entry.playerUnspentManaOnDeath)),
    sampleSeeds: sampleSeeds(entries),
  };
}

function emptyActorTotals(): ActorTotals {
  return { player: 0, enemy: 0 };
}

function emptyDamageTotals(): DamageTotals {
  return Object.fromEntries(DAMAGE_SOURCES.map((source) => [source, 0])) as DamageTotals;
}

function emptyAbilityOutcome(): AbilityOutcome {
  return {
    casts: 0,
    hpDamage: 0,
    guardGained: 0,
    manaGained: 0,
    backlashPaid: 0,
    specialsCreated: 0,
    specialsActivated: 0,
    extraTurns: 0,
  };
}

function averageAbilityOutcomes(entries: BattleResult[]): Record<string, AbilityOutcome> {
  const totals: Record<string, AbilityOutcome> = {};
  for (const entry of entries) {
    for (const [abilityId, outcome] of Object.entries(entry.abilityOutcomes)) {
      const total = (totals[abilityId] ??= emptyAbilityOutcome());
      for (const key of Object.keys(outcome) as Array<keyof AbilityOutcome>) total[key] += outcome[key];
    }
  }
  for (const outcome of Object.values(totals)) {
    for (const key of Object.keys(outcome) as Array<keyof AbilityOutcome>) {
      outcome[key] = entries.length ? outcome[key] / entries.length : 0;
    }
  }
  return Object.fromEntries(Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)));
}

function averageDamage(entries: BattleResult[], actor: ActorId): DamageTotals {
  const totals = emptyDamageTotals();
  for (const entry of entries) {
    for (const source of DAMAGE_SOURCES) totals[source] += entry.damageBySource[actor][source];
  }
  for (const source of DAMAGE_SOURCES) totals[source] = entries.length ? totals[source] / entries.length : 0;
  return totals;
}

function averageActorTotals(
  entries: BattleResult[],
  field: 'guardGained' | 'damageBlocked' | 'finalGuard' | 'manaGained' | 'manaSpent',
): ActorTotals {
  return {
    player: average(entries.map((entry) => entry[field].player)),
    enemy: average(entries.map((entry) => entry[field].enemy)),
  };
}

function averageNamedCounts(entries: Record<string, number>[], divisor: number): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry)) totals[key] = (totals[key] ?? 0) + value;
  }
  return Object.fromEntries(Object.keys(totals).sort().map((key) => [key, divisor ? totals[key] / divisor : 0]));
}

function chainLengths(actors: ActorId[]): number[] {
  const lengths: number[] = [];
  let previous: ActorId | null = null;
  for (const actor of actors) {
    if (actor === previous) lengths[lengths.length - 1] += 1;
    else lengths.push(1);
    previous = actor;
  }
  return lengths;
}

function histogram(values: number[]): Record<string, number> {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.fromEntries([...counts].sort(([a], [b]) => a - b).map(([key, value]) => [String(key), value]));
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)];
}

function sampleSeeds(entries: BattleResult[]): Summary['sampleSeeds'] {
  const oneSided = (entry: BattleResult) => Math.abs(entry.playerFinalHp - entry.enemyFinalHp);
  return {
    longest: [...entries].sort((a, b) => b.actions - a.actions || a.seed - b.seed).slice(0, 3).map((entry) => entry.seed),
    shortest: [...entries].sort((a, b) => a.actions - b.actions || a.seed - b.seed).slice(0, 3).map((entry) => entry.seed),
    mostOneSided: [...entries].sort((a, b) => oneSided(b) - oneSided(a) || a.seed - b.seed).slice(0, 3).map((entry) => entry.seed),
  };
}

function costTotal(cost: { sun?: number; moon?: number; crown?: number }): number {
  return (cost.sun ?? 0) + (cost.moon ?? 0) + (cost.crown ?? 0);
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
