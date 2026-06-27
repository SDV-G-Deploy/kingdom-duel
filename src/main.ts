import './styles.css';
import { findLegalMoves } from './engine/board';
import { applySwap, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './engine/duel';
import type { Cell, DuelState, EnemyIntent, MovePreview, PreviewEffect, TileKind } from './engine/types';

type GemKind = TileKind;

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

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('App root missing');
}

const app = appRoot;

let view: 'play' | 'moodboard' = new URLSearchParams(window.location.search).get('view') === 'moodboard' ? 'moodboard' : 'play';
let duel: DuelState = createDuel(2007);
let selectedCell: Cell | null = null;
let hoverCell: Cell | null = null;
let enemyThinking = false;

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

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function renderGem(kind: GemKind, index?: number, classes: string[] = []): string {
  return `
    <button class="gem gem-${kind} ${classes.join(' ')}" type="button" aria-label="${gemLabel(kind)} tile"${index === undefined ? '' : ` data-cell="${index}"`}>
      <span class="gem-shine"></span>
      <span class="gem-symbol gem-symbol-${kind}" aria-hidden="true">${gemIcon(kind)}</span>
    </button>
  `;
}

function cellFromIndex(index: number): Cell {
  return { x: index % duel.board.width, y: Math.floor(index / duel.board.width) };
}

function sameCell(a: Cell | null, b: Cell): boolean {
  return !!a && a.x === b.x && a.y === b.y;
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

function actorPanel(actor: DuelState['player'], side: 'hero' | 'enemy'): string {
  const intent = side === 'enemy' && duel.current === 'player' && !duel.winner ? getEnemyIntent(duel.board) : null;
  return `
    <article class="play-actor play-${side} ${duel.current === actor.id ? 'is-active' : ''}">
      <span class="avatar-orb"></span>
      <div>
        <span class="actor-kicker">${actor.id === 'player' ? 'Player' : 'Enemy'}</span>
        <strong>${actor.name}</strong>
        ${statBar('HP', actor.hp, actor.maxHp, actor.id === 'player' ? '#25d7f2' : '#ff74c8')}
        <div class="combat-stats">
          <span>Guard <b>${actor.guard}</b></span>
          <span>Sun <b>${actor.sun}</b></span>
          <span>Moon <b>${actor.moon}</b></span>
          <span>Crown <b>${actor.crown}</b></span>
        </div>
        ${intent ? renderEnemyIntent(intent) : ''}
      </div>
    </article>
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

function renderPlayableBoard(preview: MovePreview | null, intent: EnemyIntent | null): string {
  const previewCells = previewCellSet(preview);
  const intentCells = intentCellSet(intent);
  return `
    <div class="play-board" aria-label="Playable match-3 board">
      ${duel.board.tiles
        .map((kind, index) => {
          const cell = cellFromIndex(index);
          const key = cellKey(cell);
          const classes = [
            sameCell(selectedCell, cell) ? 'is-selected' : '',
            sameCell(hoverCell, cell) ? 'is-hovered' : '',
            previewCells.has(key) ? 'is-preview' : '',
            intentCells.has(key) ? 'is-threat' : '',
          ].filter(Boolean);
          return renderGem(kind, index, classes);
        })
        .join('')}
    </div>
  `;
}

function renderPreviewPanel(preview: MovePreview | null): string {
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
        <p>Legal swaps will show damage, mana, guard, backlash, and extra-turn value.</p>
      </div>
    `;
  }

  if (!preview.valid) {
    return `
      <div class="decision-panel is-risk">
        <span>Decision preview</span>
        <strong>Bad swap</strong>
        <p>${preview.reason}</p>
      </div>
    `;
  }

  return `
    <div class="decision-panel ${preview.extraTurn ? 'is-extra' : ''}">
      <span>Decision preview</span>
      <strong>${preview.summary}</strong>
      <div class="effect-row">
        ${preview.effects.map(renderEffectPill).join('')}
        ${preview.extraTurn ? '<em class="effect-pill tone-extra">extra turn</em>' : ''}
      </div>
    </div>
  `;
}

function renderEnemyIntent(intent: EnemyIntent): string {
  return `
    <div class="intent-card">
      <span>Intent</span>
      <strong>${intent.preview.summary}</strong>
      <p>Best visible enemy move if the board stays open.</p>
    </div>
  `;
}

function renderEffectPill(effect: PreviewEffect): string {
  return `<em class="effect-pill tone-${effect.tone}">${effect.tone === 'risk' ? '-' : '+'}${effect.value} ${effect.label}</em>`;
}

function renderPlayable(): string {
  const canMove = duel.current === 'player' && !duel.winner && !enemyThinking;
  const legalMoves = findLegalMoves(duel.board).length;
  const preview = canMove ? activePreview() : null;
  const intent = canMove ? getEnemyIntent(duel.board) : null;
  return `
    <main class="aero-shell play-shell">
      ${renderTopNav()}
      <section class="play-stage">
        <div class="play-header">
          <div>
            <p class="kicker">Kingdom Duel playable core v0.1</p>
            <h1>Match Duel</h1>
          </div>
          <button class="glass-action" data-action="restart" type="button">Restart seed</button>
        </div>
        <div class="play-layout">
          ${actorPanel(duel.player, 'hero')}
          <section class="board-zone ${canMove ? 'is-ready' : ''}">
            <div class="turn-banner">
              <span>${duel.winner ? `${duel.winner === 'player' ? 'Victory' : 'Defeat'}` : duel.current === 'player' ? 'Your move' : 'Enemy move'}</span>
              <strong>${duel.winner ? 'Battle ended' : preview?.valid ? preview.summary : canMove ? 'Read the board, then swap' : enemyThinking ? 'Shade Knight thinking' : 'Resolving'}</strong>
              <em>${legalMoves} legal moves</em>
            </div>
            ${renderPlayableBoard(preview, intent)}
          </section>
          ${actorPanel(duel.enemy, 'enemy')}
        </div>
        <section class="play-bottom">
          ${renderPreviewPanel(preview)}
          <div class="spell-row" aria-label="Spell placeholders">
            <button class="spell-button spell-1" type="button" disabled><span>6 sun</span><strong>Sun Bloom</strong><em>next milestone</em></button>
            <button class="spell-button spell-2" type="button" disabled><span>5 moon</span><strong>Glass Ward</strong><em>next milestone</em></button>
            <button class="spell-button spell-3" type="button" disabled><span>6 crown</span><strong>Crown Strike</strong><em>next milestone</em></button>
          </div>
          <ol class="combat-log">
            ${duel.log.map((entry) => `<li>${entry}</li>`).join('')}
          </ol>
        </section>
      </section>
    </main>
  `;
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
          <span class="avatar-orb"></span>
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
          <span class="avatar-orb"></span>
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
  renderApp();
  window.setTimeout(() => {
    const result = runEnemyTurn(duel);
    duel = result.state;
    enemyThinking = false;
    renderApp();
    if (duel.current === 'enemy' && !duel.winner) maybeRunEnemy();
  }, 520);
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const nextView = target.closest<HTMLElement>('[data-view]')?.dataset.view as 'play' | 'moodboard' | undefined;
  if (nextView) {
    view = nextView;
    selectedCell = null;
    hoverCell = null;
    renderApp();
    return;
  }

  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  if (action === 'restart') {
    duel = createDuel(Date.now() % 100000);
    selectedCell = null;
    hoverCell = null;
    enemyThinking = false;
    renderApp();
    return;
  }

  const cellValue = target.closest<HTMLElement>('[data-cell]')?.dataset.cell;
  if (cellValue === undefined || view !== 'play' || duel.current !== 'player' || duel.winner || enemyThinking) return;

  const cell = cellFromIndex(Number(cellValue));
  if (!selectedCell) {
    selectedCell = cell;
    hoverCell = null;
    renderApp();
    return;
  }

  if (sameCell(selectedCell, cell)) {
    selectedCell = null;
    hoverCell = null;
    renderApp();
    return;
  }

  const result = applySwap(duel, selectedCell, cell);
  duel = result.state;
  selectedCell = null;
  hoverCell = null;
  renderApp();
  maybeRunEnemy();
});

app.addEventListener('pointerover', (event) => {
  const target = event.target as HTMLElement | null;
  const cellValue = target?.closest<HTMLElement>('[data-cell]')?.dataset.cell;
  if (cellValue === undefined || view !== 'play' || duel.current !== 'player' || duel.winner || enemyThinking) return;
  const nextHover = cellFromIndex(Number(cellValue));
  if (sameCell(hoverCell, nextHover)) return;
  hoverCell = nextHover;
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
