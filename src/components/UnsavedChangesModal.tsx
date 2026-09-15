'use client';

import React from 'react';
import { AlertTriangle, X, Save, ArrowRight } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  documentTitle: string;
  onClose: () => void;
  onSaveAndProceed: () => void;
  onDiscardAndProceed: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  documentTitle,
  onClose,
  onSaveAndProceed,
  onDiscardAndProceed,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/70">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Unsaved Changes in Document</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs text-slate-300">
          <p>
            You have uncommitted modifications in <strong className="text-slate-100 font-medium font-mono">{documentTitle}</strong>.
          </p>
          <p className="text-slate-400">
            Navigating to another document will discard uncommitted changes unless you save them as a version snapshot.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-canvas-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDiscardAndProceed}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              Discard & Switch
            </button>
            <button
              type="button"
              onClick={onSaveAndProceed}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary hover:brightness-110 text-brand-text shadow-sm shadow-sky-500/20 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Switch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
