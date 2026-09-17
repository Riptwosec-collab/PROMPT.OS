export const V5_PROMPT_SCHEMA_VERSION = 5;

const DEFAULTS = Object.freeze({
  displayTitle: '',
  displayTitleTh: '',
  description: '',
  descriptionTh: '',
  category: '',
  categoryTh: '',
  subcategory: '',
  tags: [],
  collections: [],
  workspaceId: null,
  folderId: null,
  variables: {},
  variableConfig: {},
  usageGuideEn: '',
  usageGuideTh: '',
  sampleInput: '',
  exampleOutput: '',
  favorite: false,
  pinned: false,
  rating: 0,
  runs: 0,
  copyCount: 0,
  lastUsedAt: null,
  versions: [],
  results: [],
  catalogManaged: false,
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
});

export function normalizePromptRecord(prompt) {
  const source = prompt && typeof prompt === 'object' && !Array.isArray(prompt) ? prompt : {};
  return {
    ...DEFAULTS,
    ...source,
    schemaVersion: V5_PROMPT_SCHEMA_VERSION,
    tags: Array.isArray(source.tags) ? source.tags : [],
    collections: Array.isArray(source.collections) ? source.collections : [],
    variables: source.variables && typeof source.variables === 'object' && !Array.isArray(source.variables)
      ? source.variables
      : {},
    variableConfig: source.variableConfig && typeof source.variableConfig === 'object' && !Array.isArray(source.variableConfig)
      ? source.variableConfig
      : {},
    versions: Array.isArray(source.versions) ? source.versions : [],
    results: Array.isArray(source.results) ? source.results : [],
  };
}

export function validatePromptRecord(prompt) {
  const errors = [];
  if (!prompt || typeof prompt !== 'object' || Array.isArray(prompt)) {
    return { ok: false, errors: ['prompt must be an object'] };
  }
  if (typeof prompt.id !== 'string' || !prompt.id.trim()) errors.push('id is required');
  if (typeof prompt.name !== 'string' || !prompt.name.trim()) errors.push('name is required');
  if (typeof prompt.prompt !== 'string') errors.push('prompt is required');
  if (!Number.isFinite(prompt.schemaVersion)) errors.push('schemaVersion must be numeric');
  return { ok: errors.length === 0, errors };
}
