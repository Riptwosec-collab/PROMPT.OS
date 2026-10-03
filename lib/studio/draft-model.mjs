function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export const DRAFT_SECTION_KEYS = Object.freeze(['role', 'goal', 'context', 'inputs', 'constraints', 'outputFormat', 'examples', 'variables', 'notes']);

const SECTION_LABELS = Object.freeze({
  role: 'Role', goal: 'Goal', context: 'Context', inputs: 'Inputs', constraints: 'Constraints',
  outputFormat: 'Output Format', examples: 'Examples', variables: 'Variables', notes: 'Notes',
});

export function composeStructuredPrompt(sections = {}) {
  return DRAFT_SECTION_KEYS.map((key) => {
    const value = sections[key];
    const text = Array.isArray(value) ? value.join('\n') : String(value ?? '').trim();
    return text ? `# ${SECTION_LABELS[key]}\n${text}` : '';
  }).filter(Boolean).join('\n\n');
}

export function createDraft(input = {}) {
  const promptId = String(input.promptId || input.id || crypto.randomUUID());
  const draftId = String(input.draftId || `draft:${promptId}`);
  const sections = Object.fromEntries(DRAFT_SECTION_KEYS.map((key) => [key, clone(input.sections?.[key] ?? '')]));
  const explicitRaw = input.rawPrompt ?? input.prompt;
  return {
    draftId,
    promptId,
    title: String(input.title || 'Untitled Prompt'),
    sections,
    rawPrompt: String(explicitRaw ?? composeStructuredPrompt(sections)),
    variableConfig: clone(input.variableConfig || {}),
    derivedFromPromptId: input.derivedFromPromptId == null ? null : String(input.derivedFromPromptId),
    sourceBuiltInSnapshot: clone(input.sourceBuiltInSnapshot ?? null),
    syncState: String(input.syncState || 'local'),
    revision: Number.isFinite(Number(input.revision)) ? Number(input.revision) : 0,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}

export function updateDraftSection(draft, key, value) {
  if (!DRAFT_SECTION_KEYS.includes(key)) throw new Error(`Unknown draft section: ${key}`);
  const next = createDraft({ ...clone(draft), sections: { ...(draft?.sections || {}), [key]: clone(value) } });
  next.rawPrompt = composeStructuredPrompt(next.sections);
  return next;
}

export function updateDraftRaw(draft, rawPrompt) {
  return createDraft({ ...clone(draft), rawPrompt: String(rawPrompt ?? '') });
}

export function restoreVersionToDraft(version, overrides = {}) {
  if (!version?.versionId || !version?.promptId) throw new Error('Version is required');
  const metadata = version.metadataSnapshot || {};
  return createDraft({
    draftId: overrides.draftId || `draft:${version.promptId}`,
    promptId: version.promptId,
    title: overrides.title || metadata.title || version.label || 'Restored Prompt',
    rawPrompt: version.promptSnapshot || '',
    variableConfig: clone(version.variableConfigSnapshot || {}),
    sections: clone(version.sectionsSnapshot || metadata.sections || {}),
    derivedFromPromptId: metadata.derivedFromPromptId ?? null,
    sourceBuiltInSnapshot: metadata.sourceBuiltInSnapshot ?? null,
    revision: 0,
    syncState: 'local',
  });
}
