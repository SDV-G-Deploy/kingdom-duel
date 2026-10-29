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
import { BUILD_IDENTITY } from './build-info';
import { registerServiceWorker } from './pwa/register';
import { sameCell } from './ui/assets';
import { GameAudio } from './ui/audio';
import { AUDIO_STORAGE_KEY, cuesForFrame, parseAudioPreferences, summaryCues, type AudioPreferences } from './ui/audio-cues';
import {
  COACH_STORAGE_KEY,
  chooseCoachTip,
  markCoachTipSeen,
  parseCoachPreferences,
  type CoachPreferences,
  type CoachTipId,
} from './ui/coach';
import { FLOAT_FX_DURATION_MS, diffCombatFx, activeFloatFx, type ActorPair } from './ui/fx';
import { createDebugSession } from './ui/debug-presets';
import { bindBattleInput } from './ui/input-controller';
import { ResolutionPlaybackController } from './ui/playback';
import { BattleUiStore, canUseBoard as canUseBoardSelector, duelForPresentation } from './ui/state';
import { createBattleView } from './ui/views/battle';
import { renderMoodboard } from './ui/views/moodboard';
import { TERMINAL_BANNER_MS } from './ui/views/battle';
import { renderRewardView, renderRunResult } from './ui/views/run';
import { renderTitleView } from './ui/views/title';
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

const uiStore = new BattleUiStore(search.get('view') === 'moodboard' ? 'moodboard' : runEnabled ? 'title' : 'play');
const ui = uiStore.state;
const restored = runEnabled && runStorage ? loadRun(runStorage) : null;
let run: RunState = restored?.run ?? createRun(Date.now() >>> 0);
let duelRules = runEnabled ? buildRunDuelRules(run) : DEFAULT_DUEL_RULES;
const debugSession = createDebugSession(debugPreset, duelRules);
let duel: DuelState = runEnabled ? restored?.duel ?? createRunDuel(run) : debugSession.duel;
uiStore.update(debugSession.ui);
// A first-time visitor gets a placeholder run at boot; it is offered as "Continue" only once it is chosen or played.
let bootRunIsPlaceholder = !restored;
let coachPreferences: CoachPreferences = loadCoachPreferences();
const gameAudio = new GameAudio(loadAudioPreferences());
let fxSequence = 0;
let fxRefreshTimer: number | null = null;
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
    sound: gameAudio.preferences,
    coachTip: runEnabled && canUseBoard() ? chooseCoachTip(duel, duelRules, coachPreferences) : null,
  });
}

function loadCoachPreferences(): CoachPreferences {
  try {
    return parseCoachPreferences(runStorage?.getItem(COACH_STORAGE_KEY) ?? null);
  } catch {
    return parseCoachPreferences(null);
  }
}

function loadAudioPreferences(): AudioPreferences {
  try {
    return parseAudioPreferences(runStorage?.getItem(AUDIO_STORAGE_KEY) ?? null);
  } catch {
    return parseAudioPreferences(null);
  }
}

function saveAudioPreferences(next: AudioPreferences): void {
  gameAudio.setPreferences(next);
  try {
    runStorage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The toggle still applies for this session.
  }
}

function saveCoachPreferences(next: CoachPreferences): void {
  coachPreferences = next;
  try {
    runStorage?.setItem(COACH_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Hints still work for this session when storage is unavailable.
  }
}

function markCoachSeen(id: CoachTipId): void {
  if (!coachPreferences.seen.includes(id)) saveCoachPreferences(markCoachTipSeen(coachPreferences, id));
}

function pushCombatFx(before: ActorPair, after: ActorPair): void {
  const now = Date.now();
  const fresh = diffCombatFx(before, after).map((entry) => ({ ...entry, id: ++fxSequence, startedAt: now }));
  if (!fresh.length) return;
  ui.floatFx = [...activeFloatFx(ui.floatFx, now), ...fresh];
  if (fresh.some((entry) => entry.side === 'hero' && entry.tone === 'damage')) vibrate(28);
  scheduleFxRefresh(FLOAT_FX_DURATION_MS);
}

function scheduleFxRefresh(delay: number): void {
  if (fxRefreshTimer !== null) window.clearTimeout(fxRefreshTimer);
  fxRefreshTimer = window.setTimeout(() => {
    fxRefreshTimer = null;
    ui.floatFx = activeFloatFx(ui.floatFx, Date.now());
    renderApp();
  }, delay + 20);
}

function vibrate(pattern: number | number[]): void {
  try {
    if (!prefersReducedMotion.matches) navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional.
  }
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
  let shown: ActorPair = { player: duel.player, enemy: duel.enemy };
  let cascade = 1;
  const reducedMotion = prefersReducedMotion.matches;
  duel = result.state;
  persistCurrentRun();
  uiStore.beginResolution(result.frames);
  if (reducedMotion) gameAudio.playCues(summaryCues(result.frames));
  resolutionPlayback.play(
    result.frames,
    {
      onFrame: (frame) => {
        if (!reducedMotion) {
          const sound = cuesForFrame(frame, cascade);
          cascade = sound.cascade;
          gameAudio.playCues(sound.cues, 0.04);
        }
        pushCombatFx(shown, frame.snapshot);
        shown = { player: frame.snapshot.player, enemy: frame.snapshot.enemy };
        uiStore.presentFrame(frame);
        renderApp();
      },
      onComplete: () => {
        pushCombatFx(shown, duel);
        uiStore.finishResolution();
        if (duel.winner) {
          ui.terminalFxAt = Date.now();
          vibrate(duel.winner === 'player' ? [30, 60, 30] : 80);
          scheduleFxRefresh(TERMINAL_BANNER_MS);
        }
        renderApp();
        onComplete();
      },
    },
    { reducedMotion },
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
  if (ui.view === 'title') {
    const title = renderTitleView({
      run: restoredOrCurrentRun(),
      dailyKey: dailyRunKey(),
      hintsEnabled: coachPreferences.enabled,
      sound: gameAudio.preferences,
      buildLabel: `v${BUILD_IDENTITY.appVersion} · ${BUILD_IDENTITY.buildCommit.slice(0, 7)}`,
    });
    app.innerHTML = title.html;
    if (title.announcement !== lastAnnouncement) {
      liveRegion.textContent = title.announcement;
      lastAnnouncement = title.announcement;
    }
    restoreFocus(focusIdentity);
    return;
  }
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

/** The run worth offering on the title screen: anything the player has started or finished. */
function restoredOrCurrentRun(): RunState | null {
  if (!runEnabled) return null;
  const started = run.phase !== 'battle' || run.battles.length > 0 || duel.actionLog.length > 0;
  return started || !bootRunIsPlaceholder ? run : null;
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
    gameAudio.play('invalid');
    bumpInvalidTarget(to, 'No match: the target tile snapped back.');
    return;
  }

  const result = applySwap(duel, from, to, duelRules);
  markCoachSeen('first-move');
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
      gameAudio.play('select');
      ui.hoverCell = cell;
      ui.confirmedAbilityTarget = cell;
      ui.selectedCell = null;
      ui.bumpCell = null;
      renderApp();
      return;
    }

    const result = castSpell(duel, ui.activeAbilityId, cell, duelRules);
    if (!result.events.some((event) => event.type === 'invalid_spell')) markCoachSeen('spell-ready');
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
    gameAudio.play('select');
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

function handleViewChange(nextView: 'title' | 'play' | 'moodboard'): void {
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
  bootRunIsPlaceholder = false;
  duelRules = buildRunDuelRules(run);
  duel = createRunDuel(run);
  uiStore.clearResolution();
  uiStore.resetInteraction();
  ui.logOpen = false;
  ui.view = 'play';
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
  if (action === 'toggle-sound') {
    const prefs = gameAudio.preferences;
    saveAudioPreferences({ ...prefs, muted: !prefs.muted });
    gameAudio.play('ui');
    renderApp();
    return;
  }

  if (action === 'toggle-music') {
    const prefs = gameAudio.preferences;
    // Turning music on from a muted state unmutes too, so the toggle is never a no-op.
    saveAudioPreferences(prefs.music && !prefs.muted ? { ...prefs, music: false } : { muted: false, music: true });
    renderApp();
    return;
  }

  if (!action.startsWith('copy-')) gameAudio.play('ui');

  if (action === 'continue-run-save') {
    handleViewChange('play');
    return;
  }

  if (action === 'toggle-hints') {
    saveCoachPreferences(coachPreferences.enabled ? { ...coachPreferences, enabled: false } : { enabled: true, seen: [] });
    renderApp();
    return;
  }

  if (action.startsWith('dismiss-coach:')) {
    markCoachSeen(action.slice('dismiss-coach:'.length) as CoachTipId);
    renderApp();
    return;
  }

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
  gameAudio.play('ui');
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

// Browsers only start audio from a user gesture; every gesture re-arms it (iOS can interrupt a context).
for (const type of ['pointerdown', 'keydown', 'touchend'] as const) {
  window.addEventListener(type, () => gameAudio.unlock(), { capture: true, passive: true });
}
document.addEventListener('visibilitychange', () => gameAudio.setPageVisible(document.visibilityState === 'visible'));

persistCurrentRun();
renderApp();
maybeRunEnemy();
registerServiceWorker();
