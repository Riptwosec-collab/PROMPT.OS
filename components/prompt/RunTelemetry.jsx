'use client';

import React from 'react';

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-xs font-medium text-slate-200">{value}</div>
    </div>
  );
}

export default function RunTelemetry({ meta = {} }) {
  const rows = [];
  const hasInputTokens = Number.isFinite(meta.inputTokens);
  const hasOutputTokens = Number.isFinite(meta.outputTokens);

  if (typeof meta.provider === 'string' && meta.provider) rows.push(['Provider', meta.provider]);
  if (typeof meta.model === 'string' && meta.model) rows.push(['Model', meta.model]);
  if (Number.isFinite(meta.latencyMs)) rows.push(['Latency', `${Math.round(meta.latencyMs)} ms`]);
  if (hasInputTokens) rows.push(['Input tokens', Math.max(0, Math.round(meta.inputTokens)).toLocaleString()]);
  if (hasOutputTokens) rows.push(['Output tokens', Math.max(0, Math.round(meta.outputTokens)).toLocaleString()]);
  if (hasInputTokens || hasOutputTokens) {
    const total = (hasInputTokens ? meta.inputTokens : 0) + (hasOutputTokens ? meta.outputTokens : 0);
    rows.push(['Total tokens', Math.max(0, Math.round(total)).toLocaleString()]);
  }
  if (typeof meta.responseId === 'string' && meta.responseId) {
    const compactId = meta.responseId.length > 24 ? `${meta.responseId.slice(0, 12)}…${meta.responseId.slice(-8)}` : meta.responseId;
    rows.push(['Response ID', compactId]);
  }

  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3" data-run-telemetry>
      {rows.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
    </div>
  );
}
