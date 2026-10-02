const BACKUP_SCHEMA = 'prompt-os-backup';
const BACKUP_VERSION = 1;
const SAFE_SETTING_KEYS = ['language', 'theme', 'density', 'appearance', 'accentColor'];

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function withoutBuiltInSnapshot(record = {}) {
  const next = clone(record) || {};
  delete next.sourceBuiltInSnapshot;
  if (next.metadataSnapshot && typeof next.metadataSnapshot === 'object') {
    next.metadataSnapshot = { ...next.metadataSnapshot };
    delete next.metadataSnapshot.sourceBuiltInSnapshot;
  }
  return next;
}

function isUserPrompt(prompt = {}) {
  return prompt.builtIn === false
    || prompt.owner === 'user'
    || prompt.sourceType === 'custom'
    || String(prompt.id || '').startsWith('user:');
}

function safeSettings(settings = {}) {
  return Object.fromEntries(SAFE_SETTING_KEYS.flatMap((key) => Object.prototype.hasOwnProperty.call(settings, key) ? [[key, clone(settings[key])]] : []));
}

export function createBackup(snapshot = {}, { now = Date.now } = {}) {
  const customPrompts = Array.isArray(snapshot.customPrompts)
    ? snapshot.customPrompts
    : (snapshot.prompts || []).filter(isUserPrompt);
  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    createdAt: now(),
    data: {
      customPrompts: customPrompts.map(withoutBuiltInSnapshot),
      drafts: (snapshot.drafts || []).map(withoutBuiltInSnapshot),
      versions: (snapshot.versions || []).map(withoutBuiltInSnapshot),
      runs: clone(snapshot.runs || []),
      results: clone(snapshot.results || []),
      packs: (snapshot.packs || []).map((pack) => ({ ...clone(pack), promptIds: [...(pack.promptIds || [])].map(String) })),
      favorites: [...(snapshot.favorites || [])].map(String),
      settings: safeSettings(snapshot.settings || {}),
    },
  };
}

export function validateBackup(input) {
  let backup = input;
  const errors = [];
  if (typeof input === 'string') {
    try { backup = JSON.parse(input); } catch { return { ok: false, errors: ['Invalid JSON'], summary: null }; }
  }
  if (!backup || typeof backup !== 'object') return { ok: false, errors: ['Backup must be an object'], summary: null };
  if (backup.schema !== BACKUP_SCHEMA) errors.push('Unsupported backup schema');
  if (backup.version !== BACKUP_VERSION) errors.push('Unsupported backup version');
  const data = backup.data;
  if (!data || typeof data !== 'object') errors.push('Backup data is required');
  const arrayKeys = ['customPrompts', 'drafts', 'versions', 'runs', 'results', 'packs', 'favorites'];
  for (const key of arrayKeys) if (!Array.isArray(data?.[key])) errors.push(`${key} must be an array`);
  if (!data?.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) errors.push('settings must be an object');
  const summary = errors.length ? null : Object.fromEntries(arrayKeys.map((key) => [key, data[key].length]));
  return { ok: errors.length === 0, errors, summary };
}

const COLLECTION_KEYS = {
  customPrompts: 'id', drafts: 'draftId', versions: 'versionId', runs: 'id', results: 'resultId', packs: 'id',
};
const MUTABLE_COLLECTIONS = new Set(['customPrompts', 'drafts', 'packs']);

function sameRecord(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function planRestore(backupInput, localState = {}, { replaceMutable = false } = {}) {
  const validation = validateBackup(backupInput);
  if (!validation.ok) return { ok: false, errors: validation.errors, creates: [], skips: [], conflicts: [], requiresDestructiveConfirmation: false };
  const backup = typeof backupInput === 'string' ? JSON.parse(backupInput) : backupInput;
  const creates = [];
  const skips = [];
  const conflicts = [];

  for (const [collection, idKey] of Object.entries(COLLECTION_KEYS)) {
    const incoming = backup.data[collection] || [];
    const local = localState[collection] || [];
    const localById = new Map(local.map((item) => [String(item?.[idKey]), item]));
    for (const record of incoming) {
      const id = String(record?.[idKey] || '');
      if (!id) { conflicts.push({ collection, id: null, strategy: 'invalid', incoming: clone(record) }); continue; }
      const current = localById.get(id);
      if (!current) { creates.push({ collection, id, record: clone(record) }); continue; }
      if (sameRecord(current, record)) { skips.push({ collection, id, reason: 'identical' }); continue; }
      if (MUTABLE_COLLECTIONS.has(collection)) {
        conflicts.push({ collection, id, strategy: replaceMutable ? 'replace' : 'preserve_both', local: clone(current), incoming: clone(record) });
      } else {
        conflicts.push({ collection, id, strategy: 'preserve_both', local: clone(current), incoming: clone(record) });
      }
    }
  }

  const incomingFavorites = backup.data.favorites || [];
  const localFavorites = new Set((localState.favorites || []).map(String));
  for (const id of incomingFavorites) if (!localFavorites.has(String(id))) creates.push({ collection: 'favorites', id: String(id), record: String(id) });
  const settingKeys = Object.keys(backup.data.settings || {});
  for (const key of settingKeys) {
    const localValue = localState.settings?.[key];
    const incoming = backup.data.settings[key];
    if (localValue === undefined) creates.push({ collection: 'settings', id: key, record: clone(incoming) });
    else if (JSON.stringify(localValue) === JSON.stringify(incoming)) skips.push({ collection: 'settings', id: key, reason: 'identical' });
    else conflicts.push({ collection: 'settings', id: key, strategy: replaceMutable ? 'replace' : 'preserve_both', local: clone(localValue), incoming: clone(incoming) });
  }

  return {
    ok: true,
    errors: [],
    creates,
    skips,
    conflicts,
    requiresDestructiveConfirmation: Boolean(replaceMutable && conflicts.some((item) => item.strategy === 'replace')),
  };
}
