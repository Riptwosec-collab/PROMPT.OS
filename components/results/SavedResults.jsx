'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { serializeArtifact } from '../../lib/export/artifact-export.mjs';

function downloadText(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SavedResults({ resultRepository, ready = false }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ append = false, nextCursor = null } = {}) => {
    if (!ready || !resultRepository?.listPage) return;
    setLoading(true);
    setError('');
    try {
      const page = await resultRepository.listPage({ search, pinned: pinnedOnly ? true : null, cursor: nextCursor, limit: 30 });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause?.message || 'Unable to load Saved Results.');
    } finally {
      setLoading(false);
    }
  }, [pinnedOnly, ready, resultRepository, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const update = async (resultId, patch) => {
    await resultRepository.updateMetadata(resultId, patch);
    await load();
  };

  const remove = async (resultId) => {
    if (!window.confirm('Delete this Saved Result? The source Run will remain in History.')) return;
    await resultRepository.delete(resultId);
    await load();
  };

  const duplicate = async (resultId) => {
    await resultRepository.duplicate(resultId, { name: 'Copy' });
    await load();
  };

  const exportResult = (result, format = 'markdown') => {
    const ext = format === 'markdown' ? 'md' : format;
    downloadText(`prompt-os-result-${result.resultId}.${ext}`, serializeArtifact({ kind: 'result', record: result, format }), format === 'json' ? 'application/json' : 'text/plain');
  };

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8" aria-labelledby="saved-results-title">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-violet-300/70">CURATED OUTPUT</p>
            <h1 id="saved-results-title" className="mt-2 text-2xl font-semibold text-white md:text-3xl">Saved Results</h1>
            <p className="mt-2 text-sm text-slate-400">Immutable output snapshots with editable organization metadata.</p>
          </div>
          <button type="button" onClick={() => load()} disabled={!ready || loading} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-200 disabled:opacity-40">Refresh</button>
        </header>

        <div className="v5-glass mb-4 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, prompt, output, tags, notes" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-300/40" />
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-slate-300"><input type="checkbox" checked={pinnedOnly} onChange={(event) => setPinnedOnly(event.target.checked)} /> Pinned only</label>
        </div>

        {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-sm text-rose-100">{error}</div> : null}
        {!ready ? <div className="v5-glass rounded-2xl p-6 text-sm text-slate-400">Local Saved Result storage is loading.</div> : null}

        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((result) => (
            <article key={result.resultId} className="v5-glass rounded-2xl border border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <input value={result.name || ''} onChange={(event) => setItems((current) => current.map((item) => item.resultId === result.resultId ? { ...item, name: event.target.value } : item))} onBlur={(event) => update(result.resultId, { name: event.target.value })} aria-label="Saved result name" className="w-full bg-transparent text-sm font-medium text-white outline-none" />
                  <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-400">{result.outputSnapshot || 'No output captured.'}</p>
                </div>
                <button type="button" onClick={() => update(result.resultId, { pinned: !result.pinned })} aria-pressed={Boolean(result.pinned)} className="min-h-11 min-w-11 rounded-xl border border-white/10 text-sm text-slate-300">{result.pinned ? '★' : '☆'}</button>
              </div>
              <textarea value={result.notes || ''} onChange={(event) => setItems((current) => current.map((item) => item.resultId === result.resultId ? { ...item, notes: event.target.value } : item))} onBlur={(event) => update(result.resultId, { notes: event.target.value })} rows={2} placeholder="Notes" className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300 outline-none" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => duplicate(result.resultId)} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">Duplicate</button>
                <button type="button" onClick={() => exportResult(result, 'markdown')} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">Export MD</button>
                <button type="button" onClick={() => exportResult(result, 'json')} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">Export JSON</button>
                <button type="button" onClick={() => remove(result.resultId)} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-xs text-rose-200">Delete</button>
              </div>
            </article>
          ))}
        </div>

        {ready && !items.length && !loading ? <div className="v5-glass rounded-2xl p-8 text-center text-sm text-slate-500">No Saved Results match this view.</div> : null}
        {cursor ? <button type="button" onClick={() => load({ append: true, nextCursor: cursor })} disabled={loading} className="mt-4 min-h-11 w-full rounded-xl border border-violet-300/20 bg-violet-300/[0.04] text-xs text-violet-100 disabled:opacity-40">Load more</button> : null}
      </div>
    </section>
  );
}
