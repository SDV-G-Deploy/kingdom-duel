import { RUN_ENCOUNTERS } from './content';
import { dailyRunSeed, encounterSeed, isDailyRunKey, offerUpgrades } from './run';
import type { RunSave, RunState, StoragePort, UpgradeId } from './types';
import {
  DAILY_CHALLENGE_VERSION,
  LEGACY_RUN_SAVE_KEY,
  RUN_CONTENT_VERSION,
  RUN_RULES_VERSION,
  RUN_SAVE_KEY,
  RUN_SCHEMA_VERSION,
} from './version';

export { RUN_SAVE_KEY } from './version';

export function saveRun(storage: StoragePort, save: RunSave): void {
  storage.setItem(RUN_SAVE_KEY, JSON.stringify(save));
}

export function loadRun(storage: StoragePort): RunSave | null {
  const raw = storage.getItem(RUN_SAVE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return isRunSave(value) ? value : null;
  } catch {
    return null;
  }
}

export function clearRun(storage: StoragePort): void {
  storage.removeItem(RUN_SAVE_KEY);
  storage.removeItem(LEGACY_RUN_SAVE_KEY);
}

function isRunSave(value: unknown): value is RunSave {
  if (!isRecord(value) || value.version !== RUN_SCHEMA_VERSION || !isRunState(value.run) || !isRecord(value.duel)) return false;
  const duel = value.duel;
  const encounter = RUN_ENCOUNTERS[value.run.encounterIndex];
  if (!encounter || !isUint32(duel.initialSeed) || duel.initialSeed !== encounterSeed(value.run)) return false;
  if (!Array.isArray(duel.actionLog) || !duel.actionLog.every(isActionRecord) ||
    !Array.isArray(duel.log) || !duel.log.every((entry) => typeof entry === 'string') ||
    !Array.isArray(duel.history) || !duel.history.every(isBattleLogEntry) ||
    !isActor(duel.player, 'player') || !isActor(duel.enemy, 'enemy') || !isRecord(duel.board)) return false;
  if (duel.enemy.definitionId !== encounter.enemyId) return false;
  if (duel.mode !== 'interactive' || (duel.current !== 'player' && duel.current !== 'enemy')) return false;
  if (!Number.isInteger(duel.turn) || Number(duel.turn) < 1 || !isUint32(duel.seed)) return false;
  if (duel.selected !== null && !isCell(duel.selected)) return false;
  if (duel.board.width !== 8 || duel.board.height !== 8 || !Array.isArray(duel.board.tiles) ||
    duel.board.tiles.length !== 64 || !duel.board.tiles.every(isTileKind)) return false;
  if (value.run.phase === 'reward' && duel.winner !== 'player') return false;
  if (value.run.phase === 'complete' && (duel.winner !== 'player' || value.run.encounterIndex !== RUN_ENCOUNTERS.length - 1)) return false;
  if (value.run.phase === 'failed' && duel.winner !== 'enemy') return false;
  return duel.winner === null || duel.winner === 'player' || duel.winner === 'enemy';
}

function isRunState(value: unknown): value is RunState {
  if (!isRecord(value)) return false;
  const phases = new Set(['battle', 'reward', 'complete', 'failed']);
  const modes = new Set(['standard', 'daily']);
  if (!(value.version === RUN_SCHEMA_VERSION &&
    value.rulesVersion === RUN_RULES_VERSION &&
    value.contentVersion === RUN_CONTENT_VERSION &&
    isUint32(value.seed) &&
    modes.has(String(value.mode)) &&
    phases.has(String(value.phase)) &&
    Number.isInteger(value.encounterIndex) &&
    Number(value.encounterIndex) >= 0 &&
    Number(value.encounterIndex) < RUN_ENCOUNTERS.length &&
    Array.isArray(value.selectedUpgradeIds) &&
    value.selectedUpgradeIds.every(isUpgradeId) &&
    Array.isArray(value.rewardOptions) &&
    value.rewardOptions.every(isUpgradeId) &&
    Array.isArray(value.battles))) return false;

  const selected = value.selectedUpgradeIds as UpgradeId[];
  const offered = value.rewardOptions as UpgradeId[];
  if (new Set(selected).size !== selected.length || new Set(offered).size !== offered.length) return false;
  if (offered.some((id) => selected.includes(id))) return false;
  if (value.phase === 'reward' ? offered.length !== 3 : offered.length !== 0) return false;
  const priorRewardIndexes = RUN_ENCOUNTERS
    .map((encounter, index) => ({ encounter, index }))
    .filter(({ encounter, index }) => encounter.rewardAfter && index < Number(value.encounterIndex))
    .map(({ index }) => index);
  const expectedUpgradeCount = priorRewardIndexes.length;
  if (selected.length !== expectedUpgradeCount) return false;
  if (!selected.every((upgradeId, index) => {
    const checkpoint = {
      ...(value as unknown as RunState),
      phase: 'battle' as const,
      encounterIndex: priorRewardIndexes[index],
      selectedUpgradeIds: selected.slice(0, index),
      rewardOptions: [],
      battles: [],
    };
    return offerUpgrades(checkpoint).includes(upgradeId);
  })) return false;
  if (value.phase === 'reward' && !sameUpgradeOrder(offered, offerUpgrades(value as unknown as RunState))) return false;

  const expectedBattleCount = value.phase === 'battle' ? Number(value.encounterIndex) : Number(value.encounterIndex) + 1;
  if (value.battles.length !== expectedBattleCount ||
    !value.battles.every((battle, index) => isBattleRecord(
      battle,
      index,
      String(value.phase),
      Number(value.encounterIndex),
    ))) return false;

  if (value.mode === 'daily') {
    if (typeof value.dailyKey !== 'string' || !isDailyRunKey(value.dailyKey) ||
      value.dailyVersion !== DAILY_CHALLENGE_VERSION || dailyRunSeed(value.dailyKey) !== value.seed) return false;
  } else if (value.dailyKey !== null || value.dailyVersion !== null) return false;
  return true;
}

function isActor(value: unknown, actorId: 'player' | 'enemy'): value is Record<string, unknown> & { definitionId: string } {
  return isRecord(value) && typeof value.definitionId === 'string' && typeof value.name === 'string' &&
    value.id === actorId &&
    isFiniteNumber(value.hp) && isFiniteNumber(value.maxHp) && isFiniteNumber(value.guard) &&
    isFiniteNumber(value.sun) && isFiniteNumber(value.moon) && isFiniteNumber(value.crown) &&
    value.maxHp > 0 && value.hp >= 0 && value.hp <= value.maxHp && value.guard >= 0 &&
    value.sun >= 0 && value.moon >= 0 && value.crown >= 0 &&
    (value.passiveId === null || typeof value.passiveId === 'string') &&
    Array.isArray(value.abilityIds) && value.abilityIds.every((id) => typeof id === 'string');
}

function isActionRecord(value: unknown): boolean {
  if (!isRecord(value) || !isPositiveInteger(value.id) || !isPositiveInteger(value.turn) ||
    typeof value.accepted !== 'boolean' || !isRecord(value.action) || !Array.isArray(value.events)) return false;
  const action = value.action;
  if (action.actor !== 'player' && action.actor !== 'enemy') return false;
  if (action.type === 'swap') return isCell(action.from) && isCell(action.to);
  if (action.type === 'cast') return typeof action.abilityId === 'string' && isCell(action.target);
  return action.type === 'refill';
}

function isBattleLogEntry(value: unknown): boolean {
  return isRecord(value) && isPositiveInteger(value.id) && isPositiveInteger(value.turn) &&
    (value.actor === 'player' || value.actor === 'enemy' || value.actor === 'system') &&
    typeof value.summary === 'string' && typeof value.detail === 'string' &&
    Array.isArray(value.events) && value.events.every((event) => typeof event === 'string') &&
    isRecord(value.before) && isRecord(value.after) &&
    isActorSnapshot(value.before.player) && isActorSnapshot(value.before.enemy) &&
    isActorSnapshot(value.after.player) && isActorSnapshot(value.after.enemy);
}

function isActorSnapshot(value: unknown): boolean {
  return isRecord(value) && isFiniteNumber(value.hp) && isFiniteNumber(value.maxHp) &&
    isFiniteNumber(value.guard) && isFiniteNumber(value.sun) && isFiniteNumber(value.moon) &&
    isFiniteNumber(value.crown);
}

function isCell(value: unknown): boolean {
  return isRecord(value) && Number.isInteger(value.x) && Number.isInteger(value.y) &&
    Number(value.x) >= 0 && Number(value.x) < 8 && Number(value.y) >= 0 && Number(value.y) < 8;
}

function isBattleRecord(value: unknown, index: number, phase: string, encounterIndex: number): boolean {
  if (!isRecord(value) || value.encounterId !== RUN_ENCOUNTERS[index]?.id) return false;
  const expectedWinner = phase === 'failed' && index === encounterIndex ? 'enemy' : 'player';
  return value.winner === expectedWinner && isPositiveInteger(value.turns) &&
    isNonNegativeInteger(value.actions) && isFiniteNumber(value.playerHp) && value.playerHp >= 0;
}

function isTileKind(value: unknown): boolean {
  return typeof value === 'string' && new Set(['sword', 'shield', 'sun', 'moon', 'crown', 'shade', 'aether']).has(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isUint32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isUpgradeId(value: unknown): value is UpgradeId {
  return typeof value === 'string' && new Set([
    'solar_halo',
    'aether_relay',
    'royal_bastion',
    'ward_battery',
    'veilbreaker_lens',
    'aether_core',
  ]).has(value);
}

function sameUpgradeOrder(first: UpgradeId[], second: UpgradeId[]): boolean {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
