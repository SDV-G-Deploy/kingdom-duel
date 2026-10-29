import { findLegalMoves } from '../../engine/board';
import { castSpell, getEnemyIntent, previewSwap } from '../../engine/duel';
import type {
  AbilityId,
  Cell,
  DuelRules,
  DuelState,
  EnemyIntent,
  MovePreview,
  PreviewEffect,
} from '../../engine/types';
import { RUN_ENCOUNTERS, RUN_UPGRADES } from '../../run/content';
import type { RunState } from '../../run/types';
import {
  sameCell,
} from '../assets';
import {
  abilityCostLabel,
  abilityRoleLabel,
  abilityTargetHint,
  renderAbilityRow,
} from '../components/abilities';
import { renderCombatLogSheet } from '../components/battle-log';
import { renderPlayableBoard, swapTruthLabel } from '../components/board';
import { renderCombatStrip } from '../components/combatants';
import type { CoachTip } from '../coach';
import type { BattleUiState } from '../state';
import { createBattleReportView, type BattleTerminalAction } from './battle-report';

type SpellTargetPreview = {
  spellId: AbilityId;
  title: string;
  hint: string;
  effects: PreviewEffect[];
  extraTurn: boolean;
  fatal: boolean;
};
type TerminalEventMeta = {
  label: string;
  summary: string;
  action: string;
};

export type BattleViewContext = {
  duel: DuelState;
  committedDuel?: DuelState;
  rules: DuelRules;
  ui: Readonly<BattleUiState>;
  run?: RunState;
  /** First-session hint to show in the idle command deck. */
  coachTip?: CoachTip | null;
  /** Presentation clock for float/hit/banner effects (defaults to Date.now()). */
  now?: number;
};

export type BattleView = {
  html: string;
  announcement: string;
  readableBattleLog(): string;
  compactBattleReport(): string;
  debugBattleTrace(): string;
  intentLead(intent: EnemyIntent): string;
};

export const TERMINAL_BANNER_MS = 1600;

export function createBattleView(context: BattleViewContext): BattleView {
  const duel = context.duel;
  const duelRules = context.rules;
  const ui = context.ui;
  const now = context.now ?? Date.now();
  const coachTip = context.coachTip ?? null;
  const reportView = createBattleReportView(context.committedDuel ?? duel, ui, context.run, terminalRunAction());

  function terminalRunAction(): BattleTerminalAction | undefined {
    if (!context.run || !duel.winner) return undefined;
    const encounter = RUN_ENCOUNTERS[context.run.encounterIndex];
    if (duel.winner === 'enemy') {
      return { action: 'continue-run', label: 'Record run result', hint: 'The run ends here. Record the fracture before starting again.' };
    }
    if (context.run.encounterIndex === RUN_ENCOUNTERS.length - 1) {
      return { action: 'continue-run', label: 'Seal run result', hint: 'The boss is down. Seal this build into the run record.' };
    }
    if (encounter.rewardAfter) {
      return { action: 'continue-run', label: 'Choose a prism', hint: 'Victory opens one mechanical upgrade before the next duel.' };
    }
    return { action: 'continue-run', label: 'Enter boss duel', hint: 'Aurora restores to full HP, but the Eclipse Crown waits without another reward.' };
  }

  function activePreview(): MovePreview | null {
    if (!ui.selectedCell || !ui.hoverCell || sameCell(ui.selectedCell, ui.hoverCell)) return null;
    return previewSwap(duel.board, ui.selectedCell, ui.hoverCell, duelRules);
  }

  function activeSpellPreviewCell(): Cell | null {
    return ui.confirmedAbilityTarget ?? ui.hoverCell;
  }

  function renderPreviewPanel(preview: MovePreview | null, snapBackCue: string | null): string {
    if (ui.activeAbilityId) {
      const spell = duelRules.abilities[ui.activeAbilityId];
      const spellPreview = activeSpellTargetPreview();
      if (spellPreview) {
        const confirmHint = ui.confirmedAbilityTarget ? ' Tap same target again to cast.' : '';
        return `
          <div class="decision-panel ${spellPreview.extraTurn ? 'is-extra' : ''} ${spellPreview.fatal ? 'is-risk' : ''} ${ui.confirmedAbilityTarget ? 'is-armed' : 'is-aim'}">
            <span>${ui.confirmedAbilityTarget ? 'Spell armed' : abilityRoleLabel(ui.activeAbilityId, duelRules)} · ${abilityCostLabel(spell.cost)}</span>
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
          <span>${abilityRoleLabel(ui.activeAbilityId, duelRules)} · ${abilityCostLabel(spell.cost)}</span>
          <strong>${spell.name}</strong>
          <p>${abilityTargetHint(ui.activeAbilityId, duelRules)}</p>
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

    if (!ui.selectedCell && coachTip) {
      return `
        <div class="decision-panel is-coach" data-coach-tip="${coachTip.id}">
          <span>Coach · ${coachTip.label}</span>
          <strong>${coachTip.title}</strong>
          <p>${coachTip.body}</p>
          <button class="coach-dismiss" data-action="dismiss-coach:${coachTip.id}" type="button">Got it</button>
        </div>
      `;
    }

    if (!ui.selectedCell) {
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
        <strong>${swapTruthLabel(duel, preview.from, preview.to)}: no match</strong>
          <p>No chain forms here. Shift to a bright socket before ${duel.enemy.name} gets tempo.</p>
        </div>
      `;
    }

    const backlash = previewBacklash(preview);
    const fatalBacklash = backlash > 0 && backlash >= duel.player.hp;
    return `
      <div class="decision-panel ${preview.extraTurn ? 'is-extra' : ''} ${backlash ? 'is-risk is-backlash' : 'is-valid-route'}">
        <span>${backlash ? 'Risk strike' : preview.extraTurn ? 'Tempo strike' : 'Strike ready'} · ${swapTruthLabel(duel, preview.from, preview.to)}</span>
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

  function previewBacklash(preview: MovePreview | null): number {
    if (!preview?.valid) return 0;
    return preview.effects.find((effect) => effect.label === 'backlash')?.value ?? 0;
  }

  function activeSpellTargetPreview(): SpellTargetPreview | null {
    const target = activeSpellPreviewCell();
    if (!ui.activeAbilityId || !target) return null;
    const result = castSpell(duel, ui.activeAbilityId, target, duelRules);
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
      spellId: ui.activeAbilityId,
      title: spellPreviewTitle(ui.activeAbilityId, damage, guard, backlash, fatal),
      hint: spellPreviewHint(ui.activeAbilityId, target, converted, fatal),
      effects,
      extraTurn,
      fatal,
    };
  }

  function spellPreviewTitle(spellId: AbilityId, damage: number, guard: number, backlash: number, fatal: boolean): string {
    const name = duelRules.abilities[spellId].name;
    if (fatal) return `Fatal ${name}`;
    if (backlash) return `${name}: backlash risk`;
    if (damage) return `${name}: ${damage} damage`;
    if (guard) return `${name}: +${guard} Guard`;
    return `${name}: setup`;
  }

  function spellPreviewHint(spellId: AbilityId, target: Cell, converted: number, fatal: boolean): string {
    const fatalCopy = fatal ? ' This will drop Aurora to 0.' : '';
    const hint = duelRules.abilities[spellId].presentation.previewHint
      .replace('{row}', String(target.y + 1))
      .replace('{converted}', String(converted));
    return `${hint}${fatalCopy}`;
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
    if (ui.activeResolutionFrame) return resolutionFrameLabel(ui.activeResolutionFrame.kind);
    if (ui.enemyCue) return `${duel.enemy.name} action: ${ui.enemyCue.summary}.`;
    if (ui.invalidCue) return ui.invalidCue;
    return duel.log[0] ?? 'Battle ready. Select a tile to begin.';
  }

  function resolutionFrameLabel(kind: NonNullable<BattleUiState['activeResolutionFrame']>['kind']): string {
    if (kind === 'swap') return 'Gems trade places.';
    if (kind === 'ability') return 'Mana commits to the ability.';
    if (kind === 'ability_effect') return 'The ability reshapes the board.';
    if (kind === 'cascade') return 'A new cascade begins.';
    if (kind === 'match') return 'Matched gems lock in.';
    if (kind === 'damage') return 'The strike lands.';
    if (kind === 'guard') return 'Guard rises.';
    if (kind === 'mana') return 'Mana flows to the acting knight.';
    if (kind === 'backlash') return 'Shade backlash cuts through Guard.';
    if (kind === 'fall') return 'Gems fall and refill the field.';
    if (kind === 'refill') return 'The board reshuffles.';
    if (kind === 'special') return 'Aether flashes across the board.';
    if (kind === 'turn') return 'The turn settles.';
    return 'The duel is decided.';
  }

  function terminalEventMeta(): TerminalEventMeta | null {
    if (!duel.winner) return null;

    const recap = reportView.battleRecap();
    const beat = reportView.terminalBeat();
    if (duel.winner === 'player') {
      return {
        label: 'Victory sealed',
        summary: beat?.title ?? recap?.cause ?? 'Aurora closed the duel.',
        action: 'Review victory log',
      };
    }

    return {
      label: 'Board broken',
      summary: beat?.title ?? recap?.cause ?? `${duel.enemy.name} took the duel.`,
      action: 'Review defeat log',
    };
  }

  function intentLead(intent: EnemyIntent): string {
    if (intent.type === 'ability') return `${intent.summary} · ready`;
    const parts = intent.preview.effects
      .filter((effect) => effect.label !== 'backlash')
      .map((effect) => {
        if (effect.label === 'damage' || effect.label === 'shade damage') return `cuts ${effect.value}`;
        if (effect.label === 'guard') return `braces ${effect.value}`;
        if (effect.label === 'sun' || effect.label === 'moon' || effect.label === 'crown') return `claims ${effect.value} ${effect.label}`;
        return `takes ${effect.value} ${combatEffectLabel(effect)}`;
      });

    if (intent.preview.extraTurn) parts.push('keeps turn');
    if (intent.abilityThreat) parts.push(abilityThreatLabel(intent.abilityThreat));
    return parts.length ? parts.join(' · ') : intent.preview.summary;
  }

  function abilityThreatLabel(threat: EnemyIntent['abilityThreat']): string {
    if (!threat) return '';
    const charge = (['sun', 'moon', 'crown'] as const)
      .filter((mana) => threat.cost[mana])
      .map((mana) => `${mana[0].toUpperCase()}${threat.current[mana] ?? 0}/${threat.cost[mana]}`)
      .join(' ');
    return `${threat.name} ${charge}`;
  }

  function renderTopGameBar(canMove: boolean): string {
    const buildLabel = context.run?.selectedUpgradeIds.map((id) => RUN_UPGRADES[id].name).join(' + ');
    const runLabel = context.run
      ? `${context.run.mode === 'daily' ? 'Daily' : 'Run'} ${context.run.encounterIndex + 1}/${RUN_ENCOUNTERS.length} · ${RUN_ENCOUNTERS[context.run.encounterIndex].name}${buildLabel ? ` · ${buildLabel}` : ''}`
      : duel.winner ? (duel.winner === 'player' ? 'Victory' : 'Defeat') : ui.enemyCue ? 'Enemy moved' : canMove ? 'Your move' : ui.enemyThinking ? 'Enemy thinking' : 'Resolving';
    return `
      <nav class="game-bar" aria-label="Kingdom Duel cockpit">
        <div class="game-brand">
          <strong>Kingdom Duel</strong>
          <span>${runLabel}</span>
        </div>
        <div class="game-actions">
          ${duel.winner || context.run ? '' : '<button class="icon-action" data-action="restart" type="button" aria-label="Restart duel" title="Restart duel">↻</button>'}
          ${context.run ? '<button class="icon-action" data-view="title" type="button" aria-label="Title screen" title="Title screen (run is saved)">⌂</button>' : ''}
          <button class="icon-action" data-action="toggle-log" type="button" aria-expanded="${ui.logOpen}" aria-label="Open combat log" title="Combat log">≡</button>
          <button class="icon-action" data-view="moodboard" type="button" aria-label="Open AeroCandy moodboard" title="AeroCandy moodboard">✦</button>
        </div>
      </nav>
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
    const spellPreview = ui.activeAbilityId ? activeSpellTargetPreview() : null;
    const hasSelection = !!ui.selectedCell && !ui.activeAbilityId;
    const hasValidSwap = !!preview?.valid && !backlash;
    return `
      <section class="board-frame ${canMove ? 'is-ready' : ''} ${ui.enemyCue ? 'has-enemy-cue' : ''} ${backlash ? 'has-backlash-preview' : ''} ${spellPreview && !ui.confirmedAbilityTarget ? 'is-spell-aim' : ''} ${spellPreview && ui.confirmedAbilityTarget ? 'is-spell-armed' : ''} ${snapBackCue || invalidPreview ? 'is-snap-back' : ''} ${hasSelection && !preview ? 'is-selection-state' : ''} ${hasValidSwap ? 'is-valid-swap-state' : ''}" aria-label="Battle board">
        <div class="board-status">
          <span>${
            duel.winner
              ? duel.winner === 'player' ? 'Victory' : 'Defeat'
              : ui.enemyCue
              ? 'Enemy moved'
              : spellPreview?.fatal
              ? 'Fatal spell'
              : spellPreview && ui.confirmedAbilityTarget
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
            duel.winner
              ? duel.winner === 'player'
                ? `${duel.enemy.name} falls. Review the recap below.`
                : `Aurora falls. Review the recap below.`
              : ui.enemyCue
              ? `${duel.enemy.name} action: ${ui.enemyCue.summary}`
              : spellPreview && ui.confirmedAbilityTarget
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
                  ? `${swapTruthLabel(duel, preview.from, preview.to)}: no match`
                  : 'No match: target returned'
                : invalidPreview
                  ? preview
                    ? `${swapTruthLabel(duel, preview.from, preview.to)}: no match`
                    : 'No match on this target'
                  : preview?.valid
                    ? preview.summary
                  : hasSelection
                    ? 'Trace a bright socket to route the strike'
                  : canMove
                      ? 'Pick a gem'
                      : ui.enemyThinking
                        ? `${duel.enemy.name} is choosing`
                        : 'Resolving cascades'
          }</strong>
        </div>
        ${renderPlayableBoard(duel, duelRules, ui, preview, intent, now)}
      </section>
    `;
  }

  function renderActionDock(preview: MovePreview | null, canMove: boolean): string {
    return `
      <section class="action-dock" aria-label="Actions">
        ${renderPreviewPanel(preview, ui.invalidCue)}
        ${renderAbilityRow(duel, duelRules, ui, canMove, !ui.selectedCell && !ui.activeAbilityId ? coachTip?.spellId : undefined)}
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
        <button data-action="toggle-log" type="button" aria-expanded="${ui.logOpen}">${terminalMeta?.action ?? 'Full log'}</button>
      </section>
    `;
  }

  function renderTerminalBanner(): string {
    if (!duel.winner || ui.terminalFxAt === null) return '';
    const elapsed = Math.max(0, now - ui.terminalFxAt);
    if (elapsed > TERMINAL_BANNER_MS) return '';
    const won = duel.winner === 'player';
    const encounter = context.run ? RUN_ENCOUNTERS[context.run.encounterIndex] : null;
    return `
      <div class="terminal-banner ${won ? 'is-victory' : 'is-defeat'}" style="--banner-delay:-${elapsed}ms" aria-hidden="true">
        <span>${encounter ? `${encounter.tier} · ${encounter.name}` : 'Duel'}</span>
        <strong>${won ? 'Victory' : 'Defeat'}</strong>
      </div>
    `;
  }

  function renderPlayable(): string {
    const canMove = duel.current === 'player' && !duel.winner && !ui.enemyThinking && !ui.isResolving;
    const legalMoves = findLegalMoves(duel.board).length;
    const preview = canMove && !ui.activeAbilityId ? activePreview() : null;
    const intent = canMove ? getEnemyIntent(duel, duelRules) : null;
    const activeSpellName = ui.activeAbilityId ? duelRules.abilities[ui.activeAbilityId].name : null;
    return `
      <main class="aero-shell play-shell ${ui.isResolving ? 'is-resolving' : ''}"${ui.activeResolutionFrame ? ` data-resolution-frame="${ui.activeResolutionFrame.kind}"` : ''}>
        <section class="play-stage cockpit-stage">
          ${renderTopGameBar(canMove)}
          <section class="battle-console" aria-label="Glass battle console">
            ${renderCombatStrip({ duel, rules: duelRules, ui, intent, legalMoves, intentLead, now })}
            ${renderBoardFrame(preview, intent, canMove, activeSpellName, ui.invalidCue)}
            ${duel.winner ? reportView.renderBattleRecap() : renderActionDock(preview, canMove)}
          </section>
          ${renderLatestEvent()}
          ${renderCombatLogSheet(duel, ui)}
          ${renderTerminalBanner()}
        </section>
      </main>
    `;
  }

  const terminalAnnouncement = terminalEventMeta();
  return {
    html: renderPlayable(),
    announcement: terminalAnnouncement
      ? `${terminalAnnouncement.label}: ${terminalAnnouncement.summary}`
      : latestEvent(),
    readableBattleLog: reportView.readableBattleLog,
    compactBattleReport: reportView.compactBattleReport,
    debugBattleTrace: reportView.debugBattleTrace,
    intentLead,
  };
}
