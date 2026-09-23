'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import PromptSearch from './PromptSearch.jsx';
import PromptDetailV2 from './PromptDetailV2.jsx';
import PromptCardV5 from './PromptCardV5.jsx';
import PromptPacks from './PromptPacks.jsx';
import WorkspaceSidebar from '../workspace/WorkspaceSidebar.jsx';
import { AI_PROMPT_LIBRARY } from '../../lib/prompts/ai-prompt-library.mjs';
import { buildSmartCollections } from '../../lib/prompts/smart-collections.mjs';
import { scorePromptHealth } from '../../lib/prompts/health-score.mjs';
import { createPack } from '../../lib/prompts/packs.mjs';
import {
  loadPromptCatalogState,
  persistPromptCatalogState,
} from '../../lib/prompts/client-store.mjs';
import { buildDefaultPacks } from '../../lib/prompts/default-packs.mjs';
import { normalizeWorkspaceState } from '../../lib/workspace/model.mjs';
import { searchPrompts } from '../../lib/search/prompt-search.mjs';
import { shouldHandleShortcut } from '../../lib/ui/command-palette.mjs';

const STORAGE_KEY = 'promptVaultData';

function browserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function uniqueValues(prompts, key) {
  return [...new Set(prompts.map((prompt) => prompt?.[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function loadOrganization(prompts, stored) {
  const database = stored && !Array.isArray(stored) && typeof stored === 'object' ? stored : {};
  const workspaceState = normalizeWorkspaceState(database);
  const packs = Array.isArray(database.promptPacks)
    ? database.promptPacks.map((pack) => createPack(pack))
    : buildDefaultPacks(prompts);
  return { workspaceState, packs };
}

function findPromptElement(id) {
  if (typeof document === 'undefined') return null;
  return [...document.querySelectorAll('[data-prompt-id]')]
    .find((node) => node.getAttribute('data-prompt-id') === String(id)) || null;
}

export default function PromptLibraryV5({
  detailEnabled = false,
  variablesEnabled = false,
  healthEnabled = false,
  workspaceEnabled = false,
  smartCollectionsEnabled = false,
  executionEnabled = false,
  immersiveRunEnabled = false,
  premiumCardsEnabled = false,
  sharedTransitionEnabled = false,
  externalRequest = null,
  onExternalRequestHandled,
  onOpenPrompt,
  onRunPrompt,
}) {
  const [prompts, setPrompts] = useState(() => AI_PROMPT_LIBRARY);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [activeView, setActiveView] = useState('all');
  const [hydrated, setHydrated] = useState(false);
  const [organization, setOrganization] = useState(() => ({
    workspaceState: normalizeWorkspaceState({}),
    packs: buildDefaultPacks(AI_PROMPT_LIBRARY),
  }));
  const searchInputRef = useRef(null);
  const libraryHeadingRef = useRef(null);
  const originPromptIdRef = useRef(null);
  const originTriggerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const { prompts: loadedPrompts, database } = loadPromptCatalogState(browserStorage(), AI_PROMPT_LIBRARY, STORAGE_KEY);
    setPrompts(loadedPrompts);
    setOrganization(loadOrganization(loadedPrompts, database));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if (event.key !== '/') return;
      if (!shouldHandleShortcut(event)) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener('keydown', handleSearchShortcut);
    return () => document.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const categories = useMemo(() => uniqueValues(prompts, 'category'), [prompts]);
  const difficulties = useMemo(() => uniqueValues(prompts, 'difficulty'), [prompts]);
  const sources = useMemo(() => uniqueValues(prompts, 'sourceType'), [prompts]);
  const smartCollections = useMemo(() => buildSmartCollections(prompts, new Date()), [prompts]);
  const searchedPrompts = useMemo(() => searchPrompts(prompts, query, filters), [prompts, query, filters]);
  const selectedPrompt = useMemo(() => prompts.find((prompt) => prompt.id === selectedPromptId) || null, [prompts, selectedPromptId]);
  const healthScores = useMemo(() => {
    if (!healthEnabled) return new Map();
    return new Map(prompts.map((prompt) => [String(prompt.id), scorePromptHealth(prompt).total]));
  }, [healthEnabled, prompts]);
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

  const sourceAvailable = Boolean(
    premiumCardsEnabled
    && selectedPrompt
    && results.some((prompt) => String(prompt.id) === String(selectedPrompt.id)),
  );

  const openPrompt = (id, trigger = null) => {
    originPromptIdRef.current = String(id);
    originTriggerRef.current = trigger?.focus ? trigger : findPromptElement(id);
    onOpenPrompt?.(id);
    if (detailEnabled) setSelectedPromptId(id);
  };

  const closePrompt = () => {
    const originId = originPromptIdRef.current;
    setSelectedPromptId(null);
    requestAnimationFrame(() => {
      const originalTrigger = originTriggerRef.current;
      if (originalTrigger?.isConnected && typeof originalTrigger.focus === 'function') {
        originalTrigger.focus();
        return;
      }
      const liveOrigin = findPromptElement(originId);
      if (liveOrigin && typeof liveOrigin.focus === 'function') {
        liveOrigin.focus();
        return;
      }
      if (searchInputRef.current) {
        searchInputRef.current?.focus();
        return;
      }
      libraryHeadingRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!hydrated || !externalRequest) return;

    if (externalRequest.type === 'prompt') {
      const target = prompts.find((prompt) => String(prompt.id) === String(externalRequest.id));
      if (target) openPrompt(target.id);
      onExternalRequestHandled?.();
      return;
    }

    if (externalRequest.type === 'view' && typeof externalRequest.viewId === 'string') {
      setActiveView(externalRequest.viewId);
      onExternalRequestHandled?.();
    }
  }, [hydrated, externalRequest, prompts, detailEnabled, onExternalRequestHandled]);

  const patchPrompt = (id, patch) => {
    setPrompts((current) => {
      const next = current.map((prompt) => String(prompt.id) === String(id) ? { ...prompt, ...patch, updatedAt: new Date().toISOString() } : prompt);
      persistPromptCatalogState(browserStorage(), next, null, STORAGE_KEY);
      return next;
    });
  };

  const addAllToWorkspace = (promptIds) => {
    const ids = new Set((promptIds || []).map(String));
    setPrompts((current) => {
      const next = current.map((prompt) => ids.has(String(prompt.id)) ? { ...prompt, workspaceId: workspace?.id || 'personal' } : prompt);
      persistPromptCatalogState(browserStorage(), next, null, STORAGE_KEY);
      return next;
    });
  };

  const changeView = (view) => {
    if (view?.type === 'folder') setActiveView(`folder:${view.id}`);
    else if (view?.type === 'smart') setActiveView(view.key);
    else setActiveView('all');
  };

  const showDiscovery = workspaceEnabled || smartCollectionsEnabled;
  const detailVisible = detailEnabled && selectedPrompt;

  return (
    <LayoutGroup id="premium-prompt-experience">
      <AnimatePresence initial={false}>
        {detailVisible ? (
          <motion.div
            key={`detail-${selectedPrompt.id}`}
            className="h-full"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.12 }}
          >
            <PromptDetailV2
              prompt={selectedPrompt}
              variablesEnabled={variablesEnabled}
              healthEnabled={healthEnabled}
              executionEnabled={executionEnabled}
              immersiveRunEnabled={immersiveRunEnabled}
              transitionEnabled={sharedTransitionEnabled}
              sourceAvailable={sourceAvailable}
              onClose={closePrompt}
              onRun={onRunPrompt}
              onFavorite={(id, favorite) => patchPrompt(id, { favorite })}
              onPin={(id, pinned) => patchPrompt(id, { pinned })}
            />
          </motion.div>
        ) : (
          <motion.section
            key="prompt-library"
            className="h-full overflow-auto p-3 md:p-6"
            data-v5-library
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.12 }}
          >
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
                      <h1 ref={libraryHeadingRef} tabIndex={-1} className="mt-1 text-2xl font-semibold text-white">Prompt Library</h1>
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
                    inputRef={searchInputRef}
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

                  {premiumCardsEnabled ? (
                    <div className="v5-premium-grid grid grid-cols-1 gap-4 lg:grid-cols-2" aria-live="polite">
                      <AnimatePresence initial={false}>
                        {results.map((prompt) => (
                          <motion.div
                            layout
                            key={prompt.id}
                            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            transition={{ duration: reducedMotion ? 0 : 0.16 }}
                          >
                            <PromptCardV5
                              prompt={prompt}
                              healthScore={healthEnabled ? healthScores.get(String(prompt.id)) : null}
                              onOpen={openPrompt}
                              onRun={onRunPrompt}
                              onFavorite={(id, favorite) => patchPrompt(id, { favorite })}
                              onPin={(id, pinned) => patchPrompt(id, { pinned })}
                              transitionEnabled={sharedTransitionEnabled}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
                      {results.map((prompt) => (
                        <PromptCard key={prompt.id} prompt={prompt} onOpen={(trigger) => openPrompt(prompt.id, trigger)} />
                      ))}
                    </div>
                  )}

                  {results.length === 0 ? (
                    <div className="v5-glass rounded-2xl border border-white/10 p-10 text-center text-sm text-slate-400">No matching prompts / ไม่พบพรอมต์ที่ตรงกัน</div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

function DiscoveryRow({ title, prompts, onOpenPrompt }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {prompts.map((prompt) => (
          <button key={prompt.id} type="button" onClick={(event) => onOpenPrompt?.(prompt.id, event.currentTarget)} className="min-w-44 rounded-xl border border-white/10 bg-black/20 p-3 text-left">
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
      onClick={(event) => onOpen?.(event.currentTarget)}
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