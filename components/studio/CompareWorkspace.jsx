'use client';

import React, { useMemo, useState } from 'react';
import { compareArtifacts } from '../../lib/studio/diff.mjs';

function titleFor(artifact) {
  return `${artifact?.kind || 'artifact'}${artifact?.record?.name ? ` · ${artifact.record.name}` : ''}`;
}

function SectionBlock({ section, side }) {
  const text = side === 'left' ? section.left : section.right;
  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400">{section.key}</h3>
        {section.changed ? <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-[9px] text-amber-200">Changed</span> : null}
      </div>
      <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{text || '—'}</pre>
    </section>
  );
}

export default function CompareWorkspace({ left, right, onClose }) {
  const [desktopMode, setDesktopMode] = useState('side');
  const [mobileMode, setMobileMode] = useState('diff');
  const comparison = useMemo(() => compareArtifacts(left, right), [left, right]);

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="compare-title" className="fixed inset-0 z-[95] flex min-h-0 flex-col bg-[#030611]/95 text-white backdrop-blur-xl">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/60">PROMPT STUDIO</p>
          <h1 id="compare-title" className="text-lg font-semibold">Compare</h1>
          <p className="mt-1 text-[11px] text-slate-500">Deterministic local diff · no AI evaluation</p>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-200">Close</button>
      </header>

      <div className="shrink-0 border-b border-white/10 px-4 py-3 md:px-6">
        <div className="hidden flex-wrap gap-2 md:flex" aria-label="Desktop compare mode">
          <button type="button" onClick={() => setDesktopMode('side')} aria-pressed={desktopMode === 'side'} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Side by side</button>
          <button type="button" onClick={() => setDesktopMode('unified')} aria-pressed={desktopMode === 'unified'} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Unified</button>
          <button type="button" onClick={() => setDesktopMode('output')} aria-pressed={desktopMode === 'output'} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Output only</button>
        </div>
        <div className="flex gap-2 md:hidden" aria-label="Mobile compare mode">
          <button type="button" onClick={() => setMobileMode('a')} aria-pressed={mobileMode === 'a'} className="min-h-11 flex-1 rounded-xl border border-white/10 text-xs">A</button>
          <button type="button" onClick={() => setMobileMode('b')} aria-pressed={mobileMode === 'b'} className="min-h-11 flex-1 rounded-xl border border-white/10 text-xs">B</button>
          <button type="button" onClick={() => setMobileMode('diff')} aria-pressed={mobileMode === 'diff'} className="min-h-11 flex-1 rounded-xl border border-white/10 text-xs">Diff</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="v5-glass rounded-xl border border-white/10 p-3 text-xs"><span className="text-slate-500">A</span><div className="mt-1 text-slate-200">{titleFor(left)}</div></div>
            <div className="v5-glass rounded-xl border border-white/10 p-3 text-xs"><span className="text-slate-500">B</span><div className="mt-1 text-slate-200">{titleFor(right)}</div></div>
          </div>

          <div className="hidden md:block">
            {desktopMode === 'side' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">{comparison.sections.map((section) => <SectionBlock key={`left-${section.key}`} section={section} side="left" />)}</div>
                <div className="space-y-3">{comparison.sections.map((section) => <SectionBlock key={`right-${section.key}`} section={section} side="right" />)}</div>
              </div>
            ) : desktopMode === 'output' ? (
              <div className="grid gap-4 md:grid-cols-2">{['left', 'right'].map((side) => <SectionBlock key={side} section={comparison.sections.find((item) => item.key === 'output')} side={side} />)}</div>
            ) : (
              <div className="space-y-3">{comparison.sections.map((section) => <section key={section.key} className="v5-glass rounded-2xl border border-white/10 p-4"><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{section.key}</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><pre className="whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-xs text-slate-400">A\n{section.left || '—'}</pre><pre className="whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-xs text-slate-300">B\n{section.right || '—'}</pre></div></section>)}</div>
            )}
          </div>

          <div className="space-y-3 md:hidden">
            {mobileMode === 'a' ? comparison.sections.map((section) => <SectionBlock key={section.key} section={section} side="left" />) : null}
            {mobileMode === 'b' ? comparison.sections.map((section) => <SectionBlock key={section.key} section={section} side="right" />) : null}
            {mobileMode === 'diff' ? comparison.sections.filter((section) => section.changed).map((section) => <section key={section.key} className="v5-glass rounded-2xl border border-white/10 p-3"><h2 className="text-xs font-semibold text-white">{section.key}</h2><pre className="mt-2 whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-xs text-slate-500">A\n{section.left || '—'}</pre><pre className="mt-2 whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-xs text-slate-300">B\n{section.right || '—'}</pre></section>) : null}
            {mobileMode === 'diff' && !comparison.hasChanges ? <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-slate-500">No differences.</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
