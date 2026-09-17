'use client';

import React from 'react';

const QUICK_FILTERS = [
  ['favorite', 'Favorites'],
  ['recent', 'Recent'],
  ['hasVariables', 'Has Variables'],
];

export default function PromptSearch({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  categories = [],
  difficulties = [],
  sources = [],
}) {
  const patch = (next) => onFiltersChange?.({ ...filters, ...next });

  return (
    <section className="v5-glass rounded-2xl border border-white/10 p-3 md:p-4" data-v5-search>
      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Search prompts</span>
          <input
            aria-label="Search prompts"
            value={query}
            onChange={(event) => onQueryChange?.(event.target.value)}
            placeholder="Search prompts / ค้นหาพรอมต์..."
            className="w-full rounded-xl border border-cyan-400/20 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15"
          />
        </label>

        <div className="flex flex-wrap gap-2" aria-label="Quick filters">
          {QUICK_FILTERS.map(([key, label]) => {
            const active = filters?.[key] === true;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => patch({ [key]: active ? undefined : true })}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <FilterSelect label="Category" value={filters?.category || ''} values={categories} onChange={(value) => patch({ category: value || undefined })} />
          <FilterSelect label="Difficulty" value={filters?.difficulty || ''} values={difficulties} onChange={(value) => patch({ difficulty: value || undefined })} />
          <FilterSelect label="Source" value={filters?.source || ''} values={sources} onChange={(value) => patch({ source: value || undefined })} />
          <label className="flex min-w-0 flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Has Variables
            <select
              value={filters?.hasVariables === true ? 'yes' : filters?.hasVariables === false ? 'no' : ''}
              onChange={(event) => patch({ hasVariables: event.target.value === '' ? undefined : event.target.value === 'yes' })}
              className="rounded-lg border border-white/10 bg-[#07101d] px-2 py-2 text-xs normal-case tracking-normal text-slate-200"
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-white/10 bg-[#07101d] px-2 py-2 text-xs normal-case tracking-normal text-slate-200"
      >
        <option value="">All</option>
        {values.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}
