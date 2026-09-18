'use client';

import React from 'react';
import { V5_NAV_ITEMS } from '../../lib/ui/v5-navigation.mjs';

export default function TopBar({
  activePage,
  onOpenCommand,
  commandEnabled = Boolean(onOpenCommand),
  status,
}) {
  const item = V5_NAV_ITEMS.find((entry) => entry.id === activePage);
  const title = item?.label || String(activePage || 'home').replaceAll('-', ' ');

  return (
    <header className="v5-glass flex h-16 shrink-0 items-center justify-between gap-3 border-b border-cyan-300/10 px-4 md:px-5">
      <div className="min-w-0">
        <p className="text-[10px] text-cyan-200/55">Prompt.OS / {title}</p>
        <h1 className="truncate text-sm font-semibold text-white md:text-base">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {status ? (
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] text-slate-400 lg:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${status.mode === 'ready' ? 'bg-emerald-300' : 'bg-amber-300'}`} aria-hidden="true" />
            <span>{status.mode || 'status'}</span>
          </div>
        ) : null}
        {commandEnabled && onOpenCommand ? (
          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden min-h-11 items-center gap-3 rounded-xl border border-cyan-300/15 bg-black/20 px-3 text-[10px] text-cyan-100 hover:border-cyan-300/40 sm:flex"
          >
            <span>Search anything</span>
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-slate-400">⌘K</span>
          </button>
        ) : null}
        <div className="rounded-xl border border-violet-300/15 bg-violet-300/[0.04] px-3 py-2 text-[10px] font-mono text-violet-200">TH / EN</div>
      </div>
    </header>
  );
}
