'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, 
  Rows, 
  History, 
  Save, 
  Copy, 
  Check, 
  Sparkles, 
  Code, 
  Split,
  ChevronDown,
  ChevronUp,
  FileDiff,
  X,
  Eye,
  Palette,
  MoreHorizontal
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

interface EditorHeaderProps {
  title: string;
  filename: string;
  language: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  onOpenThemePalette?: () => void;
  isDiffMode: boolean;
  isSideBySide: boolean;
  markdownViewMode?: 'edit' | 'split' | 'preview';
  onMarkdownViewModeChange?: (mode: 'edit' | 'split' | 'preview') => void;
  diffStats: { added: number; removed: number; hasChanges: boolean };
  hasUnsavedChanges: boolean;
  copiedCode: boolean;
  copiedDiff: boolean;
  customDiffLabel?: string | null;
  onExitCustomDiff?: () => void;
  onTitleChange: (val: string) => void;
  onTitleBlur: () => void;
  onFilenameChange: (val: string) => void;
  onFilenameBlur: () => void;
  onLanguageChange: (lang: string) => void;
  onToggleDiffMode: () => void;
  onToggleSideBySide: () => void;
  onOpenHistory: () => void;
  onSavePrompt: () => void;
  onFormatDocument: () => void;
  onCopyContent: () => void;
  onCopyDiff: () => void;
  onNextDiffChunk: () => void;
  onPrevDiffChunk: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  filename,
  language,
  theme,
  onThemeChange,
  onOpenThemePalette,
  isDiffMode,
  isSideBySide,
  markdownViewMode = 'edit',
  onMarkdownViewModeChange,
  diffStats,
  hasUnsavedChanges,
  copiedCode,
  copiedDiff,
  customDiffLabel,
  onExitCustomDiff,
  onTitleChange,
  onTitleBlur,
  onFilenameChange,
  onFilenameBlur,
  onLanguageChange,
  onToggleDiffMode,
  onToggleSideBySide,
  onOpenHistory,
  onSavePrompt,
  onFormatDocument,
  onCopyContent,
  onCopyDiff,
  onNextDiffChunk,
  onPrevDiffChunk,
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

  return (
    <header className="relative z-30 h-14 border-b border-canvas-border bg-canvas-elevated/70 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Title, Filename, and Language metadata */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
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
          placeholder="Snippet Title"
          className="bg-transparent border-b border-transparent hover:border-canvas-border focus:border-brand-primary text-xs sm:text-sm font-medium text-slate-100 px-1 py-0.5 outline-none transition-colors min-w-[60px] max-w-[120px] sm:max-w-[160px] md:max-w-xs truncate shrink"
          title="Click to edit title (auto-saves on blur)"
        />

        <span className="text-slate-600 hidden xs:inline shrink-0">/</span>

        <input
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          onBlur={onFilenameBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="e.g. note.md"
          className="bg-canvas-surface border border-canvas-border rounded px-2 py-1 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-primary w-24 sm:w-32 md:w-36 shrink-0 transition-colors truncate"
          title="Click to edit filename (auto-saves on blur)"
        />

        {/* Language select */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-canvas-surface border border-canvas-border text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-primary cursor-pointer hover:border-canvas-highlight transition-colors shrink-0 max-w-[100px] sm:max-w-none"
          title="Select Language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id} className="bg-canvas-surface text-slate-200">
              {lang.name}
            </option>
          ))}
        </select>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <>
            <span className="hidden md:flex items-center gap-1 text-[11px] text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 animate-pulse shrink-0">
              ● Unsaved edits
            </span>
            <span
              className="md:hidden flex items-center justify-center w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
              title="Unsaved edits"
            />
          </>
        )}

        {/* Custom Version Diff banner if active */}
        {customDiffLabel && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/70 border border-sky-600/50 text-[11px] sm:text-xs text-sky-300 font-mono shrink-0 truncate">
            <span className="truncate">Diff: {customDiffLabel}</span>
            {onExitCustomDiff && (
              <button
                onClick={onExitCustomDiff}
                className="hover:text-white p-0.5 rounded shrink-0"
                title="Exit version comparison and return to editor"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action toolbars */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Diff Navigation controls (Diff mode only) */}
        {isDiffMode && (
          <div className="flex items-center gap-0.5 bg-canvas-surface border border-canvas-border rounded p-0.5 shrink-0">
            <button
              onClick={onPrevDiffChunk}
              className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-canvas-elevated"
              title="Previous Change Chunk"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNextDiffChunk}
              className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-canvas-elevated"
              title="Next Change Chunk"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Markdown View Mode selector (When language === 'markdown' and not diff mode) */}
        {!isDiffMode && language === 'markdown' && onMarkdownViewModeChange && (
          <div 
            className="flex items-center bg-canvas-surface border border-canvas-border rounded p-0.5 text-xs shrink-0" 
            role="group" 
            aria-label="Markdown view mode"
          >
            <button
              onClick={() => onMarkdownViewModeChange('edit')}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'edit'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Edit markdown source only"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onMarkdownViewModeChange('split')}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'split'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-side edit and rendered preview"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => onMarkdownViewModeChange('preview')}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'preview'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rendered preview only"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        )}

        {/* Side-by-side vs Inline toggle (Diff mode only) */}
        {isDiffMode && (
          <button
            onClick={onToggleSideBySide}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded bg-canvas-surface border border-canvas-border text-xs text-slate-300 hover:border-canvas-highlight hover:text-white transition-colors shrink-0"
            title={isSideBySide ? 'Switch to Unified Inline View' : 'Switch to Split Side-by-Side View'}
          >
            {isSideBySide ? (
              <>
                <Columns className="w-3.5 h-3.5 text-brand-primary" />
                <span className="hidden md:inline">Side-by-Side</span>
              </>
            ) : (
              <>
                <Rows className="w-3.5 h-3.5 text-brand-primary" />
                <span className="hidden md:inline">Inline</span>
              </>
            )}
          </button>
        )}

        {/* Diff Toggle Button with Live Status */}
        <button
          onClick={onToggleDiffMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium border transition-all shrink-0 ${
            isDiffMode
              ? 'bg-sky-500/15 text-brand-primary border-sky-500/50 shadow-sm ring-1 ring-sky-500/20'
              : diffStats.hasChanges
              ? 'bg-canvas-surface text-slate-200 border-amber-500/40 hover:border-amber-500/70 hover:bg-canvas-elevated'
              : 'bg-canvas-surface text-slate-400 border-canvas-border hover:border-canvas-highlight hover:text-slate-200'
          }`}
          title={
            isDiffMode
              ? 'Return to code editor'
              : diffStats.hasChanges
              ? `Inspect diff (${diffStats.added} added, ${diffStats.removed} removed)`
              : 'Inspect diff (No unsaved changes against last saved version)'
          }
        >
          {isDiffMode ? <Code className="w-3.5 h-3.5" /> : <Split className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isDiffMode ? 'Editor' : 'Inspect Diff'}</span>

          {!isDiffMode && (
            diffStats.hasChanges ? (
              <span className="flex items-center gap-0.5 text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                +{diffStats.added}/-{diffStats.removed}
              </span>
            ) : (
              <span className="hidden md:inline-block text-[10px] font-sans px-1.5 py-0.2 rounded bg-canvas-elevated text-slate-500 border border-canvas-border">
                No diff
              </span>
            )
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
              {/* Revisions & History */}
              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  setIsMoreOpen(false);
                }}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors text-slate-200 hover:text-white"
                title="View Revisions & History"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>Revisions</span>
                </div>
              </button>

              <div className="h-px bg-canvas-border my-1" />

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

              {/* Theme selector inside menu */}
              <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-canvas-border mt-1 pt-1.5">
                <span className="text-slate-400 text-[11px] flex items-center gap-1.5 shrink-0">
                  <Palette className="w-3 h-3 text-slate-400" />
                  Theme
                </span>
                <select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value)}
                  className="bg-canvas-elevated border border-canvas-border text-slate-200 text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-brand-primary cursor-pointer max-w-[130px]"
                >
                  <optgroup label="Standard Themes" className="bg-canvas-surface text-slate-200">
                    <option value="vs-dark">VS Dark</option>
                    <option value="vs">VS Light</option>
                    <option value="hc-black">High Contrast</option>
                  </optgroup>
                  <optgroup label="Popular Dark Themes" className="bg-canvas-surface text-slate-200">
                    <option value="github-dark">GitHub Dark</option>
                    <option value="dracula">Dracula</option>
                    <option value="monokai">Monokai</option>
                    <option value="monokai-bright">Monokai Bright</option>
                    <option value="nord">Nord</option>
                    <option value="night-owl">Night Owl</option>
                    <option value="cobalt2">Cobalt2</option>
                    <option value="oceanic-next">Oceanic Next</option>
                    <option value="solarized-dark">Solarized Dark</option>
                    <option value="tomorrow-night">Tomorrow Night</option>
                    <option value="tomorrow-night-blue">Tomorrow Night Blue</option>
                    <option value="twilight">Twilight</option>
                    <option value="blackboard">Blackboard</option>
                    <option value="clouds-midnight">Clouds Midnight</option>
                    <option value="zenburnesque">Zenburn</option>
                  </optgroup>
                  <optgroup label="Popular Light Themes" className="bg-canvas-surface text-slate-200">
                    <option value="github-light">GitHub Light</option>
                    <option value="solarized-light">Solarized Light</option>
                    <option value="chrome-devtools">Chrome DevTools</option>
                    <option value="xcode-default">Xcode Default</option>
                    <option value="tomorrow">Tomorrow (Light)</option>
                    <option value="clouds">Clouds (Light)</option>
                    <option value="active4d">Active4D (Light)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action: Save Version Snapshot */}
        <button
          onClick={onSavePrompt}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded bg-brand-primary hover:brightness-110 text-brand-text font-semibold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-95 shrink-0"
          title="Save Version (Ctrl+S / Cmd+S)"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Save Version</span>
          <span className="sm:hidden">Save</span>
          <kbd className="hidden lg:inline-block text-[10px] opacity-80 font-mono px-1 py-0.2 rounded bg-black/20 text-brand-text">
            Ctrl+S
          </kbd>
        </button>
      </div>
    </header>
  );
};
