'use client';

import React, { useMemo } from 'react';
import GlassSurface from '../ui/GlassSurface.jsx';
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
    <GlassSurface
      as="section"
      level="panel"
      className="relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ring-1 ring-inset ring-white/[0.035]"
      data-prompt-health
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" />
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/55">Prompt Health</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{health.total}<span className="ml-0.5 text-sm font-normal text-slate-500">/100</span></p>
        </div>
        <span className="rounded-full border border-cyan-200/15 bg-cyan-200/[0.04] px-2.5 py-1 text-[10px] font-mono text-cyan-100/70">LOCAL SCORE</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {Object.entries(health.categories).map(([key, item]) => {
          const percent = item.max > 0 ? Math.max(0, Math.min(100, (item.score / item.max) * 100)) : 0;
          return (
            <div key={key} className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
                <span className="text-slate-400">{LABELS[key] || key}</span>
                <span className="font-mono text-slate-200">{item.score}/{item.max}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300/55 to-violet-300/45" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {health.findings.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Findings</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
            {health.findings.slice(0, 4).map((finding) => <li key={finding}>• {finding}</li>)}
          </ul>
        </div>
      ) : null}
    </GlassSurface>
  );
}
