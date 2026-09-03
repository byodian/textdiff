'use client';

import React from 'react';
import { X, GitCommit, ArrowLeftRight, RotateCcw, Clock, Layers } from 'lucide-react';

export interface VersionItem {
  id: string;
  versionNo: number;
  title: string;
  code: string;
  commitMsg: string | null;
  createdAt: string;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionItem[];
  selectedVersionA: VersionItem | null;
  selectedVersionB: VersionItem | null;
  onSelectVersionA: (v: VersionItem) => void;
  onSelectVersionB: (v: VersionItem) => void;
  onRevertToVersion: (v: VersionItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  selectedVersionA,
  selectedVersionB,
  onSelectVersionA,
  onSelectVersionB,
  onRevertToVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-canvas-elevated border-l border-canvas-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-primary" />
          <h2 className="font-semibold text-sm text-slate-100">Revision History</h2>
          <span className="text-xs text-slate-500">({versions.length} versions)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comparison Selector Hint */}
      <div className="px-4 py-3 bg-canvas-surface/50 border-b border-canvas-border text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="font-medium text-slate-300">Diff Comparison Pair</span>
          <ArrowLeftRight className="w-3.5 h-3.5 text-brand-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-1.5 rounded bg-canvas-surface border border-canvas-border">
            <span className="text-slate-500 block text-[9px] uppercase">Base (Original)</span>
            <span className="text-slate-200 truncate block">
              {selectedVersionA ? `v${selectedVersionA.versionNo} - ${selectedVersionA.commitMsg || 'Snapshot'}` : 'Current Draft'}
            </span>
          </div>
          <div className="p-1.5 rounded bg-canvas-surface border border-canvas-border">
            <span className="text-slate-500 block text-[9px] uppercase">Target (Modified)</span>
            <span className="text-brand-primary truncate block">
              {selectedVersionB ? `v${selectedVersionB.versionNo} - ${selectedVersionB.commitMsg || 'Snapshot'}` : 'Working Code'}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {versions.map((ver, idx) => {
          const isA = selectedVersionA?.id === ver.id;
          const isB = selectedVersionB?.id === ver.id;
          return (
            <div key={ver.id} className="relative pl-6 pb-2 border-l border-canvas-border last:border-l-0">
              {/* Timeline node icon */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-canvas-surface border border-canvas-border flex items-center justify-center text-slate-400">
                <GitCommit className="w-2.5 h-2.5" />
              </div>

              <div className="bg-canvas-surface border border-canvas-border rounded-lg p-3 text-xs space-y-2 hover:border-canvas-highlight transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                    v{ver.versionNo}
                    {idx === 0 && (
                      <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Latest
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-300 font-medium text-xs leading-relaxed">
                  {ver.commitMsg || 'No commit message'}
                </p>

                <div className="pt-2 border-t border-canvas-border/60 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectVersionA(ver)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                        isA
                          ? 'bg-sky-950 text-sky-400 border-sky-600'
                          : 'bg-canvas-elevated text-slate-400 border-canvas-border hover:text-slate-200'
                      }`}
                      title="Set as Base comparison"
                    >
                      Base
                    </button>
                    <button
                      onClick={() => onSelectVersionB(ver)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                        isB
                          ? 'bg-sky-950 text-sky-400 border-sky-600'
                          : 'bg-canvas-elevated text-slate-400 border-canvas-border hover:text-slate-200'
                      }`}
                      title="Set as Target comparison"
                    >
                      Compare
                    </button>
                  </div>

                  <button
                    onClick={() => onRevertToVersion(ver)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 transition-colors"
                    title="Restore this version code to editor"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Revert
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
