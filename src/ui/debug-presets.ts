import { createDuel } from '../engine/duel';
import type { Board, DuelRules, DuelState, TileKind } from '../engine/types';
import type { BattleUiState } from './state';

export type DebugPreset =
  | 'result-victory'
  | 'result-defeat'
  | 'state-selected'
  | 'state-valid-swap'
  | 'state-spell-aim'
  | 'state-spell-armed'
  | 'state-backlash'
  | 'state-snapback';

export type DebugSession = {
  duel: DuelState;
  ui: Partial<BattleUiState>;
};

export function createDebugSession(value: string | null, rules: DuelRules): DebugSession {
  const preset = isDebugPreset(value) ? value : null;
  let duel = preset === 'result-victory' || preset === 'result-defeat'
    ? createResultDuel(preset, rules)
    : createDuel(2007, rules);
  const ui: Partial<BattleUiState> = {};

  if (preset === 'state-spell-aim') {
    duel = { ...duel, player: { ...duel.player, sun: 8 } };
    ui.activeAbilityId = 'sun_bloom';
    ui.hoverCell = { x: 3, y: 3 };
  } else if (preset === 'state-selected') {
    ui.selectedCell = { x: 2, y: 1 };
  } else if (preset === 'state-valid-swap') {
    ui.selectedCell = { x: 2, y: 1 };
    ui.hoverCell = { x: 2, y: 0 };
  } else if (preset === 'state-spell-armed') {
    duel = { ...duel, player: { ...duel.player, moon: 5 } };
    ui.activeAbilityId = 'glass_ward';
    ui.hoverCell = { x: 3, y: 3 };
    ui.confirmedAbilityTarget = { x: 3, y: 3 };
  } else if (preset === 'state-backlash') {
    duel = createBacklashDuel(rules);
    ui.selectedCell = { x: 2, y: 1 };
    ui.hoverCell = { x: 2, y: 0 };
  } else if (preset === 'state-snapback') {
    ui.selectedCell = { x: 2, y: 1 };
    ui.hoverCell = { x: 1, y: 1 };
    ui.invalidCue = 'No match: the target tile snapped back.';
  }

  return { duel, ui };
}

function isDebugPreset(value: string | null): value is DebugPreset {
  return value === 'result-victory' ||
    value === 'result-defeat' ||
    value === 'state-selected' ||
    value === 'state-valid-swap' ||
    value === 'state-spell-aim' ||
    value === 'state-spell-armed' ||
    value === 'state-backlash' ||
    value === 'state-snapback';
}

function createResultDuel(preset: 'result-victory' | 'result-defeat', rules: DuelRules): DuelState {
  const base = createDuel(2007, rules);
  if (preset === 'result-victory') {
    return {
      ...base,
      current: 'player',
      turn: 7,
      winner: 'player',
      player: { ...base.player, hp: 13, guard: 4, sun: 1, moon: 2, crown: 0 },
      enemy: { ...base.enemy, hp: 0, guard: 1, sun: 3, moon: 1, crown: 1 },
      log: [
        'Aurora Knight opens the glass duel.',
        'Sun Bloom ignites the center lane.',
        'Aurora Knight seals the last break in Shade Veil.',
      ],
      history: [
        ...base.history,
        {
          id: 3,
          turn: 4,
          actor: 'player',
          summary: 'Sun Bloom re-cut the board and kept the turn.',
          detail: 'Aurora Knight cast Sun Bloom to convert the center cluster into sun and reopen lethal pressure.',
          events: ['cast Sun Bloom', 'matched 4 sun for 4 mana', 'kept the turn'],
          before: {
            player: { hp: 18, maxHp: 20, guard: 2, sun: 5, moon: 1, crown: 0 },
            enemy: { hp: 14, maxHp: 20, guard: 2, sun: 0, moon: 2, crown: 1 },
          },
          after: {
            player: { hp: 18, maxHp: 20, guard: 2, sun: 3, moon: 1, crown: 0 },
            enemy: { hp: 9, maxHp: 20, guard: 1, sun: 0, moon: 2, crown: 1 },
          },
        },
        {
          id: 4,
          turn: 7,
          actor: 'player',
          summary: 'Aurora Knight finished the duel with a crown strike.',
          detail: 'Aurora Knight converted stored mana into a final Crown Strike and dropped Shade Knight to 0 HP.',
          events: ['cast Crown Strike', 'dealt 9 damage', 'Shade Knight reached 0 HP'],
          before: {
            player: { hp: 13, maxHp: 20, guard: 3, sun: 1, moon: 2, crown: 5 },
            enemy: { hp: 8, maxHp: 20, guard: 1, sun: 3, moon: 1, crown: 1 },
          },
          after: {
            player: { hp: 13, maxHp: 20, guard: 4, sun: 1, moon: 2, crown: 0 },
            enemy: { hp: 0, maxHp: 20, guard: 1, sun: 3, moon: 1, crown: 1 },
          },
        },
      ],
    };
  }

  return {
    ...base,
    current: 'enemy',
    turn: 6,
    winner: 'enemy',
    player: { ...base.player, hp: 0, guard: 0, sun: 4, moon: 3, crown: 4 },
    enemy: { ...base.enemy, hp: 8, guard: 2, sun: 1, moon: 1, crown: 2 },
    log: [
      'Aurora Knight opens the glass duel.',
      'Shade Knight chains a backlash trap.',
      'Aurora Knight falls under shade pressure.',
    ],
    history: [
      ...base.history,
      {
        id: 3,
        turn: 5,
        actor: 'enemy',
        summary: 'Shade Knight chained a backlash line and kept the turn.',
        detail: 'Shade Knight converted a shade pocket into damage pressure and forced Aurora low before the last exchange.',
        events: ['matched 4 shade', 'Aurora paid 4 HP backlash', 'kept the turn'],
        before: {
          player: { hp: 8, maxHp: 20, guard: 1, sun: 4, moon: 2, crown: 4 },
          enemy: { hp: 13, maxHp: 20, guard: 1, sun: 1, moon: 1, crown: 2 },
        },
        after: {
          player: { hp: 4, maxHp: 20, guard: 0, sun: 4, moon: 2, crown: 4 },
          enemy: { hp: 13, maxHp: 20, guard: 2, sun: 1, moon: 1, crown: 2 },
        },
      },
      {
        id: 4,
        turn: 6,
        actor: 'player',
        summary: 'Aurora Knight broke on a risky sword answer.',
        detail: 'Aurora Knight tried to answer with sword pressure but paid fatal shade backlash and fell with mana still banked.',
        events: ['matched 3 swords', 'Aurora paid 4 HP backlash', 'Aurora Knight reached 0 HP'],
        before: {
          player: { hp: 4, maxHp: 20, guard: 0, sun: 4, moon: 3, crown: 4 },
          enemy: { hp: 8, maxHp: 20, guard: 2, sun: 1, moon: 1, crown: 2 },
        },
        after: {
          player: { hp: 0, maxHp: 20, guard: 0, sun: 4, moon: 3, crown: 4 },
          enemy: { hp: 8, maxHp: 20, guard: 2, sun: 1, moon: 1, crown: 2 },
        },
      },
    ],
  };
}

function createBacklashDuel(rules: DuelRules): DuelState {
  const base = createDuel(2007, rules);
  const tiles: TileKind[] = Array.from({ length: 64 }, (_, index) => {
    const x = index % 8;
    const y = Math.floor(index / 8);
    return ['sun', 'shield', 'sword', 'moon', 'crown', 'shade'][(x + y) % 6] as TileKind;
  });
  const board: Board = { width: 8, height: 8, tiles };
  board.tiles[0] = 'shade';
  board.tiles[1] = 'shade';
  board.tiles[2] = 'sun';
  board.tiles[3] = 'shade';
  board.tiles[10] = 'shade';

  return {
    ...base,
    board,
    seed: 99,
    player: { ...base.player, hp: 4, guard: 0 },
    enemy: { ...base.enemy, hp: 14, guard: 1 },
    log: ['Shade pressure is climbing. One sword answer risks lethal backlash.'],
  };
}
