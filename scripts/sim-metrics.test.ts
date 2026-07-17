import { strict as assert } from 'node:assert';
import { createDuel, runEnemyTurn } from '../src/engine/duel';
import { DEFAULT_DUEL_RULES } from '../src/engine/rules';
import { analyzeBattle, summarize } from './sim-metrics';

function testStructuredMetricsUseActionEvents(): void {
  const base = createDuel(44, DEFAULT_DUEL_RULES, 'simulation');
  const ready = {
    ...base,
    current: 'enemy' as const,
    enemy: { ...base.enemy, moon: 5 },
  };
  const resolved = runEnemyTurn(ready, DEFAULT_DUEL_RULES).state;
  const result = analyzeBattle(44, 'spell-aware', resolved, 1, DEFAULT_DUEL_RULES);
  const summary = summarize('spell-aware', [result]);

  assert.equal(result.enemySpellsCast, 1);
  assert.equal(result.castsByAbility.veil_rift, 1);
  assert.equal(result.abilityOutcomes.veil_rift.casts, 1);
  assert.ok(result.abilityOutcomes.veil_rift.guardGained >= 2);
  assert.ok(result.abilityOutcomes.veil_rift.hpDamage > 0);
  assert.equal(result.manaSpent.enemy, 5);
  assert.ok(result.matchLengths.some((length) => length >= 5));
  assert.ok(result.specialsCreated >= 1);
  assert.equal(summary.actionPercentiles.p50, 1);
  assert.equal(summary.actionPercentiles.p90, 1);
  assert.equal(summary.castsPerBattleByAbility.veil_rift, 1);
  assert.equal(summary.avgAbilityOutcomesByAbility.veil_rift.casts, 1);
  assert.equal(summary.avgFinalGuard.player, resolved.player.guard);
  assert.equal(summary.avgFinalGuard.enemy, resolved.enemy.guard);
  assert.ok(summary.avgDamageBySource.enemy.shade > 0);
  assert.doesNotThrow(() => JSON.stringify(summary));
}

testStructuredMetricsUseActionEvents();

console.log('simulation metrics tests passed');
