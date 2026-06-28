import './styles.css';
import { areAdjacent, findLegalMoves } from './engine/board';
import { applySwap, castSpell, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './engine/duel';
import { DEFAULT_DUEL_RULES } from './engine/rules';
import type { Cell, DuelState, EnemyIntent, ManaCost, MovePreview, PreviewEffect, SpellId, TileKind } from './engine/types';
import { chooseDragCommitCell } from './input';

type GemKind = TileKind;
type CharacterSlot = 'hero' | 'enemy';
type AssetSlot = {
  path: string;
  src: string | null;
};

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

let view: 'play' | 'moodboard' = new URLSearchParams(window.location.search).get('view') === 'moodboard' ? 'moodboard' : 'play';
let duel: DuelState = createDuel(2007);
let selectedCell: Cell | null = null;
let hoverCell: Cell | null = null;
let activeSpell: SpellId | null = null;
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

function gemIcon(kind: GemKind): string {
  void kind;
  return '';
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
  return src ? ` style="--asset-url: url('${src}')"` : '';
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

function spellTargetCellSet(): Set<string> {
  const cells = new Set<string>();
  if (!activeSpell || !hoverCell) return cells;
  const spell = DEFAULT_DUEL_RULES.spells[activeSpell];
  if (spell.target === 'row') {
    for (let x = 0; x < duel.board.width; x++) cells.add(cellKey({ x, y: hoverCell.y }));
    return cells;
  }

  for (let y = hoverCell.y - spell.radius; y <= hoverCell.y + spell.radius; y++) {
    for (let x = hoverCell.x - spell.radius; x <= hoverCell.x + spell.radius; x++) {
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
    return `
      <div class="decision-panel is-extra">
        <span>${spellTargetLabel(activeSpell)}</span>
        <strong>${spell.name}</strong>
        <p>${spellTargetHint(activeSpell)}</p>
      </div>
    `;
  }

  if (snapBackCue) {
    return `
      <div class="decision-panel is-risk">
        <span>Decision preview</span>
        <strong>Snapped back</strong>
        <p>${snapBackCue}</p>
      </div>
    `;
  }

  if (!selectedCell) {
    return `
      <div class="decision-panel is-empty">
        <span>Decision preview</span>
        <strong>Select a tile</strong>
        <p>Then hover or tap an adjacent tile to read the move before committing.</p>
      </div>
    `;
  }

  if (!preview) {
    return `
      <div class="decision-panel is-empty">
        <span>Decision preview</span>
        <strong>Choose a neighbor</strong>
        <p>Bright aqua targets will make a match. Soft white targets are adjacent but may snap back.</p>
      </div>
    `;
  }

  if (!preview.valid) {
    return `
      <div class="decision-panel is-risk">
        <span>Decision preview</span>
        <strong>No match</strong>
        <p>That target snaps back. Pick an aqua target to commit.</p>
      </div>
    `;
  }

  const backlash = previewBacklash(preview);
  return `
    <div class="decision-panel ${preview.extraTurn ? 'is-extra' : ''} ${backlash ? 'is-risk' : ''}">
      <span>Decision preview</span>
      <strong>${backlash ? `Backlash risk: -${backlash} HP` : preview.summary}</strong>
      ${backlash ? `<p>Shade strikes hard, but Aurora pays ${backlash} HP after the hit.</p>` : ''}
      <div class="effect-row">
        ${preview.effects.map(renderEffectPill).join('')}
        ${preview.extraTurn ? '<em class="effect-pill tone-extra">extra turn</em>' : ''}
      </div>
    </div>
  `;
}

function renderEffectPill(effect: PreviewEffect): string {
  return `<em class="effect-pill tone-${effect.tone}">${effect.tone === 'risk' ? '-' : '+'}${effect.value} ${effect.label}</em>`;
}

function intentReason(intent: EnemyIntent): string {
  const parts = intent.preview.effects
    .filter((effect) => effect.label !== 'backlash')
    .map((effect) => `+${effect.value} ${effect.label}`);

  if (intent.preview.extraTurn) parts.push('extra turn');
  return parts.length ? parts.join(', ') : intent.preview.summary;
}

function previewBacklash(preview: MovePreview | null): number {
  if (!preview?.valid) return 0;
  return preview.effects.find((effect) => effect.label === 'backlash')?.value ?? 0;
}

function latestEvent(): string {
  if (enemyCue) return `Shade Knight moved: ${enemyCue.summary}.`;
  if (invalidCue) return invalidCue;
  return duel.log[0] ?? 'Battle ready. Select a tile to begin.';
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
        <button class="icon-action" data-action="toggle-log" type="button" aria-expanded="${logOpen}" aria-label="Open combat log" title="Combat log">Log</button>
        <button class="icon-action" data-view="moodboard" type="button" aria-label="Open moodboard" title="Moodboard">Style</button>
      </div>
    </nav>
  `;
}

function renderActorMeters(actor: DuelState['player'], side: 'hero' | 'enemy'): string {
  return `
    <article class="combatant combatant-${side} ${duel.current === actor.id ? 'is-active' : ''} ${side === 'enemy' && (enemyThinking || enemyCue) ? 'is-cue' : ''}">
      ${renderPortraitSlot(side === 'hero' ? 'hero' : 'enemy')}
      <div class="combatant-body">
        <span>${actor.id === 'player' ? 'Aurora side' : 'Shade side'}</span>
        <strong>${actor.name}</strong>
        ${statBar('HP', actor.hp, actor.maxHp, actor.id === 'player' ? '#25d7f2' : '#ff74c8')}
        <div class="mini-stats" aria-label="${actor.name} resources">
          <b>G ${actor.guard}</b>
          <b>S ${actor.sun}</b>
          <b>M ${actor.moon}</b>
          <b>C ${actor.crown}</b>
        </div>
      </div>
    </article>
  `;
}

function renderCombatStrip(intent: EnemyIntent | null, legalMoves: number): string {
  return `
    <section class="combat-strip ${enemyCue ? 'has-enemy-cue' : ''}" aria-label="Combat state">
      ${renderActorMeters(duel.player, 'hero')}
      <div class="duel-pulse">
        <span>${duel.winner ? 'Battle ended' : enemyCue ? 'Enemy action' : duel.current === 'player' ? 'Turn' : 'Enemy'}</span>
        <strong>${duel.winner ? (duel.winner === 'player' ? 'You win' : 'Shade wins') : enemyCue ? enemyCue.summary : duel.current === 'player' ? 'Your move' : 'Enemy move'}</strong>
        <em>${legalMoves} moves</em>
        ${intent ? `<p>Shade plan: ${intentReason(intent)}</p>` : ''}
      </div>
      ${renderActorMeters(duel.enemy, 'enemy')}
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
  return `
    <section class="board-frame ${canMove ? 'is-ready' : ''} ${enemyCue ? 'has-enemy-cue' : ''} ${backlash ? 'has-backlash-preview' : ''}" aria-label="Battle board">
      <div class="board-status">
        <span>${
          enemyCue
            ? 'Enemy moved'
            : activeSpellName
            ? 'Spell targeting'
            : backlash
              ? 'Backlash risk'
            : snapBackCue || invalidPreview
              ? 'Snap-back'
              : preview?.valid
                ? 'Move preview'
                : canMove
                  ? 'Board ready'
                  : 'Board locked'
        }</span>
        <strong>${
          enemyCue
            ? `Shade Knight: ${enemyCue.summary}`
            : activeSpellName
            ? `Choose target for ${activeSpellName}`
            : backlash
              ? `Shade hits hard, costs ${backlash} HP`
            : snapBackCue
              ? 'No match: target returned'
              : invalidPreview
                ? 'No match on this target'
                : preview?.valid
                  ? preview.summary
                  : canMove
                    ? 'Swap adjacent tiles'
                    : enemyThinking
                      ? 'Shade Knight is choosing'
                      : 'Resolving cascades'
        }</strong>
      </div>
      ${
        intent && canMove && !enemyCue && !activeSpellName
          ? `
            <div class="intent-strip" aria-label="Enemy intent">
              <span>Shade plan</span>
              <strong>${intentReason(intent)}</strong>
            </div>
          `
          : ''
      }
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
  return `
    <section class="latest-event" aria-label="Latest combat event">
      <span>${latestEvent()}</span>
      <button data-action="toggle-log" type="button" aria-expanded="${logOpen}">Full log</button>
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
      <ol class="combat-log">
        ${duel.log.map((entry) => `<li>${entry}</li>`).join('')}
      </ol>
    </aside>
  `;
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
        ${renderCombatStrip(intent, legalMoves)}
        ${renderBoardFrame(preview, intent, canMove, activeSpellName, invalidCue)}
        ${renderActionDock(preview, canMove)}
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
          return `
            <button class="spell-button spell-${index + 1} ${activeSpell === spellId ? 'is-active' : ''}" type="button" data-spell="${spellId}" ${canCast ? '' : 'disabled'}>
              <span>${costLabel(spell.cost)}</span>
              <strong>${spell.name}</strong>
              <b>${spellTargetLabel(spellId)}</b>
              <em>${canCast ? spellHint(spellId) : missingCostLabel(spell.cost)}</em>
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
    cost.sun ? `${cost.sun} sun` : '',
    cost.moon ? `${cost.moon} moon` : '',
    cost.crown ? `${cost.crown} crown` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function missingCostLabel(cost: ManaCost): string {
  return `need ${costLabel(cost)}`;
}

function spellHint(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'convert a 3x3 cluster into sun';
  if (spellId === 'glass_ward') return '+4 guard, shade nearby becomes shield';
  return 'clear one row and collect every tile';
}

function spellTargetLabel(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return '3x3 cell target';
  if (spellId === 'glass_ward') return 'purify cell target';
  return 'row target';
}

function spellTargetHint(spellId: SpellId): string {
  if (spellId === 'sun_bloom') return 'Choose the center tile. Its 3x3 cluster becomes sun for mana and setup.';
  if (spellId === 'glass_ward') return 'Choose the center tile. Gain guard and turn nearby shade into shields.';
  return 'Choose any tile in a row. The whole row clears and pays its tile effects.';
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
    enemyCue = intent ? { cells: [intent.from, intent.to], summary: intent.preview.summary } : { cells: [], summary: 'board shifts' };
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
    const result = castSpell(duel, activeSpell, cell);
    duel = result.state;
    activeSpell = null;
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

  const spellValue = target.closest<HTMLElement>('[data-spell]')?.dataset.spell as SpellId | undefined;
  if (spellValue && view === 'play' && duel.current === 'player' && !duel.winner && !enemyThinking) {
    clearEnemyCue();
    activeSpell = activeSpell === spellValue ? null : spellValue;
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
