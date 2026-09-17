'use client';

import React, { useMemo } from 'react';
import { scorePromptHealth } from '../../lib/prompts/health-score.mjs';

const LABELS = {
  structure: 'Structure',
  context: 'Context',
  variables: 'Variables',
  constraints: 'Constraints',
  outputFormat: 'Output Format',
  reliability: 'Reliability',
};

export default function PromptHealth({ prompt }) {
  const health = useMemo(() => scorePromptHealth(prompt), [prompt]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" data-prompt-health>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Prompt Health</p>
          <p className="mt-1 text-3xl font-semibold text-white">{health.total}<span className="text-sm text-slate-500">/100</span></p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">LOCAL SCORE</span>
      </div>

      <div className="mt-4 space-y-2">
        {Object.entries(health.categories).map(([key, item]) => (
          <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
            <span className="text-slate-400">{LABELS[key] || key}</span>
            <span className="font-mono text-slate-200">{item.score}/{item.max}</span>
          </div>
        ))}
      </div>

      {health.findings.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Findings</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
            {health.findings.slice(0, 4).map((finding) => <li key={finding}>• {finding}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
