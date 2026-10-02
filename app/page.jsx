'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import LanguageRuntime from '../components/LanguageRuntime.jsx';
import { V5FeatureFlagProvider } from '../components/V5FeatureFlagProvider.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { loadPromptCatalogState } from '../lib/prompts/client-store.mjs';
import { createDerivedDraft } from '../lib/studio/customize.mjs';
import { buildCommandItems } from '../lib/ui/command-items.mjs';
import { shouldHandleShortcut } from '../lib/ui/command-palette.mjs';
import { V5_FEATURE_FLAGS } from '../lib/ui/feature-flags.mjs';
import { buildReleaseNavItems, normalizeV5Page, V5_NAV_ITEMS } from '../lib/ui/v5-navigation.mjs';

const PromptOS = dynamic(() => import('../components/PromptOS.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">BOOTING_PROMPT.OS...</main> });
const PromptLibraryV5 = dynamic(() => import('../components/prompt/PromptLibraryV5.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">LOADING_LIBRARY_V5...</main> });
const PromptStudio = dynamic(() => import('../components/studio/PromptStudio.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-violet-300 grid place-items-center font-mono">LOADING_PROMPT_STUDIO...</main> });
const MissionControl = dynamic(() => import('../components/home/MissionControl.jsx'), { ssr: false, loading: () => <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">LOADING_MISSION_CONTROL...</main> });
const CommandPaletteV5 = dynamic(() => import('../components/command/CommandPaletteV5.jsx'), { ssr: false });

function PlaceholderPanel({ activePage, navigationItems = V5_NAV_ITEMS }) {
  const item = navigationItems.find((entry) => entry.id === activePage);
  return <section className="h-full overflow-auto p-4 md:p-8"><div className="v5-glass max-w-4xl mx-auto rounded-3xl p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"><p className="text-[10px] font-mono tracking-[0.3em] text-cyan-300/60">V5 MODULE</p><h2 className="mt-3 text-2xl md:text-4xl font-semibold text-white">{item?.label || 'PROMPT.OS'}</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">This module is staged behind the V5 rollout plan. The existing prompt library remains available from Library while this module is completed.</p></div></section>;
}

export default function HomePage() {
  const [activePage, setActivePage] = useState(() => V5_FEATURE_FLAGS.V5_MISSION_CONTROL ? 'home' : 'library');
  const [libraryRequest, setLibraryRequest] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandItems, setCommandItems] = useState([]);
  const [studioInitialDraft, setStudioInitialDraft] = useState(null);

  const v5CommandPaletteEnabled = Boolean(V5_FEATURE_FLAGS.V5_COMMAND_PALETTE);
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
  const v5DailyUseEnabled = Boolean(V5_FEATURE_FLAGS.V5_DAILY_USE_COMPLETE);
  const v5PromptStudioEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_STUDIO);
  const navigationItems = useMemo(() => buildReleaseNavItems({ dailyUseEnabled: v5DailyUseEnabled, studioEnabled: v5PromptStudioEnabled }), [v5DailyUseEnabled, v5PromptStudioEnabled]);

  const navigate = useCallback((page) => {
    if (page === 'studio') setStudioInitialDraft(null);
    setActivePage(normalizeV5Page(page));
  }, []);
  const clearLibraryRequest = useCallback(() => setLibraryRequest(null), []);
  const openLibraryPrompt = useCallback((id) => { setLibraryRequest({ type: 'prompt', id }); setActivePage('library'); }, []);
  const openLibraryView = useCallback((viewId) => { setLibraryRequest({ type: 'view', viewId }); setActivePage('library'); }, []);
  const handleRuntimeOpenPrompt = useCallback((id) => { if (activePage === 'library') return; setLibraryRequest({ type: 'prompt', id }); setActivePage('library'); }, [activePage]);

  const openCommandPalette = useCallback(() => {
    if (!V5_FEATURE_FLAGS.V5_COMMAND_PALETTE) return;
    const storage = typeof window === 'undefined' ? null : window.localStorage;
    const { prompts } = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
    setCommandItems(buildCommandItems({ navItems: navigationItems, prompts }));
    setCommandPaletteOpen(true);
  }, [navigationItems]);

  const executeCommandItem = useCallback((item) => {
    const action = item?.action;
    if (!action) return;
    if (action.type === 'prompt') openLibraryPrompt(action.promptId);
    else if (action.type === 'navigate') navigate(action.page);
    else if (action.type === 'action' && action.name === 'new-prompt') navigate(v5PromptStudioEnabled ? 'studio' : 'library');
  }, [navigate, openLibraryPrompt, v5PromptStudioEnabled]);

  useEffect(() => {
    if (!v5PromptStudioEnabled || typeof window === 'undefined') return undefined;
    const handleCustomize = (event) => {
      const requested = event?.detail?.prompt;
      if (!requested?.id) return;
      const builtIn = AI_PROMPT_LIBRARY.find((prompt) => String(prompt.id) === String(requested.id));
      if (!builtIn) return;
      try {
        const derivedDraft = createDerivedDraft(builtIn);
        setStudioInitialDraft(derivedDraft);
        setActivePage('studio');
      } catch {
        // Keep the source prompt untouched and remain on the current surface if draft creation fails.
      }
    };
    window.addEventListener('prompt-os:customize', handleCustomize);
    return () => window.removeEventListener('prompt-os:customize', handleCustomize);
  }, [v5PromptStudioEnabled]);

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

  const status = null;
  const v5ShellEnabled = Object.values(V5_FEATURE_FLAGS).some(Boolean);
  const runtimePage = activePage === 'library' || (v5DailyUseEnabled && (activePage === 'history' || activePage === 'results'));

  if (!v5ShellEnabled) return <LanguageRuntime><PromptOS /></LanguageRuntime>;

  return (
    <LanguageRuntime>
      <V5FeatureFlagProvider>
        <AppShell activePage={activePage} onNavigate={navigate} onOpenCommand={v5CommandPaletteEnabled ? openCommandPalette : undefined} status={status} visualSystemEnabled={v5VisualSystemEnabled} navigationItems={navigationItems}>
          {activePage === 'home' && v5MissionControlEnabled ? (
            <MissionControl onOpenCommand={openCommandPalette} onOpenPrompt={openLibraryPrompt} onOpenPack={openLibraryView} onOpenCollection={openLibraryView} onNavigate={navigate} cloudStatus={null} usageEnabled={v5UsageAnalyticsEnabled} healthEnabled={v5PromptHealthEnabled} smartCollectionsEnabled={v5SmartCollectionsEnabled} />
          ) : activePage === 'studio' && v5PromptStudioEnabled ? (
            <PromptStudio initialDraft={studioInitialDraft} onClose={() => navigate('library')} />
          ) : runtimePage ? (
            v5SearchEnabled || activePage !== 'library' ? (
              <PromptLibraryV5 detailEnabled={v5PromptDetailEnabled} variablesEnabled={v5VariablesEnabled} healthEnabled={v5PromptHealthEnabled} explainerEnabled={v5PromptExplainerEnabled} workspaceEnabled={v5WorkspaceEnabled} smartCollectionsEnabled={v5SmartCollectionsEnabled} executionEnabled={v5ExecutionEnabled} immersiveRunEnabled={v5ImmersiveRunEnabled} premiumCardsEnabled={v5PremiumCardsEnabled} sharedTransitionEnabled={v5PromptDetailEnabled && v5SharedPromptTransitionEnabled} dailyUseEnabled={v5DailyUseEnabled} dailyUseView={activePage} externalRequest={libraryRequest} onExternalRequestHandled={clearLibraryRequest} onOpenPrompt={handleRuntimeOpenPrompt} />
            ) : <div className="v5-legacy-frame h-full"><PromptOS /></div>
          ) : <PlaceholderPanel activePage={activePage} navigationItems={navigationItems} />}
        </AppShell>
        <CommandPaletteV5 open={v5CommandPaletteEnabled && commandPaletteOpen} items={commandItems} onClose={() => setCommandPaletteOpen(false)} onExecute={executeCommandItem} />
      </V5FeatureFlagProvider>
    </LanguageRuntime>
  );
}
