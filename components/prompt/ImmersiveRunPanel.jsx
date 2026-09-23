'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { shouldFollowLatest } from '../../lib/ai/scroll-follow.mjs';
import ExecutionPulse from './ExecutionPulse.jsx';
import RunTelemetry from './RunTelemetry.jsx';

const ACTIVE = new Set(['preparing', 'running', 'streaming']);

function ActionButton({ children, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary
        ? 'min-h-10 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.09] px-4 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/[0.14]'
        : 'min-h-10 rounded-xl border border-white/10 bg-black/20 px-4 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white'}
    >
      {children}
    </button>
  );
}

export default function ImmersiveRunPanel({
  state,
  onStop,
  onRetry,
  onEdit,
  onSaveResult,
  onImprove,
  onCompare,
  onAddToWorkflow,
  reducedMotion = false,
}) {
  const outputRef = useRef(null);
  const [following, setFollowing] = useState(true);
  const [copied, setCopied] = useState(false);
  const status = state?.status || 'idle';
  const output = state?.output || '';
  const active = ACTIVE.has(status);

  const scrollToLatest = (forceFollow = false) => {
    const node = outputRef.current;
    if (!node) return;
    if (forceFollow) setFollowing(true);
    node.scrollTo({ top: node.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (!following || !output) return;
    scrollToLatest(false);
  }, [output, following, reducedMotion]);

  const handleScroll = () => {
    const node = outputRef.current;
    if (!node) return;
    setFollowing(shouldFollowLatest({
      scrollTop: node.scrollTop,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
    }));
  };

  const copyOutput = async () => {
    if (!output || !navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="v5-immersive-run-panel rounded-3xl border border-white/10 bg-black/25 p-3 md:p-4" data-run-status={status}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
        <ExecutionPulse status={status} reducedMotion={reducedMotion} />
        <div className="flex flex-wrap items-center gap-2">
          {active ? <ActionButton primary onClick={() => onStop?.()}>Stop</ActionButton> : null}
          {status === 'failed' ? <ActionButton primary onClick={() => onRetry?.()}>Retry</ActionButton> : null}
          {status === 'stopped' || status === 'completed' ? <ActionButton primary onClick={() => onRetry?.()}>Run Again</ActionButton> : null}
          {status === 'failed' || status === 'stopped' ? <ActionButton onClick={() => onEdit?.()}>Edit Prompt</ActionButton> : null}
          {status === 'completed' ? <ActionButton onClick={copyOutput}>{copied ? 'Copied' : 'Copy'}</ActionButton> : null}
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Run status: {status}
      </div>

      <div className="relative mt-3">
        <motion.div
          ref={outputRef}
          onScroll={handleScroll}
          className="v5-run-output max-h-[46vh] min-h-48 overflow-auto rounded-2xl border border-white/8 bg-black/30 p-4 text-sm leading-6 text-slate-200 md:min-h-64"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
        >
          {output ? (
            <div className="whitespace-pre-wrap break-words select-text">{state.output}</div>
          ) : (
            <div className="flex min-h-40 items-center justify-center text-center text-xs text-slate-600">
              {active ? 'Waiting for the first response chunk…' : 'Run the prompt to see streamed output here.'}
            </div>
          )}
        </motion.div>

        {!following && output ? (
          <button
            type="button"
            onClick={() => scrollToLatest(true)}
            className="absolute bottom-3 left-1/2 min-h-9 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-slate-950/90 px-3 text-[11px] font-medium text-cyan-100 shadow-lg"
          >
            Jump to latest
          </button>
        ) : null}
      </div>

      {state?.error ? (
        <div role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-200">
          {state.error}
        </div>
      ) : null}

      <div className="mt-3">
        <RunTelemetry meta={state?.meta || {}} />
      </div>

      {status === 'completed' ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
          {onSaveResult ? <ActionButton onClick={() => onSaveResult?.(state)}>Save Result</ActionButton> : null}
          {onImprove ? <ActionButton onClick={() => onImprove?.(state)}>Improve</ActionButton> : null}
          {onCompare ? <ActionButton onClick={() => onCompare?.(state)}>Compare</ActionButton> : null}
          {onAddToWorkflow ? <ActionButton onClick={() => onAddToWorkflow?.(state)}>Add to Workflow</ActionButton> : null}
        </div>
      ) : null}
    </section>
  );
}
