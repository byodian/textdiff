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
      <div className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/70">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs sm:text-sm">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Delete Document</span>
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

        <div className="p-5 space-y-3.5 text-xs text-slate-300">
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-100 font-medium font-mono">{documentTitle || 'Untitled Document'}</strong>?
          </p>

          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-rose-200">Irreversible Action</div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-canvas-surface border border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all active:scale-95"
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
