'use client';

import React from 'react';
import GlassSurface from '../ui/GlassSurface.jsx';

const SMART_VIEWS = [
  ['favorites', 'Favorites'],
  ['pinned', 'Pinned'],
  ['recentlyUsed', 'Recently Used'],
  ['mostUsed', 'Most Used'],
  ['recentlyAdded', 'Recently Added'],
  ['hasVariables', 'Has Variables'],
];

export default function WorkspaceSidebar({ workspace, folders = [], smartCollections = {}, activeView = 'all', onViewChange }) {
  const workspaceId = workspace?.id || 'personal';
  const visibleFolders = folders.filter((folder) => !folder.archivedAt && String(folder.workspaceId || 'personal') === String(workspaceId));

  return (
    <GlassSurface
      as="aside"
      level="panel"
      className="relative h-fit overflow-hidden rounded-2xl border border-white/10 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.2)] ring-1 ring-inset ring-white/[0.035]"
      data-workspace-sidebar
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
      <div className="mb-3 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2.5">
        <p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/60">WORKSPACE</p>
        <h2 className="mt-1 truncate text-sm font-semibold text-white">{workspace?.name || 'PERSONAL'}</h2>
      </div>

      <nav className="space-y-1" aria-label="Workspace navigation">
        <NavButton active={activeView === 'all'} onClick={() => onViewChange?.({ type: 'all' })}>All Prompts</NavButton>

        <div className="pt-2">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">Smart Collections</p>
          {SMART_VIEWS.map(([key, label]) => (
            <NavButton key={key} active={activeView === key} onClick={() => onViewChange?.({ type: 'smart', key })}>
              <span>{label}</span>
              <span className="rounded-full border border-white/[0.05] bg-black/15 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{smartCollections?.[key]?.length || 0}</span>
            </NavButton>
          ))}
        </div>

        <div className="pt-2">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">Folders</p>
          {visibleFolders.length === 0 ? <p className="px-2 py-1 text-[11px] text-slate-600">No folders yet</p> : null}
          {visibleFolders.map((folder) => (
            <NavButton key={folder.id} active={activeView === `folder:${folder.id}`} onClick={() => onViewChange?.({ type: 'folder', id: folder.id })}>
              <span>▱ {folder.name}</span>
            </NavButton>
          ))}
        </div>
      </nav>
    </GlassSurface>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border px-2 py-2 text-left text-xs transition ${active ? 'border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'border-transparent text-slate-400 hover:border-white/[0.05] hover:bg-white/[0.035] hover:text-slate-200'}`}
    >
      {children}
    </button>
  );
}
