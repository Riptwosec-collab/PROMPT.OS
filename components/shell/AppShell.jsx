'use client';

import React, { useState } from 'react';
import AuroraBackground from '../ui/AuroraBackground.jsx';
import ToastViewport from '../ui/ToastViewport.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import StatusHud from './StatusHud.jsx';
import MobileDock from './MobileDock.jsx';
import CreateActionSheet from './CreateActionSheet.jsx';
import PageTransition from './PageTransition.jsx';

export default function AppShell({
  activePage,
  onNavigate,
  status,
  children,
  onOpenCommand,
  onNewPrompt,
  onNewWorkflow,
  onImportPrompt,
  onOpenMore,
  toasts = [],
  onDismissToast,
  visualSystemEnabled = false,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const commandEnabled = Boolean(onOpenCommand);

  const openMore = () => {
    if (onOpenMore) onOpenMore();
    else onNavigate?.('settings');
  };

  return (
    <div className={`v5-shell min-h-screen bg-[var(--v5-bg)] text-slate-200 overflow-hidden relative ${visualSystemEnabled ? 'v5-visual-enabled' : ''}`}>
      {visualSystemEnabled ? (
        <AuroraBackground />
      ) : (
        <div className="v5-ambient pointer-events-none fixed inset-0" aria-hidden="true" />
      )}
      <div className="relative z-10 h-screen flex">
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        />
        <div className="min-w-0 flex-1 flex flex-col h-screen">
          <TopBar
            activePage={activePage}
            onOpenCommand={onOpenCommand}
            commandEnabled={commandEnabled}
            status={status}
          />
          <main className="min-h-0 flex-1 overflow-hidden pb-24 md:pb-0">
            <PageTransition activeKey={activePage}>
              {children}
            </PageTransition>
          </main>
          <StatusHud status={status} />
        </div>
      </div>
      <MobileDock
        activePage={activePage}
        onNavigate={onNavigate}
        onNewPrompt={() => setCreateSheetOpen(true)}
        onOpenMore={openMore}
      />
      <CreateActionSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onNewPrompt={onNewPrompt}
        onNewWorkflow={onNewWorkflow}
        onImportPrompt={onImportPrompt}
      />
      <ToastViewport toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}
