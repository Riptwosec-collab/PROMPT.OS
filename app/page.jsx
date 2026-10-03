'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import LanguageRuntime from '../components/LanguageRuntime.jsx';
import { V5FeatureFlagProvider } from '../components/V5FeatureFlagProvider.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import useRuntimeRepositories from '../components/runtime/useRuntimeRepositories.js';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { loadPromptCatalogState } from '../lib/prompts/client-store.mjs';
import { buildCommandItems } from '../lib/ui/command-items.mjs';
import { shouldHandleShortcut } from '../lib/ui/command-palette.mjs';
import { V5_FEATURE_FLAGS } from '../lib/ui/feature-flags.mjs';
import { normalizeV5Page, V5_NAV_ITEMS, visibleV5NavItems } from '../lib/ui/v5-navigation.mjs';

const PromptOS = dynamic(() => import('../components/PromptOS.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">BOOTING_PROMPT.OS...</main> });
const PromptLibraryV5 = dynamic(() => import('../components/prompt/PromptLibraryV5.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">LOADING_LIBRARY_V5...</main> });
const MissionControl = dynamic(() => import('../components/home/MissionControl.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">LOADING_MISSION_CONTROL...</main> });
const RunHistory = dynamic(() => import('../components/history/RunHistory.jsx'), { ssr: false });
const SavedResults = dynamic(() => import('../components/results/SavedResults.jsx'), { ssr: false });
const CommandPaletteV5 = dynamic(() => import('../components/command/CommandPaletteV5.jsx'), { ssr: false });

function PlaceholderPanel({ activePage }) {
  const item = V5_NAV_ITEMS.find((entry) => entry.id === activePage);
  return <section className="h-full overflow-auto p-4 md:p-8"><div className="v5-glass max-w-4xl mx-auto rounded-3xl p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"><p className="text-[10px] font-mono tracking-[0.3em] text-cyan-300/60">V5 MODULE</p><h2 className="mt-3 text-2xl md:text-4xl font-semibold text-white">{item?.label || 'PROMPT.OS'}</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">This module is staged behind the approved release gates.</p></div></section>;
}

export default function HomePage() {
  const [activePage, setActivePage] = useState(() => V5_FEATURE_FLAGS.V5_MISSION_CONTROL ? 'home' : 'library');
  const [libraryRequest, setLibraryRequest] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandItems, setCommandItems] = useState([]);

  const dailyUseEnabled = Boolean(V5_FEATURE_FLAGS.V5_DAILY_USE_COMPLETE);
  const promptStudioEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_STUDIO);
  const controlCenterEnabled = Boolean(V5_FEATURE_FLAGS.V5_CONTROL_CENTER_V2);
  const runtime = useRuntimeRepositories(dailyUseEnabled || Boolean(V5_FEATURE_FLAGS.V5_IMMERSIVE_RUN));
  const navItems = useMemo(() => visibleV5NavItems({ dailyUse: dailyUseEnabled, promptStudio: promptStudioEnabled, controlCenter: controlCenterEnabled }), [dailyUseEnabled, promptStudioEnabled, controlCenterEnabled]);

  const v5CommandPaletteEnabled = Boolean(V5_FEATURE_FLAGS.V5_COMMAND_PALETTE);
  const navigate = useCallback((page) => {
    const normalized = normalizeV5Page(page);
    const allowed = navItems.some((item) => item.id === normalized);
    setActivePage(allowed ? normalized : 'library');
  }, [navItems]);
  const clearLibraryRequest = useCallback(() => setLibraryRequest(null), []);
  const openLibraryPrompt = useCallback((id) => { setLibraryRequest({ type: 'prompt', id }); setActivePage('library'); }, []);
  const openLibraryView = useCallback((viewId) => { setLibraryRequest({ type: 'view', viewId }); setActivePage('library'); }, []);

  const openCommandPalette = useCallback(() => {
    if (!V5_FEATURE_FLAGS.V5_COMMAND_PALETTE) return;
    const storage = typeof window === 'undefined' ? null : window.localStorage;
    const { prompts } = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
    setCommandItems(buildCommandItems({ navItems, prompts }));
    setCommandPaletteOpen(true);
  }, [navItems]);

  const executeCommandItem = useCallback((item) => {
    const action = item?.action;
    if (!action) return;
    if (action.type === 'prompt') openLibraryPrompt(action.promptId);
    else if (action.type === 'navigate') navigate(action.page);
    else if (action.type === 'action' && action.name === 'new-prompt') navigate(promptStudioEnabled ? 'workspaces' : 'library');
  }, [navigate, openLibraryPrompt, promptStudioEnabled]);

  useEffect(() => {
    if (!v5CommandPaletteEnabled) return undefined;
    const handleKeyDown = (event) => {
      const commandKey = event.ctrlKey || event.metaKey;
      if (!commandKey || String(event.key || '').toLowerCase() !== 'k') return;
      if (!shouldHandleShortcut(event)) return;
      event.preventDefault();
      openCommandPalette();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openCommandPalette, v5CommandPaletteEnabled]);

  const status = runtime.state === 'error' ? { kind: 'error', label: runtime.error } : null;
  const v5ShellEnabled = Object.values(V5_FEATURE_FLAGS).some(Boolean);
  const v5SearchEnabled = Boolean(V5_FEATURE_FLAGS.V5_SEARCH);
  const v5PromptDetailEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_DETAIL);
  const v5VariablesEnabled = Boolean(V5_FEATURE_FLAGS.V5_VARIABLES);
  const v5PromptHealthEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_HEALTH);
  const v5PromptExplainerEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_EXPLAINER);
  const v5WorkspaceEnabled = Boolean(V5_FEATURE_FLAGS.V5_WORKSPACE);
  const v5SmartCollectionsEnabled = Boolean(V5_FEATURE_FLAGS.V5_SMART_COLLECTIONS);
  const v5ExecutionEnabled = Boolean(V5_FEATURE_FLAGS.V5_EXECUTION_ENGINE);
  const v5ImmersiveRunEnabled = Boolean(V5_FEATURE_FLAGS.V5_IMMERSIVE_RUN);
  const v5VisualSystemEnabled = Boolean(V5_FEATURE_FLAGS.V5_VISUAL_SYSTEM);
  const v5MissionControlEnabled = Boolean(V5_FEATURE_FLAGS.V5_MISSION_CONTROL);
  const v5UsageAnalyticsEnabled = Boolean(V5_FEATURE_FLAGS.V5_USAGE_ANALYTICS);
  const v5PremiumCardsEnabled = Boolean(V5_FEATURE_FLAGS.V5_PREMIUM_CARDS);
  const v5SharedPromptTransitionEnabled = Boolean(V5_FEATURE_FLAGS.V5_SHARED_PROMPT_TRANSITION);

  if (!v5ShellEnabled) return <LanguageRuntime><PromptOS /></LanguageRuntime>;

  let content;
  if (activePage === 'home' && v5MissionControlEnabled) {
    content = <MissionControl onOpenCommand={openCommandPalette} onOpenPrompt={openLibraryPrompt} onOpenPack={openLibraryView} onOpenCollection={openLibraryView} onNavigate={navigate} cloudStatus={null} usageEnabled={v5UsageAnalyticsEnabled} healthEnabled={v5PromptHealthEnabled} smartCollectionsEnabled={v5SmartCollectionsEnabled} />;
  } else if (activePage === 'library') {
    content = v5SearchEnabled ? <PromptLibraryV5 detailEnabled={v5PromptDetailEnabled} variablesEnabled={v5VariablesEnabled} healthEnabled={v5PromptHealthEnabled} explainerEnabled={v5PromptExplainerEnabled} workspaceEnabled={v5WorkspaceEnabled} smartCollectionsEnabled={v5SmartCollectionsEnabled} executionEnabled={v5ExecutionEnabled} immersiveRunEnabled={v5ImmersiveRunEnabled} premiumCardsEnabled={v5PremiumCardsEnabled} sharedTransitionEnabled={v5PromptDetailEnabled && v5SharedPromptTransitionEnabled} externalRequest={libraryRequest} onExternalRequestHandled={clearLibraryRequest} /> : <div className="v5-legacy-frame h-full"><PromptOS /></div>;
  } else if (activePage === 'history' && dailyUseEnabled) {
    content = <RunHistory runRepository={runtime.runRepository} ready={runtime.state === 'ready'} />;
  } else if (activePage === 'results' && dailyUseEnabled) {
    content = <SavedResults resultRepository={runtime.resultRepository} ready={runtime.state === 'ready'} />;
  } else {
    content = <PlaceholderPanel activePage={activePage} />;
  }

  return <LanguageRuntime><V5FeatureFlagProvider><AppShell activePage={activePage} onNavigate={navigate} navItems={navItems} onOpenCommand={v5CommandPaletteEnabled ? openCommandPalette : undefined} status={status} visualSystemEnabled={v5VisualSystemEnabled}>{content}</AppShell><CommandPaletteV5 open={v5CommandPaletteEnabled && commandPaletteOpen} items={commandItems} onClose={() => setCommandPaletteOpen(false)} onExecute={executeCommandItem} /></V5FeatureFlagProvider></LanguageRuntime>;
}
