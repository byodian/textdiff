'use client';

import React from 'react';
import { Columns, Rows, ChevronUp, ChevronDown, RotateCcw, X } from 'lucide-react';
import { VersionItem } from './HistoryDrawer';
import { getShortcutLabel } from '@/lib/platform';

interface DiffInspectorBarProps {
  versionA: VersionItem | null;
  versionB: VersionItem | null;
  currentVersionNo?: number;
  isSideBySide: boolean;
  diffStats: { added: number; removed: number; hasChanges: boolean };
  onToggleSideBySide: () => void;
  onNextDiffChunk: () => void;
  onPrevDiffChunk: () => void;
  onRestoreVersion?: (v: VersionItem) => void;
  onExitDiff: () => void;
}

export const DiffInspectorBar: React.FC<DiffInspectorBarProps> = ({
  versionA,
  versionB,
  currentVersionNo = 1,
  isSideBySide,
  diffStats,
  onToggleSideBySide,
  onNextDiffChunk,
  onPrevDiffChunk,
  onRestoreVersion,
  onExitDiff,
}) => {
  // Label comparison targets
  const sourceALabel = versionA ? `v${versionA.versionNo}` : `Latest Saved (v${currentVersionNo})`;
  const sourceBLabel = versionB ? `v${versionB.versionNo}` : 'Working Draft';

  return (
    <div className="z-20 px-3 sm:px-4 py-2 bg-canvas-elevated/95 border-b border-canvas-border flex items-center justify-between gap-2 sm:gap-4 text-xs shrink-0 shadow-sm">
      {/* Target description & Diff stats */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
          <span className="text-slate-500 dark:text-slate-400 font-sans font-medium hidden xs:inline">Diff:</span>
          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:border-sky-600/50 dark:text-sky-300 font-semibold truncate">
            {sourceALabel}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-sans font-medium">↔</span>
          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:border-sky-600/50 dark:text-sky-300 font-semibold truncate">
            {sourceBLabel}
          </span>
        </div>

        {/* Change Stats badge */}
        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-800/50 font-semibold">
            +{diffStats.added}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-400 dark:border-rose-800/50 font-semibold">
            -{diffStats.removed}
          </span>
        </div>
      </div>

      {/* Controls & Exit */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Change Chunk Navigation */}
        <div className="flex items-center bg-canvas-surface border border-canvas-border rounded p-0.5">
          <button
            type="button"
            onClick={onPrevDiffChunk}
            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-canvas-elevated transition-colors"
            title={`Previous Diff Change (${getShortcutLabel('diffPrev')})`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onNextDiffChunk}
            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-canvas-elevated transition-colors"
            title={`Next Diff Change (${getShortcutLabel('diffNext')})`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Side-by-side vs Inline toggle */}
        <button
          type="button"
          onClick={onToggleSideBySide}
          className="flex items-center gap-1 px-2 py-1 rounded bg-canvas-surface border border-canvas-border text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
          title={isSideBySide ? 'Switch to Unified Inline View' : 'Switch to Split Side-by-Side View'}
        >
          {isSideBySide ? (
            <>
              <Columns className="w-3.5 h-3.5 text-brand-primary" />
              <span className="hidden sm:inline text-[11px]">Side-by-Side</span>
            </>
          ) : (
            <>
              <Rows className="w-3.5 h-3.5 text-brand-primary" />
              <span className="hidden sm:inline text-[11px]">Inline</span>
            </>
          )}
        </button>

        {/* Optional Restore button if comparing a historical version */}
        {versionA && onRestoreVersion && (
          <button
            type="button"
            onClick={() => onRestoreVersion(versionA)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/25 transition-all active:scale-95"
            title={`Restore v${versionA.versionNo} into draft buffer`}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Restore v{versionA.versionNo} to Draft</span>
            <span className="md:hidden">Restore</span>
          </button>
        )}

        {/* Exit Diff button */}
        <button
          type="button"
          onClick={onExitDiff}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-canvas-surface border border-canvas-border hover:border-canvas-highlight text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all active:scale-95"
          title={`Exit Diff Mode (${getShortcutLabel('esc')})`}
        >
          <X className="w-3 h-3" />
          <span>Exit Diff</span>
          <kbd className="hidden lg:inline text-[9px] text-slate-500 dark:text-slate-400 font-mono px-1 rounded bg-slate-200 dark:bg-black/20">{getShortcutLabel('esc')}</kbd>
        </button>
      </div>
    </div>
  );
};
