'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LanguageRuntime from '../components/LanguageRuntime.jsx';
import { V5FeatureFlagProvider } from '../components/V5FeatureFlagProvider.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import { V5_FEATURE_FLAGS } from '../lib/ui/feature-flags.mjs';
import { normalizeV5Page, V5_NAV_ITEMS } from '../lib/ui/v5-navigation.mjs';

const PromptOS = dynamic(() => import('../components/PromptOS.jsx'), {
  ssr: false,
  loading: () => (
    <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">
      BOOTING_PROMPT.OS...
    </main>
  ),
});

const PromptLibraryV5 = dynamic(() => import('../components/prompt/PromptLibraryV5.jsx'), {
  ssr: false,
  loading: () => (
    <main className="h-full bg-[#050914] text-cyan-400 grid place-items-center font-mono">
      LOADING_LIBRARY_V5...
    </main>
  ),
});

function PlaceholderPanel({ activePage }) {
  const item = V5_NAV_ITEMS.find((entry) => entry.id === activePage);
  return (
    <section className="h-full overflow-auto p-4 md:p-8">
      <div className="v5-glass max-w-4xl mx-auto rounded-3xl p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
        <p className="text-[10px] font-mono tracking-[0.3em] text-cyan-300/60">V5 MODULE</p>
        <h2 className="mt-3 text-2xl md:text-4xl font-semibold text-white">{item?.label || 'PROMPT.OS'}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          This module is staged behind the V5 rollout plan. The existing prompt library remains available from Library while this module is completed.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [activePage, setActivePage] = useState('library');
  const navigate = (page) => setActivePage(normalizeV5Page(page));
  const status = { mode: 'ready', revision: '—', pendingCount: 0, lastSyncedAt: null, version: 'V5 PREVIEW' };
  const v5ShellEnabled = Object.values(V5_FEATURE_FLAGS).some(Boolean);
  const v5SearchEnabled = Boolean(V5_FEATURE_FLAGS.V5_SEARCH);
  const v5PromptDetailEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_DETAIL);
  const v5VariablesEnabled = Boolean(V5_FEATURE_FLAGS.V5_VARIABLES);
  const v5PromptHealthEnabled = Boolean(V5_FEATURE_FLAGS.V5_PROMPT_HEALTH);
  const v5WorkspaceEnabled = Boolean(V5_FEATURE_FLAGS.V5_WORKSPACE);
  const v5SmartCollectionsEnabled = Boolean(V5_FEATURE_FLAGS.V5_SMART_COLLECTIONS);

  if (!v5ShellEnabled) {
    return (
      <LanguageRuntime>
        <PromptOS />
      </LanguageRuntime>
    );
  }

  return (
    <LanguageRuntime>
      <V5FeatureFlagProvider>
        <AppShell activePage={activePage} onNavigate={navigate} status={status}>
          {activePage === 'library' ? (
            v5SearchEnabled ? (
              <PromptLibraryV5
                detailEnabled={v5PromptDetailEnabled}
                variablesEnabled={v5VariablesEnabled}
                healthEnabled={v5PromptHealthEnabled}
                workspaceEnabled={v5WorkspaceEnabled}
                smartCollectionsEnabled={v5SmartCollectionsEnabled}
              />
            ) : (
              <div className="v5-legacy-frame h-full">
                <PromptOS />
              </div>
            )
          ) : (
            <PlaceholderPanel activePage={activePage} />
          )}
        </AppShell>
      </V5FeatureFlagProvider>
    </LanguageRuntime>
  );
}
