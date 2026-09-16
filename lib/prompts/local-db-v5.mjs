import { normalizeVariableSchema } from '../variables/schema.mjs';
import { normalizeWorkspaceState } from '../workspace/model.mjs';

export const LOCAL_DB_V5_SCHEMA_VERSION = 5;

function normalizePromptV5(prompt = {}, index = 0) {
  const promptText = String(prompt.prompt || '');
  const explicitVariableSchema = prompt.variableSchema && typeof prompt.variableSchema === 'object'
    ? prompt.variableSchema
    : (prompt.variableConfig && typeof prompt.variableConfig === 'object' ? prompt.variableConfig : {});

  return {
    ...prompt,
    id: prompt.id ?? `prompt-${index + 1}`,
    workspaceId: prompt.workspaceId || 'personal',
    folderId: prompt.folderId || null,
    variableSchema: normalizeVariableSchema(promptText, explicitVariableSchema),
    variables: prompt.variables && typeof prompt.variables === 'object' ? prompt.variables : {},
  };
}

export function upgradeLocalDatabaseV5(raw = {}) {
  const source = Array.isArray(raw) ? { prompts: raw } : (raw && typeof raw === 'object' ? raw : {});
  const workspaceState = normalizeWorkspaceState(source);
  const prompts = (Array.isArray(source.prompts) ? source.prompts : []).map(normalizePromptV5);

  return {
    ...source,
    schemaVersion: LOCAL_DB_V5_SCHEMA_VERSION,
    workspaces: workspaceState.workspaces,
    folders: workspaceState.folders,
    savedViews: Array.isArray(source.savedViews) ? source.savedViews.map((view) => ({ ...view })) : [],
    collections: Array.isArray(source.collections) ? [...source.collections] : [],
    prompts,
  };
}
