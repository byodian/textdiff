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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(commitMsg.trim() || `Update version ${currentVersionNo + 1}`);
    setCommitMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <GitCommit className="w-4 h-4 text-brand-primary" />
            <span>Save New Version (v{currentVersionNo + 1})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Commit Note / Change Summary <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Refactored query logic, fixed null pointer..."
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full bg-canvas-surface border border-canvas-border rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-canvas-surface border border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary hover:brightness-110 text-brand-text shadow-md shadow-sky-500/20 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
