import type { AbilityDefinition, DuelRules, DuelState, ManaCost } from '../engine/types';

/**
 * First-session coach: short contextual hints that teach the duel's core
 * literacy (swap, spells, enemy charge, Aether) the first time each matters.
 * Tips are pure functions of the visible duel state plus a per-viewer "seen"
 * set, so they never change rules or the replay contract.
 */
export type CoachTipId = 'first-move' | 'spell-ready' | 'enemy-charge' | 'aether';

export type CoachTip = {
  id: CoachTipId;
  label: string;
  title: string;
  body: string;
  /** Spell button to spotlight while the tip is visible. */
  spellId?: string;
};

export type CoachPreferences = {
  enabled: boolean;
  seen: CoachTipId[];
};

export const COACH_STORAGE_KEY = 'kingdom-duel.coach.v1';
export const COACH_TIP_IDS: readonly CoachTipId[] = ['first-move', 'spell-ready', 'enemy-charge', 'aether'];

export function defaultCoachPreferences(): CoachPreferences {
  return { enabled: true, seen: [] };
}

export function parseCoachPreferences(raw: string | null): CoachPreferences {
  if (!raw) return defaultCoachPreferences();
  try {
    const value = JSON.parse(raw) as Partial<CoachPreferences>;
    return {
      enabled: value.enabled !== false,
      seen: Array.isArray(value.seen) ? value.seen.filter((id): id is CoachTipId => COACH_TIP_IDS.includes(id as CoachTipId)) : [],
    };
  } catch {
    return defaultCoachPreferences();
  }
}

export function markCoachTipSeen(preferences: CoachPreferences, id: CoachTipId): CoachPreferences {
  if (preferences.seen.includes(id)) return preferences;
  return { ...preferences, seen: [...preferences.seen, id] };
}

export function chooseCoachTip(duel: DuelState, rules: DuelRules, preferences: CoachPreferences): CoachTip | null {
  if (!preferences.enabled || duel.winner || duel.current !== 'player') return null;
  const seen = new Set(preferences.seen);

  if (!seen.has('first-move') && !duel.actionLog.some((entry) => entry.accepted && entry.action.actor === 'player')) {
    return {
      id: 'first-move',
      label: 'How to duel',
      title: 'Swap two neighbouring gems to match 3+',
      body: 'Swords hit, Shields add Guard, Sun/Moon/Crown charge spells. Pink Shade hits hardest but bites back. Match 4 to keep your turn.',
    };
  }

  const ready = duel.player.abilityIds
    .map((id) => rules.abilities[id])
    .filter((ability): ability is AbilityDefinition => !!ability && canPay(duel.player, ability.cost))
    .sort((a, b) => a.presentation.order - b.presentation.order)[0];
  if (!seen.has('spell-ready') && ready) {
    return {
      id: 'spell-ready',
      label: 'Spell charged',
      title: `${ready.name} is ready`,
      body: 'Tap the glowing spell, aim on the board, then tap the same tile again to cast. Spells are Aurora\'s answer to big enemy turns.',
      spellId: ready.id,
    };
  }

  const threat = enemyChargeThreat(duel, rules);
  if (!seen.has('enemy-charge') && threat) {
    return {
      id: 'enemy-charge',
      label: 'Enemy charging',
      title: threat.missing === 0
        ? `${duel.enemy.name} can cast ${threat.name}`
        : `${duel.enemy.name} is ${threat.missing} ${threat.mana} from ${threat.name}`,
      body: `Watch the pink intent rail. Matching ${threat.mana} gems yourself takes that mana off the shared board, and Guard softens the hit.`,
    };
  }

  if (!seen.has('aether') && duel.board.tiles.includes('aether')) {
    return {
      id: 'aether',
      label: 'Aether forged',
      title: 'Swap the Aether gem to detonate it',
      body: 'Swap Aether with any neighbour for a fixed blast that also clears a 3×3 field. It belongs to whoever swaps it first.',
    };
  }

  return null;
}

function canPay(actor: DuelState['player'], cost: ManaCost): boolean {
  return actor.sun >= (cost.sun ?? 0) && actor.moon >= (cost.moon ?? 0) && actor.crown >= (cost.crown ?? 0);
}

function enemyChargeThreat(
  duel: DuelState,
  rules: DuelRules,
): { name: string; missing: number; mana: string } | null {
  for (const id of duel.enemy.abilityIds) {
    const ability = rules.abilities[id];
    if (!ability) continue;
    const gaps = (['sun', 'moon', 'crown'] as const)
      .map((mana) => ({ mana, missing: Math.max(0, (ability.cost[mana] ?? 0) - duel.enemy[mana]) }))
      .filter((gap) => (ability.cost[gap.mana] ?? 0) > 0);
    const missing = gaps.reduce((sum, gap) => sum + gap.missing, 0);
    const required = gaps.reduce((sum, gap) => sum + (ability.cost[gap.mana] ?? 0), 0);
    if (required === 0 || missing > 2) continue;
    const largest = [...gaps].sort((a, b) => b.missing - a.missing)[0];
    const manaName = largest.mana[0].toUpperCase() + largest.mana.slice(1);
    return {
      name: ability.name,
      missing,
      mana: manaName,
    };
  }
  return null;
}
