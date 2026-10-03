function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function defaultForField(field = {}) {
  if (Object.hasOwn(field, 'default')) return clone(field.default);
  if (Object.hasOwn(field, 'defaultValue')) return clone(field.defaultValue);
  if (field.type === 'boolean' || field.type === 'toggle') return false;
  if (field.type === 'multi-select') return [];
  return '';
}

export function exampleValuesForPrompt(prompt = {}) {
  return clone(prompt.exampleValues || {});
}

export function clearValuesForPrompt(prompt = {}) {
  return Object.fromEntries(
    Object.entries(prompt.variableConfig || prompt.variableSchema || {}).map(([name, field]) => [name, defaultForField(field)]),
  );
}
