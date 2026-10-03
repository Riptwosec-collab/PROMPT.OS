'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { serializeArtifact, serializeArtifacts } from '../../lib/export/artifact-export.mjs';
import { useV5FeatureFlags } from '../V5FeatureFlagProvider.jsx';

function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SavedResults({ resultRepository, runRepository, onOpenPrompt }) {
  const flags = useV5FeatureFlags();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceRun, setSourceRun] = useState(null);
  const query = useMemo(() => ({ search, limit: 25 }), [search]);

  const load = async ({ append = false, cursor = null } = {}) => {
    if (!resultRepository?.listPage) return;
    setLoading(true);
    setError('');
    try {
      const page = await resultRepository.listPage({ ...query, cursor });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setNextCursor(page.nextCursor || null);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Saved Results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 180);
    return () => window.clearTimeout(timer);
  }, [resultRepository, query]);

  const selectedItems = items.filter((item) => selected.has(item.resultId));
  const toggleSelected = (id) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const update = async (resultId, patch) => {
    await resultRepository.updateMetadata(resultId, patch);
    await load();
  };

  const duplicate = async (resultId) => {
    await resultRepository.duplicate(resultId, { name: 'Copy' });
    await load();
  };

  const openSourceRun = async (item) => {
    if (!item?.sourceRunId || !runRepository?.get) {
      setError('Source Run is unavailable. The immutable Saved Result remains intact.');
      return;
    }
    try {
      const run = await runRepository.get(item.sourceRunId);
      if (!run) {
        setError('Source Run was deleted or is unavailable. The immutable Saved Result remains intact.');
        return;
      }
      setSourceRun(run);
    } catch (openError) {
      setError(openError?.message || 'Unable to open source Run.');
    }
  };

  const exportOne = (item, format = 'markdown') => {
    const text = serializeArtifact({ kind: 'result', record: item, format });
    const ext = format === 'markdown' ? 'md' : format;
    downloadText(`prompt-os-result-${item.resultId}.${ext}`, text, format === 'json' ? 'application/json' : 'text/plain;charset=utf-8');
  };

  const exportSelected = () => {
    const source = selectedItems.length ? selectedItems : items;
    if (!source.length) return;
    downloadText('prompt-os-saved-results.json', serializeArtifacts(source.map((record) => ({ kind: 'result', record })), 'json'), 'application/json');
  };

  const compareSelected = () => {
    if (!flags.V5_PROMPT_STUDIO || selectedItems.length !== 2 || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('prompt-os:compare', {
      detail: {
        left: { kind: 'result', record: selectedItems[0] },
        right: { kind: 'result', record: selectedItems[1] },
      },
    }));
  };

  const deleteOne = async (item) => {
    if (!window.confirm(`Delete Saved Result “${item.name || item.resultId}”? The source Run will remain.`)) return;
    await resultRepository.delete(item.resultId);
    setSelected((current) => { const next = new Set(current); next.delete(item.resultId); return next; });
    await load();
  };

  if (!resultRepository) {
    return <section className="h-full overflow-auto p-4 md:p-6"><div className="v5-glass rounded-2xl p-6 text-sm text-amber-100">Saved Results unavailable. Local runtime storage is not ready.</div></section>;
  }

  return (
    <section className="h-full overflow-auto p-4 md:p-6" aria-labelledby="saved-results-title">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-[10px] font-mono tracking-[0.24em] text-violet-300/60">CURATED ARTIFACTS</p>
          <h1 id="saved-results-title" className="mt-1 text-2xl font-semibold text-white">Saved Results</h1>
          <p className="mt-1 text-xs text-slate-500">Immutable output snapshots with editable organization metadata.</p>
        </header>

        <div className="v5-glass flex flex-wrap gap-2 rounded-2xl p-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search results" aria-label="Search results" className="min-h-11 min-w-56 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-300/40" />
          <button type="button" onClick={exportSelected} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Export</button>
          {flags.V5_PROMPT_STUDIO ? <button type="button" onClick={compareSelected} disabled={selectedItems.length !== 2} className="min-h-11 rounded-xl border border-violet-300/20 px-3 text-xs text-violet-100 disabled:opacity-40">Compare selected</button> : null}
        </div>

        {error ? <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-xs text-rose-100">{error}</div> : null}
        {sourceRun ? <aside className="v5-glass rounded-2xl border border-cyan-300/20 p-4" aria-label="Source Run"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-300/60">SOURCE RUN</p><p className="mt-1 text-sm font-medium text-white">{sourceRun.promptTitle || sourceRun.promptId || sourceRun.id}</p></div><button type="button" onClick={() => setSourceRun(null)} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">Close</button></div><p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-400">{sourceRun.output || sourceRun.renderedPrompt || 'No output checkpointed.'}</p></aside> : null}

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.resultId} className="v5-glass rounded-2xl border border-white/10 p-4">
              <div className="flex gap-3">
                <input type="checkbox" checked={selected.has(item.resultId)} onChange={() => toggleSelected(item.resultId)} aria-label={`Select ${item.resultId}`} className="mt-1 h-4 w-4" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] text-slate-500">Rename<input key={`${item.resultId}:${item.updatedAt}`} defaultValue={item.name || 'Saved Result'} onBlur={(event) => event.target.value.trim() !== (item.name || 'Saved Result') && update(item.resultId, { name: event.target.value })} className="mt-1 min-h-11 w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-medium text-white" /></label>
                      <div className="mt-2 flex flex-wrap gap-3"><button type="button" onClick={() => openSourceRun(item)} className="text-[10px] text-violet-300/80 hover:text-violet-200">Open source Run</button><button type="button" onClick={() => item.metadataSnapshot?.promptId && onOpenPrompt?.(item.metadataSnapshot.promptId)} className="text-[10px] text-cyan-300/70 hover:text-cyan-200">Open source Prompt</button></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => update(item.resultId, { pinned: !item.pinned })} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">{item.pinned ? 'Unpin' : 'Pin'}</button>
                      <button type="button" onClick={() => duplicate(item.resultId)} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Duplicate</button>
                      <button type="button" onClick={() => exportOne(item)} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Export</button>
                      <button type="button" onClick={() => deleteOne(item)} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-xs text-rose-100">Delete</button>
                    </div>
                  </div>

                  <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-400">{item.outputSnapshot || 'No output snapshot.'}</p>

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="text-[10px] text-slate-500">Tags<input defaultValue={(item.tags || []).join(', ')} onBlur={(event) => update(item.resultId, { tags: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-slate-200" placeholder="Tags" /></label>
                    <label className="text-[10px] text-slate-500">Notes<input defaultValue={item.notes || ''} onBlur={(event) => update(item.resultId, { notes: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-slate-200" placeholder="Notes" /></label>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!loading && items.length === 0 ? <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-500">No Saved Results match this search.</div> : null}
        </div>

        <div className="flex justify-center pb-8">{nextCursor ? <button type="button" disabled={loading} onClick={() => load({ append: true, cursor: nextCursor })} className="min-h-11 rounded-xl border border-violet-300/20 px-4 text-xs text-violet-100 disabled:opacity-40">Load more</button> : null}</div>
      </div>
    </section>
  );
}
