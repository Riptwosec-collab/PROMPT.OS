'use client';

import React from 'react';

export default function TopBar({ activePage, onOpenCommand }) {
  return (
    <header className="v5-glass h-16 shrink-0 flex items-center justify-between gap-3 px-4 md:px-5 border-b border-cyan-300/10">
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.28em] text-cyan-300/60 font-mono">ACTIVE_MODULE</p>
        <h1 className="text-sm md:text-base text-white font-semibold truncate">{String(activePage || 'home').toUpperCase()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-black/20 px-3 py-2 text-[10px] font-mono text-cyan-100 hover:border-cyan-300/40"
        >
          <span>COMMAND</span>
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-slate-400">⌘K</span>
        </button>
        <div className="rounded-xl border border-violet-300/15 bg-violet-300/[0.04] px-3 py-2 text-[10px] font-mono text-violet-200">TH / EN</div>
      </div>
    </header>
  );
}
