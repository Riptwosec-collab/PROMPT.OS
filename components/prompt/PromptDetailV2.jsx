'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import GlassGlyph from '../ui/GlassGlyph.jsx';
import PromptVariableForm from './PromptVariableForm.jsx';
import PromptHealth from './PromptHealth.jsx';
import { validatePromptVariables } from '../../lib/variables/validate-variables.mjs';
import { renderPromptTemplate } from '../../lib/variables/render-prompt.mjs';
import {
  getPromptTransitionMode,
  promptGlyphLayoutId,
  promptLayoutId,
  promptTitleLayoutId,
} from '../../lib/ui/prompt-transition.mjs';

export default function PromptDetailV2({
  prompt,
  variablesEnabled = false,
  healthEnabled = false,
  explainerEnabled = false,
  transitionEnabled = false,
  sourceAvailable = true,
  onClose,
  onRun,
  onFavorite,
  onPin,
  onImprove,
}) {
  const [values, setValues] = useState(() => ({ ...(prompt?.variables || {}) }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [runError, setRunError] = useState('');
  const [running, setRunning] = useState(false);
  const reducedMotion = useReducedMotion();
  const variableConfig = prompt?.variableConfig || {};

  const rendered = useMemo(
    () => renderPromptTemplate(prompt?.prompt || '', variableConfig, values),
    [prompt, variableConfig, values],
  );

  if (!prompt) return null;

  const transitionMode = getPromptTransitionMode({ enabled: transitionEnabled, reducedMotion, sourceAvailable });
  const sharedTransition = transitionMode === 'shared';
  const surfaceLayoutId = sharedTransition ? promptLayoutId(prompt.id) : undefined;
  const titleLayoutId = sharedTransition ? promptTitleLayoutId(prompt.id) : undefined;
  const glyphLayoutId = sharedTransition ? promptGlyphLayoutId(prompt.id) : undefined;
  const fadeDuration = reducedMotion ? 0 : 0.16;
  const bodyDelay = sharedTransition && !reducedMotion ? 0.05 : 0;
  const title = prompt.displayTitleTh || prompt.displayTitle || prompt.title || prompt.name;

  const run = async () => {
    if (variablesEnabled) {
      const validation = validatePromptVariables(variableConfig, values);
      setFieldErrors(validation.errors);
      setRunError('');
      if (!validation.ok || rendered.unresolvedRequired.length > 0) return;
    } else {
      setFieldErrors({});
      setRunError('');
    }

    if (!onRun) {
      setRunError('Execution is not enabled for this V5 preview yet.');
      return;
    }

    setRunning(true);
    try {
      await onRun({ prompt, values, renderedPrompt: rendered.text });
    } catch (error) {
      setRunError(error?.message || 'Run failed. Your entered values were preserved.');
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rendered.text);
    } catch {
      setRunError('Copy failed.');
    }
  };

  return (
    <AnimatePresence initial={false}>
      <motion.section
        key={`prompt-detail-${prompt.id}`}
        className="h-full overflow-auto p-3 md:p-5"
        data-prompt-detail-v2
        data-transition-mode={transitionMode}
        initial={transitionMode === 'fade' && !reducedMotion ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
        transition={{ duration: fadeDuration }}
      >
        <motion.div layoutId={surfaceLayoutId} className="v5-glass-panel mx-auto max-w-[1500px] rounded-[28px] border border-white/10 p-3 md:p-4" transition={sharedTransition ? { type: 'spring', stiffness: 340, damping: 32, mass: 0.8 } : { duration: fadeDuration }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/20">← Library</button>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => onImprove?.(prompt)} className="rounded-xl border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-xs text-violet-200">✨ Improve</button>
              <button type="button" onClick={copy} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">Copy</button>
              <button type="button" onClick={() => onFavorite?.(prompt.id, !prompt.favorite)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">{prompt.favorite ? '★ Favorite' : '☆ Favorite'}</button>
              <button type="button" onClick={() => onPin?.(prompt.id, !prompt.pinned)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">{prompt.pinned ? '⌖ Pinned' : '⌖ Pin'}</button>
            </div>
          </div>

          <motion.div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr_1fr]" initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: fadeDuration, delay: bodyDelay }}>
            <aside data-region="info" className="v5-glass order-1 rounded-2xl border border-white/10 p-4 lg:sticky lg:top-3 lg:self-start">
              <div className="flex items-start gap-3">
                <motion.span layoutId={glyphLayoutId} className="inline-flex shrink-0"><GlassGlyph>⌘</GlassGlyph></motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/60">OVERVIEW</p>
                  <motion.h1 layoutId={titleLayoutId} className="mt-2 text-xl font-semibold text-white">{title}</motion.h1>
                  {prompt.displayTitleTh && prompt.displayTitle ? <p className="mt-1 text-xs text-slate-500">{prompt.displayTitle}</p> : null}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{prompt.descriptionTh || prompt.description || 'No description'}</p>

              {explainerEnabled ? (
                <div data-prompt-explainer className="mt-5 space-y-5 border-t border-white/10 pt-5">
                  <section aria-labelledby={`purpose-${prompt.id}`}>
                    <h2 id={`purpose-${prompt.id}`} className="text-sm font-semibold text-white">พรอมต์นี้ทำอะไร</h2>
                    <p className="mt-2 text-xs leading-6 text-slate-400">{prompt.purposeTh}</p>
                  </section>
                  <section aria-labelledby={`usecases-${prompt.id}`}>
                    <h2 id={`usecases-${prompt.id}`} className="text-sm font-semibold text-white">เหมาะกับ</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
                      {(prompt.useCasesTh || []).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                  <section aria-labelledby={`outputs-${prompt.id}`}>
                    <h2 id={`outputs-${prompt.id}`} className="text-sm font-semibold text-white">ผลลัพธ์ที่จะได้</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
                      {(prompt.expectedOutputTh || []).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                  <section aria-labelledby={`example-${prompt.id}`}>
                    <h2 id={`example-${prompt.id}`} className="text-sm font-semibold text-white">ตัวอย่างข้อมูลที่กรอก</h2>
                    <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-slate-300">{prompt.exampleInputTh}</pre>
                  </section>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[prompt.category, prompt.subcategory, ...(prompt.tags || []).slice(0, 3)].filter(Boolean).map((item) => <span key={item} className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">{item}</span>)}
              </div>
              <div className="mt-4 text-xs text-slate-500">Version {prompt.version || '—'}</div>
              {healthEnabled && <div className="mt-4"><PromptHealth prompt={prompt} /></div>}
            </aside>

            <main data-region="inputs" className="v5-glass order-2 rounded-2xl border border-white/10 p-4">
              <div className="mb-4">
                <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/60">INPUTS</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Prompt Variables</h2>
                <p className="mt-1 text-xs text-slate-500">Required fields are marked with *.</p>
              </div>
              {variablesEnabled ? (
                <>
                  <PromptVariableForm variableConfig={variableConfig} values={values} onChange={setValues} errors={fieldErrors} />
                  {rendered.unresolvedRequired.length > 0 ? <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-200">Required: {rendered.unresolvedRequired.join(', ')}</div> : null}
                </>
              ) : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-500">Variables V2 is staged behind its feature flag.</p>}
            </main>

            <section data-region="preview" className="v5-glass order-3 rounded-2xl border border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/60">PREVIEW</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Rendered Prompt</h2>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-500">{rendered.text.length} chars</span>
              </div>
              <pre className="mt-4 max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-300">{rendered.text}</pre>
              {runError ? <p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-200">{runError}</p> : null}
              <button type="button" onClick={run} disabled={running} className="mt-4 w-full rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50">
                {running ? 'Running…' : '▶ Run Prompt'}
              </button>
            </section>
          </motion.div>
        </motion.div>
      </motion.section>
    </AnimatePresence>
  );
}
