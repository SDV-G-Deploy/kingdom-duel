import type { DuelState } from '../../engine/types';
import type { RunState } from '../../run/types';
import {
  DAILY_CHALLENGE_VERSION,
  RUN_CONTENT_VERSION,
  RUN_RULES_VERSION,
  RUN_SCHEMA_VERSION,
} from '../../run/version';
import { BUILD_IDENTITY } from '../../build-info';
import { renderPortraitSlot } from '../assets';
import type { BattleUiState } from '../state';

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

export type BattleTerminalAction = {
  action: string;
  label: string;
  hint: string;
};

export type BattleReportView = {
  readableBattleLog(): string;
  compactBattleReport(): string;
  debugBattleTrace(): string;
  battleRecap(): BattleRecap | null;
  terminalBeat(): TerminalBeat | null;
  renderBattleRecap(): string;
};

export function createBattleReportView(
  duel: DuelState,
  ui: Readonly<BattleUiState>,
  run?: RunState,
  terminalAction?: BattleTerminalAction,
): BattleReportView {
  function readableBattleLog(): string {
    return [...duel.history]
      .reverse()
      .map((entry) => {
        const actor = entry.actor === 'system' ? 'Setup' : entry.actor === 'player' ? 'Aurora' : duel.enemy.name;
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
    const playerSpells = history
      .filter((entry) => entry.actor === 'player')
      .flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
    const enemySpells = history
      .filter((entry) => entry.actor === 'enemy')
      .flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
    const keyTail = history
      .filter((entry) => entry.actor !== 'system')
      .slice(-6)
      .map((entry) => `T${entry.turn} ${entry.actor === 'player' ? 'Aurora' : duel.enemy.name}: ${entry.summary} (${entry.detail})`);
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
            ? `Win reason: ${duel.enemy.name} HP reached 0.`
            : 'Battle is still unresolved.';

    return [
      'Kingdom Duel compact battle report',
      `Seed: ${duel.seed}`,
      `Winner: ${duel.winner ? (duel.winner === 'player' ? 'Aurora Knight' : duel.enemy.name) : 'none'} on turn ${duel.turn}`,
      `Final: Aurora ${duel.player.hp}/${duel.player.maxHp} HP, Guard ${duel.player.guard}, mana S${duel.player.sun}/M${duel.player.moon}/C${duel.player.crown}`,
      `Final: ${duel.enemy.name} ${duel.enemy.hp}/${duel.enemy.maxHp} HP, Guard ${duel.enemy.guard}, mana S${duel.enemy.sun}/M${duel.enemy.moon}/C${duel.enemy.crown}`,
      `HP lost: Aurora ${playerHpLost}, ${duel.enemy.name} ${enemyHpLost}`,
      `Backlash paid by Aurora: ${playerBacklash}`,
      `Extra turns: Aurora ${playerExtraTurns}, ${duel.enemy.name} ${enemyExtraTurns}`,
      `Aurora abilities: ${playerSpells.length ? playerSpells.join('; ') : 'none'}`,
      `${duel.enemy.name} abilities: ${enemySpells.length ? enemySpells.join('; ') : 'none'}`,
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
        traceSchemaVersion: 1,
        build: BUILD_IDENTITY,
        contract: {
          runSchemaVersion: RUN_SCHEMA_VERSION,
          rulesVersion: run?.rulesVersion ?? RUN_RULES_VERSION,
          contentVersion: run?.contentVersion ?? RUN_CONTENT_VERSION,
          dailyVersion: run?.dailyVersion ?? (run?.mode === 'daily' ? DAILY_CHALLENGE_VERSION : null),
        },
        run: run
          ? {
              seed: run.seed,
              mode: run.mode,
              dailyKey: run.dailyKey,
              phase: run.phase,
              encounterIndex: run.encounterIndex,
              selectedUpgradeIds: run.selectedUpgradeIds,
              rewardOptions: run.rewardOptions,
              battles: run.battles,
            }
          : null,
        initialSeed: duel.initialSeed,
        rngSeed: duel.seed,
        turn: duel.turn,
        current: duel.current,
        winner: duel.winner,
        player: duel.player,
        enemy: duel.enemy,
        actions: duel.actionLog,
        resolutionFrames: ui.resolutionFrames,
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
    const playerSpells = history
      .filter((entry) => entry.actor === 'player')
      .flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
    const enemySpells = history
      .filter((entry) => entry.actor === 'enemy')
      .flatMap((entry) => entry.events.filter((event) => event.startsWith('cast ')));
    const aetherCreated = history.reduce(
      (sum, entry) => sum + entry.events.filter((event) => event.startsWith('forged Aether')).length,
      0,
    );
    const aetherActivated = history.reduce(
      (sum, entry) => sum + entry.events.filter((event) => event.startsWith('detonated Aether')).length,
      0,
    );
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
          ? `${duel.enemy.name} ended the duel by pushing Aurora to 0 HP.`
          : playerSpells.length
            ? 'Aurora converted stored mana into lethal spell pressure.'
            : 'Aurora ended the duel through board pressure.';
    const lesson = selfKo
      ? 'Lesson: below 5 HP, treat shade cascades as lethal unless preview says safe.'
      : duel.winner === 'enemy' && unspentMana >= 10
        ? 'Lesson: spend mana earlier; unused spells do not protect Aurora.'
        : duel.winner === 'enemy'
          ? `Lesson: guard and preview shade risk before giving ${duel.enemy.name} a chain.`
          : playerSpells.length
            ? 'Lesson: previewed spells are the strongest way to convert mana into tempo.'
            : 'Lesson: forcing sword pressure and extra turns can win without spells.';

    return {
      outcome: duel.winner === 'player' ? 'Victory' : 'Defeat',
      cause,
      turningPoint: turningEntry ? `T${turningEntry.turn} ${turningEntry.actor === 'player' ? 'Aurora' : duel.enemy.name}: ${turningEntry.summary}` : 'No combat action recorded.',
      pressure: `Backlash ${playerBacklash} HP · Abilities A${playerSpells.length}/S${enemySpells.length} · Aether ${aetherCreated}/${aetherActivated} · Chains A${playerExtraTurns}/S${enemyExtraTurns}`,
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
    const actorName = terminalEntry.actor === 'player' ? 'Aurora' : duel.enemy.name;

    if (duel.winner === 'player') {
      if (spells.length) {
        return {
          title: `${actorName} spent banked mana for the finish`,
          detail: `${spells[0]} converted the last opening before ${duel.enemy.name} could reset guard.`,
        };
      }

      return {
        title: `${actorName} closed with a clean board strike`,
        detail: `The final exchange stayed on-board and denied ${duel.enemy.name} one more chain.`,
      };
    }

    if (backlash > 0 && terminalEntry.actor === 'player') {
      return {
        title: `Aurora broke on a ${backlash} HP backlash`,
        detail: 'The answer line looked live, but shade pressure turned the last move into a self-break.',
      };
    }

    return {
      title: `${duel.enemy.name} held tempo in the last exchange`,
      detail: 'Aurora lost the last safe line before the board could be stabilized.',
    };
  }

  function actorReserve(actor: DuelState['player']): number {
    return actor.sun + actor.moon + actor.crown;
  }

  function resultStanceLabel(actorId: 'player' | 'enemy'): string {
    if (!duel.winner) return actorId === 'player' ? 'Aurora Glass' : 'Hostile court';
    if (duel.winner === actorId) return actorId === 'player' ? 'Board sealed' : 'Board broken';
    return actorId === 'player' ? 'Aurora fallen' : `${duel.enemy.name} fallen`;
  }

  function renderResultStand(actor: DuelState['player'], side: 'hero' | 'enemy'): string {
    const actorId = side === 'hero' ? 'player' : 'enemy';
    const faction = actorId === 'player' ? 'Aurora Glass' : 'Hostile court';
    return `
      <div class="recap-stand recap-stand-${side} ${duel.winner === actorId ? 'is-winner' : 'is-loser'}">
        ${renderPortraitSlot(side === 'hero' ? 'hero' : 'enemy', actor.definitionId)}
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
    const winnerName = duel.winner === 'player' ? 'Aurora Glass' : duel.enemy.name;
    const resultTitle = duel.winner === 'player' ? 'Aurora seals the glass board' : `${duel.enemy.name} breaks the glass board`;
    const terminalScore = `Aurora ${duel.player.hp}/${duel.player.maxHp} HP · ${duel.enemy.name} ${duel.enemy.hp}/${duel.enemy.maxHp} HP`;
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
          <span>${terminalAction?.hint ?? resultActionCopy}</span>
          ${terminalAction ? `<button class="primary-run-action" data-action="${terminalAction.action}" type="button">${terminalAction.label}</button>` : ''}
          <button data-action="toggle-log" type="button" aria-expanded="${ui.logOpen}">${terminalAction ? 'Study battle log' : resultActionLabel}</button>
        </div>
      </section>
    `;
  }

  return {
    readableBattleLog,
    compactBattleReport,
    debugBattleTrace,
    battleRecap,
    terminalBeat,
    renderBattleRecap,
  };
}
