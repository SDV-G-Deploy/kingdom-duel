import type { DuelState } from '../engine/types';
import type {
  DAILY_CHALLENGE_VERSION,
  RUN_CONTENT_VERSION,
  RUN_RULES_VERSION,
  RUN_SCHEMA_VERSION,
} from './version';

export type RunMode = 'standard' | 'daily';
export type RunPhase = 'battle' | 'reward' | 'complete' | 'failed';
export type EncounterTier = 'normal' | 'elite' | 'boss';
export type UpgradeId =
  | 'solar_halo'
  | 'aether_relay'
  | 'royal_bastion'
  | 'ward_battery'
  | 'veilbreaker_lens'
  | 'aether_core';

export type EncounterDefinition = {
  id: string;
  name: string;
  subtitle: string;
  tier: EncounterTier;
  enemyId: string;
  seedSalt: number;
  enemyHpBonus: number;
  enemyGuardBonus: number;
  rewardAfter: boolean;
};

export type UpgradeDefinition = {
  id: UpgradeId;
  name: string;
  description: string;
  path: 'sun' | 'aether' | 'crown' | 'ward' | 'shade';
};

export type RunBattleRecord = {
  encounterId: string;
  winner: 'player' | 'enemy';
  turns: number;
  actions: number;
  playerHp: number;
};

export type RunState = {
  version: typeof RUN_SCHEMA_VERSION;
  rulesVersion: typeof RUN_RULES_VERSION;
  contentVersion: typeof RUN_CONTENT_VERSION;
  seed: number;
  mode: RunMode;
  dailyKey: string | null;
  dailyVersion: typeof DAILY_CHALLENGE_VERSION | null;
  phase: RunPhase;
  encounterIndex: number;
  selectedUpgradeIds: UpgradeId[];
  rewardOptions: UpgradeId[];
  battles: RunBattleRecord[];
};

export type RunSave = {
  version: typeof RUN_SCHEMA_VERSION;
  run: RunState;
  duel: DuelState;
};

export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
