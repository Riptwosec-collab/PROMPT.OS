import test from 'node:test';
import assert from 'node:assert/strict';

async function loadDeleteConfirmation() {
  try {
    return await import('../lib/ui/confirm-delete.mjs');
  } catch {
    return null;
  }
}

test('destructive action only proceeds after two confirmations', async () => {
  const mod = await loadDeleteConfirmation();
  assert.ok(mod, 'Expected lib/ui/confirm-delete.mjs to exist');
  const messages = [];
  const result = mod.confirmDestructiveAction((message) => {
    messages.push(message);
    return true;
  }, 'FIRST', 'SECOND');

  assert.equal(result, true);
  assert.deepEqual(messages, ['FIRST', 'SECOND']);
});

test('second rejection cancels the destructive action', async () => {
  const mod = await loadDeleteConfirmation();
  assert.ok(mod);
  let calls = 0;
  const result = mod.confirmDestructiveAction(() => {
    calls += 1;
    return calls === 1;
  }, 'FIRST', 'SECOND');

  assert.equal(result, false);
  assert.equal(calls, 2);
});

test('first rejection short-circuits without asking again', async () => {
  const mod = await loadDeleteConfirmation();
  assert.ok(mod);
  let calls = 0;
  const result = mod.confirmDestructiveAction(() => {
    calls += 1;
    return false;
  }, 'FIRST', 'SECOND');

  assert.equal(result, false);
  assert.equal(calls, 1);
});
