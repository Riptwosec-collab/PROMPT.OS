import { normalizePromptRecord, validatePromptRecord } from './state-schema.mjs';

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
}

function sameJsonShape(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function migratePromptState(prompts) {
  if (!Array.isArray(prompts)) {
    return { ok: false, prompts, changed: false, errors: ['prompts must be an array'] };
  }

  const migrated = [];
  const errors = [];
  let changed = false;

  for (let index = 0; index < prompts.length; index += 1) {
    const sourceCopy = cloneValue(prompts[index]);
    const normalized = normalizePromptRecord(sourceCopy);
    const validation = validatePromptRecord(normalized);
    if (!validation.ok) {
      errors.push(...validation.errors.map((error) => `prompt[${index}]: ${error}`));
      continue;
    }
    if (!sameJsonShape(sourceCopy, normalized)) changed = true;
    migrated.push(normalized);
  }

  if (errors.length > 0) {
    return { ok: false, prompts, changed: false, errors };
  }

  return { ok: true, prompts: migrated, changed, errors: [] };
}
