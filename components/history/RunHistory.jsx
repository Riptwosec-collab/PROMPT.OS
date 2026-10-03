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

export default function RunHistory({ runRepository, ready = false }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ append = false, nextCursor = null } = {}) => {
    if (!ready || !runRepository?.listPage) return;
    setLoading(true);
    setError('');
    try {
      const page = await runRepository.listPage({ search, statuses: status ? [status] : [], cursor: nextCursor, limit: 30 });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause?.message || 'Unable to load Run History.');
    } finally {
      setLoading(false);
    }
  }, [ready, runRepository, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const exportRun = (run, format = 'markdown') => {
    const ext = format === 'markdown' ? 'md' : format;
    downloadText(`prompt-os-run-${run.id}.${ext}`, serializeArtifact({ kind: 'run', record: run, format }), format === 'json' ? 'application/json' : 'text/plain');
  };

  return (
    <section className="h-full overflow-y-auto p-4 md:p-8" aria-labelledby="run-history-title">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/60">DAILY USE</p>
            <h1 id="run-history-title" className="mt-2 text-2xl font-semibold text-white md:text-3xl">Run History</h1>
            <p className="mt-2 text-sm text-slate-400">Every durable execution, including failed, stopped, and interrupted runs.</p>
          </div>
          <button type="button" onClick={() => load()} disabled={!ready || loading} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-200 disabled:opacity-40">Refresh</button>
        </header>

        <div className="v5-glass mb-4 grid gap-3 rounded-2xl p-3 sm:grid-cols-[1fr_180px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompt, rendered input, or output" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-300/40" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#07101d] px-3 text-sm text-slate-200">
            <option value="">All statuses</option><option value="success">Success</option><option value="failed">Failed</option><option value="stopped">Stopped</option><option value="interrupted">Interrupted</option>
          </select>
        </div>

        {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-sm text-rose-100">{error}</div> : null}
        {!ready ? <div className="v5-glass rounded-2xl p-6 text-sm text-slate-400">Local Run storage is loading.</div> : null}

        <div className="space-y-3">
          {items.map((run) => (
            <article key={run.id} className="v5-glass rounded-2xl border border-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-cyan-200">{run.status || 'unknown'}</span>
                    {run.model ? <span className="text-[10px] text-slate-500">{run.provider || 'provider'} / {run.model}</span> : null}
                  </div>
                  <h2 className="mt-3 truncate text-sm font-medium text-white">{run.promptTitle || run.promptId || run.id}</h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{run.output || 'No output captured.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => exportRun(run, 'markdown')} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">MD</button>
                  <button type="button" onClick={() => exportRun(run, 'json')} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-300">JSON</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {ready && !items.length && !loading ? <div className="v5-glass rounded-2xl p-8 text-center text-sm text-slate-500">No runs match this view.</div> : null}
        {cursor ? <button type="button" onClick={() => load({ append: true, nextCursor: cursor })} disabled={loading} className="mt-4 min-h-11 w-full rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] text-xs text-cyan-100 disabled:opacity-40">Load more</button> : null}
      </div>
    </section>
  );
}
