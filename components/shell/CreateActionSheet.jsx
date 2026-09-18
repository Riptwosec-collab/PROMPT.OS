'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const ACTIONS = [
  ['New Prompt', 'onNewPrompt'],
  ['New Workflow', 'onNewWorkflow'],
  ['Import Prompt', 'onImportPrompt'],
];

export default function CreateActionSheet({
  open,
  onClose,
  onNewPrompt,
  onNewWorkflow,
  onImportPrompt,
}) {
  const reducedMotion = useReducedMotion();
  const callbacks = { onNewPrompt, onNewWorkflow, onImportPrompt };

  const run = (callback) => {
    if (!callback) return;
    callback();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Create"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="v5-glass-focus w-full max-w-md rounded-3xl border border-white/10 p-4"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
            transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-200/60">Create</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Choose an action</h2>
              </div>
              <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-xl border border-white/10 text-xs text-slate-400" aria-label="Close">Close</button>
            </div>

            <div className="space-y-2">
              {ACTIONS.map(([label, key]) => {
                const callback = callbacks[key];
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!callback}
                    onClick={() => run(callback)}
                    className={`min-h-12 w-full rounded-2xl border px-4 text-left text-sm transition-colors ${callback ? 'border-white/10 bg-white/[0.03] text-slate-100 hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]' : 'cursor-not-allowed border-white/5 bg-white/[0.015] text-slate-600'}`}
                  >
                    {label}
                    {!callback ? <span className="float-right text-[10px] font-mono uppercase tracking-[0.12em]">Unavailable</span> : null}
                  </button>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
