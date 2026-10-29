import { RUN_ENCOUNTERS } from '../../run/content';
import type { RunState } from '../../run/types';
import { renderGem, renderPortraitSlot } from '../assets';
import { renderRunRoute } from './run';

export type TitleViewContext = {
  /** The saved run, when one exists; drives the Continue button. */
  run: RunState | null;
  /** Today's UTC daily key, e.g. 2026-10-29. */
  dailyKey: string;
  hintsEnabled: boolean;
  buildLabel: string;
  /** Sound preferences for the footer toggles; omitted in tests that do not care. */
  sound?: { muted: boolean; music: boolean };
};

export type TitleView = { html: string; announcement: string };

export function titleContinueLabel(run: RunState | null): { label: string; detail: string } | null {
  if (!run) return null;
  const encounter = RUN_ENCOUNTERS[run.encounterIndex];
  const mode = run.mode === 'daily' ? `Daily ${run.dailyKey}` : 'Run';
  if (run.phase === 'battle') {
    return { label: 'Continue run', detail: `${mode} ${run.encounterIndex + 1}/${RUN_ENCOUNTERS.length} · ${encounter.name}` };
  }
  if (run.phase === 'reward') {
    return { label: 'Continue run', detail: `${mode} · prism choice after ${encounter.name}` };
  }
  const victories = run.battles.filter((battle) => battle.winner === 'player').length;
  return {
    label: 'Last run recap',
    detail: `${run.phase === 'complete' ? 'Crown sealed' : 'Path fractured'} · ${victories}/${RUN_ENCOUNTERS.length} victories`,
  };
}

export function renderTitleView(context: TitleViewContext): TitleView {
  const resume = titleContinueLabel(context.run);
  const inProgress = !!context.run && (context.run.phase === 'battle' || context.run.phase === 'reward');
  const html = `
    <main class="aero-shell run-shell title-shell">
      <section class="run-stage title-stage" aria-label="Kingdom Duel title">
        <span class="title-bubble title-bubble-a" aria-hidden="true"></span>
        <span class="title-bubble title-bubble-b" aria-hidden="true"></span>
        <header class="title-hero">
          <div class="title-versus" aria-hidden="true">
            ${renderPortraitSlot('hero', 'aurora_knight')}
            <b>VS</b>
            ${renderPortraitSlot('enemy', 'shade_knight')}
          </div>
          <span>AeroCandy match-3 duel</span>
          <h1>Kingdom Duel</h1>
          <p>One shared board. Every match is damage, defence, mana or denial. Four duels, two prisms, one Eclipse Crown.</p>
        </header>
        <div class="title-actions">
          ${
            resume
              ? `<button class="primary-run-action" data-action="continue-run-save" type="button"><strong>${resume.label}</strong><small>${resume.detail}</small></button>`
              : ''
          }
          <button class="${resume ? 'secondary-run-action' : 'primary-run-action'}" data-action="new-standard-run" type="button"><strong>New run</strong><small>${inProgress ? 'Replaces the saved run' : 'Glass Edge → Moon Lock → Veil Champion → Eclipse Crown'}</small></button>
          <button class="secondary-run-action" data-action="new-daily-run" type="button"><strong>Daily seed</strong><small>${context.dailyKey} · same boards for everyone today</small></button>
        </div>
        ${context.run ? renderRunRoute(context.run) : ''}
        <section class="how-to-play" aria-label="How to play">
          <span>How to play</span>
          <ul>
            <li>${gemIcon('sword')}<p><b>Swap neighbours</b> to line up 3+. Swords strike, Shields add Guard.</p></li>
            <li>${gemIcon('moon')}<p><b>Sun, Moon, Crown</b> charge Aurora's three spells. Cast them — they win duels.</p></li>
            <li>${gemIcon('shade')}<p><b>Shade</b> hits hardest but bites back. Watch the pink enemy intent.</p></li>
            <li>${gemIcon('aether')}<p><b>Match 4</b> keeps your turn; <b>match 5</b> forges an Aether bomb.</p></li>
          </ul>
        </section>
        <footer class="title-footer">
          <button data-action="toggle-hints" type="button" aria-pressed="${context.hintsEnabled}">Coach hints: ${context.hintsEnabled ? 'on' : 'off'}</button>
          ${
            context.sound
              ? `<button data-action="toggle-sound" type="button" aria-pressed="${!context.sound.muted}">Sound: ${context.sound.muted ? 'off' : 'on'}</button>
          <button data-action="toggle-music" type="button" aria-pressed="${context.sound.music && !context.sound.muted}">Music: ${context.sound.music && !context.sound.muted ? 'on' : 'off'}</button>`
              : ''
          }
          <button data-view="moodboard" type="button">Moodboard</button>
          <small>${context.buildLabel}</small>
        </footer>
      </section>
    </main>
  `;
  return {
    html,
    announcement: resume ? `Kingdom Duel. ${resume.label}: ${resume.detail}.` : 'Kingdom Duel. Start a new run or today\'s daily seed.',
  };
}

function gemIcon(kind: Parameters<typeof renderGem>[0]): string {
  // Decorative copy of the board gem markup, rendered as a non-interactive span.
  return renderGem(kind, undefined, ['title-gem'])
    .replace('<button', '<span aria-hidden="true"')
    .replace(' type="button"', '')
    .replace(/<\/button>\s*$/, '</span>');
}
