import './styles.css';
import { areAdjacent, findLegalMoves, getTile } from './engine/board';
import { applySwap, castSpell, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './engine/duel';
import { DEFAULT_DUEL_RULES } from './engine/rules';
import type { Board, Cell, DuelState, EnemyIntent, ManaCost, MovePreview, PreviewEffect, SpellId, TileKind } from './engine/types';
import { chooseDragCommitCell, chooseSpellTargetTapAction } from './input';

type GemKind = TileKind;
type CharacterSlot = 'hero' | 'enemy';
type AssetSlot = {
  path: string;
  src: string | null;
};
type SpellTargetPreview = {
  spellId: SpellId;
  title: string;
  hint: string;
  effects: PreviewEffect[];
  extraTurn: boolean;
  fatal: boolean;
};
type BattleRecap = {
  outcome: string;
  cause: string;
  turningPoint: string;
  pressure: string;
  lesson: string;
};
type TerminalBeat = {
  title: string;
  detail: string;
};
type TerminalEventMeta = {
  label: string;
  summary: string;
  action: string;
};
type DebugPreset =
  | 'result-victory'
  | 'result-defeat'
  | 'state-selected'
  | 'state-valid-swap'
  | 'state-spell-aim'
  | 'state-spell-armed'
  | 'state-backlash'
  | 'state-snapback';

const boardPattern: GemKind[] = [
  'sun',
  'shield',
  'sword',
  'moon',
  'crown',
  'sun',
  'shade',
  'shield',
  'sword',
  'moon',
  'sun',
  'shield',
  'sword',
  'crown',
  'moon',
  'sun',
  'shield',
  'sword',
  'crown',
  'shade',
  'moon',
  'sun',
  'shield',
  'crown',
  'moon',
  'sun',
  'shield',
  'sword',
  'crown',
  'shade',
  'sun',
  'moon',
  'crown',
  'shield',
  'sun',
  'moon',
  'sword',
  'shield',
  'crown',
  'shade',
  'sun',
  'moon',
  'shield',
  'crown',
  'sword',
  'sun',
  'moon',
  'shield',
  'shade',
  'crown',
  'sun',
  'sword',
  'shield',
  'moon',
  'crown',
  'sun',
  'shield',
  'moon',
  'sword',
  'crown',
  'sun',
  'shade',
  'shield',
  'moon',
];

const gemKinds: GemKind[] = ['sword', 'shield', 'sun', 'moon', 'crown', 'shade'];
const characterAssetSlots: Record<CharacterSlot, AssetSlot> = {
  hero: { path: 'assets/characters/aurora-knight.webp', src: 'assets/characters/aurora-knight.webp' },
  enemy: { path: 'assets/characters/shade-knight.webp', src: 'assets/characters/shade-knight.webp' },
};
const gemAssetSlots: Record<GemKind, AssetSlot> = {
  sword: { path: 'assets/gems/sword.webp', src: 'assets/gems/sword.webp' },
  shield: { path: 'assets/gems/shield.webp', src: 'assets/gems/shield.webp' },
  sun: { path: 'assets/gems/sun.webp', src: 'assets/gems/sun.webp' },
  moon: { path: 'assets/gems/moon.webp', src: 'assets/gems/moon.webp' },
  crown: { path: 'assets/gems/crown.webp', src: 'assets/gems/crown.webp' },
  shade: { path: 'assets/gems/shade.webp', src: 'assets/gems/shade.webp' },
};

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('App root missing');
}

const app = appRoot;
const search = new URLSearchParams(window.location.search);
const debugPreset = search.get('debug');

let view: 'play' | 'moodboard' = search.get('view') === 'moodboard' ? 'moodboard' : 'play';
let duel: DuelState =
  debugPreset === 'result-victory' || debugPreset === 'result-defeat' ? createDebugDuel(debugPreset) : createDuel(2007);
let selectedCell: Cell | null = null;
let hoverCell: Cell | null = null;
let activeSpell: SpellId | null = null;
let confirmedSpellTarget: Cell | null = null;
let enemyThinking = false;
let logOpen = false;
let bumpCell: Cell | null = null;
let dragState: { pointerId: number; startCell: Cell; startX: number; startY: number } | null = null;
let suppressNextCellClick = false;
let bumpTimer: number | null = null;
let invalidCue: string | null = null;
let invalidCueTimer: number | null = null;
let enemyCue: { cells: Cell[]; summary: string } | null = null;
let enemyCueTimer: number | null = null;

if (debugPreset === 'state-spell-aim') {
  duel.player = { ...duel.player, sun: 6 };
  activeSpell = 'sun_bloom';
  hoverCell = { x: 3, y: 3 };
}

if (debugPreset === 'state-selected') {
  selectedCell = { x: 2, y: 1 };
}

if (debugPreset === 'state-valid-swap') {
  selectedCell = { x: 2, y: 1 };
  hoverCell = { x: 2, y: 0 };
}

if (debugPreset === 'state-spell-armed') {
  duel.player = { ...duel.player, moon: 5 };
  activeSpell = 'glass_ward';
  hoverCell = { x: 3, y: 3 };
  confirmedSpellTarget = { x: 3, y: 3 };
}

if (debugPreset === 'state-backlash') {
  duel = createBacklashDebugDuel();
  selectedCell = { x: 2, y: 1 };
  hoverCell = { x: 2, y: 0 };
}

if (debugPreset === 'state-snapback') {
  selectedCell = { x: 2, y: 1 };
  hoverCell = { x: 1, y: 1 };
  invalidCue = 'No match: the target tile snapped back.';
}

function gemIcon(kind: GemKind): string {
  void kind;
  return '';
}

function createDebugDuel(preset: DebugPreset): DuelState {
  const base = createDuel(2007);
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

function createBacklashDebugDuel(): DuelState {
  const base = createDuel(2007);
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

function gemLabel(kind: GemKind): string {
  if (kind === 'sword') return 'Sword';
  if (kind === 'shield') return 'Shield';
  if (kind === 'sun') return 'Sun';
  if (kind === 'moon') return 'Moon';
  if (kind === 'crown') return 'Crown';
  return 'Shade';
}

function assetStyle(src: string | null): string {
  if (!src) return '';
  const assetUrl = new URL(src, window.location.href).toString();
  return ` style="--asset-url: url('${assetUrl}')"`;
}

function renderPortraitSlot(slot: CharacterSlot): string {
  const asset = characterAssetSlots[slot];
  return `
    <span class="portrait-slot portrait-${slot} ${asset.src ? 'has-asset' : ''}" aria-hidden="true" data-asset-path="${asset.path}"${assetStyle(asset.src)}>
      <span class="portrait-fallback"></span>
    </span>
  `;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function tileAtLabel(cell: Cell): string {
  return gemLabel(getTile(duel.board, cell));
}

function swapTruthLabel(from: Cell, to: Cell): string {
  return `${tileAtLabel(from)} -> ${tileAtLabel(to)}`;
}

function renderGem(kind: GemKind, index?: number, classes: string[] = []): string {
  const asset = gemAssetSlots[kind];
  return `
    <button class="gem gem-${kind} ${asset.src ? 'has-sprite' : ''} ${classes.join(' ')}" type="button" aria-label="${gemLabel(kind)} tile"${index === undefined ? '' : ` data-cell="${index}"`}>
      <span class="gem-sprite-slot" aria-hidden="true" data-asset-path="${asset.path}"${assetStyle(asset.src)}></span>
      <span class="gem-fallback" aria-hidden="true">
        <span class="gem-shine"></span>
        <span class="gem-symbol gem-symbol-${kind}">${gemIcon(kind)}</span>
      </span>
    </button>
  `;
}

function cellFromIndex(index: number): Cell {
  return { x: index % duel.board.width, y: Math.floor(index / duel.board.width) };
}

function sameCell(a: Cell | null, b: Cell): boolean {
  return !!a && a.x === b.x && a.y === b.y;
}

function canUseBoard(): boolean {
  return view === 'play' && duel.current === 'player' && !duel.winner && !enemyThinking;
}

function adjacentCellSet(cell: Cell | null): Set<string> {
  const cells = new Set<string>();
  if (!cell) return cells;

  for (const next of [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ]) {
    if (next.x >= 0 && next.x < duel.board.width && next.y >= 0 && next.y < duel.board.height) {
      cells.add(cellKey(next));
    }
  }

  return cells;
}

function validSwapCellSet(cell: Cell | null): Set<string> {
  const cells = new Set<string>();
  if (!cell) return cells;

  for (const targetKey of adjacentCellSet(cell)) {
    const [x, y] = targetKey.split(',').map(Number);
    const target = { x, y };
    if (previewSwap(duel.board, cell, target).valid) cells.add(targetKey);
  }

  return cells;
}

function statBar(label: string, value: number, max: number, tone: string): string {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `
    <div class="stat-bar" style="--bar:${pct}; --tone:${tone}">
      <span>${label}</span>
      <strong>${value}/${max}</strong>
      <i></i>
    </div>
  `;
}

function activePreview(): MovePreview | null {
  if (!selectedCell || !hoverCell || sameCell(selectedCell, hoverCell)) return null;
  return previewSwap(duel.board, selectedCell, hoverCell);
}

function previewCellSet(preview: MovePreview | null): Set<string> {
  const cells = new Set<string>();
  if (!preview?.valid) return cells;
  cells.add(cellKey(preview.from));
  cells.add(cellKey(preview.to));
  for (const match of preview.matches) {
    for (const cell of match.cells) cells.add(cellKey(cell));
  }
  return cells;
}

function intentCellSet(intent: EnemyIntent | null): Set<string> {
  const cells = new Set<string>();
  if (!intent) return cells;
  cells.add(cellKey(intent.from));
  cells.add(cellKey(intent.to));
  for (const match of intent.preview.matches) {
    for (const cell of match.cells) cells.add(cellKey(cell));
  }
  return cells;
}

function activeSpellPreviewCell(): Cell | null {
  return confirmedSpellTarget ?? hoverCell;
}

function spellTargetCellSet(): Set<string> {
  const cells = new Set<string>();
  const target = activeSpellPreviewCell();
  if (!activeSpell || !target) return cells;
  const spell = DEFAULT_DUEL_RULES.spells[activeSpell];
  if (spell.target === 'row') {
    for (let x = 0; x < duel.board.width; x++) cells.add(cellKey({ x, y: target.y }));
    return cells;
  }

  for (let y = target.y - spell.radius; y <= target.y + spell.radius; y++) {
    for (let x = target.x - spell.radius; x <= target.x + spell.radius; x++) {
      if (x >= 0 && x < duel.board.width && y >= 0 && y < duel.board.height) cells.add(cellKey({ x, y }));
    }
  }
  return cells;
}

function renderPlayableBoard(preview: MovePreview | null, intent: EnemyIntent | null): string {
  const previewCells = previewCellSet(preview);
  const intentCells = intentCellSet(intent);
  const spellTargetCells = spellTargetCellSet();
  const neighborCells = activeSpell ? new Set<string>() : adjacentCellSet(selectedCell);
  const validSwapCells = activeSpell ? new Set<string>() : validSwapCellSet(selectedCell);
  const enemyCueCells = new Set(enemyCue?.cells.map(cellKey) ?? []);
  return `
    <div class="play-board ${activeSpell ? 'is-targeting' : ''}" aria-label="Playable match-3 board">
      ${duel.board.tiles
        .map((kind, index) => {
          const cell = cellFromIndex(index);
          const key = cellKey(cell);
          const classes = [
            sameCell(selectedCell, cell) ? 'is-selected' : '',
            sameCell(hoverCell, cell) ? 'is-hovered' : '',
            sameCell(confirmedSpellTarget, cell) ? 'is-spell-confirmed' : '',
            neighborCells.has(key) ? 'is-neighbor' : '',
            validSwapCells.has(key) ? 'is-valid-swap' : '',
            sameCell(bumpCell, cell) ? 'is-bumped' : '',
            enemyCueCells.has(key) ? 'is-enemy-action' : '',
            previewCells.has(key) ? 'is-preview' : '',
            intentCells.has(key) ? 'is-threat' : '',
            spellTargetCells.has(key) ? 'is-spell-target' : '',
          ].filter(Boolean);
          return renderGem(kind, index, classes);
        })
        .join('')}
    </div>
  `;
}

function renderPreviewPanel(preview: MovePreview | null, snapBackCue: string | null): string {
  if (activeSpell) {
    const spell = DEFAULT_DUEL_RULES.spells[activeSpell];
    const spellPreview = activeSpellTargetPreview();
    if (spellPreview) {
      const confirmHint = confirmedSpellTarget ? ' Tap same target again to cast.' : '';
      return `
        <div class="decision-panel ${spellPreview.extraTurn ? 'is-extra' : ''} ${spellPreview.fatal ? 'is-risk' : ''} ${confirmedSpellTarget ? 'is-armed' : 'is-aim'}">
          <span>${confirmedSpellTarget ? 'Spell armed' : spellRoleLabel(activeSpell)} · ${costLabel(spell.cost)}</span>
          <strong>${spellPreview.title}</strong>
          <p>${spellPreview.hint}${confirmHint}</p>
          <div class="effect-row">
            ${spellPreview.effects.map(renderEffectPill).join('')}
            ${spellPreview.extraTurn ? '<em class="effect-pill tone-extra">extra turn</em>' : ''}
          </div>
        </div>
      `;
    }
    return `
      <div class="decision-panel is-extra">
        <span>${spellRoleLabel(activeSpell)} · ${costLabel(spell.cost)}</span>
        <strong>${spell.name}</strong>
        <p>${spellTargetHint(activeSpell)}</p>
      </div>
    `;
  }

  if (snapBackCue) {
    return `
      <div class="decision-panel is-risk is-snapback">
        <span>Strike failed</span>
        <strong>No match. Gem snaps back.</strong>
        <p>${snapBackCue}</p>
      </div>
    `;
  }

  if (!selectedCell) {
    return `
      <div class="decision-panel is-empty is-deck">
        <span>Command deck</span>
        <strong>Pick a strike gem</strong>
        <p>Tap a gem. Bright sockets are safe; pink marks Shade risk.</p>
      </div>
    `;
  }

  if (!preview) {
    return `
      <div class="decision-panel is-empty is-deck is-selection">
        <span>Tile claimed</span>
        <strong>Choose a lit socket</strong>
        <p>Aqua sockets strike. Pale sockets snap back.</p>
      </div>
    `;
  }

  if (!preview.valid) {
    return `
      <div class="decision-panel is-risk is-snapback">
        <span>Strike failed</span>
        <strong>${swapTruthLabel(preview.from, preview.to)}: no match</strong>
        <p>No chain forms here. Shift to a bright socket before Shade gets tempo.</p>
      </div>
    `;
  }

  const backlash = previewBacklash(preview);
  const fatalBacklash = backlash > 0 && backlash >= duel.player.hp;
  return `
    <div class="decision-panel ${preview.extraTurn ? 'is-extra' : ''} ${backlash ? 'is-risk is-backlash' : 'is-valid-route'}">
      <span>${backlash ? 'Risk strike' : preview.extraTurn ? 'Tempo strike' : 'Strike ready'} · ${swapTruthLabel(preview.from, preview.to)}</span>
      <strong>${backlash ? backlashPreviewTitle(backlash, fatalBacklash) : preview.summary}</strong>
      ${backlash ? `<p>${backlashPreviewHint(backlash, fatalBacklash)}</p>` : ''}
      <div class="effect-row">
        ${preview.effects.map(renderEffectPill).join('')}
        ${preview.extraTurn ? '<em class="effect-pill tone-extra">extra turn</em>' : ''}
      </div>
    </div>
  `;
}

function renderEffectPill(effect: PreviewEffect): string {
  const sign = effect.tone === 'risk' ? '-' : '+';
  return `<em class="effect-pill tone-${effect.tone}">${sign}${effect.value} ${combatEffectLabel(effect)}</em>`;
}

function combatEffectLabel(effect: PreviewEffect): string {
  if (effect.label === 'sun' || effect.label === 'moon' || effect.label === 'crown') return `${effect.label} mana`;
  if (effect.label === 'shade damage') return 'shade damage';
  if (effect.label === 'backlash') return 'Aurora HP';
  return effect.label;
}

function intentReason(intent: EnemyIntent): string {
  const parts = intent.preview.effects
    .filter((effect) => effect.label !== 'backlash')
    .map((effect) => `+${effect.value} ${combatEffectLabel(effect)}`);

  if (intent.preview.extraTurn) parts.push('keeps turn');
  return parts.length ? parts.join(', ') : intent.preview.summary;
}

function previewBacklash(preview: MovePreview | null): number {
  if (!preview?.valid) return 0;
  return preview.effects.find((effect) => effect.label === 'backlash')?.value ?? 0;
}

function activeSpellTargetPreview(): SpellTargetPreview | null {
  const target = activeSpellPreviewCell();
  if (!activeSpell || !target) return null;
  const result = castSpell(duel, activeSpell, target);
  if (result.events.some((event) => event.type === 'invalid_spell')) return null;

  const damage = Math.max(0, duel.enemy.hp - result.state.enemy.hp);
  const guard = Math.max(0, result.state.player.guard - duel.player.guard);
  const sun = Math.max(0, result.state.player.sun - duel.player.sun);
  const moon = Math.max(0, result.state.player.moon - duel.player.moon);
  const crown = Math.max(0, result.state.player.crown - duel.player.crown);
  const backlash = Math.max(0, duel.player.hp - result.state.player.hp);
  const converted = result.events
    .filter((event) => event.type === 'tiles_converted')
    .reduce((sum, event) => sum + event.cells.length, 0);
  const effects: PreviewEffect[] = [
    damage ? { label: 'damage', value: damage, tone: 'damage' } : null,
    guard ? { label: 'guard', value: guard, tone: 'guard' } : null,
    sun ? { label: 'sun', value: sun, tone: 'mana' } : null,
    moon ? { label: 'moon', value: moon, tone: 'mana' } : null,
    crown ? { label: 'crown', value: crown, tone: 'mana' } : null,
    backlash ? { label: 'backlash', value: backlash, tone: 'risk' } : null,
  ].filter((effect): effect is PreviewEffect => !!effect);
  const fatal = result.state.winner === 'enemy';
  const extraTurn = result.state.current === 'player' && !result.state.winner;

  return {
    spellId: activeSpell,
    title: spellPreviewTitle(activeSpell, damage, guard, backlash, fatal),
    hint: spellPreviewHint(activeSpell, target, converted, fatal),
    effects,
    extraTurn,
    fatal,
  };
}

function spellPreviewTitle(spellId: SpellId, damage: number, guard: number, backlash: number, fatal: boolean): string {
  if (fatal) return `Fatal ${DEFAULT_DUEL_RULES.spells[spellId].name}`;
  if (backlash) return `${DEFAULT_DUEL_RULES.spells[spellId].name}: backlash risk`;
  if (damage) return `${DEFAULT_DUEL_RULES.spells[spellId].name}: ${damage} damage`;
  if (guard) return `${DEFAULT_DUEL_RULES.spells[spellId].name}: +${guard} Guard`;
  return `${DEFAULT_DUEL_RULES.spells[spellId].name}: setup`;
}

function spellPreviewHint(spellId: SpellId, target: Cell, converted: number, fatal: boolean): string {
  const fatalCopy = fatal ? ' This will drop Aurora to 0.' : '';
  if (spellId === 'crown_strike') return `Row ${target.y + 1} fires now, then cascades.${fatalCopy}`;
  if (spellId === 'glass_ward') return `Raise guard and seal ${converted} nearby shade into shields.${fatalCopy}`;
  return `Bloom ${converted} tiles into sun, then let the board chain.${fatalCopy}`;
}

function backlashPreviewTitle(backlash: number, fatal: boolean): string {
  return fatal ? `Fatal backlash: -${backlash} HP` : `Backlash risk: -${backlash} HP`;
}

function backlashPreviewHint(backlash: number, fatal: boolean): string {
  return fatal
    ? `Aurora has ${duel.player.hp} HP. This shade hit will drop her to 0; Guard does not block backlash.`
    : `Shade will bite through the chain. Aurora pays ${backlash} HP after the hit.`;
}

function latestEvent(): string {
  if (enemyCue) return `Shade Knight action: ${enemyCue.summary}.`;
  if (invalidCue) return invalidCue;
  return duel.log[0] ?? 'Battle ready. Select a tile to begin.';
}

function terminalEventMeta(): TerminalEventMeta | null {
  if (!duel.winner) return null;

  const recap = battleRecap();
  const beat = terminalBeat();
  if (duel.winner === 'player') {
    return {
      label: 'Victory sealed',
      summary: beat?.title ?? recap?.cause ?? 'Aurora closed the duel.',
      action: 'Review victory log',
    };
  }

  return {
    label: 'Board broken',
    summary: beat?.title ?? recap?.cause ?? 'Shade took the duel.',
    action: 'Review defeat log',
  };
}

function intentLead(intent: EnemyIntent): string {
  const parts = intent.preview.effects
    .filter((effect) => effect.label !== 'backlash')
    .map((effect) => {
      if (effect.label === 'damage' || effect.label === 'shade damage') return `cuts ${effect.value}`;
      if (effect.label === 'guard') return `braces ${effect.value}`;
      if (effect.label === 'sun' || effect.label === 'moon' || effect.label === 'crown') return `claims ${effect.value} ${effect.label}`;
      return `takes ${effect.value} ${combatEffectLabel(effect)}`;
    });

  if (intent.preview.extraTurn) parts.push('keeps turn');
  return parts.length ? parts.join(' · ') : intent.preview.summary;
}

function renderTopGameBar(canMove: boolean): string {
  return `
    <nav class="game-bar" aria-label="Kingdom Duel cockpit">
      <div class="game-brand">
        <strong>Kingdom Duel</strong>
        <span>${duel.winner ? (duel.winner === 'player' ? 'Victory' : 'Defeat') : enemyCue ? 'Enemy moved' : canMove ? 'Your move' : enemyThinking ? 'Enemy thinking' : 'Resolving'}</span>
      </div>
      <div class="game-actions">
        <button class="icon-action" data-action="restart" type="button" aria-label="Restart duel" title="Restart duel">↻</button>
        <button class="icon-action" data-action="toggle-log" type="button" aria-expanded="${logOpen}" aria-label="Open combat log" title="Combat log">≡</button>
        <button class="icon-action" data-view="moodboard" type="button" aria-label="Open AeroCandy moodboard" title="AeroCandy moodboard">✦</button>
      </div>
    </nav>
  `;
}

function renderActorMeters(actor: DuelState['player'], side: 'hero' | 'enemy'): string {
  const isWinner = duel.winner === actor.id;
  const isDefeated = !!duel.winner && duel.winner !== actor.id;
  const hpPct = actor.hp / actor.maxHp;
  const pressureClass = hpPct <= 0 ? 'is-ko' : hpPct <= 0.28 ? 'is-critical' : actor.guard >= 4 ? 'is-braced' : '';
  const status = hpPct <= 0 ? 'KO' : hpPct <= 0.28 ? 'Critical' : actor.guard >= 4 ? 'Braced' : actor.id === duel.current ? 'Acting' : 'Ready';
  const faction = actor.id === 'player' ? 'Aurora' : 'Shade';
  return `
    <article class="combatant combatant-${side} ${pressureClass} ${duel.current === actor.id ? 'is-active' : ''} ${side === 'enemy' && (enemyThinking || enemyCue) ? 'is-cue' : ''} ${isWinner ? 'is-winner' : ''} ${isDefeated ? 'is-defeated' : ''}">
      ${renderPortraitSlot(side === 'hero' ? 'hero' : 'enemy')}
      <div class="combatant-body">
        <span>${faction}</span>
        <strong>${actor.name}</strong>
        ${statBar('HP', actor.hp, actor.maxHp, actor.id === 'player' ? '#25d7f2' : '#ff74c8')}
        <div class="combat-readout" aria-label="${actor.name} combat resources">
          <b class="guard-chip" title="${status}, Guard ${actor.guard}">Guard ${actor.guard}</b>
          <b class="mana-bank">
            <i class="mana-sun">S${actor.sun}</i>
            <i class="mana-moon">M${actor.moon}</i>
            <i class="mana-crown">C${actor.crown}</i>
          </b>
        </div>
      </div>
    </article>
  `;
}

function renderCombatStrip(intent: EnemyIntent | null, legalMoves: number): string {
  const turnLabel = duel.winner
    ? duel.winner === 'player'
      ? 'Victory'
      : 'Defeat'
    : enemyCue
      ? 'Shade action'
      : duel.current === 'player'
        ? 'Aurora turn'
        : 'Shade turn';
  const turnValue = duel.winner
    ? duel.winner === 'player'
      ? 'Board sealed'
      : 'Board broken'
    : enemyCue
      ? 'Resolving'
      : `${legalMoves} moves`;
  const intentCopy = enemyCue ? enemyCue.summary : intent ? intentLead(intent) : '';
  return `
    <section class="combat-strip ${enemyCue ? 'has-enemy-cue' : ''}" aria-label="Combat state">
      <div class="duel-hud-row">
        ${renderActorMeters(duel.player, 'hero')}
        <div class="turn-chip">
          <span>${turnLabel}</span>
          <strong>${turnValue}</strong>
        </div>
        ${renderActorMeters(duel.enemy, 'enemy')}
      </div>
      ${
        intentCopy
          ? `
            <div class="intent-rail" aria-label="Enemy intent">
              <span>${enemyCue ? 'Shade moved' : 'Shade next'}</span>
              <strong>${intentCopy}</strong>
            </div>
          `
          : ''
      }
    </section>
  `;
}

function renderBoardFrame(
  preview: MovePreview | null,
  intent: EnemyIntent | null,
  canMove: boolean,
  activeSpellName: string | null,
  snapBackCue: string | null,
): string {
  const invalidPreview = !!preview && !preview.valid;
  const backlash = previewBacklash(preview);
  const fatalBacklash = backlash > 0 && backlash >= duel.player.hp;
  const spellPreview = activeSpell ? activeSpellTargetPreview() : null;
  const hasSelection = !!selectedCell && !activeSpell;
  const hasValidSwap = !!preview?.valid && !backlash;
  return `
    <section class="board-frame ${canMove ? 'is-ready' : ''} ${enemyCue ? 'has-enemy-cue' : ''} ${backlash ? 'has-backlash-preview' : ''} ${spellPreview && !confirmedSpellTarget ? 'is-spell-aim' : ''} ${spellPreview && confirmedSpellTarget ? 'is-spell-armed' : ''} ${snapBackCue || invalidPreview ? 'is-snap-back' : ''} ${hasSelection && !preview ? 'is-selection-state' : ''} ${hasValidSwap ? 'is-valid-swap-state' : ''}" aria-label="Battle board">
      <div class="board-status">
        <span>${
          enemyCue
            ? 'Enemy moved'
            : spellPreview?.fatal
            ? 'Fatal spell'
            : spellPreview && confirmedSpellTarget
            ? 'Spell armed'
            : spellPreview
            ? 'Spell aim'
            : activeSpellName
            ? 'Aim spell'
            : fatalBacklash
              ? 'Fatal backlash'
            : backlash
              ? 'Backlash risk'
            : snapBackCue || invalidPreview
              ? 'Snap-back'
            : preview?.valid
                ? preview.extraTurn
                  ? 'Tempo strike'
                  : 'Strike ready'
                : hasSelection
                  ? 'Tile claimed'
                : canMove
                  ? 'Aurora turn'
                  : 'Arena locked'
        }</span>
        <strong>${
          enemyCue
            ? `Shade Knight action: ${enemyCue.summary}`
            : spellPreview && confirmedSpellTarget
            ? `Tap same target again: ${spellPreview.title}`
            : spellPreview
            ? spellPreview.title
            : activeSpellName
            ? `Aim ${activeSpellName}`
            : fatalBacklash
              ? `Will KO Aurora: costs ${backlash} HP`
            : backlash
              ? `Shade hits hard, costs ${backlash} HP`
            : snapBackCue
              ? preview
                ? `${swapTruthLabel(preview.from, preview.to)}: no match`
                : 'No match: target returned'
              : invalidPreview
                ? preview
                  ? `${swapTruthLabel(preview.from, preview.to)}: no match`
                  : 'No match on this target'
                : preview?.valid
                  ? preview.summary
                : hasSelection
                  ? 'Trace a bright socket to route the strike'
                : canMove
                    ? 'Pick a gem'
                    : enemyThinking
                      ? 'Shade Knight is choosing'
                      : 'Resolving cascades'
        }</strong>
      </div>
      ${renderPlayableBoard(preview, intent)}
    </section>
  `;
}

function renderActionDock(preview: MovePreview | null, canMove: boolean): string {
  return `
    <section class="action-dock" aria-label="Actions">
      ${renderPreviewPanel(preview, invalidCue)}
      ${renderSpellRow(canMove)}
    </section>
  `;
}

function renderLatestEvent(): string {
  const terminalMeta = terminalEventMeta();
  return `
    <section class="latest-event ${duel.winner ? 'is-terminal' : ''}" aria-label="Latest combat event">
      ${
        terminalMeta
          ? `
            <div class="latest-event-copy">
              <b>${terminalMeta.label}</b>
              <span>${terminalMeta.summary}</span>
            </div>
          `
          : `<span>${latestEvent()}</span>`
      }
      <button data-action="toggle-log" type="button" aria-expanded="${logOpen}">${terminalMeta?.action ?? 'Full log'}</button>
    </section>
  `;
}

function renderLogSheet(): string {
  if (!logOpen) return '';
  return `
    <aside class="log-sheet" role="dialog" aria-modal="false" aria-label="Full combat log">
      <div class="log-sheet-head">
        <strong>Combat log</strong>
        <button class="icon-action" data-action="toggle-log" type="button" aria-label="Close combat log">Close</button>
      </div>
      <div class="log-actions" aria-label="Combat log export actions">
        <button data-action="copy-battle-report" type="button">Copy compact report</button>
        <button data-action="copy-battle-log" type="button">Copy readable log</button>
        <button data-action="copy-battle-trace" type="button">Copy debug trace</button>
      </div>
      <ol class="combat-log">
        ${duel.history
          .map(
            (entry) => `
              <li>
                <span>Turn ${entry.turn} · ${entry.actor === 'system' ? 'Setup' : entry.actor === 'player' ? 'Aurora' : 'Shade'}</span>
                <strong>${entry.summary}</strong>
                <p>${entry.detail}</p>
                ${entry.events.length ? `<small>${entry.events.join(' · ')}</small>` : ''}
              </li>
            `,
          )
          .join('')}
      </ol>
    </aside>
  `;
}

function readableBattleLog(): string {
  return [...duel.history]
    .reverse()
    .map((entry) => {
      const actor = entry.actor === 'system' ? 'Setup' : entry.actor === 'player' ? 'Aurora' : 'Shade';
      const events = entry.events.length ? `\n  events: ${entry.events.join('; ')}` : '';
      return `--- Turn ${entry.turn} / ${actor} ---\n${entry.summary}\n${entry.detail}${events}`;
    })
    .join('\n\n');
}

function compactBattleReport(): string {
  const history = [...duel.history].reverse();
  const recap = battleRecap();
  const terminalEntry = history[history.length - 1];
  const playerHpLost = history.reduce((sum, entry) => sum + Math.max(0, entry.before.player.hp - entry.after.player.hp), 0);
  const enemyHpLost = history.reduce((sum, entry) => sum + Math.max(0, entry.before.enemy.hp - entry.after.enemy.hp), 0);
  const playerBacklash = history.reduce((sum, entry) => sum + sumNumbers(entry.events, /paid (\d+) HP backlash/), 0);
  const playerExtraTurns = history.filter((entry) => entry.actor === 'player' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const enemyExtraTurns = history.filter((entry) => entry.actor === 'enemy' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const spells = history.flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
  const keyTail = history
    .filter((entry) => entry.actor !== 'system')
    .slice(-6)
    .map((entry) => `T${entry.turn} ${entry.actor === 'player' ? 'Aurora' : 'Shade'}: ${entry.summary} (${entry.detail})`);
  const unspentMana = duel.player.sun + duel.player.moon + duel.player.crown;
  const reason =
    duel.winner === 'enemy' &&
    terminalEntry.actor === 'player' &&
    terminalEntry.events.some((event) => event.includes('HP backlash')) &&
    terminalEntry.after.player.hp === 0
      ? `Likely loss reason: Aurora paid ${sumNumbers(terminalEntry.events, /paid (\d+) HP backlash/)} backlash at ${terminalEntry.before.player.hp} HP.`
      : duel.winner === 'enemy' && unspentMana >= 10
      ? `Likely loss reason: Aurora died with ${unspentMana} unspent mana; spend spells earlier.`
      : duel.winner === 'enemy'
        ? 'Likely loss reason: Aurora HP reached 0 before enough damage/spell pressure.'
        : duel.winner === 'player'
          ? 'Win reason: Shade HP reached 0.'
          : 'Battle is still unresolved.';

  return [
    'Kingdom Duel compact battle report',
    `Seed: ${duel.seed}`,
    `Winner: ${duel.winner ? (duel.winner === 'player' ? 'Aurora Knight' : 'Shade Knight') : 'none'} on turn ${duel.turn}`,
    `Final: Aurora ${duel.player.hp}/${duel.player.maxHp} HP, Guard ${duel.player.guard}, mana S${duel.player.sun}/M${duel.player.moon}/C${duel.player.crown}`,
    `Final: Shade ${duel.enemy.hp}/${duel.enemy.maxHp} HP, Guard ${duel.enemy.guard}, mana S${duel.enemy.sun}/M${duel.enemy.moon}/C${duel.enemy.crown}`,
    `HP lost: Aurora ${playerHpLost}, Shade ${enemyHpLost}`,
    `Backlash paid by Aurora: ${playerBacklash}`,
    `Extra turns: Aurora ${playerExtraTurns}, Shade ${enemyExtraTurns}`,
    `Spells cast: ${spells.length ? spells.join('; ') : 'none'}`,
    recap ? `Recap: ${recap.cause} ${recap.lesson}` : 'Recap: battle still unresolved.',
    reason,
    'Last key actions:',
    ...keyTail,
  ].join('\n');
}

function sumNumbers(lines: string[], pattern: RegExp): number {
  return lines.reduce((sum, line) => {
    const match = line.match(pattern);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
}

function debugBattleTrace(): string {
  return JSON.stringify(
    {
      seed: duel.seed,
      turn: duel.turn,
      current: duel.current,
      winner: duel.winner,
      player: duel.player,
      enemy: duel.enemy,
      history: [...duel.history].reverse(),
    },
    null,
    2,
  );
}

function battleRecap(): BattleRecap | null {
  if (!duel.winner) return null;

  const history = [...duel.history].reverse();
  const combatHistory = history.filter((entry) => entry.actor !== 'system');
  const terminalEntry = combatHistory[combatHistory.length - 1];
  const playerBacklash = history.reduce((sum, entry) => sum + sumNumbers(entry.events, /paid (\d+) HP backlash/), 0);
  const playerExtraTurns = history.filter((entry) => entry.actor === 'player' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const enemyExtraTurns = history.filter((entry) => entry.actor === 'enemy' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const spells = history.flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
  const unspentMana = duel.player.sun + duel.player.moon + duel.player.crown;
  const selfKo =
    duel.winner === 'enemy' &&
    terminalEntry?.actor === 'player' &&
    terminalEntry.events.some((event) => event.includes('HP backlash')) &&
    terminalEntry.after.player.hp === 0;
  const turningEntry =
    [...combatHistory]
      .reverse()
      .find(
        (entry) =>
          entry.events.some((event) => event.startsWith('cast ') || event.includes('kept the turn') || event.includes('HP backlash')) ||
          entry.after.enemy.hp <= Math.max(0, entry.before.enemy.hp - 6) ||
          entry.after.player.hp <= Math.max(0, entry.before.player.hp - 6),
      ) ?? terminalEntry;

  const cause = selfKo
    ? `Aurora self-KO'd on ${sumNumbers(terminalEntry.events, /paid (\d+) HP backlash/)} shade backlash.`
    : duel.winner === 'enemy' && unspentMana >= 10
      ? `Aurora fell with ${unspentMana} unspent mana.`
      : duel.winner === 'enemy'
        ? 'Shade ended the duel by pushing Aurora to 0 HP.'
        : spells.length
          ? 'Aurora converted stored mana into lethal spell pressure.'
          : 'Aurora ended the duel through board pressure.';
  const lesson = selfKo
    ? 'Lesson: below 5 HP, treat shade cascades as lethal unless preview says safe.'
    : duel.winner === 'enemy' && unspentMana >= 10
      ? 'Lesson: spend mana earlier; unused spells do not protect Aurora.'
      : duel.winner === 'enemy'
        ? 'Lesson: guard and preview shade risk before giving Shade a chain.'
        : spells.length
          ? 'Lesson: previewed spells are the strongest way to convert mana into tempo.'
          : 'Lesson: forcing sword pressure and extra turns can win without spells.';

  return {
    outcome: duel.winner === 'player' ? 'Victory' : 'Defeat',
    cause,
    turningPoint: turningEntry ? `T${turningEntry.turn} ${turningEntry.actor === 'player' ? 'Aurora' : 'Shade'}: ${turningEntry.summary}` : 'No combat action recorded.',
    pressure: `Backlash ${playerBacklash} HP · Spells ${spells.length} · Chains A${playerExtraTurns}/S${enemyExtraTurns}`,
    lesson,
  };
}

function terminalBeat(): TerminalBeat | null {
  if (!duel.winner) return null;

  const history = [...duel.history].reverse();
  const combatHistory = history.filter((entry) => entry.actor !== 'system');
  const terminalEntry = combatHistory[combatHistory.length - 1];
  if (!terminalEntry) return null;

  const backlash = sumNumbers(terminalEntry.events, /paid (\d+) HP backlash/);
  const spells = terminalEntry.events.filter((event) => event.startsWith('cast '));
  const actorName = terminalEntry.actor === 'player' ? 'Aurora' : 'Shade';

  if (duel.winner === 'player') {
    if (spells.length) {
      return {
        title: `${actorName} spent banked mana for the finish`,
        detail: `${spells[0]} converted the last opening before Shade could reset guard.`,
      };
    }

    return {
      title: `${actorName} closed with a clean board strike`,
      detail: 'The final exchange stayed on-board and denied Shade one more chain.',
    };
  }

  if (backlash > 0 && terminalEntry.actor === 'player') {
    return {
      title: `Aurora broke on a ${backlash} HP backlash`,
      detail: 'The answer line looked live, but shade pressure turned the last move into a self-break.',
    };
  }

  return {
    title: `Shade held tempo in the last exchange`,
    detail: 'Aurora lost the last safe line before the board could be stabilized.',
  };
}

function actorReserve(actor: DuelState['player']): number {
  return actor.sun + actor.moon + actor.crown;
}

function resultStanceLabel(actorId: 'player' | 'enemy'): string {
  if (!duel.winner) return actorId === 'player' ? 'Aurora Glass' : 'Shade Veil';
  if (duel.winner === actorId) return actorId === 'player' ? 'Board sealed' : 'Board broken';
  return actorId === 'player' ? 'Aurora fallen' : 'Shade fallen';
}

function renderResultStand(actor: DuelState['player'], side: 'hero' | 'enemy'): string {
  const actorId = side === 'hero' ? 'player' : 'enemy';
  const faction = actorId === 'player' ? 'Aurora Glass' : 'Shade Veil';
  return `
    <div class="recap-stand recap-stand-${side} ${duel.winner === actorId ? 'is-winner' : 'is-loser'}">
      ${renderPortraitSlot(side === 'hero' ? 'hero' : 'enemy')}
      <div class="recap-stand-copy">
        <span>${faction}</span>
        <strong>${actor.name}</strong>
        <b>${resultStanceLabel(actorId)}</b>
        <em>HP ${actor.hp}/${actor.maxHp} · Guard ${actor.guard} · Reserve ${actorReserve(actor)}</em>
      </div>
    </div>
  `;
}

function renderBattleRecap(): string {
  const recap = battleRecap();
  if (!recap) return '';
  const beat = terminalBeat();
  const history = [...duel.history].reverse();
  const playerExtraTurns = history.filter((entry) => entry.actor === 'player' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const enemyExtraTurns = history.filter((entry) => entry.actor === 'enemy' && entry.events.some((event) => event.includes('kept the turn'))).length;
  const playerBacklash = history.reduce((sum, entry) => sum + sumNumbers(entry.events, /paid (\d+) HP backlash/), 0);
  const terminalReserve = duel.player.sun + duel.player.moon + duel.player.crown;
  const winnerName = duel.winner === 'player' ? 'Aurora Glass' : 'Shade Veil';
  const resultTitle = duel.winner === 'player' ? 'Aurora seals the glass board' : 'Shade breaks the glass board';
  const terminalScore = `Aurora ${duel.player.hp}/${duel.player.maxHp} HP · Shade ${duel.enemy.hp}/${duel.enemy.maxHp} HP`;
  const resultActionCopy =
    duel.winner === 'player' ? 'Board sealed. Bank the line and study the finish.' : 'Board lost. Study the break before the next duel.';
  const resultActionLabel = duel.winner === 'player' ? 'Study victory log' : 'Study defeat log';

  return `
    <section class="battle-recap ${duel.winner === 'player' ? 'is-victory' : 'is-defeat'}" aria-label="Battle recap">
      <div class="recap-seal">
        <span>${recap.outcome}</span>
        <strong>${winnerName}</strong>
      </div>
      <div class="recap-main">
        <span>${resultTitle}</span>
        <strong>${recap.cause}</strong>
        <b>${terminalScore}</b>
      </div>
      ${
        beat
          ? `
            <div class="recap-beat">
              <span>Final exchange</span>
              <strong>${beat.title}</strong>
              <b>${beat.detail}</b>
            </div>
          `
          : ''
      }
      ${renderResultStand(duel.player, 'hero')}
      ${renderResultStand(duel.enemy, 'enemy')}
      <div class="recap-metrics" aria-label="Terminal battle metrics">
        <em class="recap-metric">
          <span>Turn</span>
          <strong>${duel.turn}</strong>
        </em>
        <em class="recap-metric">
          <span>Chains</span>
          <strong>A${playerExtraTurns}/S${enemyExtraTurns}</strong>
        </em>
        <em class="recap-metric">
          <span>Backlash</span>
          <strong>${playerBacklash} HP</strong>
        </em>
        <em class="recap-metric">
          <span>Reserve</span>
          <strong>${terminalReserve}</strong>
        </em>
      </div>
      <p class="recap-turning-point">${recap.turningPoint}</p>
      <p class="recap-pressure">${recap.pressure}</p>
      <em class="recap-lesson">${recap.lesson}</em>
      <div class="recap-actions">
        <span>${resultActionCopy}</span>
        <button data-action="toggle-log" type="button" aria-expanded="${logOpen}">${resultActionLabel}</button>
      </div>
    </section>
  `;
}

async function copyToClipboard(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showInvalidCue(`${label} copied.`);
  } catch {
    showInvalidCue(`${label} copy failed.`);
  }
  renderApp();
}

function renderPlayable(): string {
  const canMove = duel.current === 'player' && !duel.winner && !enemyThinking;
  const legalMoves = findLegalMoves(duel.board).length;
  const preview = canMove && !activeSpell ? activePreview() : null;
  const intent = canMove ? getEnemyIntent(duel.board) : null;
  const activeSpellName = activeSpell ? DEFAULT_DUEL_RULES.spells[activeSpell].name : null;
  return `
    <main class="aero-shell play-shell">
      <section class="play-stage cockpit-stage">
        ${renderTopGameBar(canMove)}
        <section class="battle-console" aria-label="Glass battle console">
          ${renderCombatStrip(intent, legalMoves)}
          ${renderBoardFrame(preview, intent, canMove, activeSpellName, invalidCue)}
          ${duel.winner ? renderBattleRecap() : renderActionDock(preview, canMove)}
        </section>
        ${renderLatestEvent()}
        ${renderLogSheet()}
      </section>
    </main>
  `;
}

function renderSpellRow(canMove: boolean): string {
  const spellIds: SpellId[] = ['sun_bloom', 'glass_ward', 'crown_strike'];
  return `
    <div class="spell-row" aria-label="Spells">
      ${spellIds
        .map((spellId, index) => {
          const spell = DEFAULT_DUEL_RULES.spells[spellId];
          const canCast = canMove && canPayCost(duel.player, spell.cost);
          const charge = spellCharge(spell.cost);
          return `
            <button class="spell-button spell-${index + 1} spell-${spellPrimaryGem(spellId)} ${canCast ? 'is-ready' : 'is-locked'} ${activeSpell === spellId ? 'is-active' : ''}" type="button" data-spell="${spellId}" style="--spell-charge: ${charge.percent};" ${canCast ? '' : 'disabled'}>
              <i class="spell-gem spell-gem-${spellPrimaryGem(spellId)}" aria-hidden="true">${spellGemShort(spellId)}</i>
              <span>${compactCostLabel(spell.cost)}</span>
              <strong>${spell.name}</strong>
              <b>${spellActionLabel(spellId)}</b>
              <em>${canCast ? spellHint(spellId) : charge.label}</em>
              <i class="spell-meter" aria-hidden="true"></i>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function canPayCost(actor: DuelState['player'], cost: ManaCost): boolean {
  return actor.sun >= (cost.sun ?? 0) && actor.moon >= (cost.moon ?? 0) && actor.crown >= (cost.crown ?? 0);
}

function costLabel(cost: ManaCost): string {
  return [
    cost.sun ? `${cost.sun} Sun` : '',
    cost.moon ? `${cost.moon} Moon` : '',
    cost.crown ? `${cost.crown} Crown` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function compactCostLabel(cost: ManaCost): string {
  return [
    cost.sun ? `${cost.sun} SUN` : '',
    cost.moon ? `${cost.moon} MOON` : '',
    cost.crown ? `${cost.crown} CROWN` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function spellCharge(cost: ManaCost): { percent: string; label: string } {
  const current =
    Math.min(duel.player.sun, cost.sun ?? 0) +
    Math.min(duel.player.moon, cost.moon ?? 0) +
    Math.min(duel.player.crown, cost.crown ?? 0);
  const required = (cost.sun ?? 0) + (cost.moon ?? 0) + (cost.crown ?? 0);
  const ratio = required > 0 ? Math.min(1, current / required) : 1;
  return { percent: `${Math.round(ratio * 100)}%`, label: `${current}/${required} charged` };
}

function spellPrimaryGem(spellId: SpellId): 'sun' | 'moon' | 'crown' {
  if (spellId === 'sun_bloom') return 'sun';
  if (spellId === 'glass_ward') return 'moon';
  return 'crown';
}

function spellGemShort(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'S';
  if (spellId === 'glass_ward') return 'M';
  return 'C';
}

function spellRoleLabel(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'Sun engine';
  if (spellId === 'glass_ward') return 'Guard seal';
  return 'Row finisher';
}

function spellHint(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'chains sun; watch shade';
  if (spellId === 'glass_ward') return '+4 guard; seals shade';
  return 'fires a row; risk included';
}

function spellActionLabel(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'Bloom field';
  if (spellId === 'glass_ward') return 'Raise guard';
  return 'Fire row';
}

function spellTargetHint(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'Choose a center tile. Bloom a sun cluster for chains, but shade can still bite.';
  if (spellId === 'glass_ward') return 'Choose a center tile. Gain guard and seal nearby shade into shields.';
  return 'Choose a row. It fires immediately and pays every tile effect, including backlash.';
}

function renderTopNav(): string {
  return `
    <nav class="top-nav" aria-label="Kingdom Duel views">
      <strong>Kingdom Duel</strong>
      <div>
        <button data-view="play" class="${view === 'play' ? 'is-active' : ''}" type="button">Playable</button>
        <button data-view="moodboard" class="${view === 'moodboard' ? 'is-active' : ''}" type="button">Moodboard</button>
      </div>
    </nav>
  `;
}

function renderBoard(): string {
  return `
    <section class="reference-card board-card">
      <div class="section-heading">
        <span>Shared board specimen</span>
        <strong>8x8 duel field</strong>
      </div>
      <div class="duel-frame">
        <article class="fighter fighter-hero">
          ${renderPortraitSlot('hero')}
          <strong>Aurora Knight</strong>
          <em>HP 42 / Guard 8</em>
          <div class="mana-row">
            <i class="mana sun"></i>
            <i class="mana moon"></i>
            <i class="mana crown"></i>
          </div>
        </article>
        <div class="board-shell" aria-label="Reference match-3 board">
        ${boardPattern.map((kind, index) => renderGem(kind, index)).join('')}
        </div>
        <article class="fighter fighter-enemy">
          ${renderPortraitSlot('enemy')}
          <strong>Shade Knight</strong>
          <em>HP 38 / Intent: Shade</em>
          <div class="intent-pill">wants shade + swords</div>
        </article>
      </div>
    </section>
  `;
}

function renderSwatches(): string {
  const swatches = [
    ['Sky', '#7ddfff'],
    ['Aqua', '#25d7f2'],
    ['Glass', '#f8ffff'],
    ['Mint', '#7bf28d'],
    ['Sun', '#ffe25c'],
    ['Orange', '#ff9d3d'],
    ['Pink', '#ff74c8'],
    ['Violet', '#9b83ff'],
    ['Ocean', '#247cff'],
    ['Silver', '#c7dbe8'],
  ];

  return `
    <section class="reference-card">
      <div class="section-heading">
        <span>Palette lock</span>
        <strong>bright, clean, never muddy</strong>
      </div>
      <div class="swatch-grid">
        ${swatches
          .map(
            ([label, color]) => `
              <article class="swatch" style="--swatch:${color}">
                <i></i>
                <span>${label}</span>
                <b>${color}</b>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderTileSpecimens(): string {
  return `
    <section class="reference-card">
      <div class="section-heading">
        <span>Tile specimens</span>
        <strong>glossy first, readable always</strong>
      </div>
      <div class="tile-specimen-grid">
        ${gemKinds
          .map(
            (kind) => `
              <article class="tile-specimen">
                ${renderGem(kind)}
                <span>${gemLabel(kind)}</span>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderSpells(): string {
  const spells = [
    ['Sun Bloom', 'convert neighbors to sun'],
    ['Glass Ward', 'turn shade into shield'],
    ['Crown Strike', 'clear a row for relic charge'],
  ];

  return `
    <section class="reference-card spell-card">
      <div class="section-heading">
        <span>Spell capsules</span>
        <strong>board-changing magic</strong>
      </div>
      <div class="spell-grid">
        ${spells
          .map(
            ([name, effect], index) => `
              <button class="spell-button spell-${index + 1}" type="button">
                <span>${index === 0 ? '6 sun' : index === 1 ? '5 moon' : '6 crown'}</span>
                <strong>${name}</strong>
                <em>${effect}</em>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderGuardrails(): string {
  const items = [
    'No imported LW2B / Kingdom OS code.',
    'Old projects are visual backup only.',
    'Board is the game, not decoration.',
    'Tile clarity beats reflections.',
    'No dark medieval sludge.',
    'No cyberpunk neon mesh.',
    'No tiny icon detail inside tiles.',
    'No side buttons that bypass the board.',
  ];

  return `
    <section class="reference-card guardrail-card">
      <div class="section-heading">
        <span>Guardrails</span>
        <strong>what this style refuses</strong>
      </div>
      <ul class="guardrail-list">
        ${items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderMoodboard(): string {
  return `
  <main class="aero-shell moodboard-shell">
    ${renderTopNav()}
    <section class="hero-band">
      <div class="hero-copy">
        <p class="kicker">Kingdom Duel moodboard v0.1</p>
        <h1><span>AeroCandy</span><span>2007</span></h1>
        <p>
          A clean standalone visual direction for a match-3 RPG duel: Frutiger Aero optimism,
          Windows Aero glass, glossy candy tiles, and strict gameplay readability.
        </p>
      </div>
      <div class="hero-glass">
        <span class="bubble bubble-a"></span>
        <span class="bubble bubble-b"></span>
        <span class="bubble bubble-c"></span>
        <div class="future-window">
          <div class="window-bar">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <strong>clean bright future</strong>
          <span>70% clarity / 20% gloss / 10% nostalgic excess</span>
        </div>
      </div>
    </section>
    <section class="reference-grid">
      ${renderSwatches()}
      ${renderTileSpecimens()}
      ${renderBoard()}
      ${renderSpells()}
      ${renderGuardrails()}
    </section>
  </main>
`;
}

function renderApp(): void {
  app.innerHTML = view === 'play' ? renderPlayable() : renderMoodboard();
}

function maybeRunEnemy(): void {
  if (duel.current !== 'enemy' || duel.winner || enemyThinking) return;
  enemyThinking = true;
  enemyCue = null;
  renderApp();
  window.setTimeout(() => {
    const intent = getEnemyIntent(duel.board);
    const result = runEnemyTurn(duel);
    duel = result.state;
    enemyThinking = false;
    enemyCue = intent ? { cells: [intent.from, intent.to], summary: intentLead(intent) } : { cells: [], summary: 'board shifts' };
    renderApp();
    if (enemyCueTimer !== null) window.clearTimeout(enemyCueTimer);
    const enemyKeepsTurn = duel.current === 'enemy' && !duel.winner;
    enemyCueTimer = window.setTimeout(() => {
      enemyCue = null;
      enemyCueTimer = null;
      renderApp();
      if (enemyKeepsTurn) maybeRunEnemy();
    }, enemyKeepsTurn ? 760 : 900);
  }, 520);
}

function clearEnemyCue(): void {
  enemyCue = null;
  if (enemyCueTimer !== null) {
    window.clearTimeout(enemyCueTimer);
    enemyCueTimer = null;
  }
}

function clearInvalidCue(): void {
  invalidCue = null;
  if (invalidCueTimer !== null) {
    window.clearTimeout(invalidCueTimer);
    invalidCueTimer = null;
  }
}

function showInvalidCue(message: string): void {
  invalidCue = message;
  if (invalidCueTimer !== null) window.clearTimeout(invalidCueTimer);
  invalidCueTimer = window.setTimeout(() => {
    invalidCue = null;
    invalidCueTimer = null;
    renderApp();
  }, 900);
}

function clearBumpLater(): void {
  if (bumpTimer !== null) window.clearTimeout(bumpTimer);
  bumpTimer = window.setTimeout(() => {
    bumpCell = null;
    hoverCell = null;
    bumpTimer = null;
    renderApp();
  }, 420);
}

function bumpInvalidTarget(target: Cell, message: string): void {
  bumpCell = target;
  hoverCell = target;
  showInvalidCue(message);
  renderApp();
  clearBumpLater();
}

function commitSwap(from: Cell, to: Cell): void {
  clearEnemyCue();
  clearInvalidCue();
  if (!areAdjacent(from, to)) {
    selectedCell = to;
    hoverCell = null;
    renderApp();
    return;
  }

  const preview = previewSwap(duel.board, from, to);
  if (!preview.valid) {
    selectedCell = from;
    bumpInvalidTarget(to, 'No match: the target tile snapped back.');
    return;
  }

  const result = applySwap(duel, from, to);
  duel = result.state;
  selectedCell = null;
  hoverCell = null;
  bumpCell = null;
  clearInvalidCue();
  renderApp();
  maybeRunEnemy();
}

function handleBoardTap(cell: Cell): void {
  if (!canUseBoard()) return;
  clearEnemyCue();
  clearInvalidCue();

  if (activeSpell) {
    if (chooseSpellTargetTapAction(confirmedSpellTarget, cell) === 'preview') {
      hoverCell = cell;
      confirmedSpellTarget = cell;
      selectedCell = null;
      bumpCell = null;
      renderApp();
      return;
    }

    const result = castSpell(duel, activeSpell, cell);
    duel = result.state;
    activeSpell = null;
    confirmedSpellTarget = null;
    selectedCell = null;
    hoverCell = null;
    bumpCell = null;
    clearInvalidCue();
    renderApp();
    maybeRunEnemy();
    return;
  }

  if (!selectedCell) {
    selectedCell = cell;
    hoverCell = null;
    bumpCell = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  if (sameCell(selectedCell, cell)) {
    selectedCell = null;
    hoverCell = null;
    bumpCell = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  commitSwap(selectedCell, cell);
}

function dragTargetCell(from: Cell, deltaX: number, deltaY: number): Cell | null {
  const threshold = 22;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) return null;

  const next =
    Math.abs(deltaX) > Math.abs(deltaY)
      ? { x: from.x + Math.sign(deltaX), y: from.y }
      : { x: from.x, y: from.y + Math.sign(deltaY) };

  if (next.x < 0 || next.x >= duel.board.width || next.y < 0 || next.y >= duel.board.height) return null;
  return next;
}

function cellAtPoint(x: number, y: number): Cell | null {
  const cellValue = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
  return cellValue === undefined ? null : cellFromIndex(Number(cellValue));
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const nextView = target.closest<HTMLElement>('[data-view]')?.dataset.view as 'play' | 'moodboard' | undefined;
  if (nextView) {
    view = nextView;
    selectedCell = null;
    hoverCell = null;
    activeSpell = null;
    confirmedSpellTarget = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  if (action === 'restart') {
    duel = createDuel(Date.now() % 100000);
    selectedCell = null;
    hoverCell = null;
    activeSpell = null;
    confirmedSpellTarget = null;
    enemyThinking = false;
    logOpen = false;
    clearEnemyCue();
    clearInvalidCue();
    renderApp();
    return;
  }

  if (action === 'toggle-log') {
    logOpen = !logOpen;
    renderApp();
    return;
  }

  if (action === 'copy-battle-log') {
    void copyToClipboard(readableBattleLog(), 'Battle log');
    return;
  }

  if (action === 'copy-battle-report') {
    void copyToClipboard(compactBattleReport(), 'Battle report');
    return;
  }

  if (action === 'copy-battle-trace') {
    void copyToClipboard(debugBattleTrace(), 'Battle trace');
    return;
  }

  const spellValue = target.closest<HTMLElement>('[data-spell]')?.dataset.spell as SpellId | undefined;
  if (spellValue && view === 'play' && duel.current === 'player' && !duel.winner && !enemyThinking) {
    clearEnemyCue();
    activeSpell = activeSpell === spellValue ? null : spellValue;
    confirmedSpellTarget = null;
    selectedCell = null;
    hoverCell = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  const cellValue = target.closest<HTMLElement>('[data-cell]')?.dataset.cell;
  if (cellValue === undefined || !canUseBoard()) return;
  if (suppressNextCellClick) {
    suppressNextCellClick = false;
    return;
  }

  const cell = cellFromIndex(Number(cellValue));
  handleBoardTap(cell);
});

app.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement | null;
  const gem = target?.closest<HTMLElement>('[data-cell]');
  const cellValue = gem?.dataset.cell;
  if (!gem || cellValue === undefined || !canUseBoard()) return;

  event.preventDefault();
  try {
    gem.setPointerCapture(event.pointerId);
  } catch {
    // Some mobile browsers reject capture during synthetic or interrupted touches.
  }
  const startCell = cellFromIndex(Number(cellValue));
  dragState = { pointerId: event.pointerId, startCell, startX: event.clientX, startY: event.clientY };
});

window.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId || !canUseBoard()) return;
  event.preventDefault();

  const targetCell = dragTargetCell(dragState.startCell, event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (!targetCell || sameCell(hoverCell, targetCell)) return;
  selectedCell = dragState.startCell;
  hoverCell = targetCell;
  bumpCell = null;
  clearInvalidCue();
  renderApp();
});

window.addEventListener('pointerup', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  suppressNextCellClick = true;
  window.setTimeout(() => {
    suppressNextCellClick = false;
  }, 0);

  const endedDrag = dragState;
  dragState = null;
  const targetCell = dragTargetCell(endedDrag.startCell, event.clientX - endedDrag.startX, event.clientY - endedDrag.startY);
  const releaseCell = cellAtPoint(event.clientX, event.clientY);
  const commitCell = chooseDragCommitCell(endedDrag.startCell, targetCell, releaseCell, {
    isAdjacent: areAdjacent,
    isValidSwap: (from, to) => previewSwap(duel.board, from, to).valid,
  });

  if (targetCell || releaseCell) {
    if (activeSpell) {
      handleBoardTap(releaseCell ?? targetCell ?? commitCell);
      return;
    }
    commitSwap(endedDrag.startCell, commitCell);
    return;
  }

  handleBoardTap(commitCell);
});

window.addEventListener('pointercancel', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  dragState = null;
  hoverCell = null;
  clearInvalidCue();
  renderApp();
});

app.addEventListener('pointerover', (event) => {
  const target = event.target as HTMLElement | null;
  const cellValue = target?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
  if (dragState || cellValue === undefined || !canUseBoard()) return;
  const nextHover = cellFromIndex(Number(cellValue));
  if (sameCell(hoverCell, nextHover)) return;
  hoverCell = nextHover;
  clearInvalidCue();
  renderApp();
});

app.addEventListener('pointerout', (event) => {
  const target = event.target as HTMLElement | null;
  const related = event.relatedTarget as HTMLElement | null;
  if (!target?.closest('.play-board') || related?.closest('.play-board') || !hoverCell) return;
  hoverCell = null;
  renderApp();
});

renderApp();
