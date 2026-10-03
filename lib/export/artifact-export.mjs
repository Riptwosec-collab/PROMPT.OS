function clone(value) {
  if (value == null) return value;
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function normalized(kind, record = {}) {
  const isResult = kind === 'result';
  const metadata = isResult ? (record.metadataSnapshot || {}) : record;
  return {
    schema: 'prompt-os-artifact-v1',
    kind,
    record: clone(record),
    prompt: String(isResult ? record.promptSnapshot ?? '' : record.renderedPrompt ?? record.promptSnapshot ?? ''),
    variables: clone(record.variablesSnapshot || {}),
    output: String(isResult ? record.outputSnapshot ?? '' : record.output ?? ''),
    status: metadata.status ?? record.status ?? null,
    provider: metadata.provider ?? record.provider ?? null,
    model: metadata.model ?? record.model ?? null,
    latencyMs: Number.isFinite(metadata.latencyMs ?? record.latencyMs) ? Number(metadata.latencyMs ?? record.latencyMs) : null,
    inputTokens: Number.isFinite(metadata.inputTokens ?? record.inputTokens) ? Number(metadata.inputTokens ?? record.inputTokens) : null,
    outputTokens: Number.isFinite(metadata.outputTokens ?? record.outputTokens) ? Number(metadata.outputTokens ?? record.outputTokens) : null,
    createdAt: record.createdAt ?? null,
    completedAt: metadata.completedAt ?? record.completedAt ?? null,
  };
}

function jsonBlock(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

function markdownArtifact(data) {
  const lines = [
    `# Prompt.OS ${data.kind === 'result' ? 'Saved Result' : 'Run'}`,
    '',
    '## Prompt',
    data.prompt || '(empty)',
    '',
    '## Variables',
    '```json',
    jsonBlock(data.variables),
    '```',
    '',
    '## Output',
    data.output || '(empty)',
    '',
    '## Metadata',
  ];
  if (data.status) lines.push(`- Status: ${data.status}`);
  if (data.provider) lines.push(`- Provider: ${data.provider}`);
  if (data.model) lines.push(`- Model: ${data.model}`);
  if (data.latencyMs != null) lines.push(`- Latency: ${data.latencyMs} ms`);
  if (data.inputTokens != null || data.outputTokens != null) {
    lines.push(`- Tokens: input ${data.inputTokens ?? 'Unavailable'}, output ${data.outputTokens ?? 'Unavailable'}`);
  }
  if (data.createdAt != null) lines.push(`- Created: ${new Date(data.createdAt).toISOString()}`);
  if (data.completedAt != null) lines.push(`- Completed: ${new Date(data.completedAt).toISOString()}`);
  return `${lines.join('\n')}\n`;
}

function textArtifact(data) {
  const lines = [
    `Prompt.OS ${data.kind === 'result' ? 'Saved Result' : 'Run'}`,
    '', 'PROMPT', data.prompt || '(empty)',
    '', 'VARIABLES', jsonBlock(data.variables),
    '', 'OUTPUT', data.output || '(empty)',
  ];
  if (data.status) lines.push('', `Status: ${data.status}`);
  if (data.provider) lines.push(`Provider: ${data.provider}`);
  if (data.model) lines.push(`Model: ${data.model}`);
  if (data.latencyMs != null) lines.push(`Latency: ${data.latencyMs} ms`);
  if (data.inputTokens != null || data.outputTokens != null) lines.push(`Tokens: input ${data.inputTokens ?? 'Unavailable'}, output ${data.outputTokens ?? 'Unavailable'}`);
  return `${lines.join('\n')}\n`;
}

export function serializeArtifact({ kind, record, format = 'markdown' } = {}) {
  if (!['run', 'result'].includes(kind)) throw new Error('Artifact kind must be run or result');
  const data = normalized(kind, record || {});
  if (format === 'json') return JSON.stringify({ schema: data.schema, kind: data.kind, record: data.record }, null, 2);
  if (format === 'txt') return textArtifact(data);
  if (format === 'markdown') return markdownArtifact(data);
  throw new Error(`Unsupported artifact format: ${format}`);
}
