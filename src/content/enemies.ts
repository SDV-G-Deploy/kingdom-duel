import type { EnemyDefinition } from '../engine/types';

export const SHADE_KNIGHT: EnemyDefinition = {
  id: 'shade_knight',
  kind: 'enemy',
  name: 'Shade Knight',
  hp: 38,
  guard: 2,
  abilityIds: ['veil_rift'],
  passiveId: null,
  ai: {
    extraTurnScore: 18,
    tileScores: { shade: 12, moon: 8, sword: 8, shield: 3, sun: 4, crown: 5 },
  },
};

export const MOON_WARDEN: EnemyDefinition = {
  id: 'moon_warden',
  kind: 'enemy',
  name: 'Moon Warden',
  hp: 38,
  guard: 5,
  abilityIds: ['lunar_lock'],
  passiveId: null,
  ai: {
    extraTurnScore: 20,
    tileScores: { shield: 9, moon: 11, sword: 5, shade: 7, sun: 2, crown: 3 },
  },
};

export const ECLIPSE_REGENT: EnemyDefinition = {
  id: 'eclipse_regent',
  kind: 'enemy',
  name: 'Eclipse Regent',
  hp: 48,
  guard: 6,
  abilityIds: ['eclipse_surge'],
  passiveId: null,
  ai: {
    extraTurnScore: 24,
    tileScores: { shade: 15, moon: 10, crown: 9, sword: 10, shield: 4, sun: 2 },
  },
};

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  [SHADE_KNIGHT.id]: SHADE_KNIGHT,
  [MOON_WARDEN.id]: MOON_WARDEN,
  [ECLIPSE_REGENT.id]: ECLIPSE_REGENT,
};
