import React from 'react';

const TONE_CLASS = {
  neutral: 'border-white/10 text-slate-300',
  info: 'border-cyan-300/20 text-cyan-100',
  success: 'border-emerald-300/20 text-emerald-200',
  warning: 'border-amber-300/20 text-amber-200',
  danger: 'border-rose-300/20 text-rose-200',
};

export default function StatusPill({ tone = 'neutral', label, children, className = '' }) {
  return (
    <span className={`v5-glass-subtle inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono ${TONE_CLASS[tone] || TONE_CLASS.neutral} ${className}`}>
      {children ?? label}
    </span>
  );
}
