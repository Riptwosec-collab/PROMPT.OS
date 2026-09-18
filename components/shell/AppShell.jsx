'use client';

import React from 'react';
import AuroraBackground from '../ui/AuroraBackground.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import StatusHud from './StatusHud.jsx';
import MobileDock from './MobileDock.jsx';

export default function AppShell({
  activePage,
  onNavigate,
  status,
  children,
  onOpenCommand,
  onNewPrompt,
  visualSystemEnabled = false,
}) {
  return (
    <div className={`v5-shell min-h-screen bg-[var(--v5-bg)] text-slate-200 overflow-hidden relative ${visualSystemEnabled ? 'v5-visual-enabled' : ''}`}>
      {visualSystemEnabled ? (
        <AuroraBackground />
      ) : (
        <div className="v5-ambient pointer-events-none fixed inset-0" aria-hidden="true" />
      )}
      <div className="relative z-10 h-screen flex">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className="min-w-0 flex-1 flex flex-col h-screen">
          <TopBar activePage={activePage} onOpenCommand={onOpenCommand} />
          <main className="min-h-0 flex-1 overflow-hidden pb-20 md:pb-0">
            {children}
          </main>
          <StatusHud status={status} />
        </div>
      </div>
      <MobileDock activePage={activePage} onNavigate={onNavigate} onNewPrompt={onNewPrompt} />
    </div>
  );
}
