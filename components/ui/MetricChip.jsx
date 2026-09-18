import React from 'react';

export default function MetricChip({ label, value, suffix, className = '' }) {
  return (
    <div className={`v5-glass-subtle rounded-xl border border-white/10 px-3 py-2 ${className}`}>
      <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-sm text-slate-100">
        {value}{suffix ? <span className="ml-1 text-slate-500">{suffix}</span> : null}
      </div>
    </div>
  );
}
