function finiteNonnegative(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function estimateEvaluationRun({
  cases = [],
  candidates = [],
  estimatedTokensPerCall = 0,
  price = {},
} = {}) {
  const calls = (Array.isArray(cases) ? cases.length : 0) * (Array.isArray(candidates) ? candidates.length : 0);
  const tokensPerCall = finiteNonnegative(estimatedTokensPerCall, 0);
  const estimatedTokens = calls * tokensPerCall;

  let estimatedCost = 0;
  if (Number.isFinite(Number(price?.per1000Tokens))) {
    estimatedCost = (estimatedTokens / 1000) * finiteNonnegative(price.per1000Tokens, 0);
  } else {
    const inputTokensPerCall = finiteNonnegative(price?.estimatedInputTokensPerCall, tokensPerCall / 2);
    const outputTokensPerCall = Math.max(0, tokensPerCall - inputTokensPerCall);
    const inputPer1k = finiteNonnegative(price?.inputPer1000Tokens, 0);
    const outputPer1k = finiteNonnegative(price?.outputPer1000Tokens, 0);
    estimatedCost = calls * (((inputTokensPerCall / 1000) * inputPer1k) + ((outputTokensPerCall / 1000) * outputPer1k));
  }

  return {
    calls,
    estimatedTokens,
    estimatedCost: Number(estimatedCost.toFixed(6)),
  };
}
