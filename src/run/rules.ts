import { ENEMY_DEFINITIONS } from '../content';
import { DEFAULT_DUEL_RULES } from '../engine/rules';
import type { AbilityDefinition, DuelRules, EnemyDefinition, PassiveDefinition, TileRule } from '../engine/types';
import { RUN_ENCOUNTERS } from './content';
import type { RunState, UpgradeId } from './types';

export function buildRunDuelRules(
  run: RunState,
  base: DuelRules = DEFAULT_DUEL_RULES,
): DuelRules {
  const encounter = RUN_ENCOUNTERS[run.encounterIndex];
  if (!encounter) throw new RangeError(`Unknown run encounter index ${run.encounterIndex}`);
  const enemy = ENEMY_DEFINITIONS[encounter.enemyId];
  if (!enemy) throw new Error(`Unknown encounter enemy ${encounter.enemyId}`);

  const rules = cloneRules(base);
  rules.actors.enemy = cloneEnemy(enemy, encounter.enemyHpBonus, encounter.enemyGuardBonus);
  rules.openingLog = [
    `${encounter.name}: ${rules.actors.player.name} faces ${rules.actors.enemy.name}.`,
    encounter.subtitle,
  ];
  for (const upgradeId of run.selectedUpgradeIds) applyUpgrade(rules, upgradeId);
  return rules;
}

function applyUpgrade(rules: DuelRules, upgradeId: UpgradeId): void {
  if (upgradeId === 'solar_halo') {
    rules.abilities.sun_bloom.effects = rules.abilities.sun_bloom.effects.map((effect) =>
      effect.type === 'convert_tiles' ? { ...effect, shape: 'square' as const } : effect,
    );
  } else if (upgradeId === 'aether_relay') {
    const effect = rules.tiles.aether.effect;
    if (effect.type === 'special') rules.tiles.aether.effect = withPlayerAetherModifier(effect, { extraTurn: true });
  } else if (upgradeId === 'royal_bastion') {
    rules.abilities.crown_strike.effects = [
      { type: 'gain_guard', amount: 5 },
      ...rules.abilities.crown_strike.effects,
    ];
  } else if (upgradeId === 'ward_battery') {
    rules.abilities.glass_ward.effects = [
      ...rules.abilities.glass_ward.effects,
      { type: 'convert_tiles', radius: 1, from: 'moon', to: 'shield' },
    ];
  } else if (upgradeId === 'veilbreaker_lens') {
    const effect = rules.tiles.shade.effect;
    if (effect.type === 'risky_damage') {
      rules.tiles.shade.effect = { ...effect, playerBacklashPerTile: 0 };
    }
  } else if (upgradeId === 'aether_core') {
    const effect = rules.tiles.aether.effect;
    if (effect.type === 'special') rules.tiles.aether.effect = withPlayerAetherModifier(effect, { damage: 8, radius: 2 });
  }
}

function withPlayerAetherModifier(
  effect: Extract<TileRule['effect'], { type: 'special' }>,
  modifier: { damage?: number; radius?: number; extraTurn?: boolean },
): Extract<TileRule['effect'], { type: 'special' }> {
  return {
    ...effect,
    actorModifiers: {
      ...effect.actorModifiers,
      player: { ...effect.actorModifiers?.player, ...modifier },
    },
  };
}

function cloneRules(source: DuelRules): DuelRules {
  return {
    board: { ...source.board },
    actors: {
      player: { ...source.actors.player, abilityIds: [...source.actors.player.abilityIds] },
      enemy: cloneEnemy(source.actors.enemy, 0, 0),
    },
    tiles: Object.fromEntries(
      Object.entries(source.tiles).map(([id, rule]) => [id, cloneTileRule(rule)]),
    ) as DuelRules['tiles'],
    match: { ...source.match },
    abilities: Object.fromEntries(
      Object.entries(source.abilities).map(([id, ability]) => [id, cloneAbility(ability)]),
    ),
    passives: Object.fromEntries(
      Object.entries(source.passives).map(([id, passive]) => [id, clonePassive(passive)]),
    ),
    openingLog: [...source.openingLog],
  };
}

function cloneEnemy(source: EnemyDefinition, hpBonus: number, guardBonus: number): EnemyDefinition {
  return {
    ...source,
    hp: Math.max(1, source.hp + hpBonus),
    guard: Math.max(0, source.guard + guardBonus),
    abilityIds: [...source.abilityIds],
    ai: {
      ...source.ai,
      tileScores: source.ai.tileScores ? { ...source.ai.tileScores } : undefined,
    },
  };
}

function cloneTileRule(source: TileRule): TileRule {
  if (source.effect.type !== 'special') return { ...source, effect: { ...source.effect } };
  return {
    ...source,
    effect: {
      ...source.effect,
      actorModifiers: source.effect.actorModifiers
        ? Object.fromEntries(Object.entries(source.effect.actorModifiers).map(([actor, modifier]) => [actor, { ...modifier }]))
        : undefined,
    },
  };
}

function cloneAbility(source: AbilityDefinition): AbilityDefinition {
  return {
    ...source,
    cost: { ...source.cost },
    effects: source.effects.map((effect) => ({ ...effect })),
    presentation: { ...source.presentation },
  };
}

function clonePassive(source: PassiveDefinition): PassiveDefinition {
  return { ...source, effects: source.effects.map((effect) => ({ ...effect })) };
}
