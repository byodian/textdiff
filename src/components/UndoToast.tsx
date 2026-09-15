'use client';

import React, { useEffect } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
  durationMs = 6000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-canvas-elevated border border-canvas-highlight px-4 py-2.5 rounded-xl shadow-2xl text-xs text-slate-100 animate-in slide-in-from-bottom-3 fade-in duration-200 ring-1 ring-white/10">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="font-medium">{message}</span>
      <div className="flex items-center gap-1.5 ml-2">
        <button
          type="button"
          onClick={() => {
            onUndo();
            onDismiss();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all active:scale-95"
          title="Revert to previous buffer content"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Undo</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
