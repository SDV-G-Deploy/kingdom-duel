import type { DuelRules } from './types';

export const DEFAULT_DUEL_RULES: DuelRules = {
  board: {
    width: 8,
    height: 8,
  },
  actors: {
    player: {
      name: 'Aurora Knight',
      hp: 42,
      guard: 4,
    },
    enemy: {
      name: 'Shade Knight',
      hp: 38,
      guard: 2,
    },
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
      enemyScorePerTile: 4,
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
  },
  match: {
    extraTurnLength: 4,
    maxCascades: 16,
  },
  enemy: {
    name: 'Shade Knight',
    extraTurnScore: 18,
  },
  spells: {
    sun_bloom: {
      id: 'sun_bloom',
      name: 'Sun Bloom',
      cost: { sun: 6 },
      target: 'cell',
      radius: 1,
      convertTo: 'sun',
    },
    glass_ward: {
      id: 'glass_ward',
      name: 'Glass Ward',
      cost: { moon: 5 },
      target: 'cell',
      guard: 4,
      radius: 1,
      fromTile: 'shade',
      convertTo: 'shield',
    },
    crown_strike: {
      id: 'crown_strike',
      name: 'Crown Strike',
      cost: { crown: 6 },
      target: 'row',
    },
  },
  openingLog: [
    'Aurora Knight enters the glass board.',
    'Match 4+ for an extra turn. Do not leave shade chains for the enemy.',
  ],
};
