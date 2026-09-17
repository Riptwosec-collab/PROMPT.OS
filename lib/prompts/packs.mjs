function uniqueIds(promptIds = []) {
  const result = [];
  const seen = new Set();
  for (const id of Array.isArray(promptIds) ? promptIds : []) {
    const key = String(id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(id);
  }
  return result;
}

export function createPack({ id, name, promptIds = [] } = {}) {
  return {
    id: String(id || ''),
    name: String(name || ''),
    promptIds: uniqueIds(promptIds),
  };
}

export function addPromptToPack(pack = {}, promptId) {
  return {
    ...pack,
    promptIds: uniqueIds([...(Array.isArray(pack.promptIds) ? pack.promptIds : []), promptId]),
  };
}

export function removePromptFromPack(pack = {}, promptId) {
  const target = String(promptId);
  return {
    ...pack,
    promptIds: uniqueIds(pack.promptIds).filter((id) => String(id) !== target),
  };
}
