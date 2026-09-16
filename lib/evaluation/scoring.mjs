function finiteScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function aggregateRubricScores(results = [], rubric = {}) {
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  const grouped = new Map();

  (Array.isArray(results) ? results : []).forEach((result) => {
    const candidateId = String(result?.candidateId || 'unknown');
    if (!grouped.has(candidateId)) grouped.set(candidateId, []);
    grouped.get(candidateId).push(result);
  });

  const weightedConfigured = rubric?.aggregation === 'weighted'
    && criteria.length > 0
    && criteria.every((criterion) => Number.isFinite(Number(criterion.weight)) && Number(criterion.weight) >= 0);

  const candidates = {};
  grouped.forEach((candidateResults, candidateId) => {
    const metrics = {};
    criteria.forEach((criterion) => {
      const scores = candidateResults
        .map((result) => finiteScore(result?.rubricScores?.[criterion.id]))
        .filter((score) => score !== null);
      metrics[criterion.id] = {
        label: criterion.label || criterion.id,
        count: scores.length,
        average: average(scores),
        min: scores.length ? Math.min(...scores) : null,
        max: scores.length ? Math.max(...scores) : null,
      };
    });

    let weightedTotal = null;
    if (weightedConfigured) {
      const totalWeight = criteria.reduce((sum, criterion) => sum + Number(criterion.weight), 0);
      const everyMetricPresent = criteria.every((criterion) => metrics[criterion.id]?.average !== null);
      if (totalWeight > 0 && everyMetricPresent) {
        weightedTotal = criteria.reduce((sum, criterion) => (
          sum + (metrics[criterion.id].average * Number(criterion.weight))
        ), 0) / totalWeight;
      }
    }

    candidates[candidateId] = {
      resultCount: candidateResults.length,
      metrics,
      weightedTotal,
    };
  });

  return {
    aggregation: weightedConfigured ? 'weighted' : null,
    candidates,
  };
}
