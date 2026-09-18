'use client';

import React from 'react';
import GlassSurface from '../ui/GlassSurface.jsx';

export default function PromptPacks({ packs = [], prompts = [], onOpenPack, onAddAllToWorkspace }) {
  const byId = new Map(prompts.map((prompt) => [String(prompt.id), prompt]));

  return (
    <section className="space-y-2" data-prompt-packs>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/60">PROMPT PACKS</p>
          <h2 className="mt-1 text-sm font-semibold text-white">Curated workflows</h2>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {packs.map((pack) => {
          const promptIds = Array.isArray(pack.promptIds) ? pack.promptIds : [];
          const members = promptIds.map((id) => byId.get(String(id))).filter(Boolean);
          return (
            <GlassSurface
              as="article"
              level="subtle"
              key={pack.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/[0.03]"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{pack.name}</h3>
                  <p className="mt-1 text-[11px] font-mono text-slate-500">{members.length} prompts</p>
                </div>
                <button type="button" onClick={() => onOpenPack?.(pack.id)} className="rounded-lg border border-white/10 bg-black/15 px-2 py-1 text-[10px] text-slate-300 transition hover:border-cyan-200/25 hover:text-cyan-100">Open</button>
              </div>
              <div className="mt-3 space-y-1 rounded-xl border border-white/[0.05] bg-black/10 p-2.5">
                {members.slice(0, 3).map((prompt) => (
                  <p key={prompt.id} className="truncate text-[11px] text-slate-400">• {prompt.displayTitleTh || prompt.displayTitle || prompt.name}</p>
                ))}
              </div>
              <button type="button" onClick={() => onAddAllToWorkspace?.(promptIds)} className="mt-3 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-2 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.09]">Add all to Workspace</button>
            </GlassSurface>
          );
        })}
      </div>
    </section>
  );
}
