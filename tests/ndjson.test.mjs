import test from 'node:test';
import assert from 'node:assert/strict';
import { createNdjsonAccumulator } from '../lib/ai/ndjson.mjs';

test('parses complete and split NDJSON chunks without losing events', () => {
  const parser = createNdjsonAccumulator();
  assert.deepEqual(parser.push('{"type":"delta","delta":"hel'), []);
  assert.deepEqual(parser.push('lo"}\n{"type":"done"}\n'), [
    { type: 'delta', delta: 'hello' },
    { type: 'done' },
  ]);
  assert.deepEqual(parser.flush(), []);
});

test('flush parses a final line without trailing newline', () => {
  const parser = createNdjsonAccumulator();
  assert.deepEqual(parser.push('{"type":"done"}'), []);
  assert.deepEqual(parser.flush(), [{ type: 'done' }]);
});
