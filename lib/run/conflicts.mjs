function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createConflictCopy({
  localRecord,
  cloudRecord,
  now = Date.now,
  idFactory = () => crypto.randomUUID(),
  keyField = 'id',
} = {}) {
  if (!localRecord || !cloudRecord) throw new Error('Local and cloud records are required');
  if (!Object.prototype.hasOwnProperty.call(localRecord, keyField)) throw new Error(`Local record is missing ${keyField}`);
  if (!Object.prototype.hasOwnProperty.call(cloudRecord, keyField)) throw new Error(`Cloud record is missing ${keyField}`);

  return {
    ...clone(localRecord),
    [keyField]: idFactory(),
    syncState: 'conflict',
    conflictOf: cloudRecord[keyField],
    conflictDetectedAt: new Date(now()).toISOString(),
    sourceRevision: localRecord.revision ?? 0,
  };
}
