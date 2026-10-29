import type { AudioPreferences, SfxCue, SfxId } from './audio-cues';

/**
 * Synthesized WebAudio sound for Kingdom Duel: no external assets.
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily by `unlock()` from the first pointer/key event. Until then every cue
 * is silently dropped. The state is mirrored to `<html data-audio>` (and a cue
 * counter) so browser tests can check it without listening.
 */
type Ctx = AudioContext;

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];
const MUSIC_CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];
const CHORD_SECONDS = 4.8;

export class GameAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private musicChord = 0;
  private cueCount = 0;
  private lastCueAt = new Map<SfxId, number>();

  constructor(private prefs: AudioPreferences) {
    this.reflect();
  }

  get preferences(): AudioPreferences {
    return this.prefs;
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        const ctx = new AudioCtor();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.prefs.muted ? 0 : 1;
        this.master.connect(ctx.destination);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = 0.55;
        this.sfxBus.connect(this.master);
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = 0;
        this.musicBus.connect(this.master);
        ctx.onstatechange = () => this.reflect();
      }
      if (this.ctx.state === 'suspended' && document.visibilityState === 'visible') {
        void this.ctx.resume().then(() => {
          this.syncMusic();
          this.reflect();
        });
      }
      this.syncMusic();
    } catch {
      // Audio is optional; a failing context leaves the game silent.
    }
    this.reflect();
  }

  setPreferences(next: AudioPreferences): void {
    this.prefs = next;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(next.muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
    this.syncMusic();
    this.reflect();
  }

  /** Suspend while the page is hidden; resume when it comes back. */
  setPageVisible(visible: boolean): void {
    if (!this.ctx) return;
    try {
      if (visible) void this.ctx.resume().then(() => this.reflect());
      else void this.ctx.suspend().then(() => this.reflect());
    } catch {
      // ignore
    }
  }

  play(id: SfxId, step = 1, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.prefs.muted || ctx.state !== 'running') return;
    // Rapid duplicates (two matches in one frame) would only clip; keep one.
    const now = ctx.currentTime + delay;
    const last = this.lastCueAt.get(id) ?? -1;
    if (now - last < 0.035) return;
    this.lastCueAt.set(id, now);
    try {
      this.render(ctx, this.sfxBus, id, Math.max(1, step), now);
      this.cueCount += 1;
      document.documentElement.dataset.sfxCount = String(this.cueCount);
      document.documentElement.dataset.sfxLast = id;
    } catch {
      // ignore synthesis failures
    }
  }

  playCues(cues: readonly SfxCue[], spacing = 0.07): void {
    cues.forEach((cue, index) => this.play(cue.id, cue.step, index * spacing));
  }

  private reflect(): void {
    try {
      const state = this.prefs.muted ? 'muted' : !this.ctx ? 'locked' : this.ctx.state;
      document.documentElement.dataset.audio = state;
      document.documentElement.dataset.music = this.prefs.music && !this.prefs.muted ? 'on' : 'off';
    } catch {
      // no document (tests)
    }
  }

  // ---------------------------------------------------------------- music

  private syncMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    const wanted = this.prefs.music && !this.prefs.muted && ctx.state === 'running';
    this.musicBus.gain.setTargetAtTime(wanted ? 0.32 : 0, ctx.currentTime, 0.6);
    if (wanted && this.musicTimer === null) {
      this.scheduleChord();
      this.musicTimer = window.setInterval(() => this.scheduleChord(), CHORD_SECONDS * 1000);
    } else if (!wanted && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleChord(): void {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const chord = MUSIC_CHORDS[this.musicChord % MUSIC_CHORDS.length];
    this.musicChord += 1;
    const start = ctx.currentTime + 0.05;
    const end = start + CHORD_SECONDS + 1.6;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, start);
    filter.frequency.linearRampToValueAtTime(1500, start + CHORD_SECONDS / 2);
    filter.frequency.linearRampToValueAtTime(800, end);
    filter.Q.value = 0.6;
    filter.connect(bus);
    chord.forEach((freq, index) => {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = index === 0 ? 'triangle' : 'sine';
        osc.frequency.value = index === 0 ? freq / 2 : freq;
        osc.detune.value = detune;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.045, start + 1.4);
        gain.gain.setValueAtTime(0.045, end - 1.8);
        gain.gain.linearRampToValueAtTime(0.0001, end);
        osc.connect(gain).connect(filter);
        osc.start(start);
        osc.stop(end + 0.05);
      }
    });
    // A soft glassy bell on the downbeat.
    this.bell(ctx, bus, chord[3] * 2, start + 0.2, 1.6, 0.025);
  }

  // ---------------------------------------------------------------- synthesis

  private render(ctx: Ctx, out: AudioNode, id: SfxId, step: number, t: number): void {
    const note = (index: number): number => PENTATONIC[Math.min(PENTATONIC.length - 1, Math.max(0, index))];
    switch (id) {
      case 'ui':
        this.tone(ctx, out, { type: 'triangle', freq: 660, to: 880, start: t, dur: 0.05, gain: 0.12 });
        break;
      case 'select':
        this.tone(ctx, out, { type: 'sine', freq: 990, start: t, dur: 0.05, gain: 0.1 });
        break;
      case 'invalid':
        this.tone(ctx, out, { type: 'square', freq: 196, to: 150, start: t, dur: 0.08, gain: 0.06, lowpass: 900 });
        this.tone(ctx, out, { type: 'square', freq: 175, to: 130, start: t + 0.09, dur: 0.1, gain: 0.06, lowpass: 900 });
        break;
      case 'swap':
        this.tone(ctx, out, { type: 'sine', freq: 420, to: 760, start: t, dur: 0.11, gain: 0.16 });
        this.noise(ctx, out, { start: t, dur: 0.07, gain: 0.05, type: 'bandpass', freq: 2400 });
        break;
      case 'match': {
        const freq = note(step - 1);
        this.tone(ctx, out, { type: 'triangle', freq, start: t, dur: 0.18, gain: 0.2 });
        this.bell(ctx, out, freq * 2, t + 0.01, 0.3, 0.06);
        break;
      }
      case 'cascade':
        [0, 2, 4].forEach((offset, index) => {
          this.bell(ctx, out, note(step + offset), t + index * 0.055, 0.35, 0.08);
        });
        break;
      case 'hit':
        this.tone(ctx, out, { type: 'sine', freq: 180, to: 55, start: t, dur: 0.18, gain: 0.32 });
        this.noise(ctx, out, { start: t, dur: 0.12, gain: 0.18, type: 'lowpass', freq: 1800 });
        break;
      case 'hurt':
        this.tone(ctx, out, { type: 'sawtooth', freq: 130, to: 48, start: t, dur: 0.24, gain: 0.16, lowpass: 700 });
        this.noise(ctx, out, { start: t, dur: 0.16, gain: 0.2, type: 'lowpass', freq: 900 });
        break;
      case 'block':
        this.tone(ctx, out, { type: 'square', freq: 720, to: 640, start: t, dur: 0.06, gain: 0.06, lowpass: 3000 });
        this.noise(ctx, out, { start: t, dur: 0.08, gain: 0.08, type: 'highpass', freq: 2500 });
        break;
      case 'guard':
        this.bell(ctx, out, 1318.5, t, 0.32, 0.08);
        this.bell(ctx, out, 1975.5, t + 0.04, 0.28, 0.05);
        break;
      case 'guard-break':
        this.noise(ctx, out, { start: t + 0.02, dur: 0.32, gain: 0.16, type: 'highpass', freq: 3200 });
        this.tone(ctx, out, { type: 'triangle', freq: 1400, to: 300, start: t, dur: 0.3, gain: 0.08 });
        break;
      case 'mana':
        [0, 1, 2].forEach((offset, index) => {
          this.tone(ctx, out, { type: 'sine', freq: note(3 + offset + Math.min(step, 3)) * 2, start: t + index * 0.035, dur: 0.08, gain: 0.05 });
        });
        break;
      case 'backlash':
        this.tone(ctx, out, { type: 'sawtooth', freq: 233, start: t, dur: 0.18, gain: 0.07, lowpass: 1200 });
        this.tone(ctx, out, { type: 'sawtooth', freq: 247, start: t, dur: 0.18, gain: 0.07, lowpass: 1200 });
        break;
      case 'spell':
        this.noise(ctx, out, { start: t, dur: 0.42, gain: 0.12, type: 'bandpass', freq: 500, to: 4200 });
        [523.25, 659.25, 783.99].forEach((freq, index) => this.bell(ctx, out, freq * 2, t + 0.05 + index * 0.06, 0.5, 0.05));
        break;
      case 'convert':
        this.tone(ctx, out, { type: 'triangle', freq: 880, to: 1760, start: t, dur: 0.16, gain: 0.07 });
        break;
      case 'forge':
        this.tone(ctx, out, { type: 'sawtooth', freq: 220, to: 880, start: t, dur: 0.26, gain: 0.07, lowpass: 2400 });
        this.bell(ctx, out, 1760, t + 0.24, 0.6, 0.09);
        break;
      case 'aether':
        this.tone(ctx, out, { type: 'sine', freq: 110, to: 36, start: t, dur: 0.5, gain: 0.4 });
        this.noise(ctx, out, { start: t, dur: 0.45, gain: 0.22, type: 'lowpass', freq: 1400, to: 200 });
        break;
      case 'extra-turn':
        this.bell(ctx, out, 783.99, t, 0.25, 0.08);
        this.bell(ctx, out, 1174.66, t + 0.09, 0.4, 0.08);
        break;
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
          this.tone(ctx, out, { type: 'triangle', freq, start: t + index * 0.11, dur: index === 3 ? 0.9 : 0.16, gain: 0.16 });
          this.bell(ctx, out, freq * 2, t + index * 0.11, index === 3 ? 1.2 : 0.3, 0.04);
        });
        this.tone(ctx, out, { type: 'sine', freq: 261.63, start: t + 0.33, dur: 0.9, gain: 0.12 });
        break;
      case 'defeat':
        [392.0, 311.13, 261.63, 196.0].forEach((freq, index) => {
          this.tone(ctx, out, { type: 'sawtooth', freq, start: t + index * 0.18, dur: index === 3 ? 0.9 : 0.22, gain: 0.08, lowpass: 900 });
        });
        break;
      default:
        break;
    }
  }

  private tone(
    ctx: Ctx,
    out: AudioNode,
    options: { type: OscillatorType; freq: number; to?: number; start: number; dur: number; gain: number; lowpass?: number },
  ): void {
    const osc = ctx.createOscillator();
    osc.type = options.type;
    osc.frequency.setValueAtTime(options.freq, options.start);
    if (options.to) osc.frequency.exponentialRampToValueAtTime(options.to, options.start + options.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, options.start);
    gain.gain.exponentialRampToValueAtTime(options.gain, options.start + Math.min(0.012, options.dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.dur);
    let node: AudioNode = osc.connect(gain);
    if (options.lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = options.lowpass;
      node = node.connect(filter);
    }
    node.connect(out);
    osc.start(options.start);
    osc.stop(options.start + options.dur + 0.02);
  }

  private bell(ctx: Ctx, out: AudioNode, freq: number, start: number, dur: number, gain: number): void {
    // Two inharmonic partials give a glassy "clink".
    this.tone(ctx, out, { type: 'sine', freq, start, dur, gain });
    this.tone(ctx, out, { type: 'sine', freq: freq * 2.76, start, dur: dur * 0.5, gain: gain * 0.35 });
  }

  private noise(
    ctx: Ctx,
    out: AudioNode,
    options: { start: number; dur: number; gain: number; type: BiquadFilterType; freq: number; to?: number },
  ): void {
    if (!this.noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 0.6);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Fixed LCG so the noise texture is identical every session.
      let seed = 2007;
      for (let i = 0; i < length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        data[i] = seed / 2147483648 - 1;
      }
      this.noiseBuffer = buffer;
    }
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = options.type;
    filter.frequency.setValueAtTime(options.freq, options.start);
    if (options.to) filter.frequency.exponentialRampToValueAtTime(options.to, options.start + options.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(options.gain, options.start);
    gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.dur);
    source.connect(filter).connect(gain).connect(out);
    source.start(options.start);
    source.stop(options.start + options.dur + 0.02);
  }
}
