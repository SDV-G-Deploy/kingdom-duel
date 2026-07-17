import type { EncounterDefinition, UpgradeDefinition, UpgradeId } from './types';

export const RUN_ENCOUNTERS: readonly EncounterDefinition[] = [
  {
    id: 'glass_edge',
    name: 'Glass Edge',
    subtitle: 'Read Shade charge before it opens the first rift.',
    tier: 'normal',
    enemyId: 'shade_knight',
    seedSalt: 101,
    enemyHpBonus: -6,
    enemyGuardBonus: -1,
    rewardAfter: true,
  },
  {
    id: 'moon_lock',
    name: 'Moon Lock',
    subtitle: 'The Warden values Moon and Shield, turning defence into tempo.',
    tier: 'normal',
    enemyId: 'moon_warden',
    seedSalt: 211,
    enemyHpBonus: 0,
    enemyGuardBonus: 0,
    rewardAfter: true,
  },
  {
    id: 'veil_elite',
    name: 'Veil Champion',
    subtitle: 'An elite Shade profile with a deeper Guard reserve.',
    tier: 'elite',
    enemyId: 'shade_knight',
    seedSalt: 307,
    enemyHpBonus: 8,
    enemyGuardBonus: 4,
    rewardAfter: false,
  },
  {
    id: 'eclipse_crown',
    name: 'Eclipse Crown',
    subtitle: 'The Regent combines Moon and Crown into a 3×3 Shade surge.',
    tier: 'boss',
    enemyId: 'eclipse_regent',
    seedSalt: 419,
    enemyHpBonus: 0,
    enemyGuardBonus: 0,
    rewardAfter: false,
  },
] as const;

export const RUN_UPGRADES: Record<UpgradeId, UpgradeDefinition> = {
  solar_halo: {
    id: 'solar_halo',
    name: 'Solar Halo',
    description: 'Sun Bloom changes from a five-tile cross into a full 3×3 halo.',
    path: 'sun',
  },
  aether_relay: {
    id: 'aether_relay',
    name: 'Aether Relay',
    description: 'Detonating Aether keeps Aurora\'s turn.',
    path: 'aether',
  },
  royal_bastion: {
    id: 'royal_bastion',
    name: 'Royal Bastion',
    description: 'Crown Strike raises 5 Guard before firing its row.',
    path: 'crown',
  },
  ward_battery: {
    id: 'ward_battery',
    name: 'Ward Battery',
    description: 'Glass Ward also seals nearby Moon gems into Shield.',
    path: 'ward',
  },
  veilbreaker_lens: {
    id: 'veilbreaker_lens',
    name: 'Veilbreaker Lens',
    description: 'Aurora no longer pays backlash when matching Shade.',
    path: 'shade',
  },
  aether_core: {
    id: 'aether_core',
    name: 'Wide Aether Core',
    description: 'Aether deals 8 damage and clears a radius-2 field instead of a 3×3 area.',
    path: 'aether',
  },
};

export const RUN_UPGRADE_IDS = Object.keys(RUN_UPGRADES) as UpgradeId[];
