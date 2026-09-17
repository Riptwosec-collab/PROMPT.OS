function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function getDefault(field = {}) {
  if (Object.prototype.hasOwnProperty.call(field, 'default')) return field.default;
  if (Object.prototype.hasOwnProperty.call(field, 'defaultValue')) return field.defaultValue;
  return undefined;
}

function optionsFor(field = {}) {
  return Array.isArray(field.options) ? field.options.map((item) => String(item)) : [];
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time);
}

export function validatePromptVariables(variableConfig = {}, values = {}) {
  const errors = {};

  for (const [name, field = {}] of Object.entries(variableConfig || {})) {
    const explicit = values?.[name];
    const fallback = getDefault(field);
    const value = isBlank(explicit) ? fallback : explicit;

    if (field.required && isBlank(value)) {
      errors[name] = 'Required';
      continue;
    }
    if (isBlank(value)) continue;

    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      errors[name] = 'Must be a finite number';
      continue;
    }

    if (field.type === 'select') {
      if (!optionsFor(field).includes(String(value))) errors[name] = 'Must match an allowed option';
      continue;
    }

    if (field.type === 'multi-select') {
      const options = optionsFor(field);
      if (!Array.isArray(value) || value.some((item) => !options.includes(String(item)))) {
        errors[name] = 'Must be an array of allowed options';
      }
      continue;
    }

    if ((field.type === 'boolean' || field.type === 'toggle') && typeof value !== 'boolean') {
      errors[name] = 'Must be true or false';
      continue;
    }

    if (field.type === 'date' && !validDate(value)) {
      errors[name] = 'Must be a valid YYYY-MM-DD date';
      continue;
    }

    if (field.type === 'url') {
      try {
        const parsed = new URL(String(value));
        if (!['http:', 'https:'].includes(parsed.protocol)) errors[name] = 'Must be a valid HTTP(S) URL';
      } catch {
        errors[name] = 'Must be a valid HTTP(S) URL';
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
