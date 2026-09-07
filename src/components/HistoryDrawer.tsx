'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitCommit, 
  RotateCcw, 
  Clock, 
  Layers, 
  ArrowRight, 
  Sparkles,
  Anchor
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
  // In pickMode, baseVersionId is the fixed anchor, targetVersionId is the compared version
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
  const [targetVersionId, setTargetVersionId] = useState<string | null>(null);

  // Sync with incoming diff state when opening
  useEffect(() => {
    if (selectedVersionA && selectedVersionB) {
      setPickMode(true);
      setBaseVersionId(selectedVersionA.id);
      setTargetVersionId(selectedVersionB.id);
    }
  }, [selectedVersionA, selectedVersionB]);

  if (!isOpen) return null;

  // Triggered when clicking a card in Compare 2 Versions mode
  const handleCardClickInPickMode = (ver: VersionItem) => {
    if (!baseVersionId) {
      // Step 1: Lock this version as the Base anchor
      setBaseVersionId(ver.id);
      setTargetVersionId(null);
      // Diff against current draft temporarily
      onCompareWithCurrent(ver);
    } else if (ver.id === baseVersionId) {
      // Clicking base again unlocks or resets it
      setBaseVersionId(null);
      setTargetVersionId(null);
      onClearCustomDiff();
    } else {
      // Step 2: Lock or switch the target comparison version against the fixed base
      setTargetVersionId(ver.id);
      const baseVer = versions.find((v) => v.id === baseVersionId);
      if (baseVer) {
        onCompareTwoVersions(baseVer, ver);
      }
    }
  };

  const handleSetAsBase = (e: React.MouseEvent, ver: VersionItem) => {
    e.stopPropagation();
    setBaseVersionId(ver.id);
    if (targetVersionId && targetVersionId !== ver.id) {
      const targetVer = versions.find((v) => v.id === targetVersionId);
      if (targetVer) {
        onCompareTwoVersions(ver, targetVer);
        return;
      }
    }
    // If no target yet, diff against current
    onCompareWithCurrent(ver);
  };

  const handleResetAll = () => {
    setBaseVersionId(null);
    setTargetVersionId(null);
    onClearCustomDiff();
  };

  const isCustomDiffActive = !!selectedVersionA;
  const activeSelectedVersion = selectedVersionB || selectedVersionA || versions[0] || null;

  const baseVersion = versions.find((v) => v.id === baseVersionId);
  const targetVersion = versions.find((v) => v.id === targetVersionId);

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
              if (pickMode) {
                setPickMode(false);
                handleResetAll();
              } else {
                setPickMode(true);
                // Default Base to the first / latest version
                const defaultBase = versions[0]?.id || null;
                setBaseVersionId(defaultBase);
                setTargetVersionId(null);
              }
            }}
            className={`px-2.5 py-1 rounded text-xs transition-all font-medium ${
              pickMode
                ? 'bg-brand-primary text-brand-text shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-canvas-surface border border-transparent'
            }`}
            title="Set a Base version and easily switch target versions to compare"
          >
            {pickMode ? 'Exit Compare' : 'Compare 2 Versions'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pick Mode Guidance Bar */}
      {pickMode && (
        <div className="px-4 py-2 bg-sky-950/40 border-b border-sky-800/40 text-[11px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sky-200">
            <Anchor className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Base: <strong className="font-mono text-amber-300 font-semibold">{baseVersion ? `v${baseVersion.versionNo}` : 'None'}</strong>
            </span>
            <ArrowRight className="w-3 h-3 text-sky-500" />
            <span>
              Target: <strong className="font-mono text-sky-300 font-semibold">{targetVersion ? `v${targetVersion.versionNo}` : 'Click any card'}</strong>
            </span>
          </div>
          {baseVersionId && (
            <button
              onClick={() => {
                setBaseVersionId(null);
                setTargetVersionId(null);
                onClearCustomDiff();
              }}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Active Diff Status Banner (Single Mode) */}
      {!pickMode && isCustomDiffActive && (
        <div className="px-4 py-2 bg-sky-950/50 border-b border-sky-800/40 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sky-300 font-mono text-[11px] truncate">
            <span className="font-semibold text-slate-100">v{selectedVersionA?.versionNo}</span>
            <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-semibold text-sky-300">Current Draft</span>
          </div>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-canvas-surface text-slate-300 border border-canvas-border hover:border-canvas-highlight hover:text-white hover:bg-canvas-elevated active:scale-95 transition-all shadow-sm shrink-0"
            title="Exit version diff and restore editor"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Diff</span>
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
            const isLatest = idx === 0;

            // In Single Mode
            const isComparingWithCurrent = !pickMode && selectedVersionA?.id === ver.id && !selectedVersionB;

            // In Pick Mode
            const isBase = pickMode && baseVersionId === ver.id;
            const isTarget = pickMode && targetVersionId === ver.id;

            // Visual Highlight State
            const isHighlighted = 
              isComparingWithCurrent || 
              isBase || 
              isTarget || 
              (!isCustomDiffActive && isLatest && !pickMode);

            return (
              <div 
                key={ver.id} 
                className={`relative pl-5 pb-0.5 border-l transition-all ${
                  isBase
                    ? 'border-amber-500'
                    : isTarget || isComparingWithCurrent
                    ? 'border-sky-500'
                    : isHighlighted
                    ? 'border-brand-primary/80'
                    : 'border-canvas-border'
                } last:border-l-0`}
              >
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isBase
                      ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold'
                      : isTarget || isComparingWithCurrent
                      ? 'bg-brand-primary border-sky-400 text-brand-text'
                      : isHighlighted
                      ? 'bg-brand-primary/80 border-sky-400 text-brand-text'
                      : 'bg-canvas-surface border-canvas-border text-slate-400'
                  }`}
                >
                  <GitCommit className="w-2.5 h-2.5" />
                </div>

                <div 
                  onClick={() => {
                    if (pickMode) {
                      handleCardClickInPickMode(ver);
                    } else {
                      onCompareWithCurrent(ver);
                    }
                  }}
                  className={`group rounded-lg p-3 text-xs space-y-2 border transition-all cursor-pointer select-none active:scale-[0.99] ${
                    isBase
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                      : isTarget
                      ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                      : isComparingWithCurrent
                      ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                      : isLatest && !isCustomDiffActive && !pickMode
                      ? 'bg-sky-950/20 border-sky-600/40 hover:border-sky-500/70 hover:bg-sky-950/30'
                      : 'bg-canvas-surface/80 border-canvas-border hover:border-canvas-highlight hover:bg-canvas-surface'
                  }`}
                  title={
                    pickMode
                      ? isBase
                        ? 'Current Base anchor. Click another card to switch target.'
                        : 'Click to compare against Base'
                      : 'Click card to compare with current draft'
                  }
                >
                  {/* Card Title Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                        v{ver.versionNo}
                        
                        {/* Pick Mode Badge Status */}
                        {pickMode && isBase && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold flex items-center gap-0.5">
                            <Anchor className="w-2.5 h-2.5" />
                            Base
                          </span>
                        )}
                        {pickMode && isTarget && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-brand-primary text-brand-text font-bold">
                            Comparing
                          </span>
                        )}

                        {/* Single Mode Diffing Badge */}
                        {!pickMode && isComparingWithCurrent && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-brand-primary text-brand-text font-bold">
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

                    <div className="flex items-center gap-2">
                      {/* Explicit "Set as Base" button in Pick Mode for fast anchoring */}
                      {pickMode && !isBase && (
                        <button
                          onClick={(e) => handleSetAsBase(e, ver)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 transition-all"
                          title="Set this version as the fixed Base"
                        >
                          Set as Base
                        </button>
                      )}

                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
