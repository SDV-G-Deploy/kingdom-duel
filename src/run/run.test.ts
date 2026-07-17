import { strict as assert } from 'node:assert';
import { getEnemyIntent } from '../engine/duel';
import { RUN_ENCOUNTERS } from './content';
import {
  chooseRunUpgrade,
  createRun,
  createRunDuel,
  dailyRunKey,
  dailyRunSeed,
  offerUpgrades,
  resolveRunBattle,
} from './run';
import { buildRunDuelRules } from './rules';
import { clearRun, loadRun, RUN_SAVE_KEY, saveRun } from './storage';
import type { StoragePort } from './types';
import {
  DAILY_CHALLENGE_VERSION,
  LEGACY_RUN_SAVE_KEY,
  RUN_CONTENT_VERSION,
  RUN_RULES_VERSION,
  RUN_SCHEMA_VERSION,
} from './version';

class MemoryStorage implements StoragePort {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function testRunScheduleAndDeterministicRewards(): void {
  assert.deepEqual(RUN_ENCOUNTERS.map((encounter) => encounter.tier), ['normal', 'normal', 'elite', 'boss']);
  assert.deepEqual(RUN_ENCOUNTERS.map((encounter) => encounter.rewardAfter), [true, true, false, false]);

  const run = createRun(1234);
  assert.deepEqual(offerUpgrades(run), offerUpgrades(createRun(1234)));
  assert.equal(new Set(offerUpgrades(run)).size, 3);

  const victory = { ...createRunDuel(run, 'simulation'), winner: 'player' as const };
  const reward = resolveRunBattle(run, victory);
  assert.equal(reward.phase, 'reward');
  assert.equal(reward.rewardOptions.length, 3);
  const selected = reward.rewardOptions[0];
  const next = chooseRunUpgrade(reward, selected);
  assert.equal(next.phase, 'battle');
  assert.equal(next.encounterIndex, 1);
  assert.deepEqual(next.selectedUpgradeIds, [selected]);
  assert.ok(!offerUpgrades(next).includes(selected));
}

function testRunProgressesThroughEliteBossAndFailure(): void {
  let run = createRun(8080);
  for (let encounterIndex = 0; encounterIndex < RUN_ENCOUNTERS.length; encounterIndex++) {
    assert.equal(run.encounterIndex, encounterIndex);
    const duel = { ...createRunDuel(run, 'simulation'), winner: 'player' as const };
    run = resolveRunBattle(run, duel);
    if (run.phase === 'reward') run = chooseRunUpgrade(run, run.rewardOptions[0]);
  }
  assert.equal(run.phase, 'complete');
  assert.equal(run.battles.length, 4);
  assert.deepEqual(run.battles.map((battle) => battle.encounterId), RUN_ENCOUNTERS.map((encounter) => encounter.id));
  assert.equal(run.selectedUpgradeIds.length, 2);

  const failedStart = createRun(8081);
  const defeatDuel = createRunDuel(failedStart, 'simulation');
  const defeat = { ...defeatDuel, winner: 'enemy' as const, player: { ...defeatDuel.player, hp: 0 } };
  const failed = resolveRunBattle(failedStart, defeat);
  assert.equal(failed.phase, 'failed');
  assert.equal(failed.battles[0]?.winner, 'enemy');

  assert.throws(
    () => resolveRunBattle(failedStart, { ...defeat, initialSeed: defeat.initialSeed + 1 }),
    /does not belong/,
  );
}

function testEncounterRulesAndMechanicalUpgrades(): void {
  const opening = buildRunDuelRules(createRun(99));
  assert.equal(opening.actors.enemy.name, 'Shade Knight');
  assert.equal(opening.actors.enemy.hp, 32);
  assert.equal(opening.actors.enemy.guard, 1);

  const upgraded = buildRunDuelRules({
    ...createRun(99),
    encounterIndex: 1,
    selectedUpgradeIds: ['solar_halo', 'aether_relay', 'ward_battery', 'veilbreaker_lens', 'aether_core'],
  });
  assert.equal(upgraded.actors.enemy.name, 'Moon Warden');
  const bloom = upgraded.abilities.sun_bloom.effects.find((effect) => effect.type === 'convert_tiles');
  assert.equal(bloom?.type === 'convert_tiles' ? bloom.shape : null, 'square');
  assert.equal(upgraded.tiles.aether.effect.type === 'special' ? upgraded.tiles.aether.effect.actorModifiers?.player?.extraTurn : null, true);
  assert.equal(upgraded.tiles.aether.effect.type === 'special' ? upgraded.tiles.aether.effect.actorModifiers?.player?.damage : null, 8);
  assert.equal(upgraded.tiles.aether.effect.type === 'special' ? upgraded.tiles.aether.effect.actorModifiers?.player?.radius : null, 2);
  assert.equal(upgraded.tiles.aether.effect.type === 'special' ? upgraded.tiles.aether.effect.damage : null, 5);
  assert.equal(upgraded.tiles.aether.effect.type === 'special' ? upgraded.tiles.aether.effect.radius : null, 1);
  assert.ok(upgraded.abilities.glass_ward.effects.some(
    (effect) => effect.type === 'convert_tiles' && effect.from === 'moon' && effect.to === 'shield',
  ));
  assert.equal(
    upgraded.tiles.shade.effect.type === 'risky_damage'
      ? upgraded.tiles.shade.effect.playerBacklashPerTile
      : null,
    0,
  );

  const readyDuel = createRunDuel({ ...createRun(99), encounterIndex: 1 }, 'simulation');
  const intent = getEnemyIntent({
    ...readyDuel,
    current: 'enemy',
    enemy: { ...readyDuel.enemy, moon: 5 },
  }, buildRunDuelRules({ ...createRun(99), encounterIndex: 1 }));
  assert.equal(intent?.type, 'ability');
  if (intent?.type === 'ability') assert.equal(intent.abilityId, 'lunar_lock');

  let distinctPolicySeed: number | null = null;
  for (let seed = 1; seed <= 40 && distinctPolicySeed === null; seed++) {
    const shadeRun = createRun(seed);
    const wardenRun = { ...createRun(seed), encounterIndex: 1 };
    const shadeRules = buildRunDuelRules(shadeRun);
    const wardenRules = buildRunDuelRules(wardenRun);
    const shadeDuel = createRunDuel(shadeRun, 'simulation');
    const wardenDuel = createRunDuel(wardenRun, 'simulation');
    const sharedBoardWarden = { ...wardenDuel, board: shadeDuel.board };
    const shadeIntent = getEnemyIntent(shadeDuel, shadeRules);
    const wardenIntent = getEnemyIntent(sharedBoardWarden, wardenRules);
    if (shadeIntent?.type === 'swap' && wardenIntent?.type === 'swap') {
      const sameMove = shadeIntent.from.x === wardenIntent.from.x &&
        shadeIntent.from.y === wardenIntent.from.y &&
        shadeIntent.to.x === wardenIntent.to.x &&
        shadeIntent.to.y === wardenIntent.to.y;
      if (!sameMove) distinctPolicySeed = seed;
    }
  }
  assert.ok(distinctPolicySeed !== null, 'enemy tile priorities should create different choices on a shared board');
}

function testDailySeedAndVersionedSave(): void {
  const firstDate = new Date('2026-07-14T23:30:00.000Z');
  const sameDate = new Date('2026-07-14T01:00:00.000Z');
  const nextDate = new Date('2026-07-15T00:00:00.000Z');
  assert.equal(dailyRunKey(firstDate), dailyRunKey(sameDate));
  assert.equal(dailyRunSeed(dailyRunKey(firstDate)), dailyRunSeed(dailyRunKey(sameDate)));
  assert.notEqual(dailyRunSeed(dailyRunKey(firstDate)), dailyRunSeed(dailyRunKey(nextDate)));
  assert.throws(() => createRun(1, 'daily'), /UTC date key/);
  assert.throws(() => createRun(1, 'daily', '2026-02-30'), /valid UTC date key/);
  assert.throws(() => createRun(1, 'standard', '2026-07-14'), /cannot have a daily key/);
  assert.throws(() => dailyRunSeed('not-a-date'), /Invalid UTC daily key/);

  const run = createRun(dailyRunSeed('2026-07-14'), 'daily', '2026-07-14');
  assert.equal(run.version, RUN_SCHEMA_VERSION);
  assert.equal(run.rulesVersion, RUN_RULES_VERSION);
  assert.equal(run.contentVersion, RUN_CONTENT_VERSION);
  assert.equal(run.dailyVersion, DAILY_CHALLENGE_VERSION);
  const duel = createRunDuel(run);
  const storage = new MemoryStorage();
  saveRun(storage, { version: RUN_SCHEMA_VERSION, run, duel });
  assert.deepEqual(loadRun(storage), { version: RUN_SCHEMA_VERSION, run, duel });

  const enemyTurn = { ...duel, current: 'enemy' as const };
  saveRun(storage, { version: RUN_SCHEMA_VERSION, run, duel: enemyTurn });
  assert.equal(loadRun(storage)?.duel.current, 'enemy', 'resume must preserve a pending enemy turn');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run,
    duel: { ...duel, enemy: { ...duel.enemy, definitionId: 'wrong_enemy' } },
  });
  assert.equal(loadRun(storage), null, 'mismatched encounter saves must be rejected');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run: { ...run, battles: [{ encounterId: 'forged', winner: 'player', turns: 1, actions: 1, playerHp: 38 }] },
    duel,
  });
  assert.equal(loadRun(storage), null, 'out-of-sequence battle history must be rejected');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run,
    duel: { ...duel, board: { ...duel.board, tiles: [...duel.board.tiles.slice(0, 63), 'forged' as never] } },
  });
  assert.equal(loadRun(storage), null, 'unknown board content must be rejected');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run,
    duel: { ...duel, history: [{ forged: true } as never] },
  });
  assert.equal(loadRun(storage), null, 'malformed presentation history must be rejected before render');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run: { ...run, rulesVersion: 'rules-old' as never },
    duel,
  });
  assert.equal(loadRun(storage), null, 'rules-version mismatches must not resume under current combat');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run: { ...run, contentVersion: 'content-old' as never },
    duel,
  });
  assert.equal(loadRun(storage), null, 'content-version mismatches must not resume with a changed route');

  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run: { ...run, dailyVersion: 'daily-old' as never },
    duel,
  });
  assert.equal(loadRun(storage), null, 'daily contract mismatches must not reuse a historical daily seed');

  const victory = { ...duel, winner: 'player' as const, enemy: { ...duel.enemy, hp: 0 } };
  const reward = resolveRunBattle(run, victory);
  saveRun(storage, {
    version: RUN_SCHEMA_VERSION,
    run: { ...reward, rewardOptions: [...reward.rewardOptions].reverse() },
    duel: victory,
  });
  assert.equal(loadRun(storage), null, 'reward offers must match their deterministic seed and order');

  storage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, run: { ...run, version: 1 }, duel }));
  assert.equal(loadRun(storage), null, 'older schemas must not silently run under changed rules');
  storage.setItem(LEGACY_RUN_SAVE_KEY, '{"version":1}');
  clearRun(storage);
  assert.equal(storage.getItem(RUN_SAVE_KEY), null);
  assert.equal(storage.getItem(LEGACY_RUN_SAVE_KEY), null);

  storage.setItem(RUN_SAVE_KEY, '{"version":9}');
  assert.equal(loadRun(storage), null);
  storage.setItem(RUN_SAVE_KEY, 'not-json');
  assert.equal(loadRun(storage), null);
}

function testValidRunPhasesRoundTripStorage(): void {
  const storage = new MemoryStorage();
  let run = createRun(9090);
  let terminalDuel = createRunDuel(run);

  saveRun(storage, { version: RUN_SCHEMA_VERSION, run, duel: terminalDuel });
  assert.equal(loadRun(storage)?.run.phase, 'battle');

  for (let index = 0; index < RUN_ENCOUNTERS.length; index++) {
    const duel = createRunDuel(run);
    terminalDuel = { ...duel, winner: 'player', enemy: { ...duel.enemy, hp: 0 } };
    run = resolveRunBattle(run, terminalDuel);
    const phaseDuel = run.phase === 'battle' ? createRunDuel(run) : terminalDuel;
    saveRun(storage, { version: RUN_SCHEMA_VERSION, run, duel: phaseDuel });
    assert.equal(loadRun(storage)?.run.phase, run.phase, `${run.phase} saves must round-trip`);

    if (run.phase === 'reward') {
      run = chooseRunUpgrade(run, run.rewardOptions[0]);
      const nextDuel = createRunDuel(run);
      saveRun(storage, { version: RUN_SCHEMA_VERSION, run, duel: nextDuel });
      assert.equal(loadRun(storage)?.run.encounterIndex, run.encounterIndex);
    }
  }
  assert.equal(run.phase, 'complete');

  const failedStart = createRun(9091);
  const activeDuel = createRunDuel(failedStart);
  const lostDuel = { ...activeDuel, winner: 'enemy' as const, player: { ...activeDuel.player, hp: 0 } };
  const failed = resolveRunBattle(failedStart, lostDuel);
  saveRun(storage, { version: RUN_SCHEMA_VERSION, run: failed, duel: lostDuel });
  assert.equal(loadRun(storage)?.run.phase, 'failed');
}

testRunScheduleAndDeterministicRewards();
testRunProgressesThroughEliteBossAndFailure();
testEncounterRulesAndMechanicalUpgrades();
testDailySeedAndVersionedSave();
testValidRunPhasesRoundTripStorage();

console.log('run model tests passed');
