'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { rankCommandItems } from '../../lib/ui/command-palette.mjs';
import PointerSpotlightSurface from '../ui/PointerSpotlightSurface.jsx';

const LISTBOX_ID = 'v5-command-results';

export default function CommandPaletteV5({ open, items = [], onClose, onExecute }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const rankedItems = useMemo(() => rankCommandItems(query, items), [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.focus();

    return () => {
      const target = previousFocusRef.current;
      if (target && typeof target.focus === 'function') target.focus();
    };
  }, [open]);

  useEffect(() => {
    if (selectedIndex < rankedItems.length) return;
    setSelectedIndex(Math.max(0, rankedItems.length - 1));
  }, [rankedItems.length, selectedIndex]);

  const execute = (item) => {
    if (!item) return;
    onExecute?.(item);
    onClose?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => rankedItems.length ? (current + 1) % rankedItems.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => rankedItems.length ? (current - 1 + rankedItems.length) % rankedItems.length : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(rankedItems[selectedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/65 p-0 sm:p-6 md:pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onKeyDown={handleKeyDown}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.12 }}
        >
          <PointerSpotlightSurface className="v5-command-spotlight h-full w-full sm:h-auto sm:max-w-2xl sm:rounded-3xl">
            <motion.section
              className="v5-glass-focus flex h-full min-h-0 w-full flex-col overflow-hidden border border-cyan-200/20 shadow-2xl sm:max-h-[68vh] sm:rounded-3xl"
              initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.995 }}
              transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
            >
              <div className="border-b border-white/10 p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/60">
                  <span>Command Palette</span>
                  <span>Esc to close</span>
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedIndex(0);
                  }}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={LISTBOX_ID}
                  aria-autocomplete="list"
                  aria-activedescendant={rankedItems[selectedIndex] ? `command-option-${rankedItems[selectedIndex].id}` : undefined}
                  placeholder="Search prompts, commands, workflows"
                  className="w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <div id={LISTBOX_ID} role="listbox" aria-label="Command results" className="min-h-0 flex-1 overflow-y-auto p-2">
                {rankedItems.length ? rankedItems.map((item, index) => {
                  const selected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      id={`command-option-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onFocus={() => setSelectedIndex(index)}
                      onClick={() => execute(item)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selected ? 'v5-command-selected border-cyan-300/25 bg-cyan-300/[0.08] text-white' : 'border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.14em] text-slate-600">{item.kind}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">No matching commands</div>
                )}
              </div>
            </motion.section>
          </PointerSpotlightSurface>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
