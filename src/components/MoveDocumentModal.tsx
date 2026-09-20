'use client';

import React, { useEffect } from 'react';
import { FolderInput, X, Folder, ArrowRight } from 'lucide-react';
import { WorkspaceItem } from './Sidebar';

interface MoveDocumentModalProps {
  isOpen: boolean;
  documentTitle: string;
  currentWorkspaceId?: string | null;
  workspaces: WorkspaceItem[];
  onClose: () => void;
  onMoveToWorkspace: (targetWorkspaceId: string) => void;
}

export const MoveDocumentModal: React.FC<MoveDocumentModalProps> = ({
  isOpen,
  documentTitle,
  currentWorkspaceId,
  workspaces,
  onClose,
  onMoveToWorkspace,
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

  const candidateWorkspaces = workspaces.filter((w) => w.id !== currentWorkspaceId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-surface/70">
          <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400 font-semibold text-xs sm:text-sm">
            <FolderInput className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
            <span>Move Document</span>
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
            Move{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold font-mono bg-canvas-surface/60 dark:bg-canvas-surface px-1.5 py-0.5 rounded border border-canvas-border/70">
              {documentTitle || 'Untitled Document'}
            </strong>{' '}
            to another workspace:
          </p>

          {candidateWorkspaces.length === 0 ? (
            <div className="p-4 rounded-lg bg-canvas-surface/60 border border-canvas-border text-center text-slate-500 space-y-1">
              <p className="text-xs text-slate-400">No other workspaces available.</p>
              <p className="text-[11px] text-slate-500">Create another workspace from the sidebar first to move documents.</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {candidateWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => onMoveToWorkspace(ws.id)}
                  className="w-full px-3 py-2.5 rounded-lg border border-canvas-border bg-canvas-surface hover:bg-canvas-elevated hover:border-sky-500/50 flex items-center justify-between text-left group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0 transition-colors" />
                    <span className="font-medium text-xs text-slate-200 group-hover:text-white truncate">
                      {ws.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ws._count?.snippets !== undefined && (
                      <span className="text-[10px] font-mono text-slate-500 bg-canvas-elevated px-1.5 py-0.5 rounded border border-canvas-border/50">
                        {ws._count.snippets} docs
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-canvas-surface border border-canvas-border hover:border-canvas-highlight transition-colors active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
