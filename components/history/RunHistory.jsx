'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { serializeArtifacts } from '../../lib/export/artifact-export.mjs';
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

function statusLabel(status) {
  return String(status || 'unknown').toUpperCase();
}

export default function RunHistory({ runRepository, onOpenPrompt }) {
  const flags = useV5FeatureFlags();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = useMemo(() => ({ search, statuses: status ? [status] : [], limit: 25 }), [search, status]);

  const load = async ({ append = false, cursor = null } = {}) => {
    if (!runRepository?.listPage) return;
    setLoading(true);
    setError('');
    try {
      const page = await runRepository.listPage({ ...query, cursor });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setNextCursor(page.nextCursor || null);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Run History.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 180);
    return () => window.clearTimeout(timer);
  }, [runRepository, query]);

  const selectedItems = items.filter((item) => selected.has(item.id));
  const toggle = (id) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const exportSelected = (format = 'json') => {
    const source = selectedItems.length ? selectedItems : items;
    if (!source.length) return;
    const text = serializeArtifacts(source.map((record) => ({ kind: 'run', record })), format);
    const ext = format === 'markdown' ? 'md' : format;
    downloadText(`prompt-os-run-history.${ext}`, text, format === 'json' ? 'application/json' : 'text/plain;charset=utf-8');
  };

  const compareSelected = () => {
    if (!flags.V5_PROMPT_STUDIO || selectedItems.length !== 2 || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('prompt-os:compare', {
      detail: {
        left: { kind: 'run', record: selectedItems[0] },
        right: { kind: 'run', record: selectedItems[1] },
      },
    }));
  };

  const deleteSelected = async () => {
    if (!selectedItems.length || !runRepository?.delete) return;
    if (!window.confirm(`Delete ${selectedItems.length} selected Run records? Saved Results are not deleted.`)) return;
    for (const item of selectedItems) await runRepository.delete(item.id);
    setSelected(new Set());
    await load();
  };

  if (!runRepository) {
    return <section className="h-full overflow-auto p-4 md:p-6"><div className="v5-glass rounded-2xl p-6 text-sm text-amber-100">Run history unavailable. Local runtime storage is not ready.</div></section>;
  }

  return (
    <section className="h-full overflow-auto p-4 md:p-6" aria-labelledby="run-history-title">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-[10px] font-mono tracking-[0.24em] text-cyan-300/60">DAILY USE</p>
          <h1 id="run-history-title" className="mt-1 text-2xl font-semibold text-white">Run History</h1>
          <p className="mt-1 text-xs text-slate-500">Every durably created Run stays discoverable here.</p>
        </header>

        <div className="v5-glass grid gap-3 rounded-2xl p-3 md:grid-cols-[1fr_180px_auto]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search history" aria-label="Search history" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-300/40" />
          <label className="text-[10px] text-slate-400">Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#09101d] px-3 text-xs text-slate-200">
              <option value="">All</option><option value="success">Success</option><option value="failed">Failed</option><option value="stopped">Stopped</option><option value="interrupted">Interrupted</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button type="button" onClick={() => exportSelected('json')} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200">Export</button>
            {flags.V5_PROMPT_STUDIO ? <button type="button" onClick={compareSelected} disabled={selectedItems.length !== 2} className="min-h-11 rounded-xl border border-violet-300/20 px-3 text-xs text-violet-100 disabled:opacity-40">Compare selected</button> : null}
            <button type="button" onClick={deleteSelected} disabled={!selectedItems.length} className="min-h-11 rounded-xl border border-rose-300/20 px-3 text-xs text-rose-100 disabled:opacity-40">Delete selected</button>
          </div>
        </div>

        {error ? <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-xs text-rose-100">{error}</div> : null}

        <div className="space-y-2">
          {items.map((run) => (
            <article key={run.id} className="v5-glass rounded-2xl border border-white/10 p-4">
              <div className="flex gap-3">
                <input type="checkbox" checked={selected.has(run.id)} onChange={() => toggle(run.id)} aria-label={`Select ${run.id}`} className="mt-1 h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onClick={() => run.promptId && onOpenPrompt?.(run.promptId)} className="truncate text-left text-sm font-medium text-white hover:text-cyan-200">{run.promptTitle || run.promptId || 'Prompt Run'}</button>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-mono text-slate-400">{statusLabel(run.status)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{run.output || run.renderedPrompt || 'No output checkpointed.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-600">
                    <span>{run.model || run.provider || 'provider unavailable'}</span><span>•</span><span>{run.createdAt ? new Date(run.createdAt).toLocaleString() : 'time unavailable'}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!loading && items.length === 0 ? <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-500">No Run History matches these filters.</div> : null}
        </div>

        <div className="flex justify-center pb-8">
          {nextCursor ? <button type="button" disabled={loading} onClick={() => load({ append: true, cursor: nextCursor })} className="min-h-11 rounded-xl border border-cyan-300/20 px-4 text-xs text-cyan-100 disabled:opacity-40">Load more</button> : null}
        </div>
      </div>
    </section>
  );
}
