'use client';

import React from 'react';

function MetricCard({ label, value, hint }) {
  const available = value !== null && value !== undefined;
  return (
    <article className="v5-glass rounded-2xl border border-white/10 p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${available ? 'text-white' : 'text-slate-600'}`}>{available ? value : 'Unavailable'}</p>
      {hint ? <p className="mt-1 text-[10px] text-slate-600">{hint}</p> : null}
    </article>
  );
}

export default function ControlCenter({
  metrics = null,
  analytics = null,
  activity = [],
  failures = { runs: [], sync: [], storage: [] },
  onNavigate,
}) {
  const runFailures = failures?.runs || [];
  const syncFailures = failures?.sync || [];
  const storageFailures = failures?.storage || [];
  const totalFailures = runFailures.length + syncFailures.length + storageFailures.length;
  const statuses = analytics?.statusBreakdown || {};

  return (
    <main className="h-full overflow-auto px-3 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6" data-control-center>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="v5-glass rounded-[28px] border border-cyan-200/15 p-5 md:p-7">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/60">CONTROL CENTER V2</p>
          <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Real workspace health.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Every number below comes from persisted Prompt.OS records. Missing data stays unavailable instead of being estimated.</p>
        </header>

        <section aria-labelledby="control-metrics-title">
          <div className="flex items-end justify-between gap-3"><h2 id="control-metrics-title" className="text-sm font-semibold text-white">Workspace metrics</h2><span className="text-[10px] font-mono text-slate-600">persisted records only</span></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Runs Today" value={metrics?.runsToday} />
            <MetricCard label="7 days" value={metrics?.runs7d} />
            <MetricCard label="30 days" value={metrics?.runs30d} />
            <MetricCard label="Saved Results" value={metrics?.savedResults} />
            <MetricCard label="Pending Sync" value={metrics?.pendingSync} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Custom Prompts" value={metrics?.customPrompts} />
            <MetricCard label="Drafts" value={metrics?.drafts} />
            <MetricCard label="Versions" value={metrics?.versions} />
            <MetricCard label="Sync Errors" value={metrics?.syncErrors} />
            <MetricCard label="Conflicts" value={metrics?.conflicts} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Average latency" value={metrics?.averageLatencyMs == null ? null : `${Math.round(metrics.averageLatencyMs)} ms`} hint="Only Runs with real latency metadata" />
            <MetricCard label="Input tokens" value={metrics?.inputTokens} hint="Only provider-returned metadata" />
            <MetricCard label="Output tokens" value={metrics?.outputTokens} hint="Only provider-returned metadata" />
          </div>
        </section>

        <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="status-breakdown-title">
          <div className="flex items-center justify-between gap-3"><h2 id="status-breakdown-title" className="text-sm font-semibold text-white">Status Breakdown</h2><span className="text-[10px] text-slate-600">real Run records</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Success" value={statuses.success ?? 0} />
            <MetricCard label="Failed" value={statuses.failed ?? 0} />
            <MetricCard label="Stopped" value={statuses.stopped ?? 0} />
            <MetricCard label="Interrupted" value={statuses.interrupted ?? 0} />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="control-activity-title">
            <div className="flex items-center justify-between gap-3"><h2 id="control-activity-title" className="text-sm font-semibold text-white">Recent Activity</h2><span className="text-[10px] text-slate-600">{activity.length} records</span></div>
            {activity.length ? <ul className="mt-3 divide-y divide-white/[0.06]">{activity.slice(0, 12).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs text-slate-300">{item.label}</p><p className="mt-1 text-[9px] font-mono text-slate-600">{item.type}</p></div><time className="shrink-0 text-[10px] text-slate-600">{new Date(item.occurredAt).toLocaleString()}</time></li>)}</ul> : <p className="mt-3 rounded-xl border border-white/10 p-4 text-xs text-slate-500">No persisted activity yet.</p>}
          </section>

          <section className="v5-glass rounded-2xl border border-white/10 p-4" aria-labelledby="failure-center-title">
            <div className="flex items-center justify-between gap-3"><h2 id="failure-center-title" className="text-sm font-semibold text-white">Failure Center</h2><span className="rounded-full border border-rose-300/20 px-2 py-1 text-[10px] text-rose-200">{totalFailures}</span></div>
            {totalFailures ? <div className="mt-3 space-y-3"><FailureGroup title="Run failures" items={runFailures} /><FailureGroup title="Sync errors / conflicts" items={syncFailures} /><FailureGroup title="Storage errors" items={storageFailures} /></div> : <p className="mt-3 rounded-xl border border-white/10 p-4 text-xs text-slate-500">No recorded failures.</p>}
          </section>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate?.('history')} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-200">Open Run History</button>
          <button type="button" onClick={() => onNavigate?.('results')} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs text-slate-200">Open Saved Results</button>
          <button type="button" onClick={() => onNavigate?.('storage')} className="min-h-11 rounded-xl border border-cyan-300/20 px-4 text-xs text-cyan-100">Storage & Sync</button>
        </div>
      </div>
    </main>
  );
}

function FailureGroup({ title, items = [] }) {
  if (!items.length) return null;
  return <div><h3 className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">{title}</h3><ul className="mt-2 space-y-2">{items.slice(0, 8).map((item) => <li key={item.id || item.resultId || item.versionId} className="rounded-xl border border-rose-300/10 bg-rose-300/[0.03] p-3 text-xs text-slate-300">{item.error?.message || item.error || item.message || `${item.status || item.state || 'error'} · ${item.id || ''}`}</li>)}</ul></div>;
}
