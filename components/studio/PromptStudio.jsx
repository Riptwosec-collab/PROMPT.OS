'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  createDraft,
  DRAFT_SECTION_KEYS,
  restoreVersionToDraft,
  updateDraftRaw,
  updateDraftSection,
} from '../../lib/studio/draft-model.mjs';
import { runPromptTestSuite } from '../../lib/studio/test-lab.mjs';
import { createVersionSnapshot, VERSION_STATUS } from '../../lib/studio/version-model.mjs';
import { openStudioRuntime } from '../../lib/studio/runtime.mjs';
import PromptQualityCenter from './PromptQualityCenter.jsx';

const MODE_LABELS = ['Structured', 'Raw', 'Preview', 'Versions', 'Test Lab'];
const SECTION_LABELS = {
  role: 'Role', goal: 'Goal', context: 'Context', inputs: 'Inputs', constraints: 'Constraints',
  outputFormat: 'Output Format', examples: 'Examples', variables: 'Variables', notes: 'Notes',
};

export default function PromptStudio({
  draftRepository = null,
  versionRepository = null,
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
  const [runtime, setRuntime] = useState(null);
  const [versionLabel, setVersionLabel] = useState('');
  const [versionStatus, setVersionStatus] = useState(VERSION_STATUS.EXPERIMENTAL);
  const [changeNote, setChangeNote] = useState('');

  const activeDraftRepository = draftRepository || runtime?.draftRepository || null;
  const activeVersionRepository = versionRepository || runtime?.versionRepository || null;

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(createDraft(initialDraft));
    setRecovered(false);
    setHydrated(false);
    setVersions([]);
  }, [initialDraft?.draftId]);

  useEffect(() => {
    if (draftRepository && versionRepository) return undefined;
    let cancelled = false;
    let opened = null;
    openStudioRuntime().then((next) => {
      opened = next;
      if (cancelled) { next.close(); return; }
      setRuntime(next);
    }).catch(() => setSaveState('Storage unavailable'));
    return () => { cancelled = true; opened?.close(); };
  }, [draftRepository, versionRepository]);

  useEffect(() => {
    let cancelled = false;
    async function recover() {
      if (!activeDraftRepository) return;
      const stored = await activeDraftRepository.get(draft.draftId);
      if (cancelled) return;
      if (stored) {
        setDraft(createDraft(stored));
        setRecovered(true);
      }
      setHydrated(true);
    }
    recover().catch(() => setHydrated(true));
    return () => { cancelled = true; };
  }, [activeDraftRepository, draft.draftId]);

  useEffect(() => {
    if (!hydrated || !activeDraftRepository) return undefined;
    setSaveState('Saving…');
    const timer = setTimeout(async () => {
      try {
        const persisted = await activeDraftRepository.upsert(draft);
        setDraft((current) => current.draftId === persisted.draftId && Number(current.revision) <= Number(persisted.revision) ? createDraft(persisted) : current);
        setSaveState('Saved draft');
      } catch {
        setSaveState('Not saved');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, hydrated, activeDraftRepository]);

  useEffect(() => {
    if (mode !== 'Versions' || !activeVersionRepository) return;
    activeVersionRepository.list(draft.promptId).then(setVersions).catch(() => setVersions([]));
  }, [mode, activeVersionRepository, draft.promptId]);

  const preview = useMemo(() => draft.rawPrompt || '', [draft.rawPrompt]);
  const testLab = useMemo(() => runPromptTestSuite({ draft }), [draft]);
  const changeSection = (key, value) => setDraft((current) => updateDraftSection(current, key, value));
  const changeRaw = (value) => setDraft((current) => updateDraftRaw(current, value));

  const saveVersion = async () => {
    if (!activeVersionRepository) {
      setSaveState('Storage unavailable');
      return;
    }
    setSaveState('Saving version…');
    try {
      let workingDraft = draft;
      if (activeDraftRepository) {
        const persisted = await activeDraftRepository.upsert(draft);
        workingDraft = createDraft(persisted);
        setDraft(workingDraft);
      }
      const versionNumber = await activeVersionRepository.nextVersionNumber(workingDraft.promptId);
      const snapshot = createVersionSnapshot({
        draft: workingDraft,
        versionNumber,
        label: versionLabel.trim() || `v${versionNumber}`,
        status: versionStatus,
        changeNote,
        parentVersionId: versions[0]?.versionId || null,
      });
      await activeVersionRepository.create(snapshot);
      setVersions(await activeVersionRepository.list(workingDraft.promptId));
      setVersionLabel('');
      setChangeNote('');
      setSaveState('Version saved');
    } catch {
      setSaveState('Version not saved');
    }
  };

  const restoreVersion = (version) => {
    const restored = restoreVersionToDraft(version, { draftId: draft.draftId });
    setDraft(restored);
    setRecovered(true);
    setMode('Raw');
    setSaveState('Restored to draft');
  };

  const archiveVersion = async (versionId) => {
    if (!activeVersionRepository) return;
    await activeVersionRepository.archive(versionId);
    setVersions(await activeVersionRepository.list(draft.promptId));
  };

  const compareVersion = (version) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('prompt-os:compare', {
      detail: {
        left: { kind: 'draft', record: draft },
        right: { kind: 'version', record: version },
      },
    }));
  };

  return (
    <section data-prompt-studio className="h-full overflow-y-auto p-3 md:p-6" aria-labelledby="prompt-studio-title">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="v5-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/70">PROMPT STUDIO</p>
            <input id="prompt-studio-title" value={draft.title} onChange={(event) => setDraft((current) => createDraft({ ...current, title: event.target.value }))} className="mt-1 min-h-11 w-full bg-transparent text-xl font-semibold text-white outline-none" aria-label="Prompt title" />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>{saveState}</span>{recovered ? <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-amber-200">Recovered Draft</span> : null}</div>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-300">Close</button>
        </header>

        <nav className="v5-glass flex gap-2 overflow-x-auto rounded-2xl border border-white/10 p-2" aria-label="Prompt Studio modes">
          {MODE_LABELS.map((item) => <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className={`min-h-11 shrink-0 rounded-xl px-4 text-xs ${mode === item ? 'bg-violet-300/10 text-violet-100' : 'text-slate-400'}`}>{item}</button>)}
        </nav>

        {mode === 'Structured' ? <div className="grid gap-3 md:grid-cols-2">{DRAFT_SECTION_KEYS.map((key) => <label key={key} className="v5-glass rounded-2xl border border-white/10 p-3 text-xs text-slate-400"><span className="mb-2 block font-medium text-slate-200">{SECTION_LABELS[key]}</span><textarea value={String(draft.sections[key] ?? '')} onChange={(event) => changeSection(key, event.target.value)} rows={key === 'context' || key === 'examples' ? 6 : 4} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200 outline-none focus:border-violet-300/40" /></label>)}</div> : null}
        {mode === 'Raw' ? <textarea value={draft.rawPrompt} onChange={(event) => changeRaw(event.target.value)} rows={24} className="v5-glass min-h-[60vh] w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:border-violet-300/40" aria-label="Raw prompt" /> : null}
        {mode === 'Preview' ? <pre className="v5-glass min-h-[50vh] whitespace-pre-wrap rounded-2xl border border-white/10 p-5 text-sm leading-7 text-slate-300">{preview || 'Start writing your prompt.'}</pre> : null}
        {mode === 'Test Lab' ? <PromptQualityCenter checks={testLab.checks} title="Prompt Test Lab & Quality Center" /> : null}
        {mode === 'Versions' ? (
          <section className="v5-glass rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold text-white">Versions</h2><p className="mt-1 text-xs text-slate-500">Autosave updates only the mutable Draft. Save Version creates an immutable snapshot.</p></div>
              <button type="button" onClick={saveVersion} className="min-h-11 rounded-xl border border-violet-300/25 bg-violet-300/[0.08] px-4 text-xs font-medium text-violet-100">Save Version</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="text-xs text-slate-400">Label<input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="Optional version label" className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none" /></label>
              <label className="text-xs text-slate-400">Status<select value={versionStatus} onChange={(event) => setVersionStatus(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#09101d] px-3 text-xs text-slate-200"><option value={VERSION_STATUS.STABLE}>Stable</option><option value={VERSION_STATUS.EXPERIMENTAL}>Experimental</option><option value={VERSION_STATUS.ARCHIVED}>Archived</option></select></label>
            </div>
            <label className="mt-3 block text-xs text-slate-400">Change note<textarea value={changeNote} onChange={(event) => setChangeNote(event.target.value)} rows={3} className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200 outline-none" /></label>
            {versions.length ? <ul className="mt-4 space-y-2">{versions.map((version) => <li key={version.versionId} className="rounded-xl border border-white/10 p-3 text-xs text-slate-300"><div className="flex flex-wrap items-center justify-between gap-2"><span>v{version.versionNumber} · {version.status} · {version.label}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => compareVersion(version)} className="min-h-11 rounded-lg border border-violet-300/20 px-3 text-violet-100">Compare</button><button type="button" onClick={() => restoreVersion(version)} className="min-h-11 rounded-lg border border-cyan-300/20 px-3 text-cyan-100">Restore</button>{version.status !== VERSION_STATUS.ARCHIVED ? <button type="button" onClick={() => archiveVersion(version.versionId)} className="min-h-11 rounded-lg border border-white/10 px-3 text-slate-300">Archive</button> : null}</div></div>{version.changeNote ? <p className="mt-2 text-slate-500">{version.changeNote}</p> : null}</li>)}</ul> : <p className="mt-4 text-xs text-slate-500">No versions yet.</p>}
          </section>
        ) : null}
      </div>
    </section>
  );
}
