import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateUsage } from '../lib/analytics/aggregate.mjs';
import { evaluateBudget } from '../lib/analytics/budget.mjs';

test('aggregateUsage respects bounded time windows and groups telemetry', () => {
  const events = [
    {
      id: 'a', createdAt: '2026-09-16T01:00:00.000Z', provider: 'OpenAI', model: 'gpt-a', promptId: 'p1',
      inputTokens: 100, outputTokens: 50, estimatedCost: 0.01, latencyMs: 1000, status: 'ready',
    },
    {
      id: 'b', createdAt: '2026-09-16T02:00:00.000Z', provider: 'OpenAI', model: 'gpt-b', promptId: 'p1',
      inputTokens: 200, outputTokens: 100, estimatedCost: 0.02, latencyMs: 2000, status: 'failed', errorCode: 'ERR',
    },
    {
      id: 'old', createdAt: '2026-08-01T02:00:00.000Z', provider: 'Other', model: 'old', promptId: 'p2',
      inputTokens: 9999, outputTokens: 9999, estimatedCost: 99, latencyMs: 9999, status: 'ready',
    },
  ];

  const result = aggregateUsage(events, {
    from: '2026-09-16T00:00:00.000Z',
    to: '2026-09-17T00:00:00.000Z',
  });

  assert.equal(result.runs, 2);
  assert.equal(result.inputTokens, 300);
  assert.equal(result.outputTokens, 150);
  assert.equal(result.estimatedCost, 0.03);
  assert.equal(result.averageLatencyMs, 1500);
  assert.equal(result.errorRate, 0.5);
  assert.equal(result.byProvider.OpenAI.runs, 2);
  assert.equal(result.byModel['gpt-a'].runs, 1);
  assert.equal(result.byPrompt.p1.runs, 2);
  assert.equal(result.byDay['2026-09-16'].runs, 2);
});

test('budget warning never blocks unless hard limit is enabled', () => {
  const budget = evaluateBudget({ spent: 8, limit: 10, warningPercent: 80, hardLimitEnabled: false, nextEstimatedCost: 3 });
  assert.equal(budget.shouldWarn, true);
  assert.equal(budget.shouldBlock, false);
  assert.equal(budget.projected, 11);

  const hard = evaluateBudget({ spent: 9.5, limit: 10, warningPercent: 80, hardLimitEnabled: true, nextEstimatedCost: 1 });
  assert.equal(hard.shouldWarn, true);
  assert.equal(hard.shouldBlock, true);
  assert.equal(hard.state, 'blocked');
});

test('zero or missing budget stays unconfigured and never blocks', () => {
  assert.deepEqual(evaluateBudget({ spent: 2, nextEstimatedCost: 3 }), {
    state: 'unconfigured', projected: 5, shouldWarn: false, shouldBlock: false,
  });
});
