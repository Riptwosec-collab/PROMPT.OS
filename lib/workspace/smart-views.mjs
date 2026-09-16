function asDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function applySmartView(prompts = [], view = {}, now = new Date()) {
  const type = view?.type || 'all';
  const current = asDate(now) || new Date();

  if (type === 'modified-this-week') {
    const cutoff = new Date(current.getTime() - (7 * 24 * 60 * 60 * 1000));
    return prompts.filter((prompt) => {
      const updated = asDate(prompt.updatedAt);
      return updated && updated >= cutoff && updated <= current;
    });
  }

  if (type === 'health-below') {
    const threshold = numeric(view.value, 4);
    return prompts.filter((prompt) => numeric(prompt.healthScore, 0) < threshold);
  }

  if (type === 'cost-above') {
    const threshold = numeric(view.value, 0);
    return prompts.filter((prompt) => numeric(prompt.cost, 0) > threshold);
  }

  if (type === 'frequently-used') {
    const threshold = numeric(view.value, 1);
    return prompts
      .filter((prompt) => numeric(prompt.runs, 0) + numeric(prompt.copyCount, 0) >= threshold)
      .sort((a, b) => (
        numeric(b.runs, 0) + numeric(b.copyCount, 0)
        - numeric(a.runs, 0) - numeric(a.copyCount, 0)
      ));
  }

  return [...prompts];
}
