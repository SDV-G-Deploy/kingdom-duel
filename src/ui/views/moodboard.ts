import { BOARD_PATTERN, GEM_KINDS, gemLabel, renderGem, renderPortraitSlot } from '../assets';
import type { AppView } from '../state';

export function renderMoodboard(view: AppView): string {
  return `
  <main class="aero-shell moodboard-shell">
    ${renderTopNav(view)}
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

function renderTopNav(view: AppView): string {
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
        ${BOARD_PATTERN.map((kind, index) => renderGem(kind, index)).join('')}
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
        ${GEM_KINDS
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
