function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeDeep(child);
  return value;
}

export const VERSION_STATUS = Object.freeze({ STABLE: 'Stable', EXPERIMENTAL: 'Experimental', ARCHIVED: 'Archived' });

export function createVersionSnapshot({ draft, versionId, versionNumber, label = '', status = VERSION_STATUS.EXPERIMENTAL, changeNote = '', parentVersionId = null, createdAt = Date.now() } = {}) {
  if (!draft?.promptId) throw new Error('Draft is required');
  const number = Number(versionNumber);
  if (!Number.isInteger(number) || number < 1) throw new Error('versionNumber must be a positive integer');
  const allowed = new Set(Object.values(VERSION_STATUS));
  const record = {
    versionId: String(versionId || crypto.randomUUID()),
    promptId: String(draft.promptId),
    versionNumber: number,
    label: String(label || `v${number}`),
    status: allowed.has(status) ? status : VERSION_STATUS.EXPERIMENTAL,
    changeNote: String(changeNote || ''),
    promptSnapshot: String(draft.rawPrompt || ''),
    sectionsSnapshot: clone(draft.sections || {}),
    variableConfigSnapshot: clone(draft.variableConfig || {}),
    metadataSnapshot: clone({
      title: draft.title || 'Untitled Prompt',
      derivedFromPromptId: draft.derivedFromPromptId ?? null,
      sourceBuiltInSnapshot: draft.sourceBuiltInSnapshot ?? null,
    }),
    parentVersionId: parentVersionId == null ? null : String(parentVersionId),
    createdAt,
    syncState: String(draft.syncState || 'local'),
    revision: 0,
  };
  return freezeDeep(record);
}
