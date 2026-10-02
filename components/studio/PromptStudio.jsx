'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createDraft, DRAFT_SECTION_KEYS, updateDraftRaw, updateDraftSection } from '../../lib/studio/draft-model.mjs';

const MODE_LABELS = ['Structured', 'Raw', 'Preview', 'Versions'];
const SECTION_LABELS = {
  role: 'Role', goal: 'Goal', context: 'Context', inputs: 'Inputs', constraints: 'Constraints',
  outputFormat: 'Output Format', examples: 'Examples', variables: 'Variables', notes: 'Notes',
};

export default function PromptStudio({
  draftRepository,
  versionRepository,
  initialDraft = null,
  draftId = 'draft:new-prompt',
  onClose,
}) {
  const [draft, setDraft] = useState(() => createDraft(initialDraft || { draftId, promptId: 'user:new-prompt', title: 'New Prompt' }));
  const [mode, setMode] = useState('Structured');
  const [hydrated, setHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [saveState, setSaveState] = useState('Local draft');
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function recover() {
      if (!draftRepository) { setHydrated(true); return; }
      const stored = await draftRepository.get(draft.draftId);
      if (cancelled) return;
      if (stored) {
        setDraft(createDraft(stored));
        setRecovered(true);
      }
      setHydrated(true);
    }
    recover().catch(() => setHydrated(true));
    return () => { cancelled = true; };
  }, [draftRepository, draft.draftId]);

  useEffect(() => {
    if (!hydrated || !draftRepository) return undefined;
    setSaveState('Saving…');
    const timer = setTimeout(async () => {
      try {
        const persisted = await draftRepository.upsert(draft);
        setDraft((current) => current.draftId === persisted.draftId && Number(current.revision) <= Number(persisted.revision) ? createDraft(persisted) : current);
        setSaveState('Saved draft');
      } catch {
        setSaveState('Not saved');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, hydrated, draftRepository]);

  useEffect(() => {
    if (mode !== 'Versions' || !versionRepository) return;
    versionRepository.list(draft.promptId).then(setVersions).catch(() => setVersions([]));
  }, [mode, versionRepository, draft.promptId]);

  const preview = useMemo(() => draft.rawPrompt || '', [draft.rawPrompt]);

  const changeSection = (key, value) => setDraft((current) => updateDraftSection(current, key, value));
  const changeRaw = (value) => setDraft((current) => updateDraftRaw(current, value));

  return (
    <section data-prompt-studio className="h-full overflow-y-auto p-3 md:p-6" aria-labelledby="prompt-studio-title">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="v5-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/70">PROMPT STUDIO</p>
            <input id="prompt-studio-title" value={draft.title} onChange={(event) => setDraft((current) => createDraft({ ...current, title: event.target.value }))} className="mt-1 min-h-11 w-full bg-transparent text-xl font-semibold text-white outline-none" aria-label="Prompt title" />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>{saveState}</span>
              {recovered ? <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-amber-200">Recovered Draft</span> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-300">Close</button>
        </header>

        <nav className="v5-glass flex gap-2 overflow-x-auto rounded-2xl border border-white/10 p-2" aria-label="Prompt Studio modes">
          {MODE_LABELS.map((item) => <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className={`min-h-11 shrink-0 rounded-xl px-4 text-xs ${mode === item ? 'bg-violet-300/10 text-violet-100' : 'text-slate-400'}`}>{item}</button>)}
        </nav>

        {mode === 'Structured' ? (
          <div className="grid gap-3 md:grid-cols-2">
            {DRAFT_SECTION_KEYS.map((key) => <label key={key} className="v5-glass rounded-2xl border border-white/10 p-3 text-xs text-slate-400"><span className="mb-2 block font-medium text-slate-200">{SECTION_LABELS[key]}</span><textarea value={String(draft.sections[key] ?? '')} onChange={(event) => changeSection(key, event.target.value)} rows={key === 'context' || key === 'examples' ? 6 : 4} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200 outline-none focus:border-violet-300/40" /></label>)}
          </div>
        ) : null}

        {mode === 'Raw' ? <textarea value={draft.rawPrompt} onChange={(event) => changeRaw(event.target.value)} rows={24} className="v5-glass min-h-[60vh] w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:border-violet-300/40" aria-label="Raw prompt" /> : null}

        {mode === 'Preview' ? <pre className="v5-glass min-h-[50vh] whitespace-pre-wrap rounded-2xl border border-white/10 p-5 text-sm leading-7 text-slate-300">{preview || 'Start writing your prompt.'}</pre> : null}

        {mode === 'Versions' ? <section className="v5-glass rounded-2xl border border-white/10 p-4"><h2 className="text-sm font-semibold text-white">Versions</h2>{versions.length ? <ul className="mt-3 space-y-2">{versions.map((version) => <li key={version.versionId} className="rounded-xl border border-white/10 p-3 text-xs text-slate-300">v{version.versionNumber} · {version.status} · {version.label}</li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No versions yet. Autosave keeps only the mutable Draft; it never creates a Version.</p>}</section> : null}
      </div>
    </section>
  );
}
