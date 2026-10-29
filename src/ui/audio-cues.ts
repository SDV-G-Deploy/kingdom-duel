import type { ResolutionFrame } from '../engine/types';

/**
 * Pure mapping from resolution frames to sound cues. The WebAudio synth in
 * audio.ts only renders cues, so the choice of sounds stays deterministic and
 * testable in Node.
 */
export type SfxId =
  | 'ui'
  | 'select'
  | 'invalid'
  | 'swap'
  | 'match'
  | 'cascade'
  | 'hit'
  | 'hurt'
  | 'block'
  | 'guard'
  | 'guard-break'
  | 'mana'
  | 'backlash'
  | 'spell'
  | 'convert'
  | 'forge'
  | 'aether'
  | 'extra-turn'
  | 'victory'
  | 'defeat';

export type SfxCue = {
  id: SfxId;
  /** Cascade depth (1-based) for pitch-stepped cues; 1 otherwise. */
  step: number;
};

export const AUDIO_STORAGE_KEY = 'kingdom-duel.audio.v1';

export type AudioPreferences = {
  /** Master mute for every sound. */
  muted: boolean;
  /** Optional ambient loop; off by default. */
  music: boolean;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { muted: false, music: false };

export function parseAudioPreferences(raw: string | null): AudioPreferences {
  if (!raw) return { ...DEFAULT_AUDIO_PREFERENCES };
  try {
    const value = JSON.parse(raw) as Partial<AudioPreferences> | null;
    return {
      muted: typeof value?.muted === 'boolean' ? value.muted : DEFAULT_AUDIO_PREFERENCES.muted,
      music: typeof value?.music === 'boolean' ? value.music : DEFAULT_AUDIO_PREFERENCES.music,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }
}

/** Cues for one frame. `cascade` is the current cascade depth carried across frames. */
export function cuesForFrame(frame: ResolutionFrame, cascade: number): { cues: SfxCue[]; cascade: number } {
  const cues: SfxCue[] = [];
  let depth = cascade;
  const cue = (id: SfxId, step = 1): void => {
    cues.push({ id, step });
  };

  for (const event of frame.events) {
    switch (event.type) {
      case 'swap':
        depth = 1;
        cue('swap');
        break;
      case 'cascade':
        depth = event.count;
        if (event.count > 1) cue('cascade', event.count);
        break;
      case 'match':
        cue('match', depth);
        break;
      case 'damage': {
        const targetSnapshot = frame.snapshot[event.target];
        if (event.hpDamage > 0) cue(event.target === 'player' ? 'hurt' : 'hit');
        else if (event.blocked > 0) cue('block');
        if (event.blocked > 0 && targetSnapshot.guard === 0) cue('guard-break');
        break;
      }
      case 'guard':
        cue('guard');
        break;
      case 'mana':
        if (event.actor === 'player') cue('mana', depth);
        break;
      case 'backlash':
        cue('backlash');
        break;
      case 'spell_cast':
        depth = 1;
        cue('spell');
        break;
      case 'tiles_converted':
      case 'row_cleared':
        cue('convert');
        break;
      case 'special_created':
        cue('forge');
        break;
      case 'special_activated':
        cue('aether');
        break;
      case 'extra_turn':
        cue('extra-turn');
        break;
      case 'battle_ended':
        cue(event.winner === 'player' ? 'victory' : 'defeat');
        break;
      default:
        break;
    }
  }

  return { cues, cascade: depth };
}

/**
 * One deduplicated cue list for a whole resolution, used when reduced motion
 * skips straight to the final frame. Terminal cues win over everything else.
 */
export function summaryCues(frames: readonly ResolutionFrame[]): SfxCue[] {
  let cascade = 1;
  const byId = new Map<SfxId, SfxCue>();
  for (const frame of frames) {
    const result = cuesForFrame(frame, cascade);
    cascade = result.cascade;
    for (const cue of result.cues) {
      const existing = byId.get(cue.id);
      if (!existing || cue.step > existing.step) byId.set(cue.id, cue);
    }
  }
  const terminal = byId.get('victory') ?? byId.get('defeat');
  if (terminal) return [terminal];
  const priority: SfxId[] = ['swap', 'spell', 'aether', 'match', 'cascade', 'forge', 'hit', 'hurt', 'guard-break', 'block', 'guard', 'mana', 'backlash', 'convert', 'extra-turn'];
  return priority.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])).slice(0, 4);
}
