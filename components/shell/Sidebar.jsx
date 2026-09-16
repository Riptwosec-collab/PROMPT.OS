'use client';

import React from 'react';
import { V5_NAV_ITEMS } from '../../lib/ui/v5-navigation.mjs';

export default function Sidebar({ activePage, onNavigate, collapsed = false }) {
  return (
    <aside className={`v5-glass hidden md:flex h-full flex-col border-r border-cyan-300/10 ${collapsed ? 'w-20' : 'w-64'} transition-[width] duration-300`}>
      <div className="h-16 px-4 flex items-center border-b border-cyan-300/10">
        <div>
          <div className="text-[10px] tracking-[0.32em] text-cyan-300/70">PROMPT.OS</div>
          {!collapsed && <div className="text-xs font-mono text-white/70 mt-1">V5 CONTROL PLANE</div>}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {V5_NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left rounded-xl px-3 py-3 border transition-all ${active ? 'bg-cyan-300/10 border-cyan-300/30 text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,0.08)]' : 'border-transparent text-slate-400 hover:text-cyan-100 hover:bg-white/[0.03]'}`}
              title={item.label}
            >
              <span className="inline-flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-300 shadow-[0_0_12px_var(--v5-cyan)]' : 'bg-slate-700'}`} />
                {!collapsed && <span className="text-[11px] tracking-[0.12em] font-mono truncate">{item.label}</span>}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
