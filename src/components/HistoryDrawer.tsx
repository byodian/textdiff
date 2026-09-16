'use client';

import React, { useMemo, useState } from 'react';
import { 
  X, 
  GitCommit, 
  RotateCcw, 
  Clock, 
  Layers, 
  ArrowRight, 
  Sparkles,
  Split,
  CheckSquare,
  Square,
  Edit3,
  Check
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
  onUpdateVersionMsg?: (versionId: string, newMsg: string) => Promise<void> | void;
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
  onUpdateVersionMsg,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<string>('');

  // Currently compared IDs
  const checkedIds = useMemo(() => {
    const ids: string[] = [];
    if (selectedVersionA) ids.push(selectedVersionA.id);
    if (selectedVersionB) ids.push(selectedVersionB.id);
    return ids;
  }, [selectedVersionA, selectedVersionB]);

  if (!isOpen) return null;

  const isCustomDiffActive = !!selectedVersionA;

  const handleToggleCheckbox = (ver: VersionItem) => {
    if (checkedIds.includes(ver.id)) {
      // Uncheck
      if (checkedIds.length === 2) {
        const remainingId = checkedIds.find((id) => id !== ver.id);
        const remainingVer = versions.find((v) => v.id === remainingId);
        if (remainingVer) {
          onCompareWithCurrent(remainingVer);
        } else {
          onClearCustomDiff();
        }
      } else {
        onClearCustomDiff();
      }
    } else {
      // Check
      if (checkedIds.length === 0) {
        onCompareWithCurrent(ver);
      } else if (checkedIds.length === 1) {
        const firstVer = versions.find((v) => v.id === checkedIds[0]);
        if (firstVer) {
          // Compare older vs newer properly
          if (firstVer.versionNo < ver.versionNo) {
            onCompareTwoVersions(firstVer, ver);
          } else {
            onCompareTwoVersions(ver, firstVer);
          }
        }
      } else {
        // Already 2 checked, restart with this one
        onCompareWithCurrent(ver);
      }
    }
  };

  const activeSelectedVersion = selectedVersionB || selectedVersionA || versions[0] || null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-canvas-elevated border-l border-canvas-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-primary" />
          <h2 className="font-semibold text-sm text-slate-100">Revision History</h2>
          <span className="text-xs text-slate-500 font-mono">({versions.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isCustomDiffActive && (
            <button
              onClick={onClearCustomDiff}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-canvas-surface transition-colors"
              title="Exit comparison"
            >
              Reset Diff
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Close Drawer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison Guidance Bar */}
      {isCustomDiffActive ? (
        <div className="px-4 py-2 bg-sky-950/50 border-b border-sky-800/40 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sky-300 font-mono text-[11px] truncate">
            <span className="font-semibold text-slate-100">v{selectedVersionA?.versionNo}</span>
            <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-semibold text-sky-300">
              {selectedVersionB ? `v${selectedVersionB.versionNo}` : 'Current Draft'}
            </span>
          </div>
          <button
            onClick={onClearCustomDiff}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-canvas-surface text-slate-300 border border-canvas-border hover:border-canvas-highlight hover:text-white transition-all shadow-sm shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-1.5 bg-canvas-surface/60 border-b border-canvas-border text-[11px] text-slate-400 flex items-center justify-between">
          <span>Select 2 versions to compare or click card to diff with draft</span>
        </div>
      )}

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {versions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-canvas-surface border border-canvas-border flex items-center justify-center text-slate-500">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-300">No snapshots saved yet</div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Press <kbd className="px-1 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-400 font-mono">Cmd+S</kbd> to save your first snapshot baseline.
              </p>
            </div>
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isLatest = idx === 0;
            const isChecked = checkedIds.includes(ver.id);
            const isComparingWithDraft = !selectedVersionB && selectedVersionA?.id === ver.id;
            const isComparedInPair = (selectedVersionA?.id === ver.id || selectedVersionB?.id === ver.id) && !!selectedVersionB;

            return (
              <div 
                key={ver.id} 
                className={`relative pl-5 pb-0.5 border-l transition-all ${
                  isChecked
                    ? 'border-brand-primary'
                    : 'border-canvas-border'
                } last:border-l-0`}
              >
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-brand-primary border-sky-400 text-brand-text font-bold'
                      : 'bg-canvas-surface border-canvas-border text-slate-400'
                  }`}
                >
                  <GitCommit className="w-2.5 h-2.5" />
                </div>

                <div 
                  className={`group rounded-lg p-3 text-xs space-y-2 border transition-all select-none ${
                    isChecked
                      ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                      : 'bg-canvas-surface/80 border-canvas-border hover:border-canvas-highlight hover:bg-canvas-surface'
                  }`}
                >
                  {/* Card Title Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Checkbox for 2-version comparison */}
                      <button
                        type="button"
                        onClick={() => handleToggleCheckbox(ver)}
                        className="text-slate-400 hover:text-brand-primary transition-colors p-0.5 -ml-1"
                        title={isChecked ? 'Deselect version' : 'Select for comparison'}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-brand-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                        )}
                      </button>

                      <span className="font-mono font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                        v{ver.versionNo}

                        {isComparingWithDraft && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-brand-primary text-brand-text font-bold">
                            Diffing Draft
                          </span>
                        )}

                        {isComparedInPair && (
                          <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                            Comparing
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

                  {/* Version note with inline edit */}
                  {editingId === ver.id ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (onUpdateVersionMsg) {
                          await onUpdateVersionMsg(ver.id, editingMsg.trim());
                        }
                        setEditingId(null);
                      }}
                      className="flex items-center gap-1.5 pl-5 pt-0.5"
                    >
                      <input
                        type="text"
                        value={editingMsg}
                        onChange={(e) => setEditingMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        placeholder="Version note..."
                        className="bg-neutral-900 border border-blue-500 rounded px-2 py-0.5 text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 min-w-0"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
                        title="Save note"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between group/note pl-5">
                      <p 
                        className="text-slate-300 font-medium text-xs leading-relaxed truncate"
                        title={ver.commitMsg || 'Snapshot'}
                        onDoubleClick={() => {
                          if (onUpdateVersionMsg) {
                            setEditingId(ver.id);
                            setEditingMsg(ver.commitMsg || '');
                          }
                        }}
                      >
                        {ver.commitMsg || 'Snapshot'}
                      </p>
                      {onUpdateVersionMsg && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(ver.id);
                            setEditingMsg(ver.commitMsg || '');
                          }}
                          className="opacity-0 group-hover/note:opacity-100 p-0.5 text-slate-400 hover:text-slate-100 rounded hover:bg-canvas-elevated transition-opacity shrink-0 ml-1"
                          title="Edit note"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 pl-5">
                    <button
                      type="button"
                      onClick={() => onCompareWithCurrent(ver)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-canvas-elevated hover:bg-canvas-highlight text-slate-300 hover:text-white border border-canvas-border transition-colors"
                      title="Compare this snapshot with current working draft"
                    >
                      <Split className="w-3 h-3 text-sky-400" />
                      <span>Diff Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevertToVersion(ver)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                      title={`Restore v${ver.versionNo} into working draft`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {versions.length > 0 && (
        <div className="p-3 bg-canvas-surface border-t border-canvas-border flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 min-w-0 truncate">
            {activeSelectedVersion ? (
              <span>Target: <strong className="text-slate-200 font-mono">v{activeSelectedVersion.versionNo}</strong></span>
            ) : (
              <span>No snapshot selected</span>
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
            title={`Restore v${activeSelectedVersion?.versionNo ?? ''} into draft buffer`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore v{activeSelectedVersion?.versionNo ?? ''} to Draft</span>
          </button>
        </div>
      )}
    </div>
  );
};
