'use client';

import React from 'react';

const STATE_LABELS = Object.freeze({
  preparing: 'Preparing',
  running: 'Running',
  streaming: 'Streaming',
  completed: 'Completed',
  failed: 'Failed',
  stopped: 'Stopped',
});

export default function ExecutionPulse({ status = 'idle', reducedMotion = false }) {
  const label = STATE_LABELS[status] || 'Ready';
  const active = ['preparing', 'running', 'streaming'].includes(status);

  return (
    <div
      className="v5-execution-pulse flex items-center gap-2"
      data-status={status}
      data-active={active ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <span className="v5-execution-dot" aria-hidden="true" />
      <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-cyan-100/80">{label}</span>
      {active && !reducedMotion ? (
        <span className="v5-execution-wave" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </div>
  );
}
