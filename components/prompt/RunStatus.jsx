'use client';

import React from 'react';

const RUN_LABELS = Object.freeze({
  preparing: 'Preparing',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
  stopped: 'Stopped',
  interrupted: 'Interrupted',
});

const PERSISTENCE_LABELS = Object.freeze({
  idle: 'Local only',
  saving: 'Saving locally',
  saved: 'Saved locally',
  warning: 'Local save warning',
  error: 'Local save warning',
});

const SYNC_LABELS = Object.freeze({
  local: 'Local only',
  pending: 'Waiting to sync',
  syncing: 'Syncing',
  synced: 'Synced',
  conflict: 'Conflict',
  sync_error: 'Sync failed',
});

export default function RunStatus({ status, persistence, syncState }) {
  const persistenceState = typeof persistence === 'string' ? persistence : persistence?.state;
  const persistenceError = typeof persistence === 'object' ? persistence?.error : null;
  const runLabel = RUN_LABELS[status] || (status ? String(status) : 'Ready');
  const persistenceLabel = PERSISTENCE_LABELS[persistenceState] || null;
  const syncLabel = SYNC_LABELS[syncState] || null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400" aria-live="polite" aria-atomic="true" data-run-status>
      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-200">{runLabel}</span>
      {persistenceLabel ? <span className="rounded-full border border-white/10 px-2.5 py-1">{persistenceLabel}</span> : null}
      {syncLabel && syncLabel !== persistenceLabel ? <span className="rounded-full border border-white/10 px-2.5 py-1">{syncLabel}</span> : null}
      {persistenceError ? <span className="text-amber-200">{persistenceError}</span> : null}
    </div>
  );
}
