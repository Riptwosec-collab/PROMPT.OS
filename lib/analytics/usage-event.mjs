import { estimateRunCost } from './pricing.mjs';

function finiteNonnegative(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function iso(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) throw new Error('createdAt must be a valid date');
  return date.toISOString();
}

export function createUsageEvent(meta = {}) {
  if (!meta.id) throw new Error('usage event id is required');
  if (!meta.provider) throw new Error('usage event provider is required');
  if (!meta.model) throw new Error('usage event model is required');

  const pricingSnapshot = Object.freeze({ ...(meta.pricing || {}) });
  const inputTokens = Math.floor(finiteNonnegative(meta.inputTokens));
  const outputTokens = Math.floor(finiteNonnegative(meta.outputTokens));
  const estimatedCost = estimateRunCost({ inputTokens, outputTokens, pricing: pricingSnapshot });

  return Object.freeze({
    id: String(meta.id),
    provider: String(meta.provider),
    model: String(meta.model),
    promptId: meta.promptId ?? null,
    promptVersionId: meta.promptVersionId ?? null,
    evaluationRunId: meta.evaluationRunId ?? null,
    inputTokens,
    outputTokens,
    latencyMs: Math.floor(finiteNonnegative(meta.latencyMs)),
    estimatedCost,
    pricingEffectiveFrom: pricingSnapshot.effectiveFrom || null,
    pricingSnapshot,
    status: String(meta.status || 'ready'),
    errorCode: meta.errorCode ? String(meta.errorCode) : null,
    createdAt: iso(meta.createdAt),
  });
}
