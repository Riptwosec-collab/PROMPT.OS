'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PromptSearch from './PromptSearch.jsx';
import PromptDetailV2 from './PromptDetailV2.jsx';
import { AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION, mergePromptCatalog } from '../../lib/prompts/ai-prompt-library.mjs';
import { migratePromptState } from '../../lib/prompts/state-migration.mjs';
import { searchPrompts } from '../../lib/search/prompt-search.mjs';

const STORAGE_KEY = 'promptVaultData';

function readStoredDatabase() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadPrompts() {
  if (typeof window === 'undefined') return AI_PROMPT_LIBRARY;
  try {
    const parsed = readStoredDatabase();
    const localPrompts = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.prompts) ? parsed.prompts : [];
    const merged = mergePromptCatalog(localPrompts, AI_PROMPT_LIBRARY);
    const migration = migratePromptState(merged);
    return migration.ok ? migration.prompts : merged;
  } catch (error) {
    console.error('Failed to load V5 prompt library', error);
    return AI_PROMPT_LIBRARY;
  }
}

function persistPrompts(prompts) {
  if (typeof window === 'undefined') return;
  try {
    const existing = readStoredDatabase();
    const base = existing && !Array.isArray(existing) && typeof existing === 'object' ? existing : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...base,
      schemaVersion: Math.max(Number(base.schemaVersion || 0), 5),
      catalogVersion: PROMPT_CATALOG_VERSION,
      prompts,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to persist V5 prompt library', error);
  }
}

function uniqueValues(prompts, key) {
  return [...new Set(prompts.map((prompt) => prompt?.[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

export default function PromptLibraryV5({ detailEnabled = false, onOpenPrompt, onRunPrompt }) {
  const [prompts, setPrompts] = useState(() => AI_PROMPT_LIBRARY);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  useEffect(() => {
    setPrompts(loadPrompts());
  }, []);

  const categories = useMemo(() => uniqueValues(prompts, 'category'), [prompts]);
  const difficulties = useMemo(() => uniqueValues(prompts, 'difficulty'), [prompts]);
  const sources = useMemo(() => uniqueValues(prompts, 'sourceType'), [prompts]);
  const results = useMemo(() => searchPrompts(prompts, query, filters), [prompts, query, filters]);
  const selectedPrompt = useMemo(() => prompts.find((prompt) => prompt.id === selectedPromptId) || null, [prompts, selectedPromptId]);

  const openPrompt = (id) => {
    onOpenPrompt?.(id);
    if (detailEnabled) setSelectedPromptId(id);
  };

  const patchPrompt = (id, patch) => {
    setPrompts((current) => {
      const next = current.map((prompt) => prompt.id === id ? { ...prompt, ...patch, updatedAt: new Date().toISOString() } : prompt);
      persistPrompts(next);
      return next;
    });
  };

  if (detailEnabled && selectedPrompt) {
    return (
      <PromptDetailV2
        prompt={selectedPrompt}
        onClose={() => setSelectedPromptId(null)}
        onRun={onRunPrompt}
        onFavorite={(id, favorite) => patchPrompt(id, { favorite })}
        onPin={(id, pinned) => patchPrompt(id, { pinned })}
      />
    );
  }

  return (
    <section className="h-full overflow-auto p-3 md:p-6" data-v5-library>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono tracking-[0.28em] text-cyan-300/60">PROMPT.OS V5</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Prompt Library</h1>
            <p className="mt-1 text-xs text-slate-500">{results.length} of {prompts.length} prompts</p>
          </div>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] font-mono text-cyan-200">SEARCH V2</span>
        </header>

        <PromptSearch
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          difficulties={difficulties}
          sources={sources}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          {results.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => openPrompt(prompt.id)}
              className="v5-glass group min-w-0 rounded-2xl border border-white/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30"
              data-prompt-id={prompt.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">{prompt.displayTitle || prompt.title || prompt.name}</h2>
                  {prompt.displayTitleTh && prompt.displayTitleTh !== prompt.displayTitle ? (
                    <p className="mt-1 truncate text-xs text-cyan-200/70">{prompt.displayTitleTh}</p>
                  ) : null}
                </div>
                {prompt.favorite ? <span aria-label="Favorite" className="text-amber-300">★</span> : null}
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{prompt.descriptionTh || prompt.description || 'No description'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {prompt.category ? <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">{prompt.category}</span> : null}
                {(prompt.tags || []).slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-500">{tag}</span>)}
              </div>
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="v5-glass rounded-2xl border border-white/10 p-10 text-center text-sm text-slate-400">No matching prompts / ไม่พบพรอมต์ที่ตรงกัน</div>
        ) : null}
      </div>
    </section>
  );
}
