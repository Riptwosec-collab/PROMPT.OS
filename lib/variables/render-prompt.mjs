function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function getDefault(field = {}) {
  if (Object.prototype.hasOwnProperty.call(field, 'default')) return field.default;
  if (Object.prototype.hasOwnProperty.call(field, 'defaultValue')) return field.defaultValue;
  return undefined;
}

function renderValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value && typeof value === 'object' && typeof value.name === 'string') return value.name;
  return String(value);
}

export function renderPromptTemplate(template, variableConfig = {}, values = {}) {
  const unresolvedRequired = [];
  const text = String(template || '').replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => {
    const field = variableConfig?.[key] || {};
    const explicit = values?.[key];
    const fallback = getDefault(field);
    const value = isBlank(explicit) ? fallback : explicit;

    if (!isBlank(value)) return renderValue(value);

    if (field.required) {
      unresolvedRequired.push(key);
      return full;
    }

    return '';
  });

  return {
    text,
    unresolvedRequired: [...new Set(unresolvedRequired)],
  };
}
