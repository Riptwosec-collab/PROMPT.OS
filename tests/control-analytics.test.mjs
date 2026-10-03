import test from 'node:test';
import assert from 'node:assert/strict';
import {
  averageLatency,
  countRunsByDate,
  failureBreakdown,
  mostUsedPrompts,
  savedResultRate,
  statusBreakdown,
  tokenUsage,
} from '../lib/control/analytics-selectors.mjs';

const runs = [
  { id: 'r1', promptId: 'p1', status: 'success', createdAt: '2026-10-01T10:00:00Z', latencyMs: 100, inputTokens: 10, outputTokens: 20 },
  { id: 'r2', promptId: 'p1', status: 'failed', createdAt: '2026-10-01T11:00:00Z', error: { code: 'timeout' } },
  { id: 'r3', promptId: 'p2', status: 'interrupted', createdAt: '2026-10-02T01:00:00Z', latencyMs: 300, outputTokens: 5 },
  { id: 'r4', promptId: 'p2', status: 'success', createdAt: '2026-10-02T02:00:00Z' },
];

const results = [
  { resultId: 'x1', sourceRunId: 'r1' },
  { resultId: 'x2', sourceRunId: 'r3' },
];

test('Control Center selectors derive status date and prompt usage from real persisted records', () => {
  assert.deepEqual(statusBreakdown(runs), { success: 2, failed: 1, interrupted: 1 });
  assert.deepEqual(countRunsByDate(runs), [
    { date: '2026-10-01', count: 2 },
    { date: '2026-10-02', count: 2 },
  ]);
  assert.deepEqual(mostUsedPrompts(runs, { limit: 2 }), [
    { promptId: 'p1', count: 2 },
    { promptId: 'p2', count: 2 },
  ]);
});

test('latency and token analytics omit missing metadata instead of fabricating zero values', () => {
  assert.deepEqual(averageLatency(runs), { averageMs: 200, records: 2 });
  assert.deepEqual(tokenUsage(runs), { inputTokens: 10, outputTokens: 25, totalTokens: 35, records: 2 });
  assert.equal(averageLatency([{ id: 'none' }]), null);
  assert.equal(tokenUsage([{ id: 'none' }]), null);
});

test('saved result rate and failure breakdown use concrete run/result relations', () => {
  assert.deepEqual(savedResultRate(runs, results), { savedRuns: 2, totalRuns: 4, rate: 0.5 });
  assert.deepEqual(failureBreakdown(runs), { failed: 1, interrupted: 1, stopped: 0, codes: { timeout: 1 } });
});

test('selectors are deterministic for large paginated fixture inputs and never mutate source records', () => {
  const large = Array.from({ length: 2500 }, (_, index) => ({
    id: `r${index}`,
    promptId: `p${index % 20}`,
    status: index % 7 === 0 ? 'failed' : 'success',
    createdAt: `2026-10-${String((index % 3) + 1).padStart(2, '0')}T00:00:00Z`,
  }));
  const before = structuredClone(large);
  const first = mostUsedPrompts(large, { limit: 5 });
  const second = mostUsedPrompts(large, { limit: 5 });
  assert.deepEqual(first, second);
  assert.deepEqual(large, before);
  assert.equal(first.length, 5);
});
