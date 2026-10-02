function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value ?? null;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableString(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(stableValue(value), null, 2);
}

function normalizedArtifact(input = {}) {
  const kind = String(input.kind || 'unknown');
  const record = input.record || {};

  if (kind === 'run') {
    return {
      kind,
      id: String(record.id || ''),
      prompt: String(record.promptSnapshot || record.renderedPrompt || ''),
      variables: clone(record.variablesSnapshot || {}),
      metadata: {
        provider: record.provider ?? null,
        model: record.model ?? null,
        status: record.status ?? null,
        responseId: record.responseId ?? null,
      },
      output: String(record.output || ''),
    };
  }

  if (kind === 'result') {
    return {
      kind,
      id: String(record.resultId || record.id || ''),
      prompt: String(record.promptSnapshot || ''),
      variables: clone(record.variablesSnapshot || {}),
      metadata: clone({
        ...(record.metadataSnapshot || {}),
        name: record.name ?? null,
        pinned: record.pinned ?? null,
        tags: record.tags || [],
        notes: record.notes ?? null,
      }),
      output: String(record.outputSnapshot || record.output || ''),
    };
  }

  if (kind === 'version') {
    return {
      kind,
      id: String(record.versionId || ''),
      prompt: String(record.promptSnapshot || ''),
      variables: clone(record.variableConfigSnapshot || {}),
      metadata: clone({ ...(record.metadataSnapshot || {}), label: record.label ?? null, status: record.status ?? null, versionNumber: record.versionNumber ?? null }),
      output: '',
    };
  }

  if (kind === 'draft') {
    return {
      kind,
      id: String(record.draftId || record.promptId || ''),
      prompt: String(record.rawPrompt || record.prompt || ''),
      variables: clone(record.variableConfig || {}),
      metadata: clone({ title: record.title ?? null, derivedFromPromptId: record.derivedFromPromptId ?? null, revision: record.revision ?? null }),
      output: '',
    };
  }

  throw new Error(`Unsupported compare artifact kind: ${kind}`);
}

function section(key, left, right) {
  const leftText = stableString(left);
  const rightText = stableString(right);
  return { key, left: leftText, right: rightText, changed: leftText !== rightText };
}

export function compareArtifacts(leftInput, rightInput) {
  const left = normalizedArtifact(leftInput);
  const right = normalizedArtifact(rightInput);
  const sections = [
    section('prompt', left.prompt, right.prompt),
    section('variables', left.variables, right.variables),
    section('metadata', left.metadata, right.metadata),
    section('output', left.output, right.output),
  ];
  return {
    left,
    right,
    sections,
    hasChanges: sections.some((item) => item.changed),
  };
}
