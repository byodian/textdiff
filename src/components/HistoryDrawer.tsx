'use client';

import React, { useState } from 'react';
import { 
  X, 
  GitCommit, 
  RotateCcw, 
  Clock, 
  Layers, 
  ArrowRight, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';

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
  onCompareWithCurrent: (v: VersionItem) => void;
  onCompareTwoVersions: (base: VersionItem, target: VersionItem) => void;
  onClearCustomDiff: () => void;
  onRevertToVersion: (v: VersionItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  selectedVersionA,
  selectedVersionB,
  onCompareWithCurrent,
  onCompareTwoVersions,
  onClearCustomDiff,
  onRevertToVersion,
}) => {
  const [pickMode, setPickMode] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleTogglePick = (id: string) => {
    if (pickedIds.includes(id)) {
      setPickedIds(pickedIds.filter((item) => item !== id));
    } else {
      if (pickedIds.length >= 2) {
        setPickedIds([pickedIds[1], id]);
      } else {
        const next = [...pickedIds, id];
        setPickedIds(next);
        if (next.length === 2) {
          const v1 = versions.find((v) => v.id === next[0]);
          const v2 = versions.find((v) => v.id === next[1]);
          if (v1 && v2) {
            // older version as Base, newer as Target
            const [base, target] = v1.versionNo < v2.versionNo ? [v1, v2] : [v2, v1];
            onCompareTwoVersions(base, target);
          }
        }
      }
    }
  };

  const isCustomDiffActive = !!selectedVersionA;
  const activeSelectedVersion = selectedVersionA || versions[0] || null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-canvas-elevated border-l border-canvas-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-primary" />
          <h2 className="font-semibold text-sm text-slate-100">Revision History</h2>
          <span className="text-xs text-slate-500">({versions.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setPickMode(!pickMode);
              setPickedIds([]);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              pickMode
                ? 'bg-brand-primary text-slate-950 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-canvas-surface'
            }`}
            title="Select any two versions to compare"
          >
            {pickMode ? 'Cancel Selection' : 'Compare 2 Versions'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Diff Status Banner */}
      {isCustomDiffActive && (
        <div className="px-4 py-2.5 bg-sky-950/40 border-b border-sky-900/40 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sky-300 font-mono text-[11px]">
            <span>v{selectedVersionA?.versionNo}</span>
            <ArrowRight className="w-3 h-3 text-sky-400" />
            <span>{selectedVersionB ? `v${selectedVersionB.versionNo}` : 'Current Draft'}</span>
          </div>
          <button
            onClick={onClearCustomDiff}
            className="text-[11px] text-slate-400 hover:text-white underline transition-colors"
          >
            Reset Diff
          </button>
        </div>
      )}

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {versions.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No history versions saved yet. Click &quot;Save Version&quot; to create one.
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isComparingWithCurrent = selectedVersionA?.id === ver.id && !selectedVersionB;
            const isPicked = pickedIds.includes(ver.id);
            const isLatest = idx === 0;

            // Highlight state: currently comparing, or picked, or if idle highlight the Latest card
            const isHighlighted = isComparingWithCurrent || isPicked || (!isCustomDiffActive && isLatest && !pickMode);

            return (
              <div 
                key={ver.id} 
                className={`relative pl-5 pb-0.5 border-l transition-all ${
                  isHighlighted 
                    ? 'border-brand-primary/80' 
                    : 'border-canvas-border'
                } last:border-l-0`}
              >
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isHighlighted
                      ? 'bg-sky-500 border-sky-400 text-slate-950'
                      : 'bg-canvas-surface border-canvas-border text-slate-400'
                  }`}
                >
                  <GitCommit className="w-2.5 h-2.5" />
                </div>

                <div 
                  onClick={() => {
                    if (pickMode) {
                      handleTogglePick(ver.id);
                    } else {
                      onCompareWithCurrent(ver);
                    }
                  }}
                  className={`group rounded-lg p-3 text-xs space-y-2 border transition-all cursor-pointer select-none active:scale-[0.99] ${
                    isComparingWithCurrent || isPicked
                      ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                      : isLatest && !isCustomDiffActive && !pickMode
                      ? 'bg-sky-950/20 border-sky-600/40 hover:border-sky-500/70 hover:bg-sky-950/30'
                      : 'bg-canvas-surface/80 border-canvas-border hover:border-canvas-highlight hover:bg-canvas-surface'
                  }`}
                  title={pickMode ? 'Click to select' : 'Click card to compare'}
                >
                  {/* Card Title Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {pickMode && (
                        <div className="text-brand-primary">
                          {isPicked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                      )}
                      <span className="font-mono font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                        v{ver.versionNo}
                        {isComparingWithCurrent && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-sky-500 text-slate-950 font-bold">
                            Diffing
                          </span>
                        )}
                      </span>
                      {isLatest && (
                        <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Commit message */}
                  <p className="text-slate-300 font-medium text-xs leading-relaxed">
                    {ver.commitMsg || 'Snapshot'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Unified Single Action Footer */}
      {versions.length > 0 && (
        <div className="p-3 bg-canvas-surface border-t border-canvas-border flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 min-w-0 truncate">
            {activeSelectedVersion ? (
              <span>Target: <strong className="text-slate-200 font-mono">v{activeSelectedVersion.versionNo}</strong></span>
            ) : (
              <span>No version selected</span>
            )}
          </div>
          <button
            disabled={!activeSelectedVersion}
            onClick={() => {
              if (activeSelectedVersion) {
                onRevertToVersion(activeSelectedVersion);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/60 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title={`Restore workspace code to v${activeSelectedVersion?.versionNo ?? ''}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revert to v{activeSelectedVersion?.versionNo ?? ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};
