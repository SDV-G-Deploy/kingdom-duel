import { strict as assert } from 'node:assert';
import { ContentValidationError, validateDuelRules } from '../content/validation';
import { castAbility, castSpell, createDuel } from './duel';
import { DEFAULT_DUEL_RULES } from './rules';
import type { AbilityDefinition, DuelRules } from './types';

const TEST_GUARD: AbilityDefinition = {
  id: 'test_guard',
  name: 'Test Guard',
  cost: { sun: 1 },
  target: 'cell',
  effects: [{ type: 'gain_guard', amount: 9 }],
  presentation: {
    order: 99,
    gem: 'sun',
    shortLabel: 'T',
    roleLabel: 'Test role',
    actionLabel: 'Raise test guard',
    readyHint: 'test ready',
    targetHint: 'Choose a test target.',
    previewHint: 'Gain test guard.',
  },
};

function rulesWithTestGuard(): DuelRules {
  return {
    ...DEFAULT_DUEL_RULES,
    actors: {
      ...DEFAULT_DUEL_RULES.actors,
      player: {
        ...DEFAULT_DUEL_RULES.actors.player,
        abilityIds: [...DEFAULT_DUEL_RULES.actors.player.abilityIds, TEST_GUARD.id],
      },
    },
    abilities: {
      ...DEFAULT_DUEL_RULES.abilities,
      [TEST_GUARD.id]: TEST_GUARD,
    },
    openingLog: [],
  };
}

function testDefaultContentIsValid(): void {
  assert.deepEqual(validateDuelRules(DEFAULT_DUEL_RULES), []);
}

function testAbilityCanBeAddedWithoutChangingResolver(): void {
  const rules = rulesWithTestGuard();
  const base = createDuel(2007, rules);
  const state = { ...base, player: { ...base.player, sun: 1, guard: 0 } };

  const result = castSpell(state, TEST_GUARD.id, { x: 3, y: 3 }, rules);

  assert.equal(result.state.player.guard, 9);
  assert.ok(result.events.some((event) => event.type === 'guard'));
  assert.ok(!result.events.some((event) => event.type === 'row_cleared'));
  assert.match(result.state.history[0]?.summary ?? '', /Aurora Knight casts Test Guard/);
}

function testUnknownAbilityReferenceFailsBeforeBoardCreation(): void {
  const rules: DuelRules = {
    ...DEFAULT_DUEL_RULES,
    actors: {
      ...DEFAULT_DUEL_RULES.actors,
      player: {
        ...DEFAULT_DUEL_RULES.actors.player,
        abilityIds: [...DEFAULT_DUEL_RULES.actors.player.abilityIds, 'missing_ability'],
      },
    },
  };

  assert.throws(() => createDuel(2007, rules), ContentValidationError);
}

function testEnemyUsesTheSameGenericEffectExecutor(): void {
  const baseRules = rulesWithTestGuard();
  const rules: DuelRules = {
    ...baseRules,
    actors: {
      ...baseRules.actors,
      enemy: {
        ...baseRules.actors.enemy,
        abilityIds: [TEST_GUARD.id],
      },
    },
  };
  const base = createDuel(44, rules);
  const state = {
    ...base,
    current: 'enemy' as const,
    enemy: { ...base.enemy, sun: 1, guard: 0 },
  };

  const result = castAbility(state, 'enemy', TEST_GUARD.id, { x: 2, y: 2 }, rules);

  assert.equal(result.state.enemy.guard, 9);
  assert.ok(result.events.some((event) => event.type === 'guard' && event.actor === 'enemy'));
  assert.match(result.state.history[0]?.summary ?? '', /Shade Knight casts Test Guard/);
}

function testTargetAndEffectMismatchIsReported(): void {
  const rules = rulesWithTestGuard();
  rules.abilities.test_guard = { ...TEST_GUARD, effects: [{ type: 'clear_row' }] };

  const issues = validateDuelRules(rules);

  assert.ok(issues.some((issue) => issue.path.includes('test_guard') && issue.message.includes('row targeting')));
}

function testMalformedTileRuleFailsValidation(): void {
  const rules = {
    ...DEFAULT_DUEL_RULES,
    tiles: {
      ...DEFAULT_DUEL_RULES.tiles,
      sword: {
        ...DEFAULT_DUEL_RULES.tiles.sword,
        effect: { type: 'damage', amountPerTile: -1 },
      },
    },
  };

  const issues = validateDuelRules(rules);

  assert.ok(issues.some((issue) => issue.path === 'tiles.sword.effect.amountPerTile'));
}

function testUnknownPassiveReferenceFailsValidation(): void {
  const rules: DuelRules = {
    ...DEFAULT_DUEL_RULES,
    actors: {
      ...DEFAULT_DUEL_RULES.actors,
      player: { ...DEFAULT_DUEL_RULES.actors.player, passiveId: 'missing_passive' },
    },
  };

  const issues = validateDuelRules(rules);
  assert.ok(issues.some((issue) => issue.path === 'actors.player.passiveId'));
}

function testAetherRequiresSpecialTileRule(): void {
  const rules = {
    ...DEFAULT_DUEL_RULES,
    tiles: {
      ...DEFAULT_DUEL_RULES.tiles,
      aether: { ...DEFAULT_DUEL_RULES.tiles.aether, effect: { type: 'guard', amountPerTile: 1 } },
    },
  };

  const issues = validateDuelRules(rules);
  assert.ok(issues.some((issue) => issue.path === 'tiles.aether.effect.type'));
}

function testEnemyTileScoresRejectUnknownKinds(): void {
  const rules = {
    ...DEFAULT_DUEL_RULES,
    actors: {
      ...DEFAULT_DUEL_RULES.actors,
      enemy: {
        ...DEFAULT_DUEL_RULES.actors.enemy,
        ai: {
          ...DEFAULT_DUEL_RULES.actors.enemy.ai,
          tileScores: { ...DEFAULT_DUEL_RULES.actors.enemy.ai.tileScores, aether: 99 },
        },
      },
    },
  };

  const issues = validateDuelRules(rules);
  assert.ok(issues.some((issue) => issue.path === 'actors.enemy.ai.tileScores.aether'));
}

function testSpecialTileActorModifiersAreValidated(): void {
  const rules = {
    ...DEFAULT_DUEL_RULES,
    tiles: {
      ...DEFAULT_DUEL_RULES.tiles,
      aether: {
        ...DEFAULT_DUEL_RULES.tiles.aether,
        effect: {
          type: 'special',
          damage: 5,
          radius: 1,
          actorModifiers: { player: { radius: -1, extraTurn: 'yes' } },
        },
      },
    },
  };

  const issues = validateDuelRules(rules);
  assert.ok(issues.some((issue) => issue.path === 'tiles.aether.effect.actorModifiers.player.radius'));
  assert.ok(issues.some((issue) => issue.path === 'tiles.aether.effect.actorModifiers.player.extraTurn'));
}

testDefaultContentIsValid();
testAbilityCanBeAddedWithoutChangingResolver();
testUnknownAbilityReferenceFailsBeforeBoardCreation();
testEnemyUsesTheSameGenericEffectExecutor();
testTargetAndEffectMismatchIsReported();
testMalformedTileRuleFailsValidation();
testUnknownPassiveReferenceFailsValidation();
testAetherRequiresSpecialTileRule();
testEnemyTileScoresRejectUnknownKinds();
testSpecialTileActorModifiersAreValidated();

console.log('content model tests passed');
