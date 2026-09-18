import React from 'react';

export default function GlassGlyph({ children, className = '' }) {
  return (
    <span className={`v5-glass-subtle inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[var(--v5-ice-blue)] ${className}`}>
      {children}
    </span>
  );
}
