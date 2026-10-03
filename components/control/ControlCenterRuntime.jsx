'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlCenter from './ControlCenter.jsx';
import StorageSyncCenter from './StorageSyncCenter.jsx';
import {
  applyBackupRestore,
  createBackup,
  planRestore,
  readPromptBackupData,
  validateBackup,
} from '../../lib/control/backup.mjs';
import { openControlRuntime } from '../../lib/control/runtime.mjs';

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function browserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function currentPromptState() {
  return readPromptBackupData(browserStorage());
}

export default function ControlCenterRuntime({ activePage = 'control', onNavigate, cloudAdapter = null }) {
  const runtimeRef = useRef(null);
  const restoreInputRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: null, snapshot: null, storage: null, model: null });
  const [restoreStatus, setRestoreStatus] = useState(null);

  const refresh = useCallback(async () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    try {
      const next = await runtime.refresh({ promptState: currentPromptState() });
      setState({ loading: false, error: null, ...next });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : String(error) }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let openedRuntime = null;
    (async () => {
      try {
        openedRuntime = await openControlRuntime();
        if (cancelled) {
          openedRuntime.close();
          return;
        }
        runtimeRef.current = openedRuntime;
        const next = await openedRuntime.refresh({ promptState: currentPromptState() });
        if (!cancelled) setState({ loading: false, error: null, ...next });
      } catch (error) {
        if (!cancelled) setState({ loading: false, error: error instanceof Error ? error.message : String(error), snapshot: null, storage: null, model: null });
      }
    })();
    return () => {
      cancelled = true;
      runtimeRef.current = null;
      openedRuntime?.close?.();
    };
  }, []);

  const handleExportBackup = useCallback(() => {
    if (!state.snapshot) return;
    const backup = createBackup({ ...state.snapshot, ...currentPromptState() });
    downloadJson('prompt-os-backup.json', backup);
  }, [state.snapshot]);

  const handleRestoreFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !runtimeRef.current?.db) return;
    try {
      const text = await file.text();
      const validation = validateBackup(text);
      if (!validation.ok) {
        setRestoreStatus(`Backup rejected: ${validation.errors.join('; ')}`);
        return;
      }
      const localState = { ...(state.snapshot || {}), ...currentPromptState() };
      const plan = planRestore(text, localState);
      if (!plan.ok) {
        setRestoreStatus(`Restore plan failed: ${plan.errors.join('; ')}`);
        return;
      }
      const confirmed = window.confirm(`Restore this validated backup? ${plan.creates.length} new items will be added and ${plan.conflicts.length} conflicts will preserve both copies. Existing built-in prompts will not be replaced.`);
      if (!confirmed) {
        setRestoreStatus('Restore cancelled. No data was changed.');
        return;
      }
      const result = await applyBackupRestore(text, {
        db: runtimeRef.current.db,
        storage: browserStorage(),
      });
      if (!result.ok) {
        setRestoreStatus(`Restore failed: ${result.errors?.join('; ') || 'Unable to import backup'}`);
        return;
      }
      await refresh();
      setRestoreStatus(`Restore complete: ${result.applied} items applied; ${result.conflicts} conflicts preserved without overwriting built-ins.`);
    } catch (error) {
      setRestoreStatus(`Backup rejected: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [refresh, state.snapshot]);

  const handleRetryFailed = useCallback(async () => {
    const repository = runtimeRef.current?.repositories?.syncRepository;
    if (!repository) return;
    const items = await repository.listAll();
    for (const item of items.filter((entry) => entry.state === 'sync_error')) {
      await repository.enqueue({ ...item, state: undefined, error: null });
    }
    await refresh();
  }, [refresh]);

  if (state.loading) return <main className="grid h-full place-items-center bg-[#050914] font-mono text-xs text-cyan-300">LOADING_CONTROL_CENTER...</main>;
  if (state.error) return <main className="h-full overflow-auto p-6 text-slate-200"><section className="mx-auto max-w-xl rounded-2xl border border-rose-300/20 bg-rose-300/[0.04] p-5"><h1 className="text-lg font-semibold">Control Center unavailable</h1><p className="mt-2 text-sm text-slate-400">{state.error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 rounded-xl border border-white/10 px-4 text-xs">Retry</button></section></main>;

  if (activePage === 'storage') {
    const snapshot = state.snapshot || {};
    return (
      <>
        <StorageSyncCenter
          storage={state.storage || { available: false, usage: null, quota: null }}
          counts={{
            runs: snapshot.runs?.length || 0,
            results: snapshot.results?.length || 0,
            drafts: snapshot.drafts?.length || 0,
            versions: snapshot.versions?.length || 0,
          }}
          syncSummary={state.model?.sync}
          cloudAdapter={cloudAdapter}
          onRetryFailed={handleRetryFailed}
          onViewPending={() => setRestoreStatus('Pending sync items are reflected in the persisted queue summary above.')}
          onViewConflicts={() => setRestoreStatus('Conflict sync items are reflected in the persisted queue summary above.')}
          onExportBackup={handleExportBackup}
          onRestoreBackup={() => restoreInputRef.current?.click()}
        />
        <input ref={restoreInputRef} type="file" accept="application/json,.json" hidden onChange={handleRestoreFile} />
        {restoreStatus ? <div role="status" className="fixed bottom-4 left-1/2 z-[90] max-w-[min(92vw,42rem)] -translate-x-1/2 rounded-xl border border-white/10 bg-[#09111f]/95 px-4 py-3 text-xs text-slate-200 shadow-2xl">{restoreStatus}</div> : null}
      </>
    );
  }

  return <ControlCenter metrics={state.model?.metrics} analytics={state.model?.analytics} activity={state.model?.activity} failures={state.model?.failures} onNavigate={onNavigate} />;
}
