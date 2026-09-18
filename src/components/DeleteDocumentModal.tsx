'use client';

import React, { useEffect } from 'react';
import { Trash2, X, AlertOctagon } from 'lucide-react';

interface DeleteDocumentModalProps {
  isOpen: boolean;
  documentTitle: string;
  versionCount: number;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  isOpen,
  documentTitle,
  versionCount,
  onClose,
  onConfirmDelete,
}) => {
  useEffect(() => {
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
      <div className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
        <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/70">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs sm:text-sm">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Delete Document</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold font-mono bg-canvas-surface/60 dark:bg-canvas-surface px-1.5 py-0.5 rounded border border-canvas-border/70">
              {documentTitle || 'Untitled Document'}
            </strong>
            ?
          </p>

          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 flex items-start gap-3">
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-xs text-rose-900 dark:text-rose-200">Irreversible Action</div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/90 leading-relaxed">
                {versionCount > 0
                  ? `This document and its ${versionCount} historical version snapshot${versionCount > 1 ? 's' : ''} will be permanently removed.`
                  : 'This document will be permanently removed.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-canvas-surface border border-canvas-border hover:border-canvas-highlight transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:brightness-105 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
