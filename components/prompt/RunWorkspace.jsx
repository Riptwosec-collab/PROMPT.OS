'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import PromptVariableForm from './PromptVariableForm.jsx';
import RunResult from './RunResult.jsx';
import RunStatus from './RunStatus.jsx';
import useImmersiveRun from './useImmersiveRun.js';
import { renderPromptTemplate } from '../../lib/variables/render-prompt.mjs';
import { validatePromptVariables } from '../../lib/variables/validate-variables.mjs';

function titleFor(prompt) {
  return prompt?.displayTitle || prompt?.title || prompt?.name || 'Prompt Run';
}

export default function RunWorkspace({
  prompt,
  initialValues = {},
  initialRenderedPrompt = '',
  onClose,
  runRepository,
  resultRepository,
  syncRepository,
  runner,
}) {
  const reducedMotion = useReducedMotion();
  const variableConfig = prompt?.variableConfig || prompt?.variableSchema || {};
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [promptText, setPromptText] = useState(() => String(prompt?.prompt || prompt?.template || initialRenderedPrompt || ''));
  const [fieldErrors, setFieldErrors] = useState({});
  const [resultMode, setResultMode] = useState('markdown');
  const [copyState, setCopyState] = useState('Copy');
  const [saveState, setSaveState] = useState('Save Result');

  const execution = useImmersiveRun({
    runRepository,
    resultRepository,
    syncRepository,
    runner,
  });

  const rendered = useMemo(
    () => renderPromptTemplate(promptText, variableConfig, values),
    [promptText, variableConfig, values],
  );
  const session = execution.session;
  const active = session?.status === 'preparing' || session?.status === 'running';
  const hasTerminalRun = ['success', 'failed', 'stopped', 'interrupted'].includes(session?.status);
  const output = session?.output || '';

  const executionInput = () => ({
    promptId: prompt?.id ?? null,
    promptSnapshot: promptText,
    variablesSnapshot: values,
    renderedPrompt: rendered.text,
    sourceType: 'prompt',
    sourceVersionId: prompt?.versionId ?? null,
    provider: 'openai',
    model: prompt?.model,
  });

  const handleRun = async () => {
    const validation = validatePromptVariables(variableConfig, values);
    setFieldErrors(validation.errors);
    if (!validation.ok || rendered.unresolvedRequired.length > 0) return;
    setSaveState('Save Result');
    await execution.start(executionInput());
  };

  const handleRetry = async () => {
    if (!session || active) return;
    setSaveState('Save Result');
    await execution.retry(session);
  };

  const handleRegenerate = async () => {
    if (!session || active) return;
    const validation = validatePromptVariables(variableConfig, values);
    setFieldErrors(validation.errors);
    if (!validation.ok || rendered.unresolvedRequired.length > 0) return;
    setSaveState('Save Result');
    await execution.regenerate({ sourceRun: session, ...executionInput() });
  };

  const handleCopy = async () => {
    if (!output || !navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(output);
    setCopyState('Copied');
    window.setTimeout(() => setCopyState('Copy'), 1200);
  };

  const handleSaveResult = async () => {
    if (!session?.id || active) return;
    await execution.saveResult({ name: `${titleFor(prompt)} result` });
    setSaveState('Saved locally');
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const commandKey = event.ctrlKey || event.metaKey;
      if (!commandKey || String(event.key || '').toLowerCase() !== 'enter') return;
      event.preventDefault();
      if (!active) handleRun();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  return (
    <motion.section
      data-run-workspace
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-workspace-title"
      className="run-workspace fixed inset-0 z-[80] flex min-h-0 flex-col bg-[#030611]/95 text-white backdrop-blur-xl"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/20 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300/60">IMMERSIVE RUN</p>
          <h1 id="run-workspace-title" className="truncate text-base font-semibold text-white md:text-lg">{titleFor(prompt)}</h1>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <RunStatus status={session?.status} persistence={execution.persistence} syncState={execution.sync?.state} />
          {session?.model ? <span className="hidden rounded-full border border-white/10 px-2 py-1 text-[10px] font-mono text-slate-400 sm:inline">{session.model}</span> : null}
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            aria-label="Close Run"
          >
            Close
          </button>
        </div>
      </header>

      <div className="run-workspace-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="border-white/10 lg:border-r">
            <section data-region="variables" className="border-b border-white/10 p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-200">Variables</h2>
                <span className="text-[10px] text-slate-500">Session only</span>
              </div>
              <PromptVariableForm variableConfig={variableConfig} values={values} onChange={setValues} errors={fieldErrors} />
            </section>

            <section data-region="prompt" className="p-4 md:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-200">Prompt</h2>
                <span className="text-[10px] text-slate-500">Editable for this Run</span>
              </div>
              <textarea
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                rows={14}
                spellCheck={false}
                className="min-h-56 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-slate-200 outline-none transition focus:border-cyan-300/50 focus-visible:ring-2 focus-visible:ring-cyan-300/20"
                aria-label="Editable Prompt"
              />
              <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400">Rendered Prompt</summary>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">{rendered.text}</pre>
              </details>
            </section>
          </div>

          <section data-region="result" className="flex min-h-[50vh] min-w-0 flex-col p-4 md:p-6 lg:min-h-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-200">Result</h2>
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-1" aria-label="Result view">
                <button type="button" onClick={() => setResultMode('markdown')} aria-pressed={resultMode === 'markdown'} className="rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">Markdown</button>
                <button type="button" onClick={() => setResultMode('raw')} aria-pressed={resultMode === 'raw'} className="rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">Raw</button>
              </div>
            </div>
            <div className="min-h-56 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
              {output ? <RunResult output={output} mode={resultMode} onModeChange={setResultMode} /> : <p className="text-sm text-slate-500">Run the prompt to stream a result here.</p>}
            </div>
          </section>
        </div>
      </div>

      <div className="run-workspace-actions sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 bg-[#050914]/95 px-3 py-3 backdrop-blur-xl md:px-6">
        <button type="button" onClick={handleRun} disabled={active} className="run-primary-action min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-100 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:opacity-40">Run</button>
        <button type="button" onClick={() => execution.stop()} disabled={!active} className="min-h-11 rounded-xl border border-rose-300/25 bg-rose-300/[0.06] px-4 text-sm text-rose-100 outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50 disabled:opacity-35">Stop</button>
        <button type="button" onClick={handleRetry} disabled={!hasTerminalRun || active} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:opacity-35">Retry</button>
        <button type="button" onClick={handleRegenerate} disabled={!hasTerminalRun || active} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:opacity-35">Regenerate</button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopy} disabled={!output} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:opacity-35">{copyState}</button>
          <button type="button" onClick={handleSaveResult} disabled={!hasTerminalRun || active} className="min-h-11 rounded-xl border border-violet-300/25 bg-violet-300/[0.06] px-3 text-xs text-violet-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-35">{saveState}</button>
        </div>
      </div>
    </motion.section>
  );
}
