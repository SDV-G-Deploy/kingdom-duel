import { strict as assert } from 'node:assert';
import { CancellableTimer, chooseFocusIdentity } from './ui-lifecycle';

function testCancelledTimerCannotRunStaleCallback(): void {
  let nextHandle = 1;
  const callbacks = new Map<number, () => void>();
  const timer = new CancellableTimer<number>({
    setTimeout: (callback) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
    clearTimeout: (handle) => {
      callbacks.delete(handle);
    },
  });
  const calls: string[] = [];

  timer.schedule(() => calls.push('stale'), 520);
  const staleCallback = callbacks.get(1);
  timer.schedule(() => calls.push('current'), 520);

  staleCallback?.();
  assert.deepEqual(calls, [], 'a replaced callback must not mutate current UI state');
  assert.equal(timer.pending, true);

  callbacks.get(2)?.();
  assert.deepEqual(calls, ['current']);
  assert.equal(timer.pending, false);
}

function testCancelledTimerReportsNoPendingWork(): void {
  const cleared: number[] = [];
  const timer = new CancellableTimer<number>({
    setTimeout: () => 7,
    clearTimeout: (handle) => cleared.push(handle),
  });

  timer.schedule(() => undefined, 1);
  timer.cancel();

  assert.deepEqual(cleared, [7]);
  assert.equal(timer.pending, false);
}

function testFocusIdentityUsesStableControlKeys(): void {
  assert.deepEqual(chooseFocusIdentity({ 'data-cell': '17', 'data-action': 'restart' }), {
    attribute: 'data-cell',
    value: '17',
  });
  assert.deepEqual(chooseFocusIdentity({ 'data-spell': 'glass_ward' }), {
    attribute: 'data-spell',
    value: 'glass_ward',
  });
  assert.equal(chooseFocusIdentity({}), null);
}

testCancelledTimerCannotRunStaleCallback();
testCancelledTimerReportsNoPendingWork();
testFocusIdentityUsesStableControlKeys();

console.log('UI lifecycle tests passed');
