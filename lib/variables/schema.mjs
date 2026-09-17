export const VARIABLE_TYPES = Object.freeze([
  'text',
  'textarea',
  'number',
  'select',
  'multi-select',
  'boolean',
  'toggle',
  'date',
  'url',
  'code',
  'language',
  'file',
]);

const TYPE_SET = new Set(VARIABLE_TYPES);

function detectedVariables(promptText = '') {
  const matches = [...String(promptText).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

function normalizeField(name, field = {}) {
  const type = TYPE_SET.has(field.type) ? field.type : 'text';
  const normalized = {
    type,
    required: Boolean(field.required),
    label: field.label || name,
    placeholder: field.placeholder || '',
  };

  if (Object.prototype.hasOwnProperty.call(field, 'default')) normalized.default = field.default;
  if (Object.prototype.hasOwnProperty.call(field, 'defaultValue')) normalized.defaultValue = field.defaultValue;
  if (type === 'select' || type === 'multi-select' || type === 'language') {
    normalized.options = Array.isArray(field.options)
      ? [...new Set(field.options.map((option) => String(option)))]
      : [];
  }

  return normalized;
}

export function normalizeVariableSchema(promptText = '', schema = {}) {
  const explicit = schema && typeof schema === 'object' ? schema : {};
  const keys = [...new Set([...detectedVariables(promptText), ...Object.keys(explicit)])];

  return Object.fromEntries(
    keys.map((name) => [name, normalizeField(name, explicit[name])]),
  );
}
