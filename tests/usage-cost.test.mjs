import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateRunCost, findPricingSnapshot } from '../lib/analytics/pricing.mjs';
import { createUsageEvent } from '../lib/analytics/usage-event.mjs';

test('cost uses separate input and output rates', () => {
  const cost = estimateRunCost({
    inputTokens: 1000,
    outputTokens: 500,
    pricing: { inputPerMillion: 2, outputPerMillion: 8 },
  });
  assert.equal(cost, 0.006);
});

test('historical event selects latest pricing effective not after timestamp', () => {
  const rows = [
    { provider: 'OpenAI', model: 'gpt-x', inputPerMillion: 1, outputPerMillion: 2, effectiveFrom: '2026-01-01T00:00:00.000Z' },
    { provider: 'OpenAI', model: 'gpt-x', inputPerMillion: 2, outputPerMillion: 4, effectiveFrom: '2026-06-01T00:00:00.000Z' },
    { provider: 'OpenAI', model: 'gpt-x', inputPerMillion: 3, outputPerMillion: 6, effectiveFrom: '2026-10-01T00:00:00.000Z' },
  ];
  const selected = findPricingSnapshot(rows, 'openai', 'GPT-X', '2026-09-16T00:00:00.000Z');
  assert.equal(selected.inputPerMillion, 2);
  assert.equal(selected.effectiveFrom, '2026-06-01T00:00:00.000Z');
});

test('usage event stores immutable pricing snapshot and failed run metadata', () => {
  const event = createUsageEvent({
    id: 'run-1',
    provider: 'OpenAI',
    model: 'gpt-x',
    inputTokens: 1000,
    outputTokens: 500,
    latencyMs: 1234,
    status: 'failed',
    errorCode: 'UPSTREAM_ERROR',
    createdAt: '2026-09-16T00:00:00.000Z',
    pricing: { inputPerMillion: 2, outputPerMillion: 8, effectiveFrom: '2026-06-01T00:00:00.000Z' },
  });
  assert.equal(event.estimatedCost, 0.006);
  assert.equal(event.pricingEffectiveFrom, '2026-06-01T00:00:00.000Z');
  assert.equal(event.status, 'failed');
  assert.equal(event.errorCode, 'UPSTREAM_ERROR');
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.pricingSnapshot), true);
});
