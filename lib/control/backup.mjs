import { AI_PROMPT_LIBRARY } from '../prompts/ai-prompt-library.mjs';
import {
  loadPromptCatalogState,
  persistPromptCatalogState,
  readStoredPromptDatabase,
} from '../prompts/client-store.mjs';

const BACKUP_SCHEMA = 'prompt-os-backup';
const BACKUP_VERSION = 1;
const SAFE_SETTING_KEYS = ['language', 'theme', 'density', 'appearance', 'accentColor'];
const RUNTIME_COLLECTIONS = Object.freeze({
  drafts: { store: 'promptDrafts', idKey: 'draftId' },
  versions: { store: 'promptVersions', idKey: 'versionId' },
  runs: { store: 'runs', idKey: 'id' },
  results: { store: 'savedResults', idKey: 'resultId' },
});

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

function sameRecord(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

function importedId(base, idFactory) {
  return `${String(base || 'item')}:import:${String(idFactory())}`;
}

export function readPromptBackupData(storage) {
  const { prompts, database } = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
  const source = database && !Array.isArray(database) && typeof database === 'object' ? database : {};
  return {
    customPrompts: prompts.filter(isUserPrompt).map(withoutBuiltInSnapshot),
    packs: Array.isArray(source.promptPacks) ? clone(source.promptPacks) : [],
    favorites: prompts.filter((prompt) => Boolean(prompt.favorite)).map((prompt) => String(prompt.id)),
    settings: safeSettings(source.settings || {}),
  };
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

async function readRuntimeState(db) {
  const names = Object.values(RUNTIME_COLLECTIONS).map((item) => item.store);
  const tx = db.transaction(names, 'readonly');
  const entries = await Promise.all(Object.entries(RUNTIME_COLLECTIONS).map(async ([collection, config]) => [collection, await requestValue(tx.objectStore(config.store).getAll())]));
  await transactionDone(tx);
  return Object.fromEntries(entries);
}

function sanitizeBuiltInCollisions(backup, idFactory) {
  const next = clone(backup);
  const builtInIds = new Set(AI_PROMPT_LIBRARY.map((prompt) => String(prompt.id)));
  const promptIdMap = new Map();
  next.data.customPrompts = next.data.customPrompts.map((prompt) => {
    const original = String(prompt.id || '');
    if (!builtInIds.has(original)) return prompt;
    const mapped = `user:import:${String(idFactory())}`;
    promptIdMap.set(original, mapped);
    return { ...prompt, id: mapped, builtIn: false, owner: 'user', catalogManaged: false };
  });
  const mapPromptId = (value) => promptIdMap.get(String(value)) || value;
  next.data.drafts = next.data.drafts.map((item) => ({ ...item, promptId: mapPromptId(item.promptId) }));
  next.data.versions = next.data.versions.map((item) => ({ ...item, promptId: mapPromptId(item.promptId) }));
  next.data.runs = next.data.runs.map((item) => ({ ...item, promptId: mapPromptId(item.promptId) }));
  next.data.packs = next.data.packs.map((item) => ({ ...item, promptIds: (item.promptIds || []).map(mapPromptId) }));
  next.data.favorites = next.data.favorites.map((id) => String(mapPromptId(id)));
  return next;
}

function preparePromptState(storage, backup, plan, idFactory) {
  const { prompts: currentPrompts, database } = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
  const baseDatabase = database && !Array.isArray(database) && typeof database === 'object' ? clone(database) : {};
  const builtInIds = new Set(AI_PROMPT_LIBRARY.map((prompt) => String(prompt.id)));
  const promptById = new Map(currentPrompts.map((prompt) => [String(prompt.id), clone(prompt)]));
  const promptIdMap = new Map();

  const customConflicts = new Map(plan.conflicts.filter((item) => item.collection === 'customPrompts').map((item) => [item.id, item]));
  for (const incoming of backup.data.customPrompts) {
    const originalId = String(incoming.id || '');
    if (!originalId) continue;
    let targetId = originalId;
    const current = promptById.get(originalId);
    if (builtInIds.has(originalId) || (current && !sameRecord(current, incoming))) targetId = importedId(originalId, idFactory);
    if (customConflicts.get(originalId)?.strategy === 'replace') targetId = originalId;
    promptIdMap.set(originalId, targetId);
    promptById.set(targetId, { ...clone(incoming), id: targetId, builtIn: false, owner: 'user', catalogManaged: false });
  }

  const mapPromptId = (value) => String(promptIdMap.get(String(value)) || value);
  const favoriteIds = new Set((backup.data.favorites || []).map(mapPromptId));
  for (const [id, prompt] of promptById) {
    if (favoriteIds.has(id)) promptById.set(id, { ...prompt, favorite: true });
  }

  const packsById = new Map((Array.isArray(baseDatabase.promptPacks) ? baseDatabase.promptPacks : []).map((pack) => [String(pack.id), clone(pack)]));
  for (const pack of backup.data.packs || []) {
    let id = String(pack.id || '');
    if (!id) continue;
    if (packsById.has(id) && !sameRecord(packsById.get(id), pack)) id = importedId(id, idFactory);
    packsById.set(id, { ...clone(pack), id, promptIds: (pack.promptIds || []).map(mapPromptId) });
  }

  const settings = { ...(baseDatabase.settings || {}) };
  for (const [key, value] of Object.entries(safeSettings(backup.data.settings || {}))) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) settings[key] = clone(value);
    else if (plan.conflicts.some((item) => item.collection === 'settings' && item.id === key && item.strategy === 'replace')) settings[key] = clone(value);
  }

  return {
    prompts: [...promptById.values()],
    baseDatabase: { ...baseDatabase, promptPacks: [...packsById.values()], settings },
    promptIdMap,
  };
}

function remapRuntimeRecord(collection, record, maps) {
  const next = clone(record);
  if (next.promptId != null) next.promptId = maps.promptId.get(String(next.promptId)) || next.promptId;
  if (collection === 'results' && next.sourceRunId != null) next.sourceRunId = maps.runId.get(String(next.sourceRunId)) || next.sourceRunId;
  return next;
}

export async function applyBackupRestore(backupInput, {
  db,
  storage,
  idFactory = () => crypto.randomUUID(),
  replaceMutable = false,
  confirmDestructive = false,
} = {}) {
  const validation = validateBackup(backupInput);
  if (!validation.ok) return { ok: false, errors: validation.errors, applied: 0, conflicts: 0 };
  if (!db) return { ok: false, errors: ['Runtime database is required'], applied: 0, conflicts: 0 };
  const parsed = typeof backupInput === 'string' ? JSON.parse(backupInput) : clone(backupInput);
  const backup = sanitizeBuiltInCollisions(parsed, idFactory);
  const [runtime, promptState] = await Promise.all([readRuntimeState(db), Promise.resolve(readPromptBackupData(storage))]);
  const localState = { ...runtime, ...promptState };
  const plan = planRestore(backup, localState, { replaceMutable });
  if (!plan.ok) return { ok: false, errors: plan.errors, applied: 0, conflicts: 0 };
  if (plan.requiresDestructiveConfirmation && !confirmDestructive) {
    return { ok: false, errors: [], requiresConfirmation: true, plan, applied: 0, conflicts: plan.conflicts.length };
  }

  const promptPrepared = preparePromptState(storage, backup, plan, idFactory);
  const maps = { promptId: promptPrepared.promptIdMap, runId: new Map() };
  const createsByCollection = new Map();
  for (const [collection] of Object.entries(RUNTIME_COLLECTIONS)) createsByCollection.set(collection, []);

  for (const [collection, config] of Object.entries(RUNTIME_COLLECTIONS)) {
    const local = new Map((runtime[collection] || []).map((item) => [String(item[config.idKey]), item]));
    for (const incomingRaw of backup.data[collection] || []) {
      let incoming = remapRuntimeRecord(collection, incomingRaw, maps);
      const originalId = String(incoming[config.idKey] || '');
      if (!originalId) continue;
      const existing = local.get(originalId);
      if (existing && sameRecord(existing, incoming)) continue;
      let targetId = originalId;
      if (existing) targetId = importedId(originalId, idFactory);
      if (collection === 'runs' && targetId !== originalId) maps.runId.set(originalId, targetId);
      incoming = { ...incoming, [config.idKey]: targetId };
      if (collection === 'versions') {
        const usedNumbers = new Set([...local.values(), ...createsByCollection.get('versions')]
          .filter((item) => String(item.promptId) === String(incoming.promptId))
          .map((item) => Number(item.versionNumber)));
        let versionNumber = Number(incoming.versionNumber || 1);
        while (usedNumbers.has(versionNumber)) versionNumber += 1;
        incoming.versionNumber = versionNumber;
      }
      createsByCollection.get(collection).push(incoming);
      local.set(targetId, incoming);
    }
  }

  // Results are remapped after Run collision IDs are known.
  createsByCollection.set('results', createsByCollection.get('results').map((item) => remapRuntimeRecord('results', item, maps)));

  const stores = Object.values(RUNTIME_COLLECTIONS).map((item) => item.store);
  const tx = db.transaction(stores, 'readwrite');
  try {
    for (const [collection, config] of Object.entries(RUNTIME_COLLECTIONS)) {
      const store = tx.objectStore(config.store);
      for (const record of createsByCollection.get(collection)) store.put(clone(record));
    }
    await transactionDone(tx);
  } catch (error) {
    try { tx.abort(); } catch {}
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)], applied: 0, conflicts: plan.conflicts.length };
  }

  if (storage && !persistPromptCatalogState(storage, promptPrepared.prompts, promptPrepared.baseDatabase)) {
    return { ok: false, errors: ['Prompt metadata could not be persisted'], applied: [...createsByCollection.values()].reduce((sum, items) => sum + items.length, 0), conflicts: plan.conflicts.length, partial: true };
  }

  const runtimeApplied = [...createsByCollection.values()].reduce((sum, items) => sum + items.length, 0);
  const promptApplied = backup.data.customPrompts.length + backup.data.packs.length + backup.data.favorites.length + Object.keys(backup.data.settings).length;
  return { ok: true, errors: [], applied: runtimeApplied + promptApplied, conflicts: plan.conflicts.length, plan };
}
