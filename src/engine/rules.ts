import { ABILITY_DEFINITIONS, ENEMY_DEFINITIONS, HERO_DEFINITIONS, PASSIVE_DEFINITIONS } from '../content';
import type { DuelRules } from './types';

export const DEFAULT_DUEL_RULES: DuelRules = {
  board: {
    width: 8,
    height: 8,
  },
  actors: {
    player: HERO_DEFINITIONS.aurora_knight,
    enemy: ENEMY_DEFINITIONS.shade_knight,
  },
  tiles: {
    sword: {
      label: 'swords',
      effect: { type: 'damage', amountPerTile: 1 },
      enemyScorePerTile: 8,
    },
    shield: {
      label: 'guard',
      effect: { type: 'guard', amountPerTile: 1 },
      enemyScorePerTile: 3,
    },
    sun: {
      label: 'sun mana',
      effect: { type: 'mana', mana: 'sun', amountPerTile: 1 },
      enemyScorePerTile: 4,
    },
    moon: {
      label: 'moon mana',
      effect: { type: 'mana', mana: 'moon', amountPerTile: 1 },
      enemyScorePerTile: 8,
    },
    crown: {
      label: 'crown charge',
      effect: { type: 'mana', mana: 'crown', amountPerTile: 1 },
      enemyScorePerTile: 5,
    },
    shade: {
      label: 'shade damage',
      effect: { type: 'risky_damage', amountPerTile: 2, playerBacklashPerTile: 1 },
      enemyScorePerTile: 12,
    },
    aether: {
      label: 'aether burst',
      effect: { type: 'special', damage: 5, radius: 1 },
      enemyScorePerTile: 18,
    },
  },
  match: {
    extraTurnLength: 4,
    specialCreateLength: 5,
    maxCascades: 16,
  },
  abilities: ABILITY_DEFINITIONS,
  passives: PASSIVE_DEFINITIONS,
  openingLog: [
    'Aurora Knight enters the glass board.',
    'Match 4 for an extra turn. Match 5 to forge Aether. Deny Moon before Shade opens Veil Rift.',
  ],
};
