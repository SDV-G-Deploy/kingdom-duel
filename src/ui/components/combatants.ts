import type { DuelRules, DuelState, EnemyIntent } from '../../engine/types';
import { renderPortraitSlot } from '../assets';
import type { BattleUiState } from '../state';

type CombatStripContext = {
  duel: DuelState;
  rules: DuelRules;
  ui: Readonly<BattleUiState>;
  intent: EnemyIntent | null;
  legalMoves: number;
  intentLead(intent: EnemyIntent): string;
};

export function renderCombatStrip(context: CombatStripContext): string {
  const { duel, rules, ui, intent, legalMoves, intentLead } = context;
  const turnLabel = duel.winner
    ? duel.winner === 'player'
      ? 'Victory'
      : 'Defeat'
    : ui.enemyCue
      ? `${duel.enemy.name} action`
      : duel.current === 'player'
        ? 'Aurora turn'
        : `${duel.enemy.name} turn`;
  const turnValue = duel.winner
    ? duel.winner === 'player'
      ? 'Board sealed'
      : 'Board broken'
    : ui.enemyCue
      ? 'Resolving'
      : `${legalMoves} moves`;
  const intentCopy = ui.enemyCue ? ui.enemyCue.summary : intent ? intentLead(intent) : '';
  const passive = duel.player.passiveId ? rules.passives[duel.player.passiveId] : null;

  return `
    <section class="combat-strip ${ui.enemyCue ? 'has-enemy-cue' : ''}" aria-label="Combat state">
      <div class="duel-hud-row">
        ${renderActorMeters(duel, ui, duel.player, 'hero')}
        <div class="turn-chip">
          <span>${turnLabel}</span>
          <strong>${turnValue}</strong>
        </div>
        ${renderActorMeters(duel, ui, duel.enemy, 'enemy')}
      </div>
      <div class="tactic-rails">
        ${passive ? `<div class="passive-rail" aria-label="Aurora passive"><span>Aurora passive</span><strong>${passive.name}</strong><b>${passive.description}</b></div>` : ''}
        ${
          intentCopy
            ? `
            <div class="intent-rail" aria-label="Enemy intent">
              <span>${ui.enemyCue ? `${duel.enemy.name} moved` : `${duel.enemy.name} next`}</span>
              <strong>${intentCopy}</strong>
            </div>
          `
            : ''
        }
      </div>
    </section>
  `;
}

function renderActorMeters(
  duel: DuelState,
  ui: Readonly<BattleUiState>,
  actor: DuelState['player'],
  side: 'hero' | 'enemy',
): string {
  const isWinner = duel.winner === actor.id;
  const isDefeated = !!duel.winner && duel.winner !== actor.id;
  const hpPct = actor.hp / actor.maxHp;
  const pressureClass = hpPct <= 0 ? 'is-ko' : hpPct <= 0.28 ? 'is-critical' : actor.guard >= 4 ? 'is-braced' : '';
  const status = hpPct <= 0 ? 'KO' : hpPct <= 0.28 ? 'Critical' : actor.guard >= 4 ? 'Braced' : actor.id === duel.current ? 'Acting' : 'Ready';
  const faction = actor.id === 'player' ? 'Aurora' : 'Hostile court';

  return `
    <article class="combatant combatant-${side} ${pressureClass} ${duel.current === actor.id ? 'is-active' : ''} ${side === 'enemy' && (ui.enemyThinking || ui.enemyCue) ? 'is-cue' : ''} ${isWinner ? 'is-winner' : ''} ${isDefeated ? 'is-defeated' : ''}">
      ${renderPortraitSlot(side, actor.definitionId)}
      <div class="combatant-body">
        <span>${faction}</span>
        <strong>${actor.name}</strong>
        ${renderStatBar('HP', actor.hp, actor.maxHp, actor.id === 'player' ? '#25d7f2' : '#ff74c8')}
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

function renderStatBar(label: string, value: number, max: number, tone: string): string {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `
    <div class="stat-bar" style="--bar:${pct}; --tone:${tone}">
      <span>${label}</span>
      <strong>${value}/${max}</strong>
      <i></i>
    </div>
  `;
}
