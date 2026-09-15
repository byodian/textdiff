'use client';

import React, { useState } from 'react';
import { X, GitCommit, Check } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commitMsg: string) => void;
  currentVersionNo: number;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentVersionNo,
}) => {
  const [commitMsg, setCommitMsg] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(commitMsg.trim() || `Update version ${currentVersionNo + 1}`);
    setCommitMsg('');
    onClose();
  };

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 w-full max-w-md animate-in slide-in-from-top-2 fade-in duration-150">
      <div className="bg-canvas-elevated border border-brand-primary/40 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
            <GitCommit className="w-3.5 h-3.5 text-brand-primary" />
            <span>Save New Version (v{currentVersionNo + 1})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Version Note <span className="text-slate-500 font-normal">(Optional · Enter to save)</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Refactored query logic, fixed null check..."
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full bg-canvas-surface border border-canvas-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Press Enter to confirm · Esc to dismiss
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-canvas-surface border border-transparent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-1 rounded text-xs font-semibold bg-brand-primary hover:brightness-110 text-brand-text shadow-sm shadow-sky-500/20 transition-all active:scale-95"
              >
                <Check className="w-3 h-3" />
                <span>Confirm & Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
