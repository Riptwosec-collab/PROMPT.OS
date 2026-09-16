function collectVariables(prompt = '') {
  const matches = [...String(prompt).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)];
  return [...new Set(matches.map((match) => `{{${match[1]}}}`))];
}

export function buildImproveInput({ prompt = '', health = {}, language = 'th' } = {}) {
  const source = String(prompt || '').trim();
  if (!source) throw new Error('prompt is required');
  const variables = collectVariables(source);
  const healthScore = Number.isFinite(Number(health?.score)) ? Number(health.score) : 0;
  const healthMax = Number.isFinite(Number(health?.max)) ? Number(health.max) : 6;

  return [
    'Improve the prompt below without changing its intended task.',
    `Response language for rationale: ${language || 'th'}.`,
    `Current prompt health: ${healthScore}/${healthMax}.`,
    'Evaluate and improve: role, context, explicit task, requirements, constraints, output format, examples, and variable usage.',
    variables.length
      ? `Preserve these placeholders exactly and do not rename or remove them: ${variables.join(', ')}.`
      : 'Do not introduce unnecessary placeholders.',
    'Return strict JSON only with this shape:',
    '{"improvedPrompt":"...","rationale":["..."],"checks":{"role":true,"context":true,"constraints":true,"outputFormat":true}}',
    'Do not wrap the improved prompt in Markdown fences.',
    '',
    'ORIGINAL PROMPT',
    source,
  ].join('\n');
}

function stripFence(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

export function parseImproveResponse(text) {
  let data;
  try {
    data = JSON.parse(stripFence(text));
  } catch {
    throw new Error('AI Improve response must be valid JSON');
  }

  if (!data || typeof data !== 'object' || typeof data.improvedPrompt !== 'string' || !data.improvedPrompt.trim()) {
    throw new Error('AI Improve response requires a non-empty improvedPrompt');
  }

  return {
    improvedPrompt: data.improvedPrompt.trim(),
    rationale: Array.isArray(data.rationale)
      ? data.rationale.map((item) => String(item).trim()).filter(Boolean)
      : [],
    checks: data.checks && typeof data.checks === 'object'
      ? {
          role: Boolean(data.checks.role),
          context: Boolean(data.checks.context),
          constraints: Boolean(data.checks.constraints),
          outputFormat: Boolean(data.checks.outputFormat),
        }
      : { role: false, context: false, constraints: false, outputFormat: false },
  };
}
