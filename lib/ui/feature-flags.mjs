const FLAG_NAMES = Object.freeze([
  'V5_WORKSPACE',
  'V5_SYNC',
  'V5_EVALUATION',
  'V5_ANALYTICS',
]);

function enabled(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export function readFeatureFlags(env = {}) {
  return Object.fromEntries(
    FLAG_NAMES.map((name) => [name, enabled(env[`NEXT_PUBLIC_${name}`])]),
  );
}

export function isFeatureEnabled(flags, name) {
  if (!FLAG_NAMES.includes(name)) return false;
  return Boolean(flags?.[name]);
}

export const V5_FEATURE_FLAGS = Object.freeze(readFeatureFlags({
  NEXT_PUBLIC_V5_WORKSPACE: process.env.NEXT_PUBLIC_V5_WORKSPACE,
  NEXT_PUBLIC_V5_SYNC: process.env.NEXT_PUBLIC_V5_SYNC,
  NEXT_PUBLIC_V5_EVALUATION: process.env.NEXT_PUBLIC_V5_EVALUATION,
  NEXT_PUBLIC_V5_ANALYTICS: process.env.NEXT_PUBLIC_V5_ANALYTICS,
}));
