import { strict as assert } from 'node:assert';
import { createDuel } from '../engine/duel';
import type { ResolutionFrame } from '../engine/types';
import { BattleUiStore, canUseBoard, duelForPresentation } from './state';

function testInteractionStateAndSelectors(): void {
  const duel = createDuel(2007);
  const store = new BattleUiStore('play');
  assert.equal(canUseBoard(duel, store.state), true);

  store.update({ selectedCell: { x: 1, y: 2 }, enemyThinking: true });
  assert.equal(canUseBoard(duel, store.state), false);
  store.resetInteraction();
  assert.equal(store.state.selectedCell, null);
  assert.equal(store.state.enemyThinking, true, 'interaction reset must not cancel enemy lifecycle state');
}

function testResolutionStateAndPresentationProjection(): void {
  const duel = createDuel(2007);
  const frame: ResolutionFrame = {
    index: 1,
    kind: 'damage',
    events: [],
    snapshot: {
      board: { ...duel.board, tiles: [...duel.board.tiles] },
      player: { ...duel.player, abilityIds: [...duel.player.abilityIds] },
      enemy: { ...duel.enemy, hp: duel.enemy.hp - 3, abilityIds: [...duel.enemy.abilityIds] },
      current: duel.current,
      turn: duel.turn,
      seed: duel.seed,
      winner: null,
    },
  };
  const store = new BattleUiStore();
  store.beginResolution([frame]);
  store.presentFrame(frame);

  const presented = duelForPresentation(duel, store.state.presentedSnapshot);
  assert.equal(presented.enemy.hp, duel.enemy.hp - 3);
  assert.equal(duel.enemy.hp, duel.enemy.maxHp, 'presentation must not mutate committed duel state');
  assert.equal(canUseBoard(duel, store.state), false);

  store.finishResolution();
  assert.equal(duelForPresentation(duel, store.state.presentedSnapshot), duel);
  assert.equal(store.state.isResolving, false);
}

testInteractionStateAndSelectors();
testResolutionStateAndPresentationProjection();

console.log('UI state tests passed');
