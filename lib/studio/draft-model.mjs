function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export const DRAFT_SECTION_KEYS = Object.freeze(['role', 'goal', 'context', 'inputs', 'constraints', 'outputFormat', 'examples', 'variables', 'notes']);

export function createDraft(input = {}) {
  const promptId = String(input.promptId || input.id || crypto.randomUUID());
  const draftId = String(input.draftId || `draft:${promptId}`);
  const sections = Object.fromEntries(DRAFT_SECTION_KEYS.map((key) => [key, clone(input.sections?.[key] ?? '')]));
  return {
    draftId,
    promptId,
    title: String(input.title || 'Untitled Prompt'),
    sections,
    rawPrompt: String(input.rawPrompt ?? input.prompt ?? ''),
    variableConfig: clone(input.variableConfig || {}),
    derivedFromPromptId: input.derivedFromPromptId == null ? null : String(input.derivedFromPromptId),
    sourceBuiltInSnapshot: clone(input.sourceBuiltInSnapshot ?? null),
    syncState: String(input.syncState || 'local'),
    revision: Number.isFinite(Number(input.revision)) ? Number(input.revision) : 0,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
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
