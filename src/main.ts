import './styles.css';
import { areAdjacent } from './engine/board';
import { applySwap, castSpell, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './engine/duel';
import { DEFAULT_DUEL_RULES } from './engine/rules';
import type {
  AbilityId,
  Cell,
  DuelState,
  Resolution,
} from './engine/types';
import { chooseSpellTargetTapAction } from './input';
import { buildRunDuelRules } from './run/rules';
import {
  chooseRunUpgrade,
  createRun,
  createRunDuel,
  dailyRunKey,
  dailyRunSeed,
  resolveRunBattle,
} from './run/run';
import { loadRun, saveRun } from './run/storage';
import type { RunMode, RunState, UpgradeId } from './run/types';
import { RUN_SCHEMA_VERSION } from './run/version';
import { sameCell } from './ui/assets';
import { createDebugSession } from './ui/debug-presets';
import { bindBattleInput } from './ui/input-controller';
import { ResolutionPlaybackController } from './ui/playback';
import { BattleUiStore, canUseBoard as canUseBoardSelector, duelForPresentation } from './ui/state';
import { createBattleView } from './ui/views/battle';
import { renderMoodboard } from './ui/views/moodboard';
import { renderRewardView, renderRunResult } from './ui/views/run';
import { CancellableTimer, FOCUS_ATTRIBUTES, chooseFocusIdentity, type FocusIdentity } from './ui-lifecycle';

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('App root missing');
}

const app = appRoot;
const liveRegion = document.createElement('div');
liveRegion.className = 'visually-hidden';
liveRegion.setAttribute('role', 'status');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.setAttribute('aria-atomic', 'true');
document.body.append(liveRegion);
let lastAnnouncement = '';
const search = new URLSearchParams(window.location.search);
const debugPreset = search.get('debug');
const runEnabled = !debugPreset;
const runStorage = safeLocalStorage();

const uiStore = new BattleUiStore(search.get('view') === 'moodboard' ? 'moodboard' : 'play');
const ui = uiStore.state;
const restored = runEnabled && runStorage ? loadRun(runStorage) : null;
let run: RunState = restored?.run ?? createRun(Date.now() >>> 0);
let duelRules = runEnabled ? buildRunDuelRules(run) : DEFAULT_DUEL_RULES;
const debugSession = createDebugSession(debugPreset, duelRules);
let duel: DuelState = runEnabled ? restored?.duel ?? createRunDuel(run) : debugSession.duel;
uiStore.update(debugSession.ui);
let bumpTimer: number | null = null;
let invalidCueTimer: number | null = null;
const browserTimerPlatform = {
  setTimeout: (callback: () => void, delay: number) => window.setTimeout(callback, delay),
  clearTimeout: (handle: number) => window.clearTimeout(handle),
};
const enemyTurnTimer = new CancellableTimer(browserTimerPlatform);
const enemyCueTimer = new CancellableTimer(browserTimerPlatform);
const resolutionPlayback = new ResolutionPlaybackController(browserTimerPlatform);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function canUseBoard(): boolean {
  return (!runEnabled || run.phase === 'battle') && canUseBoardSelector(duel, ui);
}

function currentBattleView() {
  return createBattleView({
    duel: duelForPresentation(duel, ui.presentedSnapshot),
    committedDuel: duel,
    rules: duelRules,
    ui,
    run: runEnabled ? run : undefined,
  });
}

function persistCurrentRun(): void {
  if (!runEnabled || !runStorage) return;
  try {
    saveRun(runStorage, { version: RUN_SCHEMA_VERSION, run, duel });
  } catch {
    // A private or quota-constrained browser may reject storage; gameplay remains available in memory.
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function presentResolution(result: Resolution, onComplete: () => void = () => {}): void {
  duel = result.state;
  persistCurrentRun();
  uiStore.beginResolution(result.frames);
  resolutionPlayback.play(
    result.frames,
    {
      onFrame: (frame) => {
        uiStore.presentFrame(frame);
        renderApp();
      },
      onComplete: () => {
        uiStore.finishResolution();
        renderApp();
        onComplete();
      },
    },
    { reducedMotion: prefersReducedMotion.matches },
  );
}

function cancelResolution(): void {
  resolutionPlayback.cancel();
  uiStore.finishResolution();
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

function renderApp(): void {
  const focusIdentity = captureFocusIdentity();
  const battleView = ui.view === 'play' && (!runEnabled || run.phase === 'battle') ? currentBattleView() : null;
  const runView = ui.view === 'play' && runEnabled
    ? run.phase === 'reward'
      ? renderRewardView(run)
      : run.phase === 'complete' || run.phase === 'failed'
        ? renderRunResult(run)
        : null
    : null;
  app.innerHTML = battleView?.html ?? runView?.html ?? renderMoodboard(ui.view);
  const announcement = battleView?.announcement ?? runView?.announcement ?? '';
  if (announcement !== lastAnnouncement) {
    liveRegion.textContent = announcement;
    lastAnnouncement = announcement;
  }
  restoreFocus(focusIdentity);
}

function captureFocusIdentity(): FocusIdentity | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !app.contains(active)) return null;
  const control = active.closest<HTMLElement>(FOCUS_ATTRIBUTES.map((attribute) => `[${attribute}]`).join(','));
  if (!control) return null;

  return chooseFocusIdentity(
    Object.fromEntries(FOCUS_ATTRIBUTES.map((attribute) => [attribute, control.getAttribute(attribute)])),
  );
}

function restoreFocus(identity: FocusIdentity | null): void {
  if (!identity) return;
  const control = [...app.querySelectorAll<HTMLElement>(`[${identity.attribute}]`)].find(
    (candidate) => candidate.getAttribute(identity.attribute) === identity.value,
  );
  control?.focus({ preventScroll: true });
}

function maybeRunEnemy(): void {
  if (ui.view !== 'play' || (runEnabled && run.phase !== 'battle') || duel.current !== 'enemy' || duel.winner || ui.enemyThinking) return;
  ui.enemyThinking = true;
  ui.enemyCue = null;
  renderApp();
  enemyTurnTimer.schedule(() => {
    const intent = getEnemyIntent(duel, duelRules);
    const result = runEnemyTurn(duel, duelRules);
    ui.enemyThinking = false;
    ui.enemyCue = intent
      ? {
          cells: intent.type === 'ability' ? intent.cells : [intent.from, intent.to],
          summary: currentBattleView().intentLead(intent),
        }
      : { cells: [], summary: 'board shifts' };
    const enemyKeepsTurn = result.state.current === 'enemy' && !result.state.winner;
    presentResolution(result, () => {
      enemyCueTimer.schedule(() => {
        ui.enemyCue = null;
        renderApp();
        if (enemyKeepsTurn) maybeRunEnemy();
      }, enemyKeepsTurn ? 760 : 900);
    });
  }, 520);
}

function clearEnemyCue(): void {
  ui.enemyCue = null;
  enemyCueTimer.cancel();
}

function cancelEnemySequence(): void {
  enemyTurnTimer.cancel();
  enemyCueTimer.cancel();
  cancelResolution();
  ui.enemyThinking = false;
  ui.enemyCue = null;
}

function clearInvalidCue(): void {
  ui.invalidCue = null;
  if (invalidCueTimer !== null) {
    window.clearTimeout(invalidCueTimer);
    invalidCueTimer = null;
  }
}

function showInvalidCue(message: string): void {
  ui.invalidCue = message;
  if (invalidCueTimer !== null) window.clearTimeout(invalidCueTimer);
  invalidCueTimer = window.setTimeout(() => {
    ui.invalidCue = null;
    invalidCueTimer = null;
    renderApp();
  }, 900);
}

function clearBumpLater(): void {
  if (bumpTimer !== null) window.clearTimeout(bumpTimer);
  bumpTimer = window.setTimeout(() => {
    ui.bumpCell = null;
    ui.hoverCell = null;
    bumpTimer = null;
    renderApp();
  }, 420);
}

function clearBumpCue(): void {
  ui.bumpCell = null;
  if (bumpTimer !== null) {
    window.clearTimeout(bumpTimer);
    bumpTimer = null;
  }
}

function bumpInvalidTarget(target: Cell, message: string): void {
  ui.bumpCell = target;
  ui.hoverCell = target;
  showInvalidCue(message);
  renderApp();
  clearBumpLater();
}

function commitSwap(from: Cell, to: Cell): void {
  clearEnemyCue();
  clearInvalidCue();
  clearBumpCue();
  if (!areAdjacent(from, to)) {
    ui.selectedCell = to;
    ui.hoverCell = null;
    renderApp();
    return;
  }

  const preview = previewSwap(duel.board, from, to, duelRules);
  if (!preview.valid) {
    ui.selectedCell = from;
    bumpInvalidTarget(to, 'No match: the target tile snapped back.');
    return;
  }

  const result = applySwap(duel, from, to, duelRules);
  ui.selectedCell = null;
  ui.hoverCell = null;
  ui.bumpCell = null;
  clearInvalidCue();
  presentResolution(result, maybeRunEnemy);
}

function handleBoardTap(cell: Cell): void {
  if (!canUseBoard()) return;
  clearEnemyCue();
  clearInvalidCue();

  if (ui.activeAbilityId) {
    if (chooseSpellTargetTapAction(ui.confirmedAbilityTarget, cell) === 'preview') {
      ui.hoverCell = cell;
      ui.confirmedAbilityTarget = cell;
      ui.selectedCell = null;
      ui.bumpCell = null;
      renderApp();
      return;
    }

    const result = castSpell(duel, ui.activeAbilityId, cell, duelRules);
    ui.activeAbilityId = null;
    ui.confirmedAbilityTarget = null;
    ui.selectedCell = null;
    ui.hoverCell = null;
    ui.bumpCell = null;
    clearInvalidCue();
    presentResolution(result, maybeRunEnemy);
    return;
  }

  if (!ui.selectedCell) {
    ui.selectedCell = cell;
    ui.hoverCell = null;
    ui.bumpCell = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  if (sameCell(ui.selectedCell, cell)) {
    ui.selectedCell = null;
    ui.hoverCell = null;
    ui.bumpCell = null;
    clearInvalidCue();
    renderApp();
    return;
  }

  commitSwap(ui.selectedCell, cell);
}

function handleViewChange(nextView: 'play' | 'moodboard'): void {
  cancelEnemySequence();
  clearBumpCue();
  clearInvalidCue();
  ui.view = nextView;
  uiStore.resetInteraction();
  renderApp();
  if (ui.view === 'play' && (!runEnabled || run.phase === 'battle')) maybeRunEnemy();
}

function startRun(mode: RunMode): void {
  cancelEnemySequence();
  clearBumpCue();
  clearInvalidCue();
  const key = mode === 'daily' ? dailyRunKey() : null;
  const seed = key ? dailyRunSeed(key) : Date.now() >>> 0;
  run = createRun(seed, mode, key);
  duelRules = buildRunDuelRules(run);
  duel = createRunDuel(run);
  uiStore.clearResolution();
  uiStore.resetInteraction();
  ui.logOpen = false;
  persistCurrentRun();
  renderApp();
}

function continueRun(): void {
  if (!runEnabled || run.phase !== 'battle' || !duel.winner) return;
  cancelEnemySequence();
  run = resolveRunBattle(run, duel);
  if (run.phase === 'battle') {
    duelRules = buildRunDuelRules(run);
    duel = createRunDuel(run);
  }
  uiStore.clearResolution();
  uiStore.resetInteraction();
  ui.logOpen = false;
  persistCurrentRun();
  renderApp();
}

function chooseUpgrade(upgradeId: UpgradeId): void {
  if (!runEnabled || run.phase !== 'reward') return;
  try {
    run = chooseRunUpgrade(run, upgradeId);
  } catch {
    return;
  }
  duelRules = buildRunDuelRules(run);
  duel = createRunDuel(run);
  uiStore.clearResolution();
  uiStore.resetInteraction();
  ui.logOpen = false;
  persistCurrentRun();
  renderApp();
}

function handleUiAction(action: string): void {
  if (action === 'continue-run') {
    continueRun();
    return;
  }

  if (action.startsWith('choose-upgrade:')) {
    chooseUpgrade(action.slice('choose-upgrade:'.length) as UpgradeId);
    return;
  }

  if (action === 'new-standard-run') {
    startRun('standard');
    return;
  }

  if (action === 'new-daily-run') {
    startRun('daily');
    return;
  }

  if (action === 'restart') {
    if (runEnabled) return;
    cancelEnemySequence();
    clearBumpCue();
    duel = createDuel(Date.now() % 100000, duelRules);
    uiStore.clearResolution();
    uiStore.resetInteraction();
    ui.logOpen = false;
    clearInvalidCue();
    renderApp();
    return;
  }

  if (action === 'toggle-log') {
    ui.logOpen = !ui.logOpen;
    renderApp();
    return;
  }

  if (action === 'copy-battle-log') {
    void copyToClipboard(currentBattleView().readableBattleLog(), 'Battle log');
  } else if (action === 'copy-battle-report') {
    void copyToClipboard(currentBattleView().compactBattleReport(), 'Battle report');
  } else if (action === 'copy-battle-trace') {
    void copyToClipboard(currentBattleView().debugBattleTrace(), 'Battle trace');
  }
}

function handleAbilitySelect(abilityId: AbilityId): void {
  if (!canUseBoard() || !duel.player.abilityIds.includes(abilityId)) return;
  clearEnemyCue();
  clearBumpCue();
  ui.activeAbilityId = ui.activeAbilityId === abilityId ? null : abilityId;
  ui.confirmedAbilityTarget = null;
  ui.selectedCell = null;
  ui.hoverCell = null;
  clearInvalidCue();
  renderApp();
}

bindBattleInput({
  app,
  getBoard: () => duel.board,
  canUseBoard,
  getHoverCell: () => ui.hoverCell,
  hasActiveAbility: () => !!ui.activeAbilityId,
  isValidSwap: (from, to) => previewSwap(duel.board, from, to, duelRules).valid,
  onView: handleViewChange,
  onAction: handleUiAction,
  onAbility: handleAbilitySelect,
  onCellTap: handleBoardTap,
  onSwapCommit: commitSwap,
  onDragPreview: (from, to) => {
    ui.selectedCell = from;
    ui.hoverCell = to;
    ui.bumpCell = null;
    clearInvalidCue();
    renderApp();
  },
  onHover: (cell) => {
    ui.hoverCell = cell;
    clearInvalidCue();
    renderApp();
  },
});

persistCurrentRun();
renderApp();
maybeRunEnemy();
