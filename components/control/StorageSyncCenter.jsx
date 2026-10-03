'use client';

import React from 'react';
import { formatBytes } from '../../lib/control/storage.mjs';

function Stat({ label, value }) {
  return <div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[9px] font-mono uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 text-sm font-medium text-slate-200">{value}</p></div>;
}

export default function StorageSyncCenter({
  storage = { available: false, usage: null, quota: null },
  counts = { runs: 0, results: 0, drafts: 0, versions: 0 },
  syncSummary = { local: 0, pending: 0, syncing: 0, synced: 0, conflict: 0, sync_error: 0, total: 0 },
  cloudAdapter = null,
  onSyncNow,
  onRetryFailed,
  onViewPending,
  onViewConflicts,
  onDeleteRuns,
  onDeleteResults,
  onExportBackup,
  onRestoreBackup,
}) {
  const confirmCleanup = async (kind) => {
    const handler = kind === 'runs' ? onDeleteRuns : onDeleteResults;
    if (!handler) return;
    const label = kind === 'runs' ? 'selected Runs' : 'selected Saved Results';
    if (!window.confirm(`Delete ${label}? This cleanup is explicit and cannot be undone.`)) return;
    await handler();
  };

  return (
    <main className="h-full overflow-auto p-4 md:p-6" aria-labelledby="storage-sync-title">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/60">CONTROL CENTER</p>
          <h1 id="storage-sync-title" className="mt-1 text-2xl font-semibold text-white">Storage & Sync</h1>
          <p className="mt-1 text-xs text-slate-500">Measured local storage and persisted sync queue state only.</p>
        </header>

        <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="storage-health-title">
          <div className="flex items-center justify-between gap-3"><h2 id="storage-health-title" className="text-sm font-semibold text-white">Storage Health</h2><span className="text-[10px] text-slate-600">persisted records</span></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Runs" value={counts.runs ?? 0} /><Stat label="Saved Results" value={counts.results ?? 0} /><Stat label="Drafts" value={counts.drafts ?? 0} /><Stat label="Versions" value={counts.versions ?? 0} /></div>
          {storage.available ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><Stat label="Used" value={formatBytes(storage.usage)} /><Stat label="Quota" value={formatBytes(storage.quota)} /></div> : <p className="mt-3 rounded-xl border border-white/10 p-4 text-sm text-slate-500">Unavailable</p>}
        </section>

        <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="sync-health-title">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="sync-health-title" className="text-sm font-semibold text-white">Sync Health</h2><p className="mt-1 text-xs text-slate-500">Local queue stays authoritative while cloud is absent or offline.</p></div><button type="button" disabled={!cloudAdapter} onClick={() => cloudAdapter && onSyncNow?.(cloudAdapter)} className="min-h-11 rounded-xl border border-cyan-300/20 px-4 text-xs text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35">Sync Now</button></div>
          {!cloudAdapter ? <p className="mt-3 text-xs text-amber-200/80">No real cloud adapter configured. Prompt.OS remains local-only.</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Local" value={syncSummary.local ?? 0} /><Stat label="Pending" value={syncSummary.pending ?? 0} /><Stat label="Syncing" value={syncSummary.syncing ?? 0} /><Stat label="Synced" value={syncSummary.synced ?? 0} /><Stat label="Conflicts" value={syncSummary.conflict ?? 0} /><Stat label="Errors" value={syncSummary.sync_error ?? 0} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onRetryFailed} disabled={!syncSummary.sync_error} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300 disabled:opacity-35">Retry Failed</button><button type="button" onClick={onViewPending} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">View Pending</button><button type="button" onClick={onViewConflicts} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">View Conflicts</button></div>
        </section>

        <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="cleanup-title">
          <h2 id="cleanup-title" className="text-sm font-semibold text-white">Explicit Cleanup</h2><p className="mt-1 text-xs text-slate-500">Nothing is automatically pruned. Select what to remove from its source workspace first.</p>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!onDeleteRuns} onClick={() => confirmCleanup('runs')} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-35">Delete selected Runs</button><button type="button" disabled={!onDeleteResults} onClick={() => confirmCleanup('results')} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-35">Delete selected Saved Results</button></div>
          {!onDeleteRuns && !onDeleteResults ? <p className="mt-2 text-[10px] text-slate-600">Choose records in Run History or Saved Results before cleanup becomes available.</p> : null}
        </section>

        <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="backup-title">
          <h2 id="backup-title" className="text-sm font-semibold text-white">Backup / Restore</h2><p className="mt-1 text-xs text-slate-500">Backup is validated before any restore write. Built-in prompt definitions are never replaced.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onExportBackup} disabled={!onExportBackup} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200 disabled:opacity-35">Export Backup</button><button type="button" onClick={onRestoreBackup} disabled={!onRestoreBackup} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200 disabled:opacity-35">Restore Backup</button></div>
        </section>
      </div>
    </main>
  );
}
