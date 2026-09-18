'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, 
  History, 
  Save, 
  Copy, 
  Check, 
  Sparkles, 
  Code, 
  Split,
  FileDiff,
  X,
  Palette,
  MoreHorizontal
} from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  onOpenThemePalette?: () => void;
  isDiffMode: boolean;
  isSideBySide?: boolean;
  diffStats: { added: number; removed: number; hasChanges: boolean };
  hasUnsavedChanges: boolean;
  isJustSaved?: boolean;
  copiedCode: boolean;
  copiedDiff: boolean;
  versionCount?: number;
  customDiffLabel?: string | null;
  onExitCustomDiff?: () => void;
  onTitleChange: (val: string) => void;
  onTitleBlur: () => void;
  onToggleDiffMode: () => void;
  onToggleSideBySide?: () => void;
  onOpenHistory: () => void;
  onSavePrompt: () => void;
  onFormatDocument: () => void;
  onCopyContent: () => void;
  onCopyDiff: () => void;
  onNextDiffChunk?: () => void;
  onPrevDiffChunk?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onOpenThemePalette,
  isDiffMode,
  diffStats,
  hasUnsavedChanges,
  isJustSaved = false,
  copiedCode,
  copiedDiff,
  versionCount,
  customDiffLabel,
  onExitCustomDiff,
  onTitleChange,
  onTitleBlur,
  onToggleDiffMode,
  onOpenHistory,
  onSavePrompt,
  onFormatDocument,
  onCopyContent,
  onCopyDiff,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isMoreOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  // Calculate dynamic input width based on title character count (CJK counts as 1.8, ASCII as 1)
  // Ensures 20~30 characters display completely without truncation while keeping unsaved badge adjacent
  const inputWidthCh = React.useMemo(() => {
    let width = 0;
    const str = title || '';
    if (!str) return 26;
    for (let i = 0; i < str.length; i++) {
      width += str.charCodeAt(i) > 127 ? 1.8 : 1;
    }
    return Math.min(Math.max(Math.ceil(width) + 2, 24), 64);
  }, [title]);

  return (
    <header className="relative z-30 h-14 border-b border-canvas-border bg-canvas-elevated/70 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 select-none">
      {/* Zone 1 (Left): Document Identity (Title & Dirty indicator) */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[50%] lg:max-w-[58%]">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Document Title (e.g. app.tsx, schema.sql)"
          style={{ width: `${inputWidthCh}ch` }}
          className="bg-transparent border-b border-transparent hover:border-canvas-border focus:border-brand-primary text-xs sm:text-sm font-semibold text-slate-100 px-1.5 py-0.5 outline-none transition-all min-w-[200px] max-w-full sm:max-w-md lg:max-w-xl xl:max-w-2xl truncate shrink"
          title="Click to edit document title (auto-saves on blur)"
        />

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={onToggleDiffMode}
            className="flex items-center gap-1 text-[11px] text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 hover:bg-amber-950/70 animate-pulse shrink-0 transition-colors"
            title="Unsaved edits. Click to inspect diff against latest version."
          >
            <span>●<span className="hidden md:inline"> Unsaved edits</span></span>
            {diffStats.hasChanges && (
              <span className="font-mono text-[10px] opacity-90 hidden lg:inline">
                (+{diffStats.added}/-{diffStats.removed})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Zone 2 (Center): Primary Mode Switcher (Edit vs Diff) */}
      <div className="flex items-center justify-center shrink-0">
        <div className="flex items-center p-0.5 bg-canvas-surface border border-canvas-border rounded-lg shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (isDiffMode) onToggleDiffMode();
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 xl:px-3 py-1 rounded-md text-xs font-medium transition-all ${
              !isDiffMode
                ? 'bg-canvas-elevated text-brand-primary shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Return to code editor"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Editor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isDiffMode) onToggleDiffMode();
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 xl:px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isDiffMode
                ? 'bg-sky-500/15 text-brand-primary border border-sky-500/40 shadow-sm font-semibold'
                : diffStats.hasChanges
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={
              diffStats.hasChanges
                ? `Inspect diff (+${diffStats.added}/-${diffStats.removed})`
                : 'Inspect diff (No unsaved changes)'
            }
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Diff</span>
            {diffStats.hasChanges && (
              <span className="font-mono text-[10px] px-1 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 hidden md:inline">
                +{diffStats.added}/-{diffStats.removed}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Zone 3 (Right): Actions Toolbar */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
        {/* History / Revisions Button */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-canvas-surface border border-canvas-border hover:border-canvas-highlight text-xs text-slate-100 hover:text-white font-medium transition-colors shrink-0"
          title="Revision History"
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">History</span>
          {versionCount !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas-highlight text-slate-200 dark:text-slate-100 border border-canvas-border/60 font-semibold hidden lg:inline">
              {versionCount}
            </span>
          )}
        </button>

        {/* Primary Action: Save Version Snapshot */}
        <button
          onClick={onSavePrompt}
          className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded font-semibold text-xs transition-colors shrink-0 ${
            isJustSaved
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-brand-primary hover:brightness-110 active:scale-95 text-brand-text'
          }`}
          title={
            isJustSaved
              ? 'Version Saved!'
              : hasUnsavedChanges
              ? 'Save Version (Ctrl+S / ⌘S)'
              : 'Save Version (No modifications to save, Ctrl+S / ⌘S)'
          }
        >
          {isJustSaved ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </button>

        {/* More Actions Dropdown Menu (...) */}
        <div className="relative shrink-0 z-40" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`p-1.5 rounded border transition-colors flex items-center justify-center ${
              isMoreOpen
                ? 'bg-canvas-elevated border-brand-primary/60 text-brand-primary'
                : 'bg-canvas-surface border border-canvas-border text-slate-400 hover:text-slate-100 hover:border-canvas-highlight'
            }`}
            title="More actions"
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-lg bg-canvas-surface border border-canvas-border shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              {/* Format Document (when not diff mode) */}
              {!isDiffMode && (
                <button
                  type="button"
                  onClick={() => {
                    onFormatDocument();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors text-slate-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Format Document</span>
                  </div>
                  <kbd className="text-[10px] text-slate-500 font-mono">Shift+Alt+F</kbd>
                </button>
              )}

              {/* Copy Code */}
              <button
                type="button"
                onClick={() => {
                  onCopyContent();
                  setTimeout(() => setIsMoreOpen(false), 500);
                }}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-diff-added" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                </div>
              </button>

              {/* Copy Diff (when in diff mode) */}
              {isDiffMode && (
                <button
                  type="button"
                  onClick={() => {
                    onCopyDiff();
                    setTimeout(() => setIsMoreOpen(false), 500);
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors text-slate-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    {copiedDiff ? <Check className="w-3.5 h-3.5 text-diff-added" /> : <FileDiff className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedDiff ? 'Diff Copied!' : 'Copy Diff (Patch)'}</span>
                  </div>
                </button>
              )}

              <div className="h-px bg-canvas-border my-1" />

              {/* Command Palette / Theme Quick Action */}
              {onOpenThemePalette && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenThemePalette();
                    setIsMoreOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors text-slate-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Command Palette</span>
                  </div>
                  <kbd className="text-[10px] text-slate-500 font-mono">Ctrl+Shift+P</kbd>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
