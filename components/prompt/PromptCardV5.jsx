'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import MotionSurface from '../ui/MotionSurface.jsx';
import GlassGlyph from '../ui/GlassGlyph.jsx';
import PromptQuickActionsSheet from './PromptQuickActionsSheet.jsx';
import { promptLayoutId } from '../../lib/ui/prompt-transition.mjs';

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const COARSE_POINTER_QUERY = '(pointer: coarse)';
const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE = 10;

function variableCount(prompt) {
  const configured = Object.keys(prompt?.variableConfig || {}).length;
  if (configured > 0) return configured;
  const text = String(prompt?.prompt || prompt?.template || '');
  return new Set([...text.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((match) => match[1])).size;
}

function ActionButton({ children, title, disabled = false, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className="min-h-9 rounded-xl border border-white/10 bg-black/20 px-2.5 text-[10px] font-mono text-slate-300 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

export default function PromptCardV5({
  prompt,
  healthScore = null,
  onOpen,
  onRun,
  onFavorite,
  onPin,
  onCopy,
  onAddToPack,
  transitionEnabled = false,
}) {
  const cardRef = useRef(null);
  const frameRef = useRef(0);
  const longPressTimerRef = useRef(0);
  const longPressStartRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const variables = variableCount(prompt);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = 0;
    }
    longPressStartRef.current = null;
  };

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
  }, []);

  const isCoarsePointerEvent = (event) => {
    if (event.pointerType === 'touch') return true;
    return typeof window !== 'undefined' && window.matchMedia(COARSE_POINTER_QUERY).matches;
  };

  const updatePointerLight = (event) => {
    const node = cardRef.current;
    if (event.pointerType === 'touch' || !node || reducedMotion || typeof window === 'undefined' || !window.matchMedia(FINE_POINTER_QUERY).matches) return;
    const { clientX, clientY } = event;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / Math.max(rect.width, 1)) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / Math.max(rect.height, 1)) * 100));
      node.style.setProperty('--card-pointer-x', `${x}%`);
      node.style.setProperty('--card-pointer-y', `${y}%`);
      node.style.setProperty('--card-pointer-strength', '0.88');
      frameRef.current = 0;
    });
  };

  const clearPointerLight = () => {
    const node = cardRef.current;
    if (!node) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      node.style.setProperty('--card-pointer-strength', '0');
      frameRef.current = 0;
    });
  };

  const handlePointerDown = (event) => {
    if (!isCoarsePointerEvent(event)) return;
    clearLongPress();
    longPressFiredRef.current = false;
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = 0;
      longPressStartRef.current = null;
      longPressFiredRef.current = true;
      setQuickActionsOpen(true);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event) => {
    updatePointerLight(event);
    const start = longPressStartRef.current;
    if (!start) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance > LONG_PRESS_MOVE_TOLERANCE) clearLongPress();
  };

  const handlePointerUp = () => {
    clearLongPress();
  };

  const handlePointerCancel = () => {
    clearLongPress();
  };

  const handlePointerLeave = () => {
    clearLongPress();
    clearPointerLight();
  };

  const handleCardClick = (event) => {
    if (longPressFiredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressFiredRef.current = false;
      return;
    }
    if (event.target.closest?.('button, a, input, select, textarea')) return;
    onOpen?.(prompt?.id);
  };

  const closeQuickActions = () => {
    setQuickActionsOpen(false);
    requestAnimationFrame(() => cardRef.current?.focus());
  };

  const title = prompt?.displayTitle || prompt?.title || prompt?.name || 'Untitled prompt';
  const description = prompt?.descriptionTh || prompt?.description || 'No description';
  const favorite = Boolean(prompt?.favorite);
  const pinned = Boolean(prompt?.pinned);

  return (
    <>
      <MotionSurface
        ref={cardRef}
        layout
        layoutId={transitionEnabled ? promptLayoutId(prompt?.id) : undefined}
        whileHover={reducedMotion ? undefined : { y: -4 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onClick={handleCardClick}
        onBlur={clearPointerLight}
        tabIndex={0}
        role="group"
        aria-label={`Prompt card: ${title}`}
        className="v5-premium-card v5-glass-panel group relative min-w-0 rounded-3xl border border-white/10 p-4 text-left focus-within:border-cyan-300/30 md:p-5"
        data-prompt-id={prompt?.id}
      >
        <div className="flex items-start gap-3">
          <GlassGlyph className="mt-0.5">⌘</GlassGlyph>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/55">{prompt?.category || 'Prompt'}</p>
                <h2 className="mt-1 truncate text-base font-semibold text-white">{title}</h2>
                {prompt?.displayTitleTh && prompt.displayTitleTh !== title ? (
                  <p className="mt-1 truncate text-xs text-cyan-100/60">{prompt.displayTitleTh}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {pinned ? <span title="Pinned" aria-label="Pinned" className="text-cyan-200">●</span> : null}
                {favorite ? <span title="Favorite" aria-label="Favorite" className="text-amber-300">★</span> : null}
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span className="rounded-full border border-white/10 px-2 py-1">{variables} variable{variables === 1 ? '' : 's'}</span>
              {healthScore != null ? <span className="rounded-full border border-white/10 px-2 py-1">Health {healthScore}/100</span> : null}
              {prompt?.model ? <span className="rounded-full border border-white/10 px-2 py-1">{prompt.model}</span> : null}
            </div>
          </div>
        </div>

        <div className="v5-card-quick-actions mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.(prompt?.id);
            }}
            className="min-h-9 flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/40"
          >
            Open details
          </button>
          <ActionButton title="Run" disabled={!onRun} onClick={() => onRun?.(prompt)}>Run</ActionButton>
          <ActionButton title="Favorite" disabled={!onFavorite} onClick={() => onFavorite?.(prompt?.id, !favorite)}>{favorite ? 'Unfavorite' : 'Favorite'}</ActionButton>
          <ActionButton title="Pin" disabled={!onPin} onClick={() => onPin?.(prompt?.id, !pinned)}>{pinned ? 'Unpin' : 'Pin'}</ActionButton>
        </div>
      </MotionSurface>

      <PromptQuickActionsSheet
        open={quickActionsOpen}
        prompt={prompt}
        onClose={closeQuickActions}
        onRun={onRun}
        onFavorite={onFavorite}
        onPin={onPin}
        onCopy={onCopy}
        onAddToPack={onAddToPack}
      />
    </>
  );
}
