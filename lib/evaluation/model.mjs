function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean))];
}

function normalizeCase(item = {}, index = 0) {
  return {
    id: String(item.id || `case-${index + 1}`),
    name: String(item.name || `Case ${index + 1}`),
    input: item.input && typeof item.input === 'object' ? { ...item.input } : {},
    expectedOutput: item.expectedOutput ?? item.expected_output ?? null,
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
  };
}

function normalizeCriterion(item = {}, index = 0) {
  const criterion = {
    id: String(item.id || `criterion-${index + 1}`),
    label: String(item.label || item.id || `Criterion ${index + 1}`),
  };
  if (Number.isFinite(Number(item.weight))) criterion.weight = Number(item.weight);
  if (Number.isFinite(Number(item.min))) criterion.min = Number(item.min);
  if (Number.isFinite(Number(item.max))) criterion.max = Number(item.max);
  return criterion;
}

export function normalizeEvaluationSuite(raw = {}) {
  const rubricInput = raw.rubric && typeof raw.rubric === 'object' ? raw.rubric : {};
  return {
    id: String(raw.id || 'evaluation-suite'),
    name: String(raw.name || 'Evaluation Suite'),
    cases: (Array.isArray(raw.cases) ? raw.cases : []).map(normalizeCase),
    candidateVersionIds: uniqueStrings(raw.candidateVersionIds),
    rubric: {
      aggregation: rubricInput.aggregation || null,
      criteria: (Array.isArray(rubricInput.criteria) ? rubricInput.criteria : []).map(normalizeCriterion),
    },
  };
}
