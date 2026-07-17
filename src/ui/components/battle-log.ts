import type { DuelState } from '../../engine/types';
import type { BattleUiState } from '../state';

export function renderCombatLogSheet(duel: DuelState, ui: Readonly<BattleUiState>): string {
  if (!ui.logOpen) return '';

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
