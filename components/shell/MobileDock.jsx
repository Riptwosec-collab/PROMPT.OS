'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

const ITEMS = [
  ['library', 'LIBRARY', 'library'],
  ['workspaces', 'WORKSPACES', 'workspaces'],
  ['create', 'CREATE', null],
  ['activity', 'ACTIVITY', 'analytics'],
  ['more', 'MORE', null],
];

export default function MobileDock({ activePage, onNavigate, onNewPrompt, onOpenMore }) {
  const reducedMotion = useReducedMotion();

  return (
    <nav className="v5-mobile-dock v5-glass fixed left-3 right-3 z-[80] grid grid-cols-5 gap-1 rounded-2xl border border-white/10 px-1.5 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)] md:hidden" aria-label="Primary navigation">
      {ITEMS.map(([id, label, target]) => {
        const isCreate = id === 'create';
        const isMore = id === 'more';
        const active = target ? activePage === target : false;
        const handleClick = () => {
          if (isCreate) onNewPrompt?.();
          else if (isMore) onOpenMore?.();
          else onNavigate?.(target);
        };

        return (
          <button
            key={id}
            type="button"
            onClick={handleClick}
            className={`relative min-h-12 min-w-0 rounded-xl px-1 text-[9px] font-mono tracking-[0.04em] ${isCreate ? 'v5-mobile-create -translate-y-2 bg-cyan-200 text-slate-950 shadow-[0_10px_30px_rgba(103,232,249,0.18)]' : active ? 'text-cyan-50' : 'text-slate-500'}`}
            aria-current={active ? 'page' : undefined}
          >
            {active ? (
              <motion.span
                layoutId="v5-mobile-active"
                className="v5-mobile-active pointer-events-none absolute inset-1 rounded-lg"
                transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
              />
            ) : null}
            <span className="relative z-10 block truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
