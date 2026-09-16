import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRunRequest } from '../lib/ai/validate-run-request.mjs';

test('accepts a valid OpenAI run request and applies a default model', () => {
  const result = validateRunRequest({ provider: 'openai', prompt: 'Explain VLAN trunking.' });
  assert.equal(result.provider, 'openai');
  assert.equal(result.model, 'gpt-5.6');
  assert.equal(result.prompt, 'Explain VLAN trunking.');
});

test('rejects an empty prompt', () => {
  assert.throws(
    () => validateRunRequest({ provider: 'openai', prompt: '   ' }),
    /Prompt is required/,
  );
});

test('rejects unsupported providers', () => {
  assert.throws(
    () => validateRunRequest({ provider: 'unknown', prompt: 'Hello' }),
    /Unsupported provider/,
  );
});

test('caps prompt size before sending to a provider', () => {
  const huge = 'x'.repeat(200_001);
  assert.throws(
    () => validateRunRequest({ provider: 'openai', prompt: huge }),
    /Prompt exceeds 200000 characters/,
  );
});
