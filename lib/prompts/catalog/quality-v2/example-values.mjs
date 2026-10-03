function hasValue(value) {
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
}

function configuredDefault(field = {}) {
  if (Object.prototype.hasOwnProperty.call(field, 'defaultValue') && hasValue(field.defaultValue)) return field.defaultValue;
  if (Object.prototype.hasOwnProperty.call(field, 'default') && hasValue(field.default)) return field.default;
  return undefined;
}

function firstOption(field = {}) {
  return Array.isArray(field.options) && field.options.length ? field.options[0] : undefined;
}

export function exampleValueForVariable(name, field = {}) {
  const preset = configuredDefault(field);
  if (preset !== undefined) return structuredClone(preset);

  const type = String(field.type || 'text');
  if (name === 'language' || type === 'language') return firstOption(field) ?? 'Thai';
  if (type === 'select' || type === 'tone') return firstOption(field) ?? 'Thai';
  if (type === 'multi-select') {
    const option = firstOption(field);
    return option === undefined ? [] : [option];
  }
  if (type === 'number') return 3;
  if (type === 'boolean' || type === 'toggle') return true;
  if (type === 'date') return '2026-10-03';
  if (type === 'url') return 'https://example.com/source';
  if (type === 'file') return 'example-input.txt';

  const label = String(field.labelTh || field.label || name || 'ข้อมูล').trim();
  return `ตัวอย่างข้อมูลสำหรับ ${label}`;
}

export function buildStructuredExampleValues(variableConfig = {}) {
  return Object.fromEntries(
    Object.entries(variableConfig || {}).map(([name, field]) => [name, exampleValueForVariable(name, field)]),
  );
}
