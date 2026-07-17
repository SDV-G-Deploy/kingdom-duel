import { strict as assert } from 'node:assert';
import { createBoard, setTile } from './board';
import { applySwap, castSpell, createDuel, getEnemyIntent, previewSwap, runEnemyTurn } from './duel';
import { matchReward } from './rewards';
import { DEFAULT_DUEL_RULES } from './rules';
import type { Board, DuelRules, MatchGroup, TileKind } from './types';

function patternedBoard(): Board {
  const kinds: TileKind[] = ['sun', 'shield', 'sword', 'moon', 'crown', 'shade'];
  return {
    width: 8,
    height: 8,
    tiles: Array.from({ length: 64 }, (_, index) => {
      const x = index % 8;
      const y = Math.floor(index / 8);
      return kinds[(x + y * 2) % kinds.length];
    }),
  };
}

function sunLineBoard(length: 4 | 5): Board {
  const board = patternedBoard();
  setTile(board, { x: 0, y: 0 }, 'sun');
  setTile(board, { x: 1, y: 0 }, 'sun');
  setTile(board, { x: 2, y: 0 }, 'shield');
  setTile(board, { x: 3, y: 0 }, 'sun');
  setTile(board, { x: 4, y: 0 }, length === 5 ? 'sun' : 'moon');
  setTile(board, { x: 2, y: 1 }, 'sun');
  return board;
}

function singleCascadeRules(): DuelRules {
  return {
    ...DEFAULT_DUEL_RULES,
    match: { ...DEFAULT_DUEL_RULES.match, maxCascades: 1 },
    openingLog: [],
  };
}

function testMatchFourAndFiveHaveDifferentRewards(): void {
  const rules = singleCascadeRules();
  const four: MatchGroup = { tile: 'sun', cells: Array.from({ length: 4 }, (_, x) => ({ x, y: 0 })) };
  const five: MatchGroup = { tile: 'sun', cells: Array.from({ length: 5 }, (_, x) => ({ x, y: 0 })) };
  assert.deepEqual(matchReward(four, rules), { effectAmount: 4, extraTurn: true, createsSpecial: false });
  assert.deepEqual(matchReward(five, rules), { effectAmount: 5, extraTurn: true, createsSpecial: true });

  const fourPreview = previewSwap(sunLineBoard(4), { x: 2, y: 1 }, { x: 2, y: 0 }, rules);
  assert.equal(fourPreview.valid, true);
  if (fourPreview.valid) assert.doesNotMatch(fourPreview.summary, /Aether/);

  const board = sunLineBoard(5);
  const preview = previewSwap(board, { x: 2, y: 1 }, { x: 2, y: 0 }, rules);
  assert.equal(preview.valid, true);
  if (preview.valid) assert.match(preview.summary, /creates Aether/);

  const base = createDuel(2007, rules);
  const result = applySwap({ ...base, board, seed: 99 }, { x: 2, y: 1 }, { x: 2, y: 0 }, rules);
  const creation = result.events.find((event) => event.type === 'special_created' && event.matchLength === 5);
  assert.ok(creation?.type === 'special_created');
  assert.ok(result.events.some((event) => event.type === 'passive_triggered' && event.passiveId === 'prism_guard'));
  const fallen = result.events.find((event) => event.type === 'tiles_fallen');
  assert.ok(fallen?.type === 'tiles_fallen');
  assert.ok(!fallen.cells.some((cell) => cell.x === creation.cell.x && cell.y === creation.cell.y));
  assert.equal(result.state.player.guard, base.player.guard + 2);
  assert.ok(result.state.board.tiles.includes('aether'));
}

function testAetherNeverAppearsInRandomRefills(): void {
  for (let seed = 1; seed <= 40; seed++) {
    assert.ok(!createBoard(8, 8, seed).board.tiles.includes('aether'));
  }
}

function testAetherSwapDetonatesWithoutNeedingAMatch(): void {
  const rules = singleCascadeRules();
  const base = createDuel(2007, rules);
  const board = patternedBoard();
  setTile(board, { x: 3, y: 3 }, 'aether');
  const state = { ...base, board, seed: 99 };

  const preview = previewSwap(board, { x: 3, y: 3 }, { x: 4, y: 3 }, rules);
  assert.equal(preview.valid, true);
  if (preview.valid) assert.match(preview.summary, /Aether Burst/);

  const result = applySwap(state, { x: 3, y: 3 }, { x: 4, y: 3 }, rules);
  const activation = result.events.find((event) => event.type === 'special_activated');
  const damage = result.events.find((event) => event.type === 'damage' && event.source === 'aether');
  assert.ok(activation?.type === 'special_activated');
  assert.equal(activation.cells.length, 9);
  assert.ok(damage?.type === 'damage');
  assert.equal(damage.amount, 5);
  assert.ok(!result.state.board.tiles.includes('aether'));
}

function testAetherUpgradeCanBeScopedToAurora(): void {
  const baseRules = singleCascadeRules();
  const aether = baseRules.tiles.aether;
  assert.equal(aether.effect.type, 'special');
  if (aether.effect.type !== 'special') return;
  const rules: DuelRules = {
    ...baseRules,
    tiles: {
      ...baseRules.tiles,
      aether: {
        ...aether,
        effect: {
          ...aether.effect,
          actorModifiers: { player: { damage: 8, radius: 2, extraTurn: true } },
        },
      },
    },
  };
  const board = patternedBoard();
  setTile(board, { x: 3, y: 3 }, 'aether');
  const base = createDuel(2007, rules);

  const playerResult = applySwap({ ...base, board, seed: 99 }, { x: 3, y: 3 }, { x: 4, y: 3 }, rules);
  assert.equal(playerResult.state.current, 'player');
  assert.ok(playerResult.events.some((event) => event.type === 'extra_turn' && event.actor === 'player'));
  const playerDamage = playerResult.events.find((event) => event.type === 'damage' && event.source === 'aether');
  assert.equal(playerDamage?.type === 'damage' ? playerDamage.amount : null, 8);
  assert.equal(playerResult.events.find((event) => event.type === 'special_activated')?.cells.length, 25);

  const enemyResult = applySwap(
    { ...base, board, seed: 99, current: 'enemy' },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    rules,
  );
  assert.equal(enemyResult.state.current, 'player');
  assert.ok(!enemyResult.events.some((event) => event.type === 'extra_turn' && event.actor === 'enemy'));
  const enemyDamage = enemyResult.events.find((event) => event.type === 'damage' && event.source === 'aether');
  assert.equal(enemyDamage?.type === 'damage' ? enemyDamage.amount : null, 5);
  assert.equal(enemyResult.events.find((event) => event.type === 'special_activated')?.cells.length, 9);
}

function testShadeTelegraphsAndCastsVeilRift(): void {
  const base = createDuel(44);
  const charging = getEnemyIntent({ ...base, enemy: { ...base.enemy, moon: 3 } });
  assert.equal(charging?.type, 'swap');
  assert.equal(charging?.abilityThreat?.name, 'Veil Rift');
  assert.equal(charging?.abilityThreat?.current.moon, 3);
  assert.equal(charging?.abilityThreat?.cost.moon, 5);
  assert.equal(charging?.abilityThreat?.ready, false);

  const readyState = {
    ...base,
    current: 'enemy' as const,
    enemy: { ...base.enemy, moon: 5 },
  };
  const ready = getEnemyIntent(readyState);
  assert.equal(ready?.type, 'ability');
  if (ready?.type === 'ability') assert.equal(ready.abilityId, 'veil_rift');

  const result = runEnemyTurn(readyState);
  assert.ok(result.events.some((event) => event.type === 'spell_cast' && event.spell === 'veil_rift'));
  assert.ok(result.events.some((event) => event.type === 'tiles_converted' && event.to === 'shade'));
  assert.equal(result.state.actionLog[0]?.action.type, 'cast');
}

function testSunBloomUsesControlledCross(): void {
  const rules = singleCascadeRules();
  const base = createDuel(2007, rules);
  const result = castSpell(
    { ...base, board: patternedBoard(), player: { ...base.player, sun: 8 } },
    'sun_bloom',
    { x: 3, y: 3 },
    rules,
  );
  const converted = result.events.find((event) => event.type === 'tiles_converted');
  assert.ok(converted?.type === 'tiles_converted');
  assert.equal(converted.cells.length, 5);
  assert.ok(converted.cells.every((cell) => cell.x === 3 || cell.y === 3));
}

testMatchFourAndFiveHaveDifferentRewards();
testAetherNeverAppearsInRandomRefills();
testAetherSwapDetonatesWithoutNeedingAMatch();
testAetherUpgradeCanBeScopedToAurora();
testShadeTelegraphsAndCastsVeilRift();
testSunBloomUsesControlledCross();

console.log('combat expansion tests passed');
