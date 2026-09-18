'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

function SheetAction({ label, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-left text-sm text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/35 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {label}
    </button>
  );
}

export default function PromptQuickActionsSheet({
  open,
  prompt,
  onClose,
  onRun,
  onFavorite,
  onPin,
  onCopy,
  onAddToPack,
}) {
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  const closeAfter = (action) => {
    action?.();
    onClose?.();
  };

  const title = prompt?.displayTitle || prompt?.title || prompt?.name || 'Prompt';
  const favorite = Boolean(prompt?.favorite);
  const pinned = Boolean(prompt?.pinned);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-3 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.14 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick actions for ${title}`}
            tabIndex={-1}
            className="v5-glass-focus w-full max-w-md rounded-3xl border border-cyan-200/15 p-4 outline-none"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 390, damping: 32, mass: 0.7 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/55">Quick actions</p>
                <h2 className="mt-1 truncate text-base font-semibold text-white">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="min-h-11 rounded-xl border border-white/10 px-3 text-sm text-slate-300 hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/35"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SheetAction label="Run" disabled={!onRun} onClick={() => closeAfter(() => onRun?.(prompt))} />
              <SheetAction label={favorite ? 'Unfavorite' : 'Favorite'} disabled={!onFavorite} onClick={() => closeAfter(() => onFavorite?.(prompt?.id, !favorite))} />
              <SheetAction label={pinned ? 'Unpin' : 'Pin'} disabled={!onPin} onClick={() => closeAfter(() => onPin?.(prompt?.id, !pinned))} />
              <SheetAction label="Copy" disabled={!onCopy} onClick={() => closeAfter(() => onCopy?.(prompt))} />
              <SheetAction label="Add to pack" disabled={!onAddToPack} onClick={() => closeAfter(() => onAddToPack?.(prompt?.id))} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
