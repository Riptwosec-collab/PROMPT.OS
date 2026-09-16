'use client';

import React from 'react';

const ITEMS = [
  ['home', 'HOME'],
  ['library', 'LIBRARY'],
  ['new', '+'],
  ['evaluation', 'LAB'],
  ['settings', 'MORE'],
];

export default function MobileDock({ activePage, onNavigate, onNewPrompt }) {
  return (
    <nav className="v5-glass md:hidden fixed bottom-3 left-3 right-3 z-[80] rounded-2xl px-2 py-2 grid grid-cols-5 gap-1 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
      {ITEMS.map(([id, label]) => {
        const isNew = id === 'new';
        const active = activePage === id;
        const disabled = isNew && !onNewPrompt;
        return (
          <button
            key={id}
            type="button"
            disabled={isNew && !onNewPrompt}
            onClick={() => (isNew ? onNewPrompt?.() : onNavigate(id))}
            className={`min-h-12 rounded-xl text-[9px] font-mono tracking-[0.12em] ${disabled ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed' : isNew ? 'bg-cyan-300 text-slate-950 font-black text-lg' : active ? 'bg-cyan-300/10 text-cyan-100' : 'text-slate-500 hover:text-cyan-100'}`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
