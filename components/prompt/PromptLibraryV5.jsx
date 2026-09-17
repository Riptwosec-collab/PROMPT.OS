'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PromptSearch from './PromptSearch.jsx';
import PromptDetailV2 from './PromptDetailV2.jsx';
import PromptPacks from './PromptPacks.jsx';
import WorkspaceSidebar from '../workspace/WorkspaceSidebar.jsx';
import { AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION, mergePromptCatalog } from '../../lib/prompts/ai-prompt-library.mjs';
import { migratePromptState } from '../../lib/prompts/state-migration.mjs';
import { buildSmartCollections } from '../../lib/prompts/smart-collections.mjs';
import { createPack } from '../../lib/prompts/packs.mjs';
import { normalizeWorkspaceState } from '../../lib/workspace/model.mjs';
import { searchPrompts } from '../../lib/search/prompt-search.mjs';

const STORAGE_KEY = 'promptVaultData';

const DEFAULT_PACKS = [
  ['network-engineer', 'Network Engineer', ['NETWORK_TROUBLESHOOTER', 'INCIDENT_TRIAGE_COORDINATOR', 'RUNBOOK_GENERATOR', 'NETWORK_CHANGE_RISK_REVIEWER', 'CLOUD_ARCHITECTURE_REVIEWER']],
  ['research', 'Research', ['DEEP_RESEARCH_ASSISTANT', 'FACT_CHECKER', 'SOURCE_COMPARATOR', 'RESEARCH_QUESTION_REFINER', 'LITERATURE_SYNTHESIS_MATRIX']],
  ['developer', 'Developer', ['CODE_REVIEWER', 'BUG_HUNTER', 'API_DESIGNER', 'DATABASE_SCHEMA_DESIGNER', 'CI_CD_PIPELINE_REVIEWER']],
];

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

function defaultPacksFor(prompts) {
  const byName = new Map(prompts.map((prompt) => [prompt.name, prompt.id]));
  return DEFAULT_PACKS.map(([id, name, names]) => createPack({
    id,
    name,
    promptIds: names.map((promptName) => byName.get(promptName)).filter((value) => value !== undefined),
  }));
}

function loadOrganization(prompts) {
  const stored = readStoredDatabase();
  const workspaceState = normalizeWorkspaceState(stored && !Array.isArray(stored) ? stored : {});
  const packs = Array.isArray(stored?.promptPacks)
    ? stored.promptPacks.map((pack) => createPack(pack))
    : defaultPacksFor(prompts);
  return { workspaceState, packs };
}

export default function PromptLibraryV5({
  detailEnabled = false,
  variablesEnabled = false,
  healthEnabled = false,
  workspaceEnabled = false,
  smartCollectionsEnabled = false,
  onOpenPrompt,
  onRunPrompt,
}) {
  const [prompts, setPrompts] = useState(() => AI_PROMPT_LIBRARY);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [activeView, setActiveView] = useState('all');
  const [organization, setOrganization] = useState(() => ({
    workspaceState: normalizeWorkspaceState({}),
    packs: defaultPacksFor(AI_PROMPT_LIBRARY),
  }));

  useEffect(() => {
    const loadedPrompts = loadPrompts();
    setPrompts(loadedPrompts);
    setOrganization(loadOrganization(loadedPrompts));
  }, []);

  const categories = useMemo(() => uniqueValues(prompts, 'category'), [prompts]);
  const difficulties = useMemo(() => uniqueValues(prompts, 'difficulty'), [prompts]);
  const sources = useMemo(() => uniqueValues(prompts, 'sourceType'), [prompts]);
  const smartCollections = useMemo(() => buildSmartCollections(prompts, new Date()), [prompts]);
  const searchedPrompts = useMemo(() => searchPrompts(prompts, query, filters), [prompts, query, filters]);
  const selectedPrompt = useMemo(() => prompts.find((prompt) => prompt.id === selectedPromptId) || null, [prompts, selectedPromptId]);
  const workspace = organization.workspaceState.workspaces[0];
  const folders = organization.workspaceState.folders;

  const results = useMemo(() => {
    if (activeView === 'all') return searchedPrompts;
    if (activeView.startsWith('folder:')) {
      const folderId = activeView.slice('folder:'.length);
      return searchedPrompts.filter((prompt) => String(prompt.folderId || '') === folderId);
    }
    if (activeView.startsWith('pack:')) {
      const packId = activeView.slice('pack:'.length);
      const pack = organization.packs.find((item) => item.id === packId);
      const ids = new Set((pack?.promptIds || []).map(String));
      return searchedPrompts.filter((prompt) => ids.has(String(prompt.id)));
    }
    const smart = smartCollections[activeView];
    if (Array.isArray(smart)) {
      const ids = new Set(smart.map((prompt) => String(prompt.id)));
      return searchedPrompts.filter((prompt) => ids.has(String(prompt.id)));
    }
    return searchedPrompts;
  }, [searchedPrompts, activeView, organization.packs, smartCollections]);

  const openPrompt = (id) => {
    onOpenPrompt?.(id);
    if (detailEnabled) setSelectedPromptId(id);
  };

  const patchPrompt = (id, patch) => {
    setPrompts((current) => {
      const next = current.map((prompt) => String(prompt.id) === String(id) ? { ...prompt, ...patch, updatedAt: new Date().toISOString() } : prompt);
      persistPrompts(next);
      return next;
    });
  };

  const addAllToWorkspace = (promptIds) => {
    const ids = new Set((promptIds || []).map(String));
    setPrompts((current) => {
      const next = current.map((prompt) => ids.has(String(prompt.id)) ? { ...prompt, workspaceId: workspace?.id || 'personal' } : prompt);
      persistPrompts(next);
      return next;
    });
  };

  const changeView = (view) => {
    if (view?.type === 'folder') setActiveView(`folder:${view.id}`);
    else if (view?.type === 'smart') setActiveView(view.key);
    else setActiveView('all');
  };

  if (detailEnabled && selectedPrompt) {
    return (
      <PromptDetailV2
        prompt={selectedPrompt}
        variablesEnabled={variablesEnabled}
        healthEnabled={healthEnabled}
        onClose={() => setSelectedPromptId(null)}
        onRun={onRunPrompt}
        onFavorite={(id, favorite) => patchPrompt(id, { favorite })}
        onPin={(id, pinned) => patchPrompt(id, { pinned })}
      />
    );
  }

  const showDiscovery = workspaceEnabled || smartCollectionsEnabled;

  return (
    <section className="h-full overflow-auto p-3 md:p-6" data-v5-library>
      <div className="mx-auto w-full max-w-7xl">
        <div className={showDiscovery ? 'grid gap-4 lg:grid-cols-[230px_1fr]' : ''}>
          {showDiscovery ? (
            <WorkspaceSidebar
              workspace={workspace}
              folders={folders}
              smartCollections={smartCollections}
              activeView={activeView}
              onViewChange={changeView}
            />
          ) : null}

          <div className="flex min-w-0 flex-col gap-4">
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

            {smartCollectionsEnabled && smartCollections.recentlyUsed.length > 0 ? (
              <DiscoveryRow title="Continue Working" prompts={smartCollections.recentlyUsed.slice(0, 4)} onOpenPrompt={openPrompt} />
            ) : null}
            {smartCollectionsEnabled && smartCollections.mostUsed.some((prompt) => Number(prompt.runs || 0) + Number(prompt.copyCount || 0) > 0) ? (
              <DiscoveryRow title="Most Used" prompts={smartCollections.mostUsed.filter((prompt) => Number(prompt.runs || 0) + Number(prompt.copyCount || 0) > 0).slice(0, 4)} onOpenPrompt={openPrompt} />
            ) : null}

            {showDiscovery ? (
              <PromptPacks
                packs={organization.packs}
                prompts={prompts}
                onOpenPack={(packId) => setActiveView(`pack:${packId}`)}
                onAddAllToWorkspace={addAllToWorkspace}
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
              {results.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onOpen={() => openPrompt(prompt.id)} />
              ))}
            </div>

            {results.length === 0 ? (
              <div className="v5-glass rounded-2xl border border-white/10 p-10 text-center text-sm text-slate-400">No matching prompts / ไม่พบพรอมต์ที่ตรงกัน</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DiscoveryRow({ title, prompts, onOpenPrompt }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {prompts.map((prompt) => (
          <button key={prompt.id} type="button" onClick={() => onOpenPrompt?.(prompt.id)} className="min-w-44 rounded-xl border border-white/10 bg-black/20 p-3 text-left">
            <span className="block truncate text-xs font-medium text-slate-200">{prompt.displayTitleTh || prompt.displayTitle || prompt.name}</span>
            <span className="mt-1 block text-[10px] text-slate-600">{Number(prompt.runs || 0)} runs · {Number(prompt.copyCount || 0)} copies</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PromptCard({ prompt, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="v5-glass group min-w-0 rounded-2xl border border-white/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30"
      data-prompt-id={prompt.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">{prompt.displayTitle || prompt.title || prompt.name}</h2>
          {prompt.displayTitleTh && prompt.displayTitleTh !== prompt.displayTitle ? <p className="mt-1 truncate text-xs text-cyan-200/70">{prompt.displayTitleTh}</p> : null}
        </div>
        {prompt.favorite ? <span aria-label="Favorite" className="text-amber-300">★</span> : null}
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{prompt.descriptionTh || prompt.description || 'No description'}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {prompt.category ? <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">{prompt.category}</span> : null}
        {(prompt.tags || []).slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-500">{tag}</span>)}
      </div>
    </button>
  );
}
