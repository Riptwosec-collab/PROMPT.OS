import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvaluationSuite } from '../lib/evaluation/model.mjs';
import { estimateEvaluationRun } from '../lib/evaluation/estimate.mjs';
import { aggregateRubricScores } from '../lib/evaluation/scoring.mjs';

test('evaluation suite normalization preserves explicit rubric and candidates', () => {
  const suite = normalizeEvaluationSuite({
    id: 's1',
    name: 'Research Benchmark',
    cases: [{ id: 'c1', name: 'Case 1', input: { topic: 'Cloud' } }],
    candidateVersionIds: ['v1', 'v2', 'v2'],
    rubric: { criteria: [{ id: 'accuracy', label: 'Accuracy' }] },
  });

  assert.equal(suite.id, 's1');
  assert.equal(suite.cases.length, 1);
  assert.deepEqual(suite.candidateVersionIds, ['v1', 'v2']);
  assert.equal(suite.rubric.criteria[0].id, 'accuracy');
});

test('evaluation estimate computes calls, tokens and estimated cost', () => {
  const estimate = estimateEvaluationRun({
    cases: [{}, {}, {}],
    candidates: [{}, {}],
    estimatedTokensPerCall: 1000,
    price: { per1000Tokens: 0.002 },
  });

  assert.equal(estimate.calls, 6);
  assert.equal(estimate.estimatedTokens, 6000);
  assert.equal(estimate.estimatedCost, 0.012);
});

test('unweighted rubric returns metric summaries without a winner field', () => {
  const rubric = {
    criteria: [
      { id: 'accuracy', label: 'Accuracy' },
      { id: 'structure', label: 'Structure' },
    ],
  };
  const results = [
    { candidateId: 'a', rubricScores: { accuracy: 4, structure: 5 } },
    { candidateId: 'a', rubricScores: { accuracy: 5, structure: 3 } },
    { candidateId: 'b', rubricScores: { accuracy: 3, structure: 4 } },
  ];

  const summary = aggregateRubricScores(results, rubric);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'winner'), false);
  assert.equal(summary.candidates.a.metrics.accuracy.average, 4.5);
  assert.equal(summary.candidates.b.metrics.structure.average, 4);
  assert.equal(summary.candidates.a.weightedTotal, null);
});

test('weighted total is computed only when weighted aggregation is explicitly configured', () => {
  const rubric = {
    aggregation: 'weighted',
    criteria: [
      { id: 'accuracy', label: 'Accuracy', weight: 0.75 },
      { id: 'structure', label: 'Structure', weight: 0.25 },
    ],
  };
  const summary = aggregateRubricScores([
    { candidateId: 'a', rubricScores: { accuracy: 4, structure: 2 } },
  ], rubric);
  assert.equal(summary.candidates.a.weightedTotal, 3.5);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'winner'), false);
});
