import { runEnemyTurn } from '../src/engine/duel';
import { RUN_ENCOUNTERS } from '../src/run/content';
import {
  chooseRunUpgrade,
  createRun,
  createRunDuel,
  resolveRunBattle,
} from '../src/run/run';
import { buildRunDuelRules } from '../src/run/rules';
import type { RunState, UpgradeId } from '../src/run/types';
import { choosePlayerAction } from './sim-player';
import type { Strategy } from './sim-metrics';

type BuildPlan = {
  id: string;
  priority: UpgradeId[];
};

type RunResult = {
  seed: number;
  plan: string;
  completed: boolean;
  victories: number;
  actions: number;
  endedAt: string;
  upgrades: UpgradeId[];
};

const plans: BuildPlan[] = [
  { id: 'solar-aether', priority: ['solar_halo', 'aether_relay', 'aether_core', 'veilbreaker_lens', 'royal_bastion', 'ward_battery'] },
  { id: 'ward-crown', priority: ['ward_battery', 'royal_bastion', 'veilbreaker_lens', 'aether_relay', 'solar_halo', 'aether_core'] },
  { id: 'veil-core', priority: ['veilbreaker_lens', 'aether_core', 'aether_relay', 'solar_halo', 'royal_bastion', 'ward_battery'] },
];

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
  return [key, value];
}));
const runCount = Number(args.get('seeds') ?? 50);
const baseSeed = Number(args.get('base') ?? 2007);
const maxActions = Number(args.get('max-actions') ?? 180);
const json = args.get('json') === 'true';
const policy = playerPolicy(args.get('policy') ?? 'spell-aware');

const results = plans.flatMap((plan) =>
  Array.from({ length: runCount }, (_, index) => simulateRun(baseSeed + index, plan, maxActions, policy)),
);
const summaries = plans.map((plan) => summarize(plan, results.filter((entry) => entry.plan === plan.id)));

if (json) {
  console.log(JSON.stringify({ baseSeed, runCount, maxActions, policy, summaries }, null, 2));
} else {
  console.log(`Kingdom Duel run sim: ${runCount} seeds from ${baseSeed}, ${policy} policy`);
  for (const summary of summaries) {
    console.log('');
    console.log(summary.plan);
    console.log(`  complete: ${summary.completed}/${runCount} (${(summary.completionRate * 100).toFixed(1)}%)`);
    console.log(`  avg victories/actions: ${summary.avgVictories.toFixed(2)} / ${summary.avgActions.toFixed(2)}`);
    console.log(`  stopped at: ${Object.entries(summary.endedAt).map(([id, count]) => `${id}:${count}`).join(', ')}`);
    console.log(`  upgrades: ${Object.entries(summary.upgrades).map(([id, count]) => `${id}:${count}`).join(', ')}`);
  }
}

function simulateRun(seed: number, plan: BuildPlan, actionLimit: number, strategy: Strategy): RunResult {
  let run = createRun(seed);
  let totalActions = 0;

  while (run.phase === 'battle' || run.phase === 'reward') {
    if (run.phase === 'reward') {
      const choice = plan.priority.find((id) => run.rewardOptions.includes(id)) ?? run.rewardOptions[0];
      run = chooseRunUpgrade(run, choice);
      continue;
    }

    const rules = buildRunDuelRules(run);
    let duel = createRunDuel(run, 'simulation');
    let actions = 0;
    while (!duel.winner && actions < actionLimit) {
      const result = duel.current === 'player'
        ? choosePlayerAction(duel, strategy, rules)
        : runEnemyTurn(duel, rules);
      if (result.state === duel && result.events.length === 0) break;
      duel = result.state;
      actions += 1;
    }
    totalActions += actions;
    if (!duel.winner) {
      return resultFor(run, plan, false, totalActions, `unresolved-${run.encounterIndex}`);
    }
    run = resolveRunBattle(run, duel);
  }

  return resultFor(
    run,
    plan,
    run.phase === 'complete',
    totalActions,
    run.phase === 'complete' ? 'complete' : RUN_ENCOUNTERS[run.encounterIndex].id,
  );
}

function playerPolicy(value: string): Strategy {
  if (value === 'visible' || value === 'spell-aware' || value === 'greedy') return value;
  throw new Error(`Unknown player policy ${value}`);
}

function resultFor(run: RunState, plan: BuildPlan, completed: boolean, actions: number, endedAt: string): RunResult {
  return {
    seed: run.seed,
    plan: plan.id,
    completed,
    victories: run.battles.filter((battle) => battle.winner === 'player').length,
    actions,
    endedAt,
    upgrades: [...run.selectedUpgradeIds],
  };
}

function summarize(plan: BuildPlan, entries: RunResult[]) {
  const count = entries.length || 1;
  return {
    plan: plan.id,
    completed: entries.filter((entry) => entry.completed).length,
    completionRate: entries.filter((entry) => entry.completed).length / count,
    avgVictories: entries.reduce((sum, entry) => sum + entry.victories, 0) / count,
    avgActions: entries.reduce((sum, entry) => sum + entry.actions, 0) / count,
    endedAt: histogram(entries.map((entry) => entry.endedAt)),
    upgrades: histogram(entries.flatMap((entry) => entry.upgrades)),
  };
}

function histogram(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
