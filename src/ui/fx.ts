import type { ActorState } from '../engine/types';

/**
 * Presentation-only combat feedback ("juice"): floating numbers derived by
 * diffing consecutive actor snapshots during resolution playback.
 */
export type FloatFxTone = 'damage' | 'heal' | 'guard' | 'guard-break' | 'mana';

export type FloatFx = {
  id: number;
  side: 'hero' | 'enemy';
  text: string;
  tone: FloatFxTone;
  /** ms timestamp the effect started; lets re-renders continue the same animation. */
  startedAt: number;
};

export type ActorPair = { player: ActorState; enemy: ActorState };

export const FLOAT_FX_DURATION_MS = 1100;
export const HIT_SHAKE_MS = 420;

export function diffCombatFx(before: ActorPair, after: ActorPair): Omit<FloatFx, 'id' | 'startedAt'>[] {
  const out: Omit<FloatFx, 'id' | 'startedAt'>[] = [];
  for (const actor of ['player', 'enemy'] as const) {
    const side = actor === 'player' ? 'hero' : 'enemy';
    const prev = before[actor];
    const next = after[actor];
    const hp = next.hp - prev.hp;
    const guard = next.guard - prev.guard;
    const mana = next.sun + next.moon + next.crown - (prev.sun + prev.moon + prev.crown);
    if (hp < 0) out.push({ side, text: `-${-hp}`, tone: 'damage' });
    if (hp > 0) out.push({ side, text: `+${hp} HP`, tone: 'heal' });
    if (guard > 0) out.push({ side, text: `+${guard} Guard`, tone: 'guard' });
    if (guard < 0 && next.guard === 0) out.push({ side, text: 'Guard broken', tone: 'guard-break' });
    // Mana gains are only surfaced for Aurora; enemy charge lives in the intent rail.
    if (mana > 0 && actor === 'player') out.push({ side, text: `+${mana} mana`, tone: 'mana' });
  }
  return out;
}

export function activeFloatFx(fx: readonly FloatFx[], now: number): FloatFx[] {
  return fx.filter((entry) => now - entry.startedAt < FLOAT_FX_DURATION_MS);
}

export function renderFloatFx(fx: readonly FloatFx[], side: 'hero' | 'enemy', now: number): string {
  const mine = activeFloatFx(fx, now).filter((entry) => entry.side === side);
  if (!mine.length) return '';
  return `<span class="float-fx-stack" aria-hidden="true">${mine
    .map((entry, index) => {
      const elapsed = Math.max(0, now - entry.startedAt);
      return `<i class="float-fx tone-${entry.tone}" style="animation-delay:-${elapsed}ms; --fx-row:${index}">${entry.text}</i>`;
    })
    .join('')}</span>`;
}

/** Elapsed ms since the latest fresh damage on this side, or null when no hit is in progress. */
export function hitDelay(fx: readonly FloatFx[], side: 'hero' | 'enemy', now: number, windowMs = HIT_SHAKE_MS): number | null {
  const latest = fx
    .filter((entry) => entry.side === side && entry.tone === 'damage' && now - entry.startedAt < windowMs)
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  return latest ? Math.max(0, now - latest.startedAt) : null;
}
