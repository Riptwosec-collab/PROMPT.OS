'use client';

import React from 'react';

const STATUS_STYLES = {
  passed: 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-100',
  failed: 'border-rose-300/20 bg-rose-300/[0.05] text-rose-100',
  skipped: 'border-white/10 bg-white/[0.02] text-slate-400',
};

export default function PromptQualityCenter({ checks = [], title = 'Prompt Quality Center' }) {
  const passed = checks.filter((item) => item.status === 'passed').length;
  const failed = checks.filter((item) => item.status === 'failed').length;
  const skipped = checks.filter((item) => item.status === 'skipped').length;

  return (
    <section data-prompt-quality-center className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="prompt-quality-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/60">DETERMINISTIC CHECKS</p>
          <h2 id="prompt-quality-title" className="mt-1 text-sm font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">Concrete checks only. No synthetic quality percentage.</p>
        </div>
        <div className="flex gap-2 text-[10px]"><span className="rounded-full border border-emerald-300/20 px-2 py-1 text-emerald-200">{passed} passed</span><span className="rounded-full border border-rose-300/20 px-2 py-1 text-rose-200">{failed} failed</span><span className="rounded-full border border-white/10 px-2 py-1 text-slate-400">{skipped} skipped</span></div>
      </div>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {checks.map((item) => (
          <li key={item.key} className={`rounded-xl border p-3 ${STATUS_STYLES[item.status] || STATUS_STYLES.skipped}`}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{item.key.replaceAll('_', ' ')}</span><span className="text-[9px] font-mono uppercase">{item.status}</span></div>
            <p className="mt-1 text-[11px] leading-5 opacity-80">{item.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
