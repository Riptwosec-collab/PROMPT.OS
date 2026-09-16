'use client';

import React from 'react';

const MODE_LABELS = {
  ready: 'CLOUD LIVE',
  syncing: 'SYNCING',
  offline: 'OFFLINE',
  error: 'SYNC ERROR',
  recovering: 'RECOVERING',
};

export default function StatusHud({ status = {} }) {
  const mode = status.mode || 'ready';
  const label = MODE_LABELS[mode] || String(mode).toUpperCase();
  const dotClass = mode === 'error' ? 'bg-red-400' : mode === 'offline' ? 'bg-amber-400' : mode === 'syncing' ? 'bg-violet-300 animate-pulse' : 'bg-emerald-400';

  return (
    <footer className="v5-glass hidden md:flex h-8 shrink-0 items-center justify-between gap-4 px-4 border-t border-cyan-300/10 text-[9px] font-mono tracking-[0.12em] text-slate-500">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className="text-slate-300">{label}</span>
        <span>REV {status.revision ?? '—'}</span>
        <span>{Number(status.pendingCount || 0)} PENDING</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span>{status.lastSyncedAt ? `SYNCED ${status.lastSyncedAt}` : 'NOT SYNCED'}</span>
        <span className="text-cyan-300/70">{status.version || 'V5 PREVIEW'}</span>
      </div>
    </footer>
  );
}
