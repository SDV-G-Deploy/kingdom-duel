import type {
  AbilityId,
  Cell,
  DuelState,
  ResolutionFrame,
  ResolutionSnapshot,
} from '../engine/types';
import { nextBoardMotion, type BoardMotion } from './board-motion';
import type { FloatFx } from './fx';

export type AppView = 'title' | 'play' | 'moodboard';

export type EnemyCue = {
  cells: Cell[];
  summary: string;
};

export type BattleUiState = {
  view: AppView;
  selectedCell: Cell | null;
  hoverCell: Cell | null;
  activeAbilityId: AbilityId | null;
  confirmedAbilityTarget: Cell | null;
  enemyThinking: boolean;
  logOpen: boolean;
  bumpCell: Cell | null;
  invalidCue: string | null;
  enemyCue: EnemyCue | null;
  resolutionFrames: ResolutionFrame[];
  activeResolutionFrame: ResolutionFrame | null;
  presentedSnapshot: ResolutionSnapshot | null;
  isResolving: boolean;
  floatFx: FloatFx[];
  terminalFxAt: number | null;
  /** Gem slide/pop/drop motion for the frame on screen; null when the board is at rest. */
  boardMotion: BoardMotion | null;
};

type UiListener = (state: Readonly<BattleUiState>) => void;

export class BattleUiStore {
  readonly state: BattleUiState;
  private readonly listeners = new Set<UiListener>();

  constructor(view: AppView = 'play') {
    this.state = createInitialBattleUiState(view);
  }

  update(patch: Partial<BattleUiState>): void {
    Object.assign(this.state, patch);
    this.emit();
  }

  resetInteraction(): void {
    this.update({
      selectedCell: null,
      hoverCell: null,
      activeAbilityId: null,
      confirmedAbilityTarget: null,
      bumpCell: null,
      invalidCue: null,
    });
  }

  beginResolution(frames: ResolutionFrame[]): void {
    this.update({
      boardMotion: null,
      resolutionFrames: frames,
      activeResolutionFrame: null,
      presentedSnapshot: null,
      isResolving: frames.length > 0,
    });
  }

  presentFrame(frame: ResolutionFrame, now: number = Date.now()): void {
    this.update({
      boardMotion: nextBoardMotion(this.state.boardMotion, frame, now),
      activeResolutionFrame: frame,
      presentedSnapshot: frame.snapshot,
      isResolving: true,
    });
  }

  finishResolution(): void {
    this.update({
      boardMotion: null,
      activeResolutionFrame: null,
      presentedSnapshot: null,
      isResolving: false,
    });
  }

  clearResolution(): void {
    this.update({
      boardMotion: null,
      floatFx: [],
      terminalFxAt: null,
      resolutionFrames: [],
      activeResolutionFrame: null,
      presentedSnapshot: null,
      isResolving: false,
    });
  }

  subscribe(listener: UiListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}

export function createInitialBattleUiState(view: AppView = 'play'): BattleUiState {
  return {
    view,
    selectedCell: null,
    hoverCell: null,
    activeAbilityId: null,
    confirmedAbilityTarget: null,
    enemyThinking: false,
    logOpen: false,
    bumpCell: null,
    invalidCue: null,
    enemyCue: null,
    resolutionFrames: [],
    activeResolutionFrame: null,
    presentedSnapshot: null,
    isResolving: false,
    floatFx: [],
    terminalFxAt: null,
    boardMotion: null,
  };
}

export function canUseBoard(duel: DuelState, ui: Readonly<BattleUiState>): boolean {
  return (
    ui.view === 'play' &&
    duel.current === 'player' &&
    !duel.winner &&
    !ui.enemyThinking &&
    !ui.isResolving
  );
}

export function duelForPresentation(duel: DuelState, snapshot: ResolutionSnapshot | null): DuelState {
  if (!snapshot) return duel;
  return {
    ...duel,
    board: snapshot.board,
    player: snapshot.player,
    enemy: snapshot.enemy,
    current: snapshot.current,
    turn: snapshot.turn,
    seed: snapshot.seed,
    winner: snapshot.winner,
  };
}
