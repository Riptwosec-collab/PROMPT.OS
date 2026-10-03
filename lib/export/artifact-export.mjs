const ARTIFACT_SCHEMA = 'prompt-os-artifact';
const BUNDLE_SCHEMA = 'prompt-os-artifact-bundle';
const SCHEMA_VERSION = 1;

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function titleFor(kind, record = {}) {
  if (kind === 'result') return String(record.name || record.promptTitle || record.metadataSnapshot?.promptTitle || record.resultId || 'Saved Result');
  return String(record.promptTitle || record.name || record.promptId || record.id || 'Run');
}

function outputFor(kind, record = {}) {
  return String(kind === 'result' ? record.outputSnapshot ?? '' : record.output ?? '');
}

function promptFor(kind, record = {}) {
  return String(record.promptSnapshot ?? record.metadataSnapshot?.promptSnapshot ?? '');
}

function variablesFor(record = {}) {
  return clone(record.variablesSnapshot ?? {});
}

function metadataFor(kind, record = {}) {
  const source = kind === 'result' ? { ...(record.metadataSnapshot || {}), createdAt: record.createdAt, updatedAt: record.updatedAt } : record;
  const metadata = {};
  const fields = ['status', 'provider', 'model', 'startedAt', 'completedAt', 'createdAt', 'updatedAt', 'responseId'];
  for (const key of fields) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') metadata[key] = clone(source[key]);
  }
  for (const key of ['latencyMs', 'inputTokens', 'outputTokens']) {
    if (Number.isFinite(Number(source?.[key]))) metadata[key] = Number(source[key]);
  }
  return metadata;
}

function prettyVariables(variables) {
  const entries = Object.entries(variables || {});
  if (!entries.length) return '-';
  return entries.map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n');
}

function metadataLines(metadata = {}, markdown = false) {
  const labels = {
    status: 'Status', provider: 'Provider', model: 'Model', startedAt: 'Started', completedAt: 'Completed',
    createdAt: 'Created', updatedAt: 'Updated', responseId: 'Response ID', latencyMs: 'Latency',
    inputTokens: 'Input Tokens', outputTokens: 'Output Tokens',
  };
  return Object.entries(metadata).map(([key, value]) => {
    const rendered = key === 'latencyMs' ? `${value} ms` : String(value);
    return markdown ? `- **${labels[key] || key}:** ${rendered}` : `${labels[key] || key}: ${rendered}`;
  }).join('\n');
}

function markdownArtifact(kind, record) {
  const title = titleFor(kind, record);
  const metadata = metadataFor(kind, record);
  const vars = variablesFor(record);
  return [
    `# ${title}`,
    '',
    `- **Type:** ${kind === 'result' ? 'Saved Result' : 'Run'}`,
    kind === 'result' && record.resultId ? `- **Result ID:** ${record.resultId}` : null,
    kind === 'run' && record.id ? `- **Run ID:** ${record.id}` : null,
    kind === 'result' && record.sourceRunId ? `- **Source Run:** ${record.sourceRunId}` : null,
    metadataLines(metadata, true) || null,
    '',
    '## Prompt',
    '',
    promptFor(kind, record) || '_No prompt snapshot_',
    '',
    '## Variables',
    '',
    '```json',
    JSON.stringify(vars, null, 2),
    '```',
    '',
    '## Output',
    '',
    outputFor(kind, record) || '_No output_',
  ].filter((line) => line !== null).join('\n');
}

function txtArtifact(kind, record) {
  const metadata = metadataFor(kind, record);
  return [
    titleFor(kind, record),
    `Type: ${kind === 'result' ? 'Saved Result' : 'Run'}`,
    kind === 'result' && record.resultId ? `Result ID: ${record.resultId}` : null,
    kind === 'run' && record.id ? `Run ID: ${record.id}` : null,
    metadataLines(metadata) || null,
    '',
    'PROMPT',
    promptFor(kind, record) || '-',
    '',
    'VARIABLES',
    prettyVariables(variablesFor(record)),
    '',
    'OUTPUT',
    outputFor(kind, record) || '-',
  ].filter((line) => line !== null).join('\n');
}

export function serializeArtifact({ kind, record, format }) {
  if (!['run', 'result'].includes(kind)) throw new Error('Unsupported artifact kind');
  if (!record || typeof record !== 'object') throw new Error('Artifact record is required');
  if (format === 'json') {
    return JSON.stringify({ schema: ARTIFACT_SCHEMA, schemaVersion: SCHEMA_VERSION, kind, record: clone(record) }, null, 2);
  }
  if (format === 'markdown') return markdownArtifact(kind, record);
  if (format === 'txt') return txtArtifact(kind, record);
  throw new Error(`Unsupported export format: ${format}`);
}

export function serializeArtifacts(items = [], format = 'json') {
  const normalized = (Array.isArray(items) ? items : []).map((item) => {
    if (!['run', 'result'].includes(item?.kind) || !item?.record) throw new Error('Invalid artifact bundle item');
    return { kind: item.kind, record: clone(item.record) };
  });
  if (format === 'json') {
    return JSON.stringify({ schema: BUNDLE_SCHEMA, schemaVersion: SCHEMA_VERSION, items: normalized }, null, 2);
  }
  if (!['markdown', 'txt'].includes(format)) throw new Error(`Unsupported export format: ${format}`);
  const separator = format === 'markdown' ? '\n\n---\n\n' : '\n\n====================\n\n';
  return normalized.map(({ kind, record }) => serializeArtifact({ kind, record, format })).join(separator);
}
