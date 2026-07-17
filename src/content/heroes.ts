import type { HeroDefinition } from '../engine/types';

export const AURORA_KNIGHT: HeroDefinition = {
  id: 'aurora_knight',
  kind: 'hero',
  name: 'Aurora Knight',
  hp: 42,
  guard: 4,
  abilityIds: ['glass_ward', 'crown_strike', 'sun_bloom'],
  passiveId: 'prism_guard',
};

export const HERO_DEFINITIONS: Record<string, HeroDefinition> = {
  [AURORA_KNIGHT.id]: AURORA_KNIGHT,
};
