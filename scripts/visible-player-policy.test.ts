import { strict as assert } from 'node:assert';
import { createDuel } from '../src/engine/duel';
import { DEFAULT_DUEL_RULES } from '../src/engine/rules';
import { chooseVisiblePlayerAction } from './visible-player-policy';

function testVisiblePolicyIsDeterministicAndUsesOneAction(): void {
  const state = createDuel(2007, DEFAULT_DUEL_RULES, 'simulation');
  const first = chooseVisiblePlayerAction(state, DEFAULT_DUEL_RULES);
  const second = chooseVisiblePlayerAction(state, DEFAULT_DUEL_RULES);

  assert.deepEqual(first.state.actionLog, second.state.actionLog);
  assert.equal(first.state.actionLog.length, 1, 'candidate inspection must not execute hidden trial actions');
  assert.equal(first.state.actionLog[0]?.accepted, true);
  assert.equal(first.state.actionLog[0]?.action.type, 'swap', 'unaffordable abilities must not be considered');
  assert.equal(state.actionLog.length, 0, 'policy must not mutate its input state');
}

function testVisiblePolicyCanChooseAnAffordableBoardSpell(): void {
  let castAction: string | null = null;
  for (let seed = 1; seed <= 40 && castAction === null; seed++) {
    const base = createDuel(seed, DEFAULT_DUEL_RULES, 'simulation');
    const charged = {
      ...base,
      player: { ...base.player, sun: 20, moon: 20, crown: 20 },
    };
    const result = chooseVisiblePlayerAction(charged, DEFAULT_DUEL_RULES);
    const action = result.state.actionLog[0]?.action;
    if (action?.type === 'cast') castAction = action.abilityId;
  }

  assert.ok(castAction, 'visible-information scoring should use a spell when its direct board value wins');
}

testVisiblePolicyIsDeterministicAndUsesOneAction();
testVisiblePolicyCanChooseAnAffordableBoardSpell();

console.log('visible-information player policy tests passed');
