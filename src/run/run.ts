import { createDuel } from '../engine/duel';
import { nextSeed, randomInt } from '../engine/rng';
import type { DuelRuntimeMode, DuelState } from '../engine/types';
import { RUN_ENCOUNTERS, RUN_UPGRADE_IDS } from './content';
import { buildRunDuelRules } from './rules';
import type { EncounterDefinition, RunMode, RunState, UpgradeId } from './types';
import {
  DAILY_CHALLENGE_VERSION,
  RUN_CONTENT_VERSION,
  RUN_RULES_VERSION,
  RUN_SCHEMA_VERSION,
} from './version';

export function createRun(seed: number, mode: RunMode = 'standard', dailyKey: string | null = null): RunState {
  if (mode === 'daily' && (!dailyKey || !isDailyRunKey(dailyKey))) {
    throw new Error('A daily run requires a valid UTC date key');
  }
  if (mode === 'standard' && dailyKey !== null) throw new Error('A standard run cannot have a daily key');
  return {
    version: RUN_SCHEMA_VERSION,
    rulesVersion: RUN_RULES_VERSION,
    contentVersion: RUN_CONTENT_VERSION,
    seed: seed >>> 0,
    mode,
    dailyKey: mode === 'daily' ? dailyKey : null,
    dailyVersion: mode === 'daily' ? DAILY_CHALLENGE_VERSION : null,
    phase: 'battle',
    encounterIndex: 0,
    selectedUpgradeIds: [],
    rewardOptions: [],
    battles: [],
  };
}

export function currentEncounter(run: RunState): EncounterDefinition {
  const encounter = RUN_ENCOUNTERS[run.encounterIndex];
  if (!encounter) throw new RangeError(`Unknown run encounter index ${run.encounterIndex}`);
  return encounter;
}

export function encounterSeed(run: RunState): number {
  return nextSeed((run.seed ^ currentEncounter(run).seedSalt) >>> 0);
}

export function createRunDuel(run: RunState, mode: DuelRuntimeMode = 'interactive'): DuelState {
  if (run.phase !== 'battle') throw new Error(`Cannot create a duel during run phase ${run.phase}`);
  const rules = buildRunDuelRules(run);
  return createDuel(encounterSeed(run), rules, mode);
}

export function resolveRunBattle(run: RunState, duel: DuelState): RunState {
  if (run.phase !== 'battle') throw new Error(`Cannot resolve battle during run phase ${run.phase}`);
  if (!duel.winner) throw new Error('Cannot resolve an unfinished duel');
  const encounter = currentEncounter(run);
  if (duel.initialSeed !== encounterSeed(run) || duel.enemy.definitionId !== encounter.enemyId) {
    throw new Error(`Duel does not belong to run encounter ${encounter.id}`);
  }
  const battles = [
    ...run.battles,
    {
      encounterId: encounter.id,
      winner: duel.winner,
      turns: duel.turn,
      actions: duel.actionLog.filter((entry) => entry.accepted).length,
      playerHp: duel.player.hp,
    },
  ];

  if (duel.winner === 'enemy') return { ...run, phase: 'failed', battles };
  if (run.encounterIndex === RUN_ENCOUNTERS.length - 1) return { ...run, phase: 'complete', battles };
  if (encounter.rewardAfter) {
    return { ...run, phase: 'reward', rewardOptions: offerUpgrades(run), battles };
  }
  return { ...run, phase: 'battle', encounterIndex: run.encounterIndex + 1, battles };
}

export function chooseRunUpgrade(run: RunState, upgradeId: UpgradeId): RunState {
  if (run.phase !== 'reward') throw new Error(`Cannot choose an upgrade during run phase ${run.phase}`);
  if (!run.rewardOptions.includes(upgradeId)) throw new Error(`Upgrade ${upgradeId} was not offered`);
  return {
    ...run,
    phase: 'battle',
    encounterIndex: run.encounterIndex + 1,
    selectedUpgradeIds: [...run.selectedUpgradeIds, upgradeId],
    rewardOptions: [],
  };
}

export function offerUpgrades(run: RunState): UpgradeId[] {
  const available = RUN_UPGRADE_IDS.filter((id) => !run.selectedUpgradeIds.includes(id));
  let seed = nextSeed((run.seed ^ ((run.encounterIndex + 1) * 2654435761)) >>> 0);
  for (let index = available.length - 1; index > 0; index--) {
    const pick = randomInt(seed, index + 1);
    seed = pick.seed;
    [available[index], available[pick.value]] = [available[pick.value], available[index]];
  }
  return available.slice(0, 3);
}

export function dailyRunKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailyRunSeed(key: string): number {
  if (!isDailyRunKey(key)) throw new RangeError(`Invalid UTC daily key ${key}`);
  let hash = 2166136261;
  for (const character of `kingdom-duel:${DAILY_CHALLENGE_VERSION}:${RUN_RULES_VERSION}:${RUN_CONTENT_VERSION}:${key}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function isDailyRunKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
