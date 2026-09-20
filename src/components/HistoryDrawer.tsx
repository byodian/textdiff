'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  X, 
  GitCommit, 
  RotateCcw, 
  Clock, 
  Layers, 
  Sparkles,
  Columns,
  Rows,
  CheckSquare,
  Square,
  Edit3,
  Check
} from 'lucide-react';
import { CodeCanvas, MonacoEditorInstance, MonacoDiffEditorInstance } from './CodeCanvas';
import { calculateDiffStats } from '@/lib/diff-utils';

export interface VersionItem {
  id: string;
  versionNo: number;
  title: string;
  code: string;
  commitMsg: string | null;
  createdAt: string;
}

export interface HistoryDrawerProps {
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
  documentTitle?: string;
  language?: string;
  currentDraftCode?: string;
  theme?: string;
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
  documentTitle = 'Untitled Document',
  language = 'plaintext',
  currentDraftCode = '',
  theme = 'vs-dark',
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<string>('');
  const [isSideBySide, setIsSideBySide] = useState<boolean>(true);
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const diffEditorRef = useRef<MonacoDiffEditorInstance | null>(null);

  // Active target version for comparison and rollback
  const activeVersion = selectedVersionA || versions[0] || null;

  // Selected version IDs for multi-version comparison
  const checkedIds = useMemo(() => {
    const ids: string[] = [];
    if (selectedVersionA) ids.push(selectedVersionA.id);
    if (selectedVersionB) ids.push(selectedVersionB.id);
    return ids;
  }, [selectedVersionA, selectedVersionB]);

  // Diff codes
  const originalCode = activeVersion ? activeVersion.code : '';
  const targetCode = selectedVersionB ? selectedVersionB.code : currentDraftCode;

  // Real-time diff additions / deletions stats
  const stats = useMemo(() => {
    return calculateDiffStats(originalCode, targetCode);
  }, [originalCode, targetCode]);

  // Keyboard navigation & Esc to exit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          e.stopPropagation();
          setEditingId(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingId]);

  if (!isOpen) return null;

  const isCustomPairActive = !!selectedVersionB;

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
          if (firstVer.versionNo < ver.versionNo) {
            onCompareTwoVersions(firstVer, ver);
          } else {
            onCompareTwoVersions(ver, firstVer);
          }
        }
      } else {
        onCompareWithCurrent(ver);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-canvas-default text-slate-100 animate-in fade-in duration-150 select-none"
    >
      {/* Top History Context & Control Bar */}
      <div className="h-14 min-h-14 max-h-14 px-4 border-b border-canvas-border bg-canvas-elevated flex items-center justify-between gap-4 shrink-0">
        {/* Left: Document title & Diff Comparison Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-brand-primary" />
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Revision History</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>

          <span 
            className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px] sm:max-w-xs" 
            title={documentTitle}
          >
            {documentTitle}
          </span>

          {activeVersion && (
            <>
              <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-medium">
                  {selectedVersionB 
                    ? `v${activeVersion.versionNo} ↔ v${selectedVersionB.versionNo}` 
                    : `v${activeVersion.versionNo} ↔ Current Draft`}
                </span>
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  +{stats.added}
                </span>
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  -{stats.removed}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: View toggle, Restore CTA, and Minimalist X close button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Side by side / Inline view mode switcher */}
          <div className="flex items-center bg-canvas-surface border border-canvas-border rounded p-0.5">
            <button
              type="button"
              onClick={() => setIsSideBySide(true)}
              className={`p-1 rounded text-xs transition-colors ${
                isSideBySide
                  ? 'bg-canvas-elevated text-brand-primary shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Side by side diff"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsSideBySide(false)}
              className={`p-1 rounded text-xs transition-colors ${
                !isSideBySide
                  ? 'bg-canvas-elevated text-brand-primary shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Inline diff"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Prominent Global Restore Action */}
          {activeVersion && (
            <button
              type="button"
              onClick={() => onRevertToVersion(activeVersion)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-primary text-brand-text shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
              title={`Restore v${activeVersion.versionNo} into working draft buffer`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore v{activeVersion.versionNo}</span>
            </button>
          )}

          {/* Minimalist Close button (Direct X icon without redundant text) */}
          <div className="h-4 w-px bg-canvas-border mx-0.5" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-canvas-surface transition-colors shrink-0"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Workspace: Left Version Timeline (w-96) + Right Monaco Diff (Full Width) */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Left Sidebar: Clean, modern revision timeline */}
        <div className="w-96 h-full bg-canvas-elevated border-r border-canvas-border flex flex-col shrink-0 overflow-hidden">
          {/* Timeline Panel Header */}
          <div className="h-11 min-h-11 max-h-11 px-4 border-b border-canvas-border flex items-center justify-between shrink-0 bg-canvas-surface/40">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Snapshots <span className="font-mono text-[11px] text-slate-400">({versions.length})</span>
              </span>
            </div>

            {isCustomPairActive && (
              <button
                type="button"
                onClick={onClearCustomDiff}
                className="text-[11px] font-medium text-brand-primary hover:underline transition-colors"
                title="Reset to compare with current draft"
              >
                Reset to Draft
              </button>
            )}
          </div>

          {/* Timeline List: Seamless integrated list view instead of fragmented cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-canvas-border/50">
            {versions.length === 0 ? (
              <div className="text-center py-16 px-4 text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-400">No versions found</p>
                <p className="text-[11px] text-slate-500">Save edits to create automatic snapshots.</p>
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isLatest = idx === 0;
                const isChecked = checkedIds.includes(ver.id);
                const isActive = activeVersion?.id === ver.id && !selectedVersionB;
                const isComparingWithDraft = !selectedVersionB && activeVersion?.id === ver.id;
                const isComparedInPair = (selectedVersionA?.id === ver.id || selectedVersionB?.id === ver.id) && !!selectedVersionB;

                return (
                  <div
                    key={ver.id}
                    onClick={() => onCompareWithCurrent(ver)}
                    className={`group relative h-16 shrink-0 px-4 flex flex-col justify-center text-xs cursor-pointer transition-colors select-none ${
                      isActive || isComparedInPair
                        ? 'bg-brand-primary/[0.08] dark:bg-brand-primary/15 text-slate-900 dark:text-slate-100 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-brand-primary'
                        : 'hover:bg-canvas-surface/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Top Row: Checkbox, version label, status badge, timestamp (locked h-5) */}
                    <div className="h-5 flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCheckbox(ver);
                          }}
                          className={`p-0.5 -ml-1 rounded transition-colors ${
                            isChecked
                              ? 'text-brand-primary'
                              : 'text-slate-400 hover:text-brand-primary opacity-60 group-hover:opacity-100'
                          }`}
                          title={isChecked ? 'Deselect version' : 'Select for 2-version comparison'}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-brand-primary" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <span className="font-mono font-bold text-xs leading-none text-slate-900 dark:text-slate-100 shrink-0">
                          v{ver.versionNo}
                        </span>

                        {isComparingWithDraft && (
                          <span className="h-4 leading-none inline-flex items-center text-[10px] font-sans px-1.5 rounded-full bg-brand-primary text-brand-text font-medium shrink-0">
                            Diffing Draft
                          </span>
                        )}

                        {isComparedInPair && (
                          <span className="h-4 leading-none inline-flex items-center text-[10px] font-sans px-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-brand-primary font-medium shrink-0">
                            Comparing
                          </span>
                        )}

                        {isLatest && (
                          <span className="h-4 leading-none inline-flex items-center gap-1 text-[10px] font-sans px-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            Latest
                          </span>
                        )}
                      </div>

                      <span className="h-4 flex items-center gap-1 text-[11px] leading-none text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Snapshot note row aligned cleanly under the version label (locked h-5 mt-1) */}
                    <div className="h-5 flex items-center pl-5 mt-1">
                      {editingId === ver.id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (onUpdateVersionMsg) {
                              await onUpdateVersionMsg(ver.id, editingMsg.trim());
                            }
                            setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 w-full h-full"
                        >
                          <input
                            type="text"
                            value={editingMsg}
                            onChange={(e) => setEditingMsg(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                setEditingId(null);
                              }
                            }}
                            autoFocus
                            placeholder="Version note..."
                            className="h-full bg-canvas-default border border-brand-primary rounded px-2 text-xs leading-none text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none flex-1 min-w-0"
                          />
                          <button
                            type="submit"
                            className="p-1 rounded bg-brand-primary text-brand-text transition-colors shrink-0"
                            title="Save note"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded hover:bg-canvas-surface text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <div
                          className="flex items-center justify-between w-full h-full group/note"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateVersionMsg) {
                              setEditingId(ver.id);
                              setEditingMsg(ver.commitMsg || '');
                            }
                          }}
                        >
                          <p
                            className="text-slate-500 dark:text-slate-400 text-xs truncate leading-none"
                            title={ver.commitMsg || 'Snapshot'}
                          >
                            {ver.commitMsg || 'Snapshot'}
                          </p>
                          {onUpdateVersionMsg && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(ver.id);
                                setEditingMsg(ver.commitMsg || '');
                              }}
                              className="opacity-0 group-hover/note:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-canvas-surface transition-opacity shrink-0 ml-1"
                              title="Edit note"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Diff Area: Completely unobscured, zero backdrop blur */}
        <div className="flex-1 h-full min-w-0 bg-canvas-default relative overflow-hidden">
          {versions.length > 0 && activeVersion ? (
            <CodeCanvas
              language={language}
              code={targetCode}
              originalCode={originalCode}
              targetCode={targetCode}
              theme={theme}
              isDiffMode={true}
              isSideBySide={isSideBySide}
              onCodeChange={() => {}}
              editorRef={editorRef}
              diffEditorRef={diffEditorRef}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Layers className="w-12 h-12 mb-3 text-slate-400/50" />
              <p className="text-sm font-semibold text-slate-300">No snapshots saved yet</p>
              <p className="text-xs text-slate-500 mt-1">Press Save in the editor to create your first snapshot.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
