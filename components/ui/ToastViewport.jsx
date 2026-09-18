'use client';

import React from 'react';

export default function ToastViewport({ toasts = [], onDismiss }) {
  const visible = (Array.isArray(toasts) ? toasts : []).slice(-3);
  if (!visible.length) return null;

  return (
    <div className="v5-toast-viewport fixed left-3 right-3 z-[95] flex flex-col gap-2 md:left-auto md:right-4 md:top-20 md:w-80" aria-label="Notifications">
      {visible.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className="v5-glass-panel rounded-2xl border border-white/10 px-4 py-3 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {toast.title ? <p className="text-xs font-semibold text-white">{toast.title}</p> : null}
              <p className="mt-0.5 break-words text-xs leading-5 text-slate-300">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              className="min-h-11 min-w-11 shrink-0 rounded-xl border border-white/10 px-2 text-[10px] font-mono text-slate-400 hover:text-white"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
