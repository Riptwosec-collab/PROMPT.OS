'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { V5_NAV_ITEMS } from '../../lib/ui/v5-navigation.mjs';

function navGlyph(item) {
  const glyphs = {
    home: '⌂',
    library: '◇',
    workspaces: '▦',
    evaluation: '◎',
    improve: '✦',
    analytics: '↗',
    cloud: '☁',
    trash: '⌫',
    settings: '⚙',
  };
  return glyphs[item.id] || '•';
}

export default function Sidebar({ activePage, onNavigate, collapsed = false, onToggleCollapsed }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.aside
      className="v5-glass hidden h-full shrink-0 flex-col overflow-hidden border-r border-cyan-300/10 md:flex"
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 340, damping: 34, mass: 0.8 }}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-cyan-300/10 px-3">
        <div className="min-w-0 overflow-hidden">
          <div className="truncate text-[10px] tracking-[0.24em] text-cyan-300/70">PROMPT.OS</div>
          {!collapsed ? <div className="mt-1 truncate text-[10px] text-white/55">Control plane</div> : null}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="min-h-11 min-w-11 shrink-0 rounded-xl border border-white/10 text-xs text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {V5_NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex min-h-11 w-full items-center overflow-hidden rounded-xl border px-2 text-left ${active ? 'border-cyan-300/20 text-cyan-50' : 'border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-cyan-100'}`}
              title={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="v5-nav-active"
                  className="v5-nav-active pointer-events-none absolute inset-0 rounded-xl"
                  transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
                />
              ) : null}
              <span className="v5-nav-icon-cell relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm" aria-hidden="true">
                {navGlyph(item)}
              </span>
              {!collapsed ? <span className="relative z-10 min-w-0 truncate px-2 text-[10px] font-mono tracking-[0.1em]">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
