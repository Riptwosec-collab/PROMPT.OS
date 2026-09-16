function finiteNonnegative(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function timestamp(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase();
}

export function findPricingSnapshot(pricingRows = [], provider, model, at = new Date()) {
  const targetTime = timestamp(at);
  const providerKey = normalizeIdentity(provider);
  const modelKey = normalizeIdentity(model);

  const matches = (Array.isArray(pricingRows) ? pricingRows : [])
    .filter((row) => (
      normalizeIdentity(row?.provider) === providerKey
      && normalizeIdentity(row?.model) === modelKey
      && timestamp(row?.effectiveFrom) <= targetTime
    ))
    .sort((a, b) => timestamp(b.effectiveFrom) - timestamp(a.effectiveFrom));

  return matches.length ? Object.freeze({ ...matches[0] }) : null;
}

export function estimateRunCost({ inputTokens = 0, outputTokens = 0, pricing = {} } = {}) {
  const input = finiteNonnegative(inputTokens);
  const output = finiteNonnegative(outputTokens);
  const inputRate = finiteNonnegative(pricing?.inputPerMillion);
  const outputRate = finiteNonnegative(pricing?.outputPerMillion);
  const cost = ((input / 1_000_000) * inputRate) + ((output / 1_000_000) * outputRate);
  return Number.isFinite(cost) && cost >= 0 ? cost : 0;
}
