import { RUN_ENCOUNTERS, RUN_UPGRADES } from '../../run/content';
import type { RunState } from '../../run/types';

export type RunView = {
  html: string;
  announcement: string;
};

export function runRouteNodeState(run: RunState, encounterIndex: number): 'is-complete' | 'is-failed' | 'is-current' | 'is-upcoming' {
  const battle = run.battles.find((entry) => entry.encounterId === RUN_ENCOUNTERS[encounterIndex]?.id);
  if (battle?.winner === 'player') return 'is-complete';
  if (battle?.winner === 'enemy') return 'is-failed';
  return encounterIndex === run.encounterIndex ? 'is-current' : 'is-upcoming';
}

export function renderRunRoute(run: RunState): string {
  return `
    <ol class="run-route" aria-label="Run route">
      ${RUN_ENCOUNTERS.map((encounter, index) => {
        const state = runRouteNodeState(run, index);
        const stateLabel = state.slice(3).replace('-', ' ');
        return `
          <li class="run-node ${state} tier-${encounter.tier}" aria-label="${encounter.name}, ${encounter.tier}, ${stateLabel}">
            <span>${index + 1}</span>
            <b>${encounter.tier}</b>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

export function renderRunBuild(run: RunState): string {
  if (!run.selectedUpgradeIds.length) return '<span class="run-build-empty">No prisms yet</span>';
  return run.selectedUpgradeIds
    .map((id) => `<span class="run-build-chip path-${RUN_UPGRADES[id].path}">${RUN_UPGRADES[id].name}</span>`)
    .join('');
}

export function renderRewardView(run: RunState): RunView {
  const cleared = RUN_ENCOUNTERS[run.encounterIndex];
  const next = RUN_ENCOUNTERS[run.encounterIndex + 1];
  const html = `
    <main class="aero-shell run-shell">
      <section class="run-stage reward-stage" aria-label="Choose a run upgrade">
        <header class="run-header">
          <div>
            <span>${run.mode === 'daily' ? `Daily ${run.dailyKey} · ${run.dailyVersion}` : `Seed ${run.seed}`}</span>
            <strong>Prism choice</strong>
            <b>${cleared.name} cleared · ${next.name} ahead</b>
          </div>
          <button class="icon-action" data-view="title" type="button" aria-label="Title screen" title="Title screen (run is saved)">⌂</button>
        </header>
        ${renderRunRoute(run)}
        <section class="reward-intro">
          <span>Build, don't grind</span>
          <strong>Choose one rule-changing prism</strong>
          <p>Each option changes how you value the shared board. The other two disappear; Aurora restores to full HP before the next duel.</p>
        </section>
        <div class="reward-grid">
          ${run.rewardOptions.map((id) => {
            const upgrade = RUN_UPGRADES[id];
            return `
              <button class="reward-card path-${upgrade.path}" data-action="choose-upgrade:${id}" type="button">
                <span>${upgrade.path} path</span>
                <strong>${upgrade.name}</strong>
                <b>${upgrade.description}</b>
                <em>Take prism</em>
              </button>
            `;
          }).join('')}
        </div>
        <section class="run-build" aria-label="Current run build">
          <span>Current build</span>
          <div>${renderRunBuild(run)}</div>
        </section>
      </section>
    </main>
  `;
  return { html, announcement: `Choose one of three prisms before ${next.name}.` };
}

export function renderRunResult(run: RunState): RunView {
  const complete = run.phase === 'complete';
  const victories = run.battles.filter((battle) => battle.winner === 'player').length;
  const totalActions = run.battles.reduce((sum, battle) => sum + battle.actions, 0);
  const html = `
    <main class="aero-shell run-shell">
      <section class="run-stage result-stage ${complete ? 'is-complete' : 'is-failed'}" aria-label="Run result">
        <header class="run-result-seal">
          <span>${complete ? 'Run complete' : 'Run broken'}</span>
          <strong>${complete ? 'Eclipse Crown sealed' : 'The glass path fractures'}</strong>
          <b>${victories}/${RUN_ENCOUNTERS.length} victories · ${totalActions} actions</b>
        </header>
        ${renderRunRoute(run)}
        <section class="run-battle-list" aria-label="Encounter results">
          ${RUN_ENCOUNTERS.map((encounter) => {
            const battle = run.battles.find((entry) => entry.encounterId === encounter.id);
            return `
              <div class="run-battle-row ${battle ? `is-${battle.winner}` : 'is-unreached'}">
                <span>${encounter.tier}</span>
                <strong>${encounter.name}</strong>
                <b>${battle ? `${battle.winner === 'player' ? 'won' : 'lost'} · T${battle.turns} · ${battle.actions} actions` : 'unreached'}</b>
              </div>
            `;
          }).join('')}
        </section>
        <section class="run-build" aria-label="Final run build">
          <span>Final build</span>
          <div>${renderRunBuild(run)}</div>
        </section>
        <div class="run-result-actions">
          <button class="primary-run-action" data-action="new-standard-run" type="button">New standard run</button>
          <button data-action="new-daily-run" type="button">Today’s daily seed</button>
          <button data-view="title" type="button">Title screen</button>
        </div>
      </section>
    </main>
  `;
  return {
    html,
    announcement: complete ? 'Run complete. Eclipse Crown sealed.' : `Run ended after ${victories} victories.`,
  };
}
