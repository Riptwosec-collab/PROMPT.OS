'use client';

import React from 'react';

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
    <aside className="v5-glass h-fit rounded-2xl border border-white/10 p-3" data-workspace-sidebar>
      <div className="mb-3">
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
              <span className="font-mono text-[10px] text-slate-600">{smartCollections?.[key]?.length || 0}</span>
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
    </aside>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${active ? 'bg-cyan-300/10 text-cyan-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
    >
      {children}
    </button>
  );
}
