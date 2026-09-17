'use client';

import React from 'react';

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
            <article key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{pack.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">{members.length} prompts</p>
                </div>
                <button type="button" onClick={() => onOpenPack?.(pack.id)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300">Open</button>
              </div>
              <div className="mt-3 space-y-1">
                {members.slice(0, 3).map((prompt) => (
                  <p key={prompt.id} className="truncate text-[11px] text-slate-400">• {prompt.displayTitleTh || prompt.displayTitle || prompt.name}</p>
                ))}
              </div>
              <button type="button" onClick={() => onAddAllToWorkspace?.(promptIds)} className="mt-3 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/5 px-2 py-2 text-[11px] text-cyan-100">Add all to Workspace</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
