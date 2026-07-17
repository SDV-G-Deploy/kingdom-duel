import type { ResolutionFrame, ResolutionFrameKind } from '../engine/types';

export type PlaybackTimerPlatform<Handle> = {
  setTimeout(callback: () => void, delay: number): Handle;
  clearTimeout(handle: Handle): void;
};

export type PlaybackCallbacks = {
  onFrame(frame: ResolutionFrame): void;
  onComplete(): void;
};

export type PlaybackOptions = {
  reducedMotion?: boolean;
  durationFor?: (frame: ResolutionFrame) => number;
};

const FRAME_DURATIONS: Record<ResolutionFrameKind, number> = {
  swap: 110,
  ability: 140,
  ability_effect: 130,
  cascade: 90,
  match: 140,
  damage: 160,
  guard: 150,
  mana: 130,
  backlash: 180,
  fall: 160,
  refill: 180,
  special: 190,
  turn: 120,
  battle_end: 220,
};

export function defaultFrameDuration(frame: ResolutionFrame): number {
  return FRAME_DURATIONS[frame.kind];
}

export class ResolutionPlaybackController<Handle> {
  private handle: Handle | null = null;
  private generation = 0;
  private playing = false;

  constructor(private readonly timers: PlaybackTimerPlatform<Handle>) {}

  get isPlaying(): boolean {
    return this.playing;
  }

  play(frames: readonly ResolutionFrame[], callbacks: PlaybackCallbacks, options: PlaybackOptions = {}): void {
    this.cancel();
    const generation = this.generation;
    const durationFor = options.durationFor ?? defaultFrameDuration;

    if (!frames.length) {
      callbacks.onComplete();
      return;
    }

    if (options.reducedMotion) {
      callbacks.onFrame(frames[frames.length - 1]);
      callbacks.onComplete();
      return;
    }

    this.playing = true;
    let index = 0;
    callbacks.onFrame(frames[index]);

    const advance = (): void => {
      if (generation !== this.generation) return;
      index += 1;
      if (index >= frames.length) {
        this.handle = null;
        this.playing = false;
        callbacks.onComplete();
        return;
      }
      callbacks.onFrame(frames[index]);
      this.handle = this.timers.setTimeout(advance, durationFor(frames[index]));
    };

    this.handle = this.timers.setTimeout(advance, durationFor(frames[index]));
  }

  cancel(): void {
    this.generation += 1;
    this.playing = false;
    if (this.handle !== null) {
      this.timers.clearTimeout(this.handle);
      this.handle = null;
    }
  }
}
