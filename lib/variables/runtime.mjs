function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function normalizedOptions(field = {}) {
  return Array.isArray(field.options) ? field.options.map((option) => String(option)) : [];
}

export function validateVariableValues(schema = {}, values = {}) {
  const errors = {};

  Object.entries(schema || {}).forEach(([name, field = {}]) => {
    const value = values?.[name];
    const blank = isBlank(value);

    if (field.required && blank) {
      errors[name] = 'Required';
      return;
    }
    if (blank) return;

    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      errors[name] = 'Must be a finite number';
      return;
    }

    if (field.type === 'select') {
      const options = normalizedOptions(field);
      if (!options.includes(String(value))) errors[name] = 'Must match an allowed option';
      return;
    }

    if (field.type === 'multi-select') {
      const options = normalizedOptions(field);
      if (!Array.isArray(value) || value.some((item) => !options.includes(String(item)))) {
        errors[name] = 'Must be an array of allowed options';
      }
      return;
    }

    if (field.type === 'toggle' && typeof value !== 'boolean') {
      errors[name] = 'Must be true or false';
      return;
    }

    if (field.type === 'url') {
      try {
        new URL(String(value));
      } catch {
        errors[name] = 'Must be a valid URL';
      }
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

function renderValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function renderVariableValues(prompt, values = {}, schema = {}) {
  return String(prompt || '').replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => {
    const explicitValue = values?.[key];
    if (!isBlank(explicitValue)) return renderValue(explicitValue);

    const hasExplicitBlank = Object.prototype.hasOwnProperty.call(values || {}, key);
    if (hasExplicitBlank) return full;

    const field = schema?.[key];
    if (field && Object.prototype.hasOwnProperty.call(field, 'default') && !isBlank(field.default)) {
      return renderValue(field.default);
    }

    return full;
  });
}
