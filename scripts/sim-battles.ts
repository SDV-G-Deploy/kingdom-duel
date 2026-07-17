import { createDuel, runEnemyTurn } from '../src/engine/duel';
import { DEFAULT_DUEL_RULES } from '../src/engine/rules';
import { analyzeBattle, summarize, type BattleResult, type Strategy, type Summary } from './sim-metrics';
import { choosePlayerAction } from './sim-player';

const strategies: Strategy[] = ['greedy', 'visible', 'spell-aware'];
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));

const battleCount = Number(args.get('seeds') ?? 200);
const baseSeed = Number(args.get('base') ?? 2007);
const maxActions = Number(args.get('max-actions') ?? 180);
const json = args.get('json') === 'true';
const duelRules = DEFAULT_DUEL_RULES;

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
    console.log(`  action P50/P90/P99: ${summary.actionPercentiles.p50} / ${summary.actionPercentiles.p90} / ${summary.actionPercentiles.p99}`);
    console.log(`  avg max actor chain: ${format(summary.avgMaxActorChain)}`);
    console.log(`  avg extra turns: Aurora ${format(summary.avgPlayerExtraTurns)}, Shade ${format(summary.avgEnemyExtraTurns)}`);
    console.log(`  avg spells cast: Aurora ${format(summary.avgPlayerSpellsCast)}, Shade ${format(summary.avgEnemySpellsCast)}`);
    console.log(`  casts by ability: ${formatNamed(summary.castsPerBattleByAbility)}`);
    console.log(`  ability resolution value: ${formatAbilityOutcomes(summary.avgAbilityOutcomesByAbility)}`);
    console.log(`  Aurora damage by source: ${formatDamage(summary.avgDamageBySource.player)}`);
    console.log(`  Shade damage by source: ${formatDamage(summary.avgDamageBySource.enemy)}`);
    console.log(`  avg guard gained/blocked/final: Aurora ${format(summary.avgGuardGained.player)}/${format(summary.avgDamageBlocked.player)}/${format(summary.avgFinalGuard.player)}, Shade ${format(summary.avgGuardGained.enemy)}/${format(summary.avgDamageBlocked.enemy)}/${format(summary.avgFinalGuard.enemy)}`);
    console.log(`  avg mana gained/spent: Aurora ${format(summary.avgManaGained.player)}/${format(summary.avgManaSpent.player)}, Shade ${format(summary.avgManaGained.enemy)}/${format(summary.avgManaSpent.enemy)}`);
    console.log(`  match lengths: ${formatNamed(summary.matchLengthHistogram, 0)}`);
    console.log(`  avg Aether created/activated: ${format(summary.avgSpecialsCreated)} / ${format(summary.avgSpecialsActivated)}`);
    console.log(`  chain histogram: ${formatNamed(summary.chainHistogram, 0)}`);
    console.log(`  avg backlash paid: ${format(summary.avgPlayerBacklash)}`);
    console.log(`  backlash death rate: ${formatPercent(summary.backlashDeathRate)}`);
    console.log(`  avg unspent mana on Aurora death: ${format(summary.avgUnspentManaOnDeath)}`);
    console.log(`  sample seeds long/short/one-sided: ${summary.sampleSeeds.longest.join(',')} / ${summary.sampleSeeds.shortest.join(',')} / ${summary.sampleSeeds.mostOneSided.join(',')}`);
  }
}

function simulateBattle(seed: number, strategy: Strategy, actionLimit: number): BattleResult {
  let state = createDuel(seed, duelRules, 'simulation');
  let actions = 0;

  while (!state.winner && actions < actionLimit) {
    const result = state.current === 'player'
      ? choosePlayerAction(state, strategy, duelRules)
      : runEnemyTurn(state, duelRules);
    if (result.state === state && result.events.length === 0) break;
    state = result.state;
    actions += 1;
  }

  return analyzeBattle(seed, strategy, state, actions, duelRules);
}

function format(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNamed(values: Record<string, number>, digits = 2): string {
  const entries = Object.entries(values);
  return entries.length ? entries.map(([key, value]) => `${key}:${value.toFixed(digits)}`).join(', ') : 'none';
}

function formatDamage(values: Summary['avgDamageBySource']['player']): string {
  const nonZero = Object.fromEntries(Object.entries(values).filter(([, value]) => value > 0));
  return formatNamed(nonZero);
}

function formatAbilityOutcomes(values: Summary['avgAbilityOutcomesByAbility']): string {
  const entries = Object.entries(values);
  if (!entries.length) return 'none';
  return entries.map(([abilityId, outcome]) =>
    `${abilityId}[dmg:${format(outcome.hpDamage)} guard:${format(outcome.guardGained)} mana:${format(outcome.manaGained)} aether:${format(outcome.specialsCreated)}/${format(outcome.specialsActivated)} extra:${format(outcome.extraTurns)} backlash:${format(outcome.backlashPaid)}]`,
  ).join(', ');
}
