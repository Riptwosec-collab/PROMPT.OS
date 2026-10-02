import { createDraft } from './draft-model.mjs';

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createDerivedDraft(builtIn, {
  idFactory = () => `user:${crypto.randomUUID()}`,
  draftIdFactory = () => `draft:${crypto.randomUUID()}`,
} = {}) {
  if (!builtIn?.id) throw new Error('Built-in prompt is required');
  const promptId = String(idFactory());
  const draftId = String(draftIdFactory());
  const title = `${builtIn.displayTitleTh || builtIn.displayTitle || builtIn.title || builtIn.name || 'Prompt'} — Custom`;
  return createDraft({
    promptId,
    draftId,
    title,
    rawPrompt: String(builtIn.prompt || builtIn.template || ''),
    variableConfig: clone(builtIn.variableConfig || builtIn.variableSchema || {}),
    derivedFromPromptId: String(builtIn.id),
    sourceBuiltInSnapshot: clone(builtIn),
    syncState: 'local',
  });
}
