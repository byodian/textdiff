'use client';

import React, { useEffect } from 'react';
import { Trash2, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  workspaceName: string;
  snippetCount: number;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({
  isOpen,
  workspaceName,
  snippetCount,
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

  const hasDocuments = snippetCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/70">
          <div
            className={`flex items-center gap-2 font-semibold text-xs sm:text-sm ${
              hasDocuments ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {hasDocuments ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <Trash2 className="w-4 h-4 shrink-0" />
            )}
            <span>{hasDocuments ? 'Cannot Delete Workspace' : 'Delete Workspace'}</span>
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {hasDocuments ? (
            <>
              <p className="leading-relaxed">
                Workspace{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold font-mono bg-canvas-surface/60 dark:bg-canvas-surface px-1.5 py-0.5 rounded border border-canvas-border/70">
                  {workspaceName || 'Workspace'}
                </strong>{' '}
                cannot be deleted because it still contains{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                  {snippetCount} document{snippetCount > 1 ? 's' : ''}
                </strong>
                .
              </p>

              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                    Data Protection Restriction
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    To prevent accidental loss of important notes and documents, a workspace must be empty before it can be deleted. Please move documents to another workspace or delete them individually first.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-canvas-surface border border-canvas-border hover:border-canvas-highlight text-slate-200 hover:text-white transition-colors active:scale-95"
                >
                  Got it
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="leading-relaxed">
                Are you sure you want to delete workspace{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold font-mono bg-canvas-surface/60 dark:bg-canvas-surface px-1.5 py-0.5 rounded border border-canvas-border/70">
                  {workspaceName || 'Workspace'}
                </strong>
                ?
              </p>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This workspace is empty and contains no documents.
              </p>

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
                  <span>Delete Workspace</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
