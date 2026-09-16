export function renderPromptVariables(prompt, values = {}) {
  return String(prompt || '').replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => {
    const value = values?.[key];
    if (value === undefined || value === null) return full;
    if (typeof value === 'string' && value.trim() === '') return full;
    return String(value);
  });
}
