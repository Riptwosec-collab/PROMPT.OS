import {
  AI_PROMPT_LIBRARY,
  PROMPT_CATALOG_VERSION,
  mergePromptCatalog,
} from './ai-prompt-library.mjs';
import { migratePromptState } from './state-migration.mjs';

export const PROMPT_STORAGE_KEY = 'promptVaultData';

export function readStoredPromptDatabase(storage, key = PROMPT_STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storedPrompts(database) {
  if (Array.isArray(database)) return database;
  return Array.isArray(database?.prompts) ? database.prompts : [];
}

export function loadPromptCatalogState(storage, catalog = AI_PROMPT_LIBRARY, key = PROMPT_STORAGE_KEY) {
  const database = readStoredPromptDatabase(storage, key);
  const merged = mergePromptCatalog(storedPrompts(database), catalog);
  const migration = migratePromptState(merged);
  return {
    prompts: migration.ok ? migration.prompts : merged,
    database,
  };
}

export function persistPromptCatalogState(
  storage,
  prompts,
  baseDatabase = null,
  key = PROMPT_STORAGE_KEY,
) {
  if (!storage || typeof storage.setItem !== 'function') return false;

  try {
    const source = baseDatabase ?? readStoredPromptDatabase(storage, key);
    const base = source && !Array.isArray(source) && typeof source === 'object' ? source : {};
    storage.setItem(key, JSON.stringify({
      ...base,
      schemaVersion: Math.max(Number(base.schemaVersion || 0), 5),
      catalogVersion: PROMPT_CATALOG_VERSION,
      prompts: Array.isArray(prompts) ? prompts : [],
      updatedAt: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}
