'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import CloudSyncPanel from './CloudSyncPanel.jsx';
import { streamAiRun } from '../lib/ai/run-stream.mjs';

const STORAGE_KEY = 'promptVaultData';
const SCHEMA_VERSION = 3;
const DEFAULT_COLLECTIONS = ['General', 'Coding', 'Image', 'Work'];

const DEFAULT_PROMPTS = [
  {
    id: 1,
    title: 'SYSTEM.UI_COMPONENT',
    description: 'Generate responsive UI with Tailwind',
    prompt: 'Create a modern, responsive user profile card using React and Tailwind CSS. Include a dark mode variant.',
    type: 'text',
    tags: ['REACT', 'CODE'],
    category: 'Coding',
    exampleText: 'export default function Card() {\n  return (\n    <div className="p-6 rounded-xl shadow-lg border-cyan-500">\n      {/* Content */}\n    </div>\n  )\n}',
    version: '1.0',
    runs: 0,
    results: [],
  },
  {
    id: 2,
    title: 'RENDER.CYBERPUNK',
    description: 'Futuristic server room environment',
    prompt: 'A futuristic server room with glowing neon blue and magenta cables, volumetric smoke, 8k resolution --ar 16:9',
    type: 'image',
    tags: ['MIDJOURNEY', 'VISION'],
    category: 'Image Generation',
    exampleUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
    version: '1.0',
    runs: 0,
    results: [],
  },
];

function nowIso() {
  return new Date().toISOString();
}

function nextVersion(current = '1.0') {
  const parts = String(current).split('.');
  const major = Number(parts[0]) || 1;
  const minor = Number(parts[1]) || 0;
  return `${major}.${minor + 1}`;
}

function emptyBuilder() {
  return {
    role: '',
    context: '',
    task: '',
    requirements: '',
    constraints: '',
    outputFormat: '',
  };
}

function normalizeResult(result = {}, index = 0, promptVersion = '1.0', total = 0) {
  return {
    id: result.id ?? Date.now() + index,
    runNumber: result.runNumber || Math.max(1, total - index),
    content: result.content || '',
    provider: result.provider || 'Local',
    model: result.model || 'Simulated Model',
    promptVersion: result.promptVersion || promptVersion,
    status: result.status || 'Ready',
    isBest: Boolean(result.isBest),
    rating: Number(result.rating || 0),
    notes: result.notes || '',
    latencyMs: Number(result.latencyMs || 0),
    inputTokens: Number(result.inputTokens || 0),
    outputTokens: Number(result.outputTokens || 0),
    cost: Number(result.cost || 0),
    createdAt: result.createdAt || nowIso(),
  };
}

function upgradePrompt(prompt = {}, index = 0) {
  const version = prompt.version || '1.0';
  const results = (prompt.results || []).map((result, resultIndex) =>
    normalizeResult(result, resultIndex, version, prompt.results?.length || 0),
  );

  const versions = Array.isArray(prompt.versions) && prompt.versions.length
    ? prompt.versions.map((item, versionIndex) => ({
        id: item.id || `${prompt.id || index}-v-${versionIndex}-${item.version || version}`,
        version: item.version || version,
        prompt: item.prompt ?? prompt.prompt ?? '',
        updatedAt: item.updatedAt || prompt.updatedAt || nowIso(),
        note: item.note || '',
      }))
    : [{
        id: `${prompt.id || index}-v-initial`,
        version,
        prompt: prompt.prompt || '',
        updatedAt: prompt.updatedAt || nowIso(),
        note: 'Initial imported version',
      }];

  return {
    id: prompt.id ?? Date.now() + index,
    title: prompt.title || 'UNTITLED_PROMPT',
    description: prompt.description || '',
    prompt: prompt.prompt || '',
    type: prompt.type || 'text',
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    category: prompt.category || 'General',
    exampleText: prompt.exampleText || '',
    exampleUrl: prompt.exampleUrl || '',
    favorite: Boolean(prompt.favorite),
    pinned: Boolean(prompt.pinned),
    rating: Number(prompt.rating || 0),
    copyCount: Number(prompt.copyCount || 0),
    runs: Number(prompt.runs || results.length || 0),
    version,
    status: prompt.status || 'Ready',
    results,
    versions,
    deletedAt: prompt.deletedAt || null,
    collections: Array.isArray(prompt.collections) ? prompt.collections : [],
    variables: prompt.variables && typeof prompt.variables === 'object' ? prompt.variables : {},
    builder: { ...emptyBuilder(), ...(prompt.builder || {}) },
    createdAt: prompt.createdAt || prompt.updatedAt || nowIso(),
    updatedAt: prompt.updatedAt || nowIso(),
  };
}

function normalizeDatabase(raw) {
  if (Array.isArray(raw)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      collections: DEFAULT_COLLECTIONS,
      prompts: raw.map(upgradePrompt),
    };
  }

  if (raw && typeof raw === 'object' && Array.isArray(raw.prompts)) {
    return {
      schemaVersion: SCHEMA_VERSION,
      collections: Array.from(new Set([...(raw.collections || []), ...DEFAULT_COLLECTIONS])),
      prompts: raw.prompts.map(upgradePrompt),
    };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    collections: DEFAULT_COLLECTIONS,
    prompts: DEFAULT_PROMPTS.map(upgradePrompt),
  };
}

function loadDatabase() {
  try {
    if (typeof window === 'undefined') return normalizeDatabase(DEFAULT_PROMPTS);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeDatabase(DEFAULT_PROMPTS);
    return normalizeDatabase(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to load Prompt.OS database', error);
    return normalizeDatabase(DEFAULT_PROMPTS);
  }
}

function serializeDatabase(prompts, collections) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    appVersion: '3.0',
    collections,
    prompts,
  };
}

function extractVariables(prompt = '') {
  const matches = [...String(prompt).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

function renderPromptVariables(prompt, values = {}) {
  return String(prompt || '').replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (full, key) => values[key] ?? full);
}

function compileBuilder(builder) {
  const sections = [
    ['ROLE', builder.role],
    ['CONTEXT', builder.context],
    ['TASK', builder.task],
    ['REQUIREMENTS', builder.requirements],
    ['CONSTRAINTS', builder.constraints],
    ['OUTPUT FORMAT', builder.outputFormat],
  ];

  return sections
    .filter(([, value]) => String(value || '').trim())
    .map(([label, value]) => `${label}\n${String(value).trim()}`)
    .join('\n\n');
}

function diffLines(previous = '', next = '') {
  const a = String(previous).split('\n');
  const b = String(next).split('\n');
  const max = Math.max(a.length, b.length);
  const rows = [];

  for (let i = 0; i < max; i += 1) {
    if (a[i] === b[i]) {
      rows.push({ type: 'same', text: a[i] ?? '' });
    } else {
      if (a[i] !== undefined) rows.push({ type: 'remove', text: a[i] });
      if (b[i] !== undefined) rows.push({ type: 'add', text: b[i] });
    }
  }
  return rows;
}

function promptHealth(prompt) {
  const text = String(prompt.prompt || '').toLowerCase();
  const checks = [
    { label: 'Task is explicit', pass: text.length >= 30 },
    { label: 'Role or perspective defined', pass: /you are|act as|role|expert/.test(text) || Boolean(prompt.builder?.role) },
    { label: 'Output format defined', pass: /output|format|json|table|list|markdown/.test(text) || Boolean(prompt.builder?.outputFormat) },
    { label: 'Constraints included', pass: /must|do not|avoid|constraint|limit/.test(text) || Boolean(prompt.builder?.constraints) },
    { label: 'Context provided', pass: /context|background|audience|for a|for an/.test(text) || Boolean(prompt.builder?.context) },
    { label: 'Has variables/examples', pass: extractVariables(prompt.prompt).length > 0 || /example|e\.g\.|such as/.test(text) },
  ];
  return { checks, score: checks.filter((item) => item.pass).length, max: checks.length };
}

function buildAnalytics(prompts) {
  const active = prompts.filter((prompt) => !prompt.deletedAt);
  const allResults = active.flatMap((prompt) => prompt.results || []);
  const rated = allResults.filter((result) => result.rating > 0);
  const avgRating = rated.length
    ? rated.reduce((sum, result) => sum + result.rating, 0) / rated.length
    : 0;

  const categoryMap = {};
  const statusMap = {};
  active.forEach((prompt) => {
    categoryMap[prompt.category] = (categoryMap[prompt.category] || 0) + 1;
  });
  allResults.forEach((result) => {
    statusMap[result.status] = (statusMap[result.status] || 0) + 1;
  });

  const topPrompts = [...active]
    .sort((a, b) => ((b.runs || 0) + (b.copyCount || 0)) - ((a.runs || 0) + (a.copyCount || 0)))
    .slice(0, 5);

  return {
    totalPrompts: active.length,
    totalRuns: active.reduce((sum, prompt) => sum + (prompt.runs || 0), 0),
    totalResults: allResults.length,
    totalCopies: active.reduce((sum, prompt) => sum + (prompt.copyCount || 0), 0),
    favorites: active.filter((prompt) => prompt.favorite).length,
    pinned: active.filter((prompt) => prompt.pinned).length,
    avgRating,
    categoryMap,
    statusMap,
    topPrompts,
    recent: [...active].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6),
  };
}

export default function PromptOS() {
  const initial = useMemo(() => loadDatabase(), []);
  const [prompts, setPrompts] = useState(initial.prompts);
  const [collections, setCollections] = useState(initial.collections);
  const [currentView, setCurrentView] = useState('library');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [viewMode, setViewMode] = useState('grid');
  const [sortMode, setSortMode] = useState('updated');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    favorite: false,
    pinned: false,
    status: 'all',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    type: 'text',
    tags: '',
    exampleText: '',
    exampleUrl: '',
    category: 'General',
    collections: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeDatabase(prompts, collections)));
        setSaveStatus('saved');
      } catch (error) {
        console.error(error);
        setSaveStatus('error');
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [prompts, collections]);

  const activePrompt = prompts.find((prompt) => prompt.id === selectedPromptId && !prompt.deletedAt);
  const activePrompts = prompts.filter((prompt) => !prompt.deletedAt);
  const trashedPrompts = prompts.filter((prompt) => prompt.deletedAt);
  const analytics = useMemo(() => buildAnalytics(prompts), [prompts]);
  const categories = useMemo(
    () => [...new Set(activePrompts.map((prompt) => prompt.category).filter(Boolean))].sort(),
    [activePrompts],
  );

  const filteredPrompts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let items = activePrompts.filter((prompt) => {
      const resultText = (prompt.results || [])
        .map((result) => `${result.content} ${result.notes} ${result.model} ${result.status}`)
        .join(' ');
      const searchable = [
        prompt.title,
        prompt.description,
        prompt.prompt,
        prompt.category,
        ...(prompt.tags || []),
        resultText,
      ].join(' ').toLowerCase();

      if (term && !searchable.includes(term)) return false;
      if (filters.type !== 'all' && prompt.type !== filters.type) return false;
      if (filters.category !== 'all' && prompt.category !== filters.category) return false;
      if (filters.favorite && !prompt.favorite) return false;
      if (filters.pinned && !prompt.pinned) return false;
      if (filters.status !== 'all' && !(prompt.results || []).some((result) => result.status === filters.status)) return false;
      return true;
    });

    items = items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortMode === 'name') return a.title.localeCompare(b.title);
      if (sortMode === 'runs') return (b.runs || 0) - (a.runs || 0);
      if (sortMode === 'rating') return averagePromptRating(b) - averagePromptRating(a);
      if (sortMode === 'copies') return (b.copyCount || 0) - (a.copyCount || 0);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return items;
  }, [activePrompts, searchTerm, filters, sortMode]);

  const updatePrompt = (updated) => {
    setPrompts((current) => current.map((prompt) => (prompt.id === updated.id ? updated : prompt)));
  };

  const patchPrompt = (id, updates) => {
    setPrompts((current) => current.map((prompt) => (
      prompt.id === id ? { ...prompt, ...updates, updatedAt: nowIso() } : prompt
    )));
  };

  const handleCopy = async (prompt, event) => {
    event?.stopPropagation();
    const text = renderPromptVariables(prompt.prompt, prompt.variables);
    await navigator.clipboard.writeText(text);
    setCopiedId(prompt.id);
    patchPrompt(prompt.id, { copyCount: (prompt.copyCount || 0) + 1 });
    setTimeout(() => setCopiedId(null), 1600);
  };

  const toggleFavorite = (prompt, event) => {
    event?.stopPropagation();
    patchPrompt(prompt.id, { favorite: !prompt.favorite });
  };

  const togglePinned = (prompt, event) => {
    event?.stopPropagation();
    patchPrompt(prompt.id, { pinned: !prompt.pinned });
  };

  const softDelete = (prompt, event) => {
    event?.stopPropagation();
    if (!window.confirm(`Move ${prompt.title} to Trash?`)) return;
    patchPrompt(prompt.id, { deletedAt: nowIso() });
    if (selectedPromptId === prompt.id) setSelectedPromptId(null);
  };

  const restorePrompt = (id) => patchPrompt(id, { deletedAt: null });

  const permanentlyDelete = (id) => {
    const prompt = prompts.find((item) => item.id === id);
    if (!window.confirm(`Delete ${prompt?.title || 'this prompt'} forever? This cannot be undone.`)) return;
    setPrompts((current) => current.filter((item) => item.id !== id));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '', description: '', prompt: '', type: 'text', tags: '', exampleText: '', exampleUrl: '', category: 'General', collections: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item, event) => {
    event?.stopPropagation();
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      prompt: item.prompt,
      type: item.type,
      tags: item.tags?.join(', ') || '',
      exampleText: item.exampleText || '',
      exampleUrl: item.exampleUrl || '',
      category: item.category || 'General',
      collections: item.collections?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleAddSubmit = (event) => {
    event.preventDefault();
    const tags = splitCsv(formData.tags).map((tag) => tag.toUpperCase());
    const itemCollections = splitCsv(formData.collections);
    if (itemCollections.length) setCollections((current) => [...new Set([...current, ...itemCollections])]);

    if (editingId) {
      setPrompts((current) => current.map((prompt) => {
        if (prompt.id !== editingId) return prompt;
        const version = nextVersion(prompt.version);
        const versionRecord = {
          id: `${prompt.id}-${version}-${Date.now()}`,
          version,
          prompt: formData.prompt,
          updatedAt: nowIso(),
          note: 'Edited from prompt modal',
        };
        return {
          ...prompt,
          ...formData,
          tags,
          collections: itemCollections,
          version,
          exampleText: formData.type === 'text' ? formData.exampleText : '',
          exampleUrl: formData.type === 'image' ? formData.exampleUrl : '',
          versions: [versionRecord, ...(prompt.versions || [])],
          updatedAt: nowIso(),
        };
      }));
    } else {
      const id = Date.now();
      const versionRecord = { id: `${id}-1.0`, version: '1.0', prompt: formData.prompt, updatedAt: nowIso(), note: 'Initial version' };
      const newPrompt = upgradePrompt({
        ...formData,
        id,
        tags,
        collections: itemCollections,
        version: '1.0',
        versions: [versionRecord],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      setPrompts((current) => [newPrompt, ...current]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(serializeDatabase(prompts, collections), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const incomingDb = normalizeDatabase(JSON.parse(loadEvent.target.result));
        if (importMode === 'replace') {
          if (!window.confirm('Replace the current database with this backup?')) return;
          setPrompts(incomingDb.prompts);
          setCollections(incomingDb.collections);
          return;
        }

        setCollections((current) => [...new Set([...current, ...incomingDb.collections])]);
        setPrompts((current) => mergePrompts(current, incomingDb.prompts, importMode));
      } catch (error) {
        console.error(error);
        window.alert('CORRUPTED_OR_UNSUPPORTED_FILE');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex h-screen bg-[#050914] text-gray-300 font-sans overflow-hidden selection:bg-cyan-900/50">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0891b20a_1px,transparent_1px),linear-gradient(to_bottom,#0891b20a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex bg-[#02040A] border-r border-cyan-900/50 transition-all duration-300 flex-col shrink-0 z-50 relative`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-900/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 group">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
              <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PROMPT.OS</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen((value) => !value)} className="p-2 hover:bg-white/5 rounded-md text-cyan-500"><Icons.Menu /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'library', label: 'Prompt Library', icon: <Icons.List /> },
            { id: 'dashboard', label: 'Dashboard', icon: <Icons.Grid /> },
            { id: 'favorites', label: 'Favorites', icon: <Icons.Star /> },
            { id: 'pinned', label: 'Pinned', icon: <Icons.Pin /> },
            { id: 'trash', label: `Trash (${trashedPrompts.length})`, icon: <Icons.Trash /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSelectedPromptId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${currentView === item.id && !selectedPromptId ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'hover:bg-white/5 text-gray-400 border border-transparent'}`}
            >
              {item.icon}
              {isSidebarOpen && <span className="text-sm font-mono tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-cyan-900/30 text-[10px] font-mono">
          <div className={`flex items-center gap-2 ${saveStatus === 'error' ? 'text-red-400' : saveStatus === 'saving' ? 'text-amber-400' : 'text-green-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isSidebarOpen && <span>{saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'error' ? 'SAVE_ERROR' : 'SAVED'}</span>}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        <header className="min-h-16 flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-cyan-900/50 bg-[#050914]/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={() => setIsSidebarOpen((value) => !value)} className="md:hidden p-2 border border-cyan-900 text-cyan-500"><Icons.Menu /></button>
            {selectedPromptId ? (
              <button onClick={() => setSelectedPromptId(null)} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono text-xs md:text-sm"><Icons.Back /> Return to Vault</button>
            ) : (
              <div className="relative w-full max-w-xl group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-700 group-focus-within:text-cyan-400"><Icons.Search /></span>
                <input
                  type="text"
                  placeholder="SEARCH_PROMPTS_RESULTS_NOTES..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-black/80 border border-cyan-900/80 text-cyan-300 py-2 pl-9 pr-4 text-xs font-mono outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CloudSyncPanel
              payload={serializeDatabase(prompts, collections)}
              onPull={(incoming) => {
                const normalized = normalizeDatabase(incoming);
                setPrompts(normalized.prompts);
                setCollections(normalized.collections);
              }}
            />
            <select value={importMode} onChange={(event) => setImportMode(event.target.value)} className="hidden lg:block bg-black border border-cyan-900 text-cyan-500 text-[10px] font-mono px-2 py-2">
              <option value="merge">IMPORT: MERGE</option>
              <option value="keep-both">IMPORT: KEEP BOTH</option>
              <option value="replace">IMPORT: REPLACE</option>
            </select>
            <button onClick={handleExport} className="p-2 bg-black border border-cyan-900 text-cyan-600 hover:text-cyan-400 hover:border-cyan-500 rounded" title="Export Backup"><Icons.Download /></button>
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-black border border-cyan-900 text-cyan-600 hover:text-cyan-400 hover:border-cyan-500 rounded" title="Import Backup"><Icons.Upload /></button>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-black border border-cyan-500 text-cyan-400 hover:bg-cyan-400 hover:text-black px-3 md:px-4 py-2 font-bold text-[10px] md:text-xs tracking-widest transition-all">
              + ADD_RECORD
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {selectedPromptId && activePrompt ? (
            <PromptDetail prompt={activePrompt} onUpdate={updatePrompt} />
          ) : currentView === 'dashboard' ? (
            <Dashboard analytics={analytics} />
          ) : currentView === 'trash' ? (
            <TrashView prompts={trashedPrompts} onRestore={restorePrompt} onPermanentDelete={permanentlyDelete} />
          ) : (
            <LibraryView
              prompts={filteredPrompts.filter((prompt) => {
                if (currentView === 'favorites') return prompt.favorite;
                if (currentView === 'pinned') return prompt.pinned;
                return true;
              })}
              searchTerm={searchTerm}
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              sortMode={sortMode}
              setSortMode={setSortMode}
              viewMode={viewMode}
              setViewMode={setViewMode}
              copiedId={copiedId}
              onSelect={(prompt) => setSelectedPromptId(prompt.id)}
              onCopy={handleCopy}
              onEdit={openEditModal}
              onDelete={softDelete}
              onFavorite={toggleFavorite}
              onPinned={togglePinned}
            />
          )}
        </div>
      </main>

      {isModalOpen && (
        <PromptModal
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmit}
          categories={categories}
          collections={collections}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.28); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.75); }
        @keyframes scanline { 0% { transform: translateY(-120%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(120%); opacity: 0; } }
        .animate-scanline { animation: scanline 2.5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

function LibraryView({ prompts, filters, setFilters, categories, sortMode, setSortMode, viewMode, setViewMode, copiedId, onSelect, onCopy, onEdit, onDelete, onFavorite, onPinned }) {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-black/40 border border-cyan-900/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="TYPE" value={filters.type} onChange={(value) => setFilters((current) => ({ ...current, type: value }))} options={[['all', 'ALL'], ['text', 'TEXT'], ['image', 'IMAGE']]} />
            <FilterSelect label="CATEGORY" value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} options={[['all', 'ALL'], ...categories.map((item) => [item, item.toUpperCase()])]} />
            <FilterSelect label="STATUS" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={['all', 'Excellent', 'Good', 'Average', 'Needs Improvement', 'Failed', 'Ready'].map((item) => [item, item.toUpperCase()])} />
            <ToggleChip active={filters.favorite} onClick={() => setFilters((current) => ({ ...current, favorite: !current.favorite }))}>★ FAVORITE</ToggleChip>
            <ToggleChip active={filters.pinned} onClick={() => setFilters((current) => ({ ...current, pinned: !current.pinned }))}>⌖ PINNED</ToggleChip>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <FilterSelect label="SORT" value={sortMode} onChange={setSortMode} options={[['updated', 'RECENT'], ['name', 'A-Z'], ['runs', 'RUNS'], ['copies', 'COPIES'], ['rating', 'RATING']]} />
            <div className="flex border border-cyan-900">
              {['grid', 'list', 'compact'].map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 text-[10px] font-mono ${viewMode === mode ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-600 hover:text-cyan-300'}`}>{mode.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>

        {prompts.length === 0 ? (
          <EmptyState label="NO_PROMPTS_MATCH_FILTERS" />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} copied={copiedId === prompt.id} onSelect={onSelect} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} onFavorite={onFavorite} onPinned={onPinned} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <PromptRow key={prompt.id} prompt={prompt} compact={viewMode === 'compact'} copied={copiedId === prompt.id} onSelect={onSelect} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} onFavorite={onFavorite} onPinned={onPinned} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({ prompt, copied, onSelect, onCopy, onEdit, onDelete, onFavorite, onPinned }) {
  return (
    <div onClick={() => onSelect(prompt)} className="bg-black/90 border border-cyan-900/60 hover:border-cyan-400/80 flex flex-col group relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.16)] hover:-translate-y-1 cursor-pointer">
      <div className="absolute top-3 right-3 flex gap-1 z-30">
        <ActionIcon onClick={(event) => onFavorite(prompt, event)} active={prompt.favorite} title="Favorite">★</ActionIcon>
        <ActionIcon onClick={(event) => onPinned(prompt, event)} active={prompt.pinned} title="Pin">⌖</ActionIcon>
      </div>
      <div className={`h-1.5 w-full ${prompt.type === 'image' ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,1)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)]'}`} />
      <div className="h-40 relative border-b border-cyan-900/50 bg-[#020202] overflow-hidden">
        {prompt.type === 'image' ? (
          <img src={prompt.exampleUrl || fallbackImage()} alt={prompt.title} className="w-full h-full object-cover opacity-45 group-hover:opacity-85 transition-all duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.src = fallbackImage(); }} />
        ) : (
          <div className="w-full h-full p-4 overflow-hidden text-[10px] font-mono text-cyan-700 bg-black">
            <pre className="whitespace-pre-wrap group-hover:text-cyan-400 transition-colors duration-300">{prompt.exampleText || prompt.prompt || '// NO RENDER DATA_'}</pre>
          </div>
        )}
        <div className="absolute inset-0 z-10 hidden group-hover:block pointer-events-none"><div className="w-full h-1 bg-cyan-400/45 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-scanline" /></div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex gap-2 mb-3 flex-wrap items-center pr-20">
          <Badge>{prompt.type === 'image' ? 'IMG' : 'TXT'}</Badge>
          <Badge>v{prompt.version}</Badge>
          {prompt.collections?.slice(0, 1).map((collection) => <Badge key={collection}>{collection}</Badge>)}
        </div>
        <h3 className="font-bold font-mono tracking-widest text-base md:text-lg text-white mb-2 truncate group-hover:text-cyan-300 transition-colors">{prompt.title}</h3>
        <p className="text-cyan-600/80 text-sm mb-4 line-clamp-2">{prompt.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-5">{prompt.tags?.slice(0, 4).map((tag) => <span key={tag} className="text-[9px] font-mono text-cyan-500 border border-cyan-900/50 px-2 py-0.5">{tag}</span>)}</div>
        <div className="mt-auto space-y-3">
          <button onClick={(event) => onCopy(prompt, event)} className={`w-full py-2.5 transition-all text-xs font-mono tracking-widest border ${copied ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black hover:bg-cyan-950 border-cyan-900 hover:border-cyan-400 text-cyan-500 hover:text-cyan-300'}`}>{copied ? 'COPIED_SUCCESS' : 'EXECUTE_COPY'}</button>
          <div className="grid grid-cols-3 text-center text-[9px] font-mono text-cyan-700">
            <span>RUN {prompt.runs || 0}</span><span>COPY {prompt.copyCount || 0}</span><span>RES {prompt.results?.length || 0}</span>
          </div>
          <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100">
            <button onClick={(event) => onEdit(prompt, event)} className="text-[10px] font-mono text-amber-400 hover:text-amber-200">EDIT</button>
            <button onClick={(event) => onDelete(prompt, event)} className="text-[10px] font-mono text-red-400 hover:text-red-200">TRASH</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptRow({ prompt, compact, copied, onSelect, onCopy, onEdit, onDelete, onFavorite, onPinned }) {
  return (
    <div onClick={() => onSelect(prompt)} className={`group border border-cyan-900/40 hover:border-cyan-500/60 bg-black/70 cursor-pointer ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={(event) => onFavorite(prompt, event)} className={prompt.favorite ? 'text-amber-400' : 'text-cyan-900'}>★</button>
        <button onClick={(event) => onPinned(prompt, event)} className={prompt.pinned ? 'text-cyan-300' : 'text-cyan-900'}>⌖</button>
        <div className="min-w-0 flex-1">
          <div className="flex gap-2 items-center flex-wrap">
            <h3 className="font-mono font-bold text-cyan-100 truncate">{prompt.title}</h3>
            <Badge>v{prompt.version}</Badge>
            <Badge>{prompt.category}</Badge>
          </div>
          {!compact && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prompt.description}</p>}
        </div>
        <div className="hidden md:flex items-center gap-5 text-[10px] font-mono text-cyan-700">
          <span>RUN {prompt.runs || 0}</span><span>COPY {prompt.copyCount || 0}</span><span>★ {averagePromptRating(prompt).toFixed(1)}</span>
        </div>
        <button onClick={(event) => onCopy(prompt, event)} className="px-3 py-2 border border-cyan-900 text-[10px] font-mono text-cyan-500 hover:border-cyan-400">{copied ? 'COPIED' : 'COPY'}</button>
        <button onClick={(event) => onEdit(prompt, event)} className="hidden lg:block text-amber-500 text-[10px] font-mono">EDIT</button>
        <button onClick={(event) => onDelete(prompt, event)} className="hidden lg:block text-red-500 text-[10px] font-mono">TRASH</button>
      </div>
    </div>
  );
}

function Dashboard({ analytics }) {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-[10px] font-mono text-cyan-700 tracking-[0.35em]">SYSTEM_OVERVIEW</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">Prompt Operations Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatCard label="PROMPTS" value={analytics.totalPrompts} />
          <StatCard label="RUNS" value={analytics.totalRuns} />
          <StatCard label="RESULTS" value={analytics.totalResults} />
          <StatCard label="COPIES" value={analytics.totalCopies} />
          <StatCard label="FAVORITES" value={analytics.favorites} />
          <StatCard label="PINNED" value={analytics.pinned} />
          <StatCard label="AVG RATING" value={analytics.avgRating.toFixed(1)} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Panel title="TOP_PROMPTS">
            <div className="space-y-2">
              {analytics.topPrompts.map((prompt, index) => (
                <div key={prompt.id} className="grid grid-cols-[32px_1fr_auto] gap-3 items-center border-b border-cyan-900/20 pb-2">
                  <span className="text-cyan-800 font-mono text-xs">0{index + 1}</span>
                  <div><p className="text-cyan-200 font-mono text-sm truncate">{prompt.title}</p><p className="text-[10px] text-gray-600">{prompt.category}</p></div>
                  <span className="text-[10px] font-mono text-cyan-600">{prompt.runs || 0}R / {prompt.copyCount || 0}C</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="RECENTLY_UPDATED">
            <div className="space-y-2">
              {analytics.recent.map((prompt) => (
                <div key={prompt.id} className="flex items-center justify-between gap-4 border-b border-cyan-900/20 pb-2">
                  <span className="text-sm font-mono text-cyan-200 truncate">{prompt.title}</span>
                  <span className="text-[10px] font-mono text-cyan-700 shrink-0">{new Date(prompt.updatedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="CATEGORY_DISTRIBUTION"><BarList values={analytics.categoryMap} /></Panel>
          <Panel title="RESULT_STATUS"><BarList values={analytics.statusMap} /></Panel>
        </div>
      </div>
    </div>
  );
}

function TrashView({ prompts, onRestore, onPermanentDelete }) {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-4">
        <div><p className="text-[10px] font-mono tracking-[0.3em] text-red-700">RECOVERY_ZONE</p><h1 className="text-2xl font-bold text-white mt-2">Trash</h1></div>
        {prompts.length === 0 ? <EmptyState label="TRASH_IS_EMPTY" /> : prompts.map((prompt) => (
          <div key={prompt.id} className="flex flex-col md:flex-row md:items-center gap-4 justify-between border border-red-900/40 bg-black/70 p-4">
            <div className="min-w-0"><h3 className="font-mono text-cyan-200 truncate">{prompt.title}</h3><p className="text-xs text-gray-600 mt-1">Deleted {new Date(prompt.deletedAt).toLocaleString()}</p></div>
            <div className="flex gap-2"><button onClick={() => onRestore(prompt.id)} className="px-4 py-2 text-xs font-mono border border-cyan-700 text-cyan-400 hover:bg-cyan-950">RESTORE</button><button onClick={() => onPermanentDelete(prompt.id)} className="px-4 py-2 text-xs font-mono border border-red-800 text-red-400 hover:bg-red-950">DELETE_FOREVER</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptDetail({ prompt, onUpdate }) {
  const [tab, setTab] = useState('prompt');
  const health = useMemo(() => promptHealth(prompt), [prompt]);
  const renderedPrompt = useMemo(() => renderPromptVariables(prompt.prompt, prompt.variables), [prompt.prompt, prompt.variables]);

  const update = (updates) => onUpdate({ ...prompt, ...updates, updatedAt: nowIso() });

  return (
    <div className="h-full flex flex-col bg-[#030508] overflow-hidden">
      <div className="shrink-0 border-b border-cyan-900/30 bg-[#04060A] px-4 md:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex gap-2 items-center flex-wrap"><Badge>{prompt.type.toUpperCase()}</Badge><Badge>v{prompt.version}</Badge>{prompt.pinned && <Badge>PINNED</Badge>}{prompt.favorite && <Badge>FAVORITE</Badge>}</div>
            <h1 className="font-mono font-bold text-xl md:text-2xl text-white mt-2 truncate">{prompt.title}</h1>
            <p className="text-sm text-cyan-700 mt-1">{prompt.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-cyan-700"><span>RUNS {prompt.runs || 0}</span><span>COPIES {prompt.copyCount || 0}</span><span>RESULTS {prompt.results?.length || 0}</span><span>HEALTH {health.score}/{health.max}</span></div>
        </div>
        <div className="flex overflow-x-auto gap-1 mt-4 custom-scrollbar">
          {[
            ['prompt', 'PROMPT'], ['builder', 'BUILDER'], ['results', `RESULTS ${prompt.results?.length || 0}`], ['versions', `VERSIONS ${prompt.versions?.length || 0}`], ['analytics', 'ANALYTICS'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-[10px] font-mono border whitespace-nowrap ${tab === id ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300' : 'border-cyan-900/30 text-cyan-700 hover:text-cyan-400'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'prompt' && <PromptEditorTab prompt={prompt} renderedPrompt={renderedPrompt} health={health} onUpdate={update} />}
        {tab === 'builder' && <BuilderTab prompt={prompt} onUpdate={update} />}
        {tab === 'results' && <ResultWorkspace prompt={prompt} onUpdate={onUpdate} />}
        {tab === 'versions' && <VersionsTab prompt={prompt} onUpdate={onUpdate} />}
        {tab === 'analytics' && <PromptAnalytics prompt={prompt} health={health} />}
      </div>
    </div>
  );
}

function PromptEditorTab({ prompt, renderedPrompt, health, onUpdate }) {
  const variables = extractVariables(prompt.prompt);
  const [copied, setCopied] = useState(false);
  const copyRendered = async () => { await navigator.clipboard.writeText(renderedPrompt); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto grid xl:grid-cols-[1fr_320px] gap-5">
        <Panel title="PROMPT_SOURCE">
          <textarea value={prompt.prompt} onChange={(event) => onUpdate({ prompt: event.target.value })} className="w-full min-h-[320px] bg-black border border-cyan-900 text-cyan-100 p-4 font-mono text-sm outline-none focus:border-cyan-500 resize-y" />
          <div className="flex justify-between items-center mt-3"><span className="text-[10px] font-mono text-cyan-700">{prompt.prompt.length} chars</span><button onClick={copyRendered} className="px-4 py-2 border border-cyan-800 text-cyan-400 text-[10px] font-mono hover:border-cyan-400">{copied ? 'COPIED_RENDERED' : 'COPY_RENDERED'}</button></div>
        </Panel>
        <div className="space-y-5">
          <Panel title={`PROMPT_HEALTH ${health.score}/${health.max}`}>
            <div className="space-y-2">{health.checks.map((check) => <div key={check.label} className="flex items-center gap-2 text-xs"><span className={check.pass ? 'text-green-400' : 'text-amber-500'}>{check.pass ? '✓' : '!'}</span><span className={check.pass ? 'text-gray-400' : 'text-amber-300'}>{check.label}</span></div>)}</div>
          </Panel>
          <Panel title={`VARIABLES ${variables.length}`}>
            {variables.length === 0 ? <p className="text-xs text-gray-600">Use {'{{variable}}'} inside the prompt to create reusable fields.</p> : <div className="space-y-3">{variables.map((key) => <label key={key} className="block"><span className="text-[10px] font-mono text-cyan-700">{key.toUpperCase()}</span><input value={prompt.variables?.[key] || ''} onChange={(event) => onUpdate({ variables: { ...(prompt.variables || {}), [key]: event.target.value } })} className="w-full mt-1 bg-black border border-cyan-900 text-cyan-300 p-2 text-xs outline-none focus:border-cyan-500" /></label>)}</div>}
          </Panel>
        </div>
        <div className="xl:col-span-2"><Panel title="RENDERED_PREVIEW"><pre className="whitespace-pre-wrap text-sm text-cyan-200 bg-black/50 border border-cyan-900/30 p-4 min-h-32">{renderedPrompt}</pre></Panel></div>
      </div>
    </div>
  );
}

function BuilderTab({ prompt, onUpdate }) {
  const updateField = (key, value) => onUpdate({ builder: { ...prompt.builder, [key]: value } });
  const applyBuilder = () => {
    const compiled = compileBuilder(prompt.builder);
    if (!compiled) return;
    const version = nextVersion(prompt.version);
    onUpdate({
      prompt: compiled,
      version,
      versions: [{ id: `${prompt.id}-${version}-${Date.now()}`, version, prompt: compiled, updatedAt: nowIso(), note: 'Compiled from Prompt Builder' }, ...(prompt.versions || [])],
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
        {Object.entries({ role: 'ROLE', context: 'CONTEXT', task: 'TASK', requirements: 'REQUIREMENTS', constraints: 'CONSTRAINTS', outputFormat: 'OUTPUT FORMAT' }).map(([key, label]) => (
          <label key={key} className="border border-cyan-900/30 bg-black/60 p-4"><span className="text-[10px] tracking-widest font-mono text-cyan-600">{label}</span><textarea value={prompt.builder?.[key] || ''} onChange={(event) => updateField(key, event.target.value)} className="w-full h-28 mt-2 bg-black border border-cyan-900 text-cyan-200 p-3 text-sm outline-none focus:border-cyan-500 resize-y" /></label>
        ))}
        <div className="lg:col-span-2 flex justify-end"><button onClick={applyBuilder} className="px-6 py-3 bg-cyan-500 text-black font-mono font-bold text-xs tracking-widest hover:bg-cyan-300">COMPILE_TO_PROMPT + NEW_VERSION</button></div>
      </div>
    </div>
  );
}

function VersionsTab({ prompt, onUpdate }) {
  const versions = prompt.versions || [];
  const [leftId, setLeftId] = useState(versions[1]?.id || versions[0]?.id || '');
  const [rightId, setRightId] = useState(versions[0]?.id || '');
  const left = versions.find((version) => version.id === leftId) || versions[0];
  const right = versions.find((version) => version.id === rightId) || versions[0];
  const diff = useMemo(() => diffLines(left?.prompt || '', right?.prompt || ''), [left, right]);

  const restore = (versionRecord) => {
    const newVersion = nextVersion(prompt.version);
    onUpdate({
      ...prompt,
      prompt: versionRecord.prompt,
      version: newVersion,
      updatedAt: nowIso(),
      versions: [{ id: `${prompt.id}-${newVersion}-${Date.now()}`, version: newVersion, prompt: versionRecord.prompt, updatedAt: nowIso(), note: `Restored from v${versionRecord.version}` }, ...versions],
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[340px_1fr] gap-5">
        <Panel title="VERSION_HISTORY">
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">{versions.map((version) => <div key={version.id} className="border border-cyan-900/30 bg-black/50 p-3"><div className="flex items-center justify-between"><span className="font-mono text-cyan-300">v{version.version}</span><button onClick={() => restore(version)} className="text-[9px] font-mono text-amber-400 hover:text-amber-200">RESTORE</button></div><p className="text-[10px] text-gray-600 mt-1">{new Date(version.updatedAt).toLocaleString()}</p><p className="text-[10px] text-cyan-800 mt-1">{version.note || 'No note'}</p></div>)}</div>
        </Panel>
        <Panel title="VERSION_DIFF">
          <div className="grid sm:grid-cols-2 gap-3 mb-4"><VersionSelect versions={versions} value={leftId} onChange={setLeftId} label="BASE" /><VersionSelect versions={versions} value={rightId} onChange={setRightId} label="COMPARE" /></div>
          <div className="bg-black border border-cyan-900/40 p-4 max-h-[520px] overflow-auto custom-scrollbar font-mono text-xs">{diff.map((row, index) => <div key={`${index}-${row.type}`} className={`${row.type === 'add' ? 'text-green-400 bg-green-950/20' : row.type === 'remove' ? 'text-red-400 bg-red-950/20' : 'text-gray-500'} px-2 py-0.5 whitespace-pre-wrap`}><span className="inline-block w-5 opacity-60">{row.type === 'add' ? '+' : row.type === 'remove' ? '-' : ' '}</span>{row.text}</div>)}</div>
        </Panel>
      </div>
    </div>
  );
}

function PromptAnalytics({ prompt, health }) {
  const resultStatus = {};
  const versionStats = {};
  (prompt.results || []).forEach((result) => {
    resultStatus[result.status] = (resultStatus[result.status] || 0) + 1;
    const key = result.promptVersion || 'unknown';
    if (!versionStats[key]) versionStats[key] = { runs: 0, ratings: [], excellent: 0 };
    versionStats[key].runs += 1;
    if (result.rating) versionStats[key].ratings.push(result.rating);
    if (result.status === 'Excellent') versionStats[key].excellent += 1;
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><StatCard label="HEALTH" value={`${health.score}/${health.max}`} /><StatCard label="RUNS" value={prompt.runs || 0} /><StatCard label="COPIES" value={prompt.copyCount || 0} /><StatCard label="AVG RATING" value={averagePromptRating(prompt).toFixed(1)} /></div>
        <div className="grid lg:grid-cols-2 gap-5"><Panel title="RESULT_STATUS"><BarList values={resultStatus} /></Panel><Panel title="VERSION_PERFORMANCE"><div className="space-y-2">{Object.entries(versionStats).map(([version, stats]) => <div key={version} className="grid grid-cols-[70px_1fr_auto] gap-3 items-center border-b border-cyan-900/20 pb-2"><span className="font-mono text-cyan-300 text-xs">v{version}</span><span className="text-[10px] text-gray-500">{stats.runs} runs · {stats.excellent} excellent</span><span className="text-[10px] text-amber-400">★ {stats.ratings.length ? (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(1) : '0.0'}</span></div>)}</div></Panel></div>
      </div>
    </div>
  );
}

function ResultWorkspace({ prompt, onUpdate }) {
  const persistedResults = useMemo(() => [...(prompt.results || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [prompt.results]);
  const [activeRunId, setActiveRunId] = useState(persistedResults[0]?.id || null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [resultInput, setResultInput] = useState('');
  const [provider, setProvider] = useState('local');
  const [model, setModel] = useState('gpt-5.6');
  const [compareId, setCompareId] = useState('');
  const [liveRun, setLiveRun] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const sortedResults = useMemo(() => {
    if (!liveRun) return persistedResults;
    return [liveRun, ...persistedResults.filter((result) => result.id !== liveRun.id)];
  }, [persistedResults, liveRun]);

  const activeRun = sortedResults.find((result) => result.id === activeRunId) || sortedResults[0];
  const compareRun = sortedResults.find((result) => String(result.id) === String(compareId));
  const effectiveModel = provider === 'openai' ? (model.trim() || 'gpt-5.6') : 'Simulated Model';

  useEffect(() => {
    if (!activeRunId && sortedResults[0]) setActiveRunId(sortedResults[0].id);
  }, [activeRunId, sortedResults]);

  const updateActiveRun = (updates) => {
    if (!activeRun) return;
    if (liveRun?.id === activeRun.id) {
      setLiveRun((current) => current ? { ...current, ...updates } : current);
      return;
    }
    const results = prompt.results.map((result) => result.id === activeRun.id ? { ...result, ...updates } : result);
    onUpdate({ ...prompt, results, updatedAt: nowIso() });
  };

  const commitResult = (result, runNumber) => {
    onUpdate({
      ...prompt,
      runs: runNumber,
      results: [result, ...(prompt.results || [])],
      updatedAt: nowIso(),
    });
    setActiveRunId(result.id);
  };

  const executeRun = async (overridePrompt = null) => {
    if (isStreaming) return;
    const runNumber = (prompt.runs || 0) + 1;
    const sourcePrompt = overridePrompt || renderPromptVariables(prompt.prompt, prompt.variables);
    const id = Date.now();

    // A pasted custom result is stored as a manual run and never sent to a provider.
    if (resultInput.trim() && !overridePrompt) {
      const manual = normalizeResult({
        id,
        runNumber,
        content: resultInput.trim(),
        provider: 'Manual',
        model: 'Manual Result',
        promptVersion: prompt.version,
        status: 'Ready',
        createdAt: nowIso(),
      }, 0, prompt.version, runNumber);
      commitResult(manual, runNumber);
      setResultInput('');
      return;
    }

    if (provider === 'local') {
      const started = performance.now();
      const localResult = normalizeResult({
        id,
        runNumber,
        content: `[SIMULATED LOCAL OUTPUT]\n\n${sourcePrompt}\n\nSwitch provider to OpenAI Backend for a real streamed response.`,
        provider: 'Local',
        model: 'Simulated Model',
        promptVersion: prompt.version,
        status: 'Ready',
        latencyMs: Math.max(1, Math.round(performance.now() - started)),
        createdAt: nowIso(),
      }, 0, prompt.version, runNumber);
      commitResult(localResult, runNumber);
      return;
    }

    const draft = normalizeResult({
      id,
      runNumber,
      content: '',
      provider: 'OpenAI',
      model: effectiveModel,
      promptVersion: prompt.version,
      status: 'Running',
      createdAt: nowIso(),
    }, 0, prompt.version, runNumber);

    let content = '';
    let metadata = {};
    setLiveRun(draft);
    setActiveRunId(id);
    setIsStreaming(true);

    try {
      metadata = await streamAiRun({
        provider: 'openai',
        model: effectiveModel,
        prompt: sourcePrompt,
        onDelta: (delta) => {
          content += delta;
          setLiveRun((current) => current ? { ...current, content } : current);
        },
        onMeta: (meta) => {
          metadata = { ...metadata, ...meta };
          setLiveRun((current) => current ? {
            ...current,
            latencyMs: meta.latencyMs || current.latencyMs,
            inputTokens: meta.inputTokens || current.inputTokens,
            outputTokens: meta.outputTokens || current.outputTokens,
          } : current);
        },
      });

      const completed = normalizeResult({
        ...draft,
        content: content || '[NO_TEXT_OUTPUT]',
        status: 'Ready',
        latencyMs: metadata.latencyMs || 0,
        inputTokens: metadata.inputTokens || 0,
        outputTokens: metadata.outputTokens || 0,
      }, 0, prompt.version, runNumber);
      commitResult(completed, runNumber);
    } catch (error) {
      const failed = normalizeResult({
        ...draft,
        content: `${content}${content ? '\n\n' : ''}[STREAM_ERROR] ${error?.message || 'Unknown provider error'}`,
        status: 'Failed',
        latencyMs: metadata.latencyMs || 0,
        inputTokens: metadata.inputTokens || 0,
        outputTokens: metadata.outputTokens || 0,
      }, 0, prompt.version, runNumber);
      commitResult(failed, runNumber);
    } finally {
      setLiveRun(null);
      setIsStreaming(false);
      setResultInput('');
    }
  };

  const retry = () => activeRun && executeRun(renderPromptVariables(prompt.prompt, prompt.variables));
  const markBest = () => {
    if (!activeRun || liveRun?.id === activeRun.id) return;
    const results = prompt.results.map((result) => ({ ...result, isBest: result.id === activeRun.id ? !result.isBest : false }));
    onUpdate({ ...prompt, results, updatedAt: nowIso() });
  };

  return (
    <div className="h-full flex flex-col bg-[#030508] font-mono">
      <div className="shrink-0 px-3 md:px-4 py-2 border-b border-cyan-900/30 bg-black/50 flex flex-wrap items-center gap-2">
        <select
          value={provider}
          disabled={isStreaming}
          onChange={(event) => setProvider(event.target.value)}
          className="bg-black border border-cyan-900 text-cyan-300 p-2 text-[10px] disabled:opacity-40"
        >
          <option value="local">Local Simulation</option>
          <option value="openai">OpenAI Backend</option>
        </select>
        <input
          value={model}
          disabled={provider !== 'openai' || isStreaming}
          onChange={(event) => setModel(event.target.value)}
          className="bg-black border border-cyan-900 text-cyan-300 p-2 text-[10px] min-w-40 disabled:opacity-40"
          placeholder="MODEL NAME"
        />
        <span className="text-[9px] text-amber-600">OpenAI requests use the secure /api/ai/run server route. Sign in via CLOUD first; API keys are never stored in this browser UI.</span>
      </div>
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`${leftPanelOpen ? 'w-72' : 'w-0'} absolute md:relative left-0 inset-y-0 z-30 shrink-0 bg-[#05070c] border-r border-cyan-900/30 flex flex-col transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-cyan-900/30"><h3 className="text-[10px] font-bold text-cyan-500 tracking-widest">RUN_HISTORY</h3></div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">{sortedResults.length === 0 ? <EmptyState label="NO_RUNS" compact /> : sortedResults.map((result) => <button key={result.id} onClick={() => setActiveRunId(result.id)} className={`w-full text-left p-3 border ${activeRun?.id === result.id ? 'bg-cyan-950/30 border-cyan-500/50' : 'border-cyan-900/20 hover:border-cyan-700/50'}`}><div className="flex justify-between"><span className="text-cyan-300 text-xs">#{result.runNumber}</span><span className="flex gap-1">{result.status === 'Running' && <span className="text-green-400 text-[9px] animate-pulse">● LIVE</span>}{result.isBest && <span className="text-amber-400 text-[9px]">★ BEST</span>}</span></div><p className="text-[10px] text-gray-600 line-clamp-2 mt-2">{result.content || 'Streaming response...'}</p><span className="text-[9px] text-cyan-700">{result.model} · v{result.promptVersion}</span></button>)}</div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col relative bg-[#020202]">
          <button onClick={() => setLeftPanelOpen((value) => !value)} className="absolute top-3 left-3 z-40 px-2 py-1 border border-cyan-800 bg-black text-cyan-500 text-[10px]">HISTORY</button>
          <button onClick={() => setRightPanelOpen((value) => !value)} className="absolute top-3 right-3 z-40 px-2 py-1 border border-cyan-800 bg-black text-cyan-500 text-[10px]">META</button>
          <div className="h-14 border-b border-cyan-900/30 flex items-center justify-center md:justify-between px-4 md:px-24 bg-[#04060A]">
            <h2 className="text-xs md:text-sm font-bold text-cyan-300">Run #{activeRun?.runNumber || '---'} {activeRun?.status === 'Running' && <span className="text-green-400 text-[9px] ml-2 animate-pulse">STREAMING</span>}</h2>
            <div className="hidden md:flex gap-2"><button disabled={!activeRun} onClick={() => navigator.clipboard.writeText(activeRun?.content || '')} className="px-3 py-1 bg-transparent border border-cyan-800 text-cyan-500 hover:border-cyan-400 hover:text-cyan-300 text-[10px] tracking-widest disabled:opacity-30">COPY</button><button disabled={!activeRun || isStreaming} onClick={retry} className="px-3 py-1 bg-transparent border border-cyan-800 text-cyan-500 hover:border-cyan-400 hover:text-cyan-300 text-[10px] tracking-widest disabled:opacity-30">RETRY</button><button disabled={!activeRun || isStreaming} onClick={markBest} className="px-3 py-1 bg-transparent border border-amber-800 text-amber-500 hover:border-amber-400 hover:text-amber-300 text-[10px] tracking-widest disabled:opacity-30">MARK_BEST</button></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            {activeRun ? (
              compareRun ? (
                <div className="grid lg:grid-cols-2 gap-4 h-full"><ResultPane result={activeRun} title={`RUN #${activeRun.runNumber}`} /><ResultPane result={compareRun} title={`RUN #${compareRun.runNumber}`} /></div>
              ) : activeRun.status === 'Running' ? (
                <pre className="w-full min-h-[360px] whitespace-pre-wrap text-cyan-100 font-mono text-sm leading-relaxed">{activeRun.content || 'Awaiting first token...'}</pre>
              ) : (
                <textarea className="w-full h-full min-h-[360px] bg-transparent text-cyan-100 font-mono text-sm resize-none outline-none leading-relaxed" value={activeRun.content} onChange={(event) => updateActiveRun({ content: event.target.value })} />
              )
            ) : <EmptyState label="AWAITING_EXECUTION" />}
          </div>
          <div className="border-t border-cyan-900/30 bg-[#04060A] p-3 md:p-4 space-y-2">
            <div className="flex flex-col md:flex-row gap-2"><input disabled={isStreaming} value={resultInput} onChange={(event) => setResultInput(event.target.value)} placeholder="Optional: paste a manual result; leave blank to execute the selected provider" className="flex-1 bg-black border border-cyan-900 text-cyan-300 px-4 py-3 outline-none focus:border-cyan-500 text-xs disabled:opacity-40" /><button disabled={isStreaming} onClick={() => executeRun()} className="bg-cyan-500 text-black px-8 py-3 font-bold text-xs tracking-widest hover:bg-cyan-400 disabled:opacity-40">{isStreaming ? 'STREAMING...' : 'EXECUTE_RUN'}</button></div>
            <div className="flex items-center gap-2"><span className="text-[9px] text-cyan-700">COMPARE:</span><select disabled={isStreaming} value={compareId} onChange={(event) => setCompareId(event.target.value)} className="bg-black border border-cyan-900 text-cyan-500 text-[9px] p-1 disabled:opacity-40"><option value="">OFF</option>{sortedResults.filter((result) => result.id !== activeRun?.id && result.status !== 'Running').map((result) => <option key={result.id} value={result.id}>Run #{result.runNumber}</option>)}</select></div>
          </div>
        </div>

        <div className={`${rightPanelOpen && activeRun ? 'w-80' : 'w-0'} absolute md:relative right-0 inset-y-0 z-30 shrink-0 bg-[#05070c] border-l border-cyan-900/30 flex flex-col transition-all duration-300 overflow-hidden`}>
          {activeRun && <RunMetadata result={activeRun} onUpdate={updateActiveRun} />}
        </div>
      </div>
    </div>
  );
}

function RunMetadata({ result, onUpdate }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
      <h3 className="text-[10px] font-bold text-cyan-500 tracking-widest">RUN_METADATA</h3>
      <label className="block"><span className="text-[10px] text-cyan-700 tracking-widest block mb-2">STATUS</span><select value={result.status} onChange={(event) => onUpdate({ status: event.target.value })} className="w-full bg-black border border-cyan-900 text-cyan-300 p-2 text-[10px] outline-none focus:border-cyan-500"><option>Running</option><option>Excellent</option><option>Good</option><option>Average</option><option>Needs Improvement</option><option>Failed</option><option>Ready</option></select></label>
      <div><span className="text-[10px] text-cyan-700 tracking-widest block mb-2">RATING</span><div className="flex gap-2 mt-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} onClick={() => onUpdate({ rating: star })} className={`text-xl ${star <= result.rating ? 'text-amber-400' : 'text-cyan-900'}`}>★</button>)}</div></div>
      <div className="space-y-2 border-t border-cyan-900/30 pt-4 text-[10px]">
        <MetaRow label="PROVIDER" value={result.provider} /><MetaRow label="MODEL" value={result.model} /><MetaRow label="PROMPT_VER" value={`v${result.promptVersion}`} /><MetaRow label="LATENCY" value={`${result.latencyMs || 0} ms`} /><MetaRow label="TOKENS" value={`${result.inputTokens || 0} / ${result.outputTokens || 0}`} /><MetaRow label="COST" value={`$${Number(result.cost || 0).toFixed(4)}`} /><MetaRow label="TIMESTAMP" value={new Date(result.createdAt).toLocaleString()} />
      </div>
      <label className="block border-t border-cyan-900/30 pt-4"><span className="text-[10px] text-cyan-700 tracking-widest block mb-2">NOTES_LOG</span><textarea value={result.notes || ''} onChange={(event) => onUpdate({ notes: event.target.value })} className="w-full bg-black border border-cyan-900 text-cyan-300 p-2 text-[10px] outline-none focus:border-cyan-500 h-36 resize-none" /></label>
    </div>
  );
}

function PromptModal({ editingId, formData, setFormData, onClose, onSubmit, categories, collections }) {
  const patch = (key, value) => setFormData((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-950 border border-cyan-500 w-full max-w-4xl shadow-[0_0_50px_rgba(6,182,212,0.3)] max-h-[92vh] overflow-y-auto animate-fade-in">
        <div className="p-5 border-b border-cyan-900/80 flex justify-between items-center bg-cyan-950/30 sticky top-0 backdrop-blur-md z-10"><h2 className="text-lg font-mono font-bold text-cyan-400 tracking-widest">{editingId ? 'EDIT_PROTOCOL_ENTRY' : 'NEW_PROTOCOL_ENTRY'}</h2><button onClick={onClose} className="text-cyan-600 hover:text-red-500"><Icons.Close /></button></div>
        <form onSubmit={onSubmit} className="p-5 md:p-6 grid md:grid-cols-2 gap-5 font-mono text-sm">
          <Field label="TITLE"><input required value={formData.title} onChange={(event) => patch('title', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400 uppercase" /></Field>
          <Field label="CATEGORY"><input list="prompt-categories" value={formData.category} onChange={(event) => patch('category', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400" /><datalist id="prompt-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist></Field>
          <div className="md:col-span-2"><Field label="DESCRIPTION"><input required value={formData.description} onChange={(event) => patch('description', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400" /></Field></div>
          <div className="md:col-span-2"><Field label="DATA_PAYLOAD (PROMPT)"><textarea required rows="8" value={formData.prompt} onChange={(event) => patch('prompt', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400 resize-y" /></Field></div>
          <Field label="TAGS (COMMA SEPARATED)"><input value={formData.tags} onChange={(event) => patch('tags', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400 uppercase" /></Field>
          <Field label="COLLECTIONS (COMMA SEPARATED)"><input list="prompt-collections" value={formData.collections} onChange={(event) => patch('collections', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400" /><datalist id="prompt-collections">{collections.map((item) => <option key={item} value={item} />)}</datalist></Field>
          <Field label="PREVIEW TYPE"><select value={formData.type} onChange={(event) => patch('type', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400"><option value="text">TEXT / CODE</option><option value="image">IMAGE RENDER</option></select></Field>
          <div />
          <div className="md:col-span-2">{formData.type === 'text' ? <Field label="EXAMPLE_CODE_OUTPUT"><textarea rows="5" value={formData.exampleText} onChange={(event) => patch('exampleText', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400 resize-y text-xs" /></Field> : <Field label="IMAGE_URL_SOURCE"><input type="url" value={formData.exampleUrl} onChange={(event) => patch('exampleUrl', event.target.value)} className="w-full bg-black border border-cyan-900 text-cyan-300 p-3 outline-none focus:border-cyan-400 text-xs" /></Field>}</div>
          <button type="submit" className="md:col-span-2 mt-2 w-full bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-400 hover:text-black py-4 font-bold tracking-widest">{editingId ? 'UPDATE_PROTOCOL + VERSION' : 'SAVE_PROTOCOL'}</button>
        </form>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="flex items-center gap-2 text-[9px] font-mono text-cyan-800"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="bg-black border border-cyan-900 text-cyan-400 px-2 py-2 outline-none">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function ToggleChip({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-3 py-2 border text-[9px] font-mono ${active ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black text-cyan-700 border-cyan-900 hover:text-cyan-400'}`}>{children}</button>;
}

function VersionSelect({ versions, value, onChange, label }) {
  return <label className="text-[9px] font-mono text-cyan-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="w-full mt-1 bg-black border border-cyan-900 text-cyan-300 p-2 text-xs">{versions.map((version) => <option key={version.id} value={version.id}>v{version.version} — {new Date(version.updatedAt).toLocaleDateString()}</option>)}</select></label>;
}

function ResultPane({ result, title }) {
  return <div className="border border-cyan-900/30 bg-black/50 p-4 overflow-auto custom-scrollbar"><div className="text-[10px] text-cyan-600 mb-3">{title} · {result.model}</div><pre className="whitespace-pre-wrap text-sm text-cyan-100">{result.content}</pre></div>;
}

function BarList({ values }) {
  const entries = Object.entries(values || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  if (!entries.length) return <p className="text-xs text-gray-600">NO_DATA</p>;
  return <div className="space-y-3">{entries.map(([label, value]) => <div key={label}><div className="flex justify-between text-[10px] font-mono mb-1"><span className="text-cyan-500">{label}</span><span className="text-gray-500">{value}</span></div><div className="h-1.5 bg-cyan-950"><div className="h-full bg-cyan-500" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></div></div>)}</div>;
}

function StatCard({ label, value }) {
  return <div className="bg-black/70 border border-cyan-900/40 p-4"><p className="text-[9px] font-mono tracking-widest text-cyan-700">{label}</p><p className="text-2xl font-bold text-cyan-200 mt-2">{value}</p></div>;
}

function Panel({ title, children }) {
  return <section className="border border-cyan-900/40 bg-[#05070c]/90"><div className="px-4 py-3 border-b border-cyan-900/30 text-[10px] font-mono font-bold tracking-widest text-cyan-600">{title}</div><div className="p-4">{children}</div></section>;
}

function Badge({ children }) {
  return <span className="px-2 py-0.5 text-[9px] font-mono tracking-widest text-cyan-400 border border-cyan-900/60 bg-cyan-950/20">{children}</span>;
}

function Field({ label, children }) {
  return <label className="block"><span className="block text-cyan-600 mb-1.5 text-[10px] tracking-widest">{label}</span>{children}</label>;
}

function ActionIcon({ active, onClick, title, children }) {
  return <button title={title} onClick={onClick} className={`w-8 h-8 border flex items-center justify-center text-xs transition-all ${active ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/85 text-cyan-700 border-cyan-900 hover:text-cyan-300 hover:border-cyan-500'}`}>{children}</button>;
}

function MetaRow({ label, value }) {
  return <div className="flex justify-between gap-3"><span className="text-cyan-700">{label}</span><span className="text-cyan-300 text-right truncate">{value}</span></div>;
}

function EmptyState({ label, compact = false }) {
  return <div className={`${compact ? 'p-4' : 'min-h-48'} flex items-center justify-center border border-dashed border-cyan-900/40 bg-black/30 text-cyan-800 font-mono text-xs tracking-widest`}>{label}</div>;
}

function splitCsv(value = '') {
  return [...new Set(String(value).split(',').map((item) => item.trim()).filter(Boolean))];
}

function averagePromptRating(prompt) {
  const ratings = (prompt.results || []).map((result) => Number(result.rating || 0)).filter((rating) => rating > 0);
  return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : Number(prompt.rating || 0);
}

function mergePrompts(current, incoming, mode) {
  const result = [...current];
  incoming.forEach((prompt) => {
    const existingIndex = result.findIndex((item) => String(item.id) === String(prompt.id));
    if (existingIndex === -1) {
      result.push(prompt);
      return;
    }
    if (mode === 'keep-both') {
      result.push({ ...prompt, id: Date.now() + Math.floor(Math.random() * 100000), title: `${prompt.title}_IMPORTED_COPY`, updatedAt: nowIso() });
      return;
    }
    const existing = result[existingIndex];
    result[existingIndex] = new Date(prompt.updatedAt) > new Date(existing.updatedAt) ? prompt : existing;
  });
  return result;
}

function fallbackImage() {
  return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600';
}

const Icons = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  List: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  Grid: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  Menu: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>,
  Back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Upload: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.6 5.7 21 7 14 2 9.3 9 8.5 12 2" /></svg>,
  Pin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5" /><path d="M5 3h14l-3 7 3 4H5l3-4-3-7z" /></svg>,
  Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};
