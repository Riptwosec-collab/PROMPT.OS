'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import GlassSurface from '../ui/GlassSurface.jsx';
import GlassGlyph from '../ui/GlassGlyph.jsx';
import MetricChip from '../ui/MetricChip.jsx';
import AnimatedNumber from '../ui/AnimatedNumber.jsx';
import PointerSpotlightSurface from '../ui/PointerSpotlightSurface.jsx';
import MagneticAction from '../ui/MagneticAction.jsx';
import { AI_PROMPT_LIBRARY } from '../../lib/prompts/ai-prompt-library.mjs';
import { loadPromptCatalogState } from '../../lib/prompts/client-store.mjs';
import { buildDefaultPacks } from '../../lib/prompts/default-packs.mjs';
import { buildMissionControlModel } from '../../lib/home/mission-control.mjs';

const STORAGE_KEY = 'promptVaultData';
const SMART_COLLECTION_KEYS = ['favorites', 'recentlyUsed', 'mostUsed', 'recentlyAdded', 'hasVariables'];

function browserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function promptTitle(prompt) {
  return prompt?.displayTitleTh || prompt?.displayTitle || prompt?.title || prompt?.name || 'Prompt';
}

function prettyCollection(key) {
  return ({
    favorites: 'Favorites',
    recentlyUsed: 'Recently Used',
    mostUsed: 'Most Used',
    recentlyAdded: 'Recently Added',
    hasVariables: 'Has Variables',
  })[key] || key;
}

function PackGraphic({ packId }) {
  const network = packId === 'network-engineer';
  const research = packId === 'research';
  return (
    <svg viewBox="0 0 120 54" aria-hidden="true" className="h-14 w-full text-cyan-200/60">
      {network ? (
        <>
          <path d="M18 35 50 16 82 35 104 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {[18, 50, 82, 104].map((x, index) => <circle key={x} cx={x} cy={index % 2 ? 16 : 35} r="4" fill="rgba(139,233,255,.12)" stroke="currentColor" />)}
        </>
      ) : research ? (
        <>
          <ellipse cx="60" cy="27" rx="42" ry="15" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="60" cy="27" r="6" fill="rgba(167,139,250,.2)" stroke="currentColor" />
          <circle cx="98" cy="22" r="3" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M38 13 21 27l17 14M82 13l17 14-17 14M69 8 51 46" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M45 18h30M45 35h30" stroke="rgba(167,139,250,.55)" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

export default function MissionControl({
  onOpenCommand,
  onOpenPrompt,
  onOpenPack,
  onOpenCollection,
  onNavigate,
  cloudStatus = null,
  usageEnabled = false,
  healthEnabled = false,
  smartCollectionsEnabled = false,
}) {
  const [prompts, setPrompts] = useState(() => AI_PROMPT_LIBRARY);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const { prompts: loadedPrompts } = loadPromptCatalogState(browserStorage(), AI_PROMPT_LIBRARY, STORAGE_KEY);
    setPrompts(loadedPrompts);
  }, []);

  const packs = useMemo(() => buildDefaultPacks(prompts), [prompts]);
  const model = useMemo(() => buildMissionControlModel(prompts, { now: new Date(), packs }), [prompts, packs]);
  const hasUsage = model.usage.runs > 0 || model.usage.copies > 0;

  return (
    <main className="h-full overflow-auto px-3 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6" data-mission-control>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <PointerSpotlightSurface className="v5-neo-hero overflow-hidden rounded-[28px] border border-cyan-200/15 bg-black/25 p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <GlassGlyph size="sm">⌘</GlassGlyph>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/60">Neo Mission Control</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Command your prompt workspace.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Jump back into recent work, discover focused packs, and move through Prompt.OS from one command surface.</p>
            </div>
            <MagneticAction
              onClick={onOpenCommand}
              className="min-h-12 rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.07] px-4 py-3 text-left shadow-[0_16px_55px_rgba(0,0,0,.28)] focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)]"
              innerClassName="flex items-center gap-3"
              aria-label="Search prompts, commands, workflows"
            >
              <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-100">⌕</span>
              <span>
                <span className="block text-sm font-medium text-white">Search prompts, commands, workflows</span>
                <span className="mt-0.5 block font-mono text-[10px] text-slate-500">Ctrl / ⌘ + K</span>
              </span>
            </MagneticAction>
          </div>
        </PointerSpotlightSurface>

        {model.continueWorking.length ? (
          <section aria-labelledby="continue-working-title">
            <SectionHeading id="continue-working-title" title="Continue Working" hint="Recent real activity" />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {model.continueWorking.map((prompt) => (
                <button key={prompt.id} type="button" onClick={() => onOpenPrompt?.(prompt.id)} className="v5-glass-panel group rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{promptTitle(prompt)}</p>
                      <p className="mt-1 text-xs text-slate-500">{prompt.category || 'Prompt'} · last used {new Date(prompt.lastUsedAt).toLocaleDateString()}</p>
                    </div>
                    <GlassGlyph size="sm">↗</GlassGlyph>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {usageEnabled && hasUsage ? (
          <section aria-labelledby="usage-pulse-title">
            <SectionHeading id="usage-pulse-title" title="AI Usage Pulse" hint="Recorded prompt activity" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
              <MetricChip label="Runs" value={<AnimatedNumber value={model.usage.runs} reducedMotion={reducedMotion} />} />
              <MetricChip label="Copies" value={<AnimatedNumber value={model.usage.copies} reducedMotion={reducedMotion} />} />
            </div>
          </section>
        ) : null}

        {model.featuredPacks.length ? (
          <section aria-labelledby="featured-packs-title">
            <SectionHeading id="featured-packs-title" title="Featured Prompt Packs" hint="Reference-only collections" />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {model.featuredPacks.map((pack) => (
                <button key={pack.id} type="button" onClick={() => onOpenPack?.(`pack:${pack.id}`)} className="v5-glass-panel v5-neo-pack-card rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)]">
                  <PackGraphic packId={pack.id} />
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{pack.name}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{pack.promptIds.length} prompt refs</p>
                    </div>
                    <span className="text-cyan-200/70">↗</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {cloudStatus ? (
            <GlassSurface level="subtle" as="section" className="rounded-2xl p-4">
              <SectionHeading title="Cloud / Sync" hint="Live status" />
              <p className="mt-3 text-sm text-slate-300">{cloudStatus.label || cloudStatus.mode}</p>
            </GlassSurface>
          ) : null}

          {healthEnabled ? (
            <GlassSurface level="subtle" as="section" className="rounded-2xl p-4">
              <SectionHeading title="Prompt Health" hint={`${model.healthSummary.analyzedCount} analyzed`} />
              <div className="mt-3 flex items-end gap-2">
                <AnimatedNumber value={model.healthSummary.average} reducedMotion={reducedMotion} className="text-3xl font-semibold text-white" />
                <span className="pb-1 text-sm text-slate-500">/ 100 average</span>
              </div>
            </GlassSurface>
          ) : null}
        </div>

        {model.activity.length ? (
          <section aria-labelledby="activity-title">
            <SectionHeading id="activity-title" title="Activity" hint="Recorded recent use" />
            <div className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4">
              {model.activity.slice(0, 5).map((item) => (
                <button key={item.id} type="button" onClick={() => onOpenPrompt?.(item.promptId)} className="flex w-full items-center justify-between gap-4 py-3 text-left focus-visible:outline-none focus-visible:text-cyan-100">
                  <span className="truncate text-sm text-slate-300">{item.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-600">{new Date(item.occurredAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {smartCollectionsEnabled ? (
          <section aria-labelledby="smart-collections-title">
            <SectionHeading id="smart-collections-title" title="Smart Collections" hint="Computed from your prompt records" />
            <div className="mt-3 flex flex-wrap gap-2">
              {SMART_COLLECTION_KEYS.map((key) => (
                <button key={key} type="button" onClick={() => onOpenCollection?.(key)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-cyan-200/25 hover:text-white focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)]">
                  {prettyCollection(key)} <span className="ml-1 font-mono text-[10px] text-slate-600">{model.smartCollections[key]?.length || 0}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <button type="button" onClick={() => onNavigate?.('library')} className="self-start text-xs text-slate-500 underline decoration-white/10 underline-offset-4 hover:text-slate-300">Open full Library</button>
      </div>
    </main>
  );
}

function SectionHeading({ id, title, hint }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 id={id} className="text-sm font-semibold text-slate-100">{title}</h2>
      {hint ? <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">{hint}</span> : null}
    </div>
  );
}
