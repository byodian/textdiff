'use client';

import React from 'react';
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
  Palette
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

interface EditorHeaderProps {
  title: string;
  filename: string;
  language: string;
  theme: string;
  onThemeChange: (theme: string) => void;
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
  return (
    <header className="h-14 border-b border-canvas-border bg-canvas-elevated/70 backdrop-blur-md px-4 flex items-center justify-between gap-4 select-none">
      {/* Title and Filename inputs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
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
          className="bg-transparent border-b border-transparent hover:border-canvas-border focus:border-brand-primary text-sm font-medium text-slate-100 px-1 py-0.5 outline-none transition-colors max-w-xs truncate"
          title="Click to edit title (auto-saves on blur)"
        />

        <span className="text-slate-600">/</span>

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
          placeholder="e.g. index.ts, app.py"
          className="bg-canvas-surface border border-canvas-border rounded px-2 py-1 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-primary w-36 transition-colors"
          title="Click to edit filename (auto-saves on blur)"
        />

        {/* Language select */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-canvas-surface border border-canvas-border text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-primary cursor-pointer hover:border-canvas-highlight transition-colors"
          title="Select Language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id} className="bg-canvas-surface text-slate-200">
              {lang.name}
            </option>
          ))}
        </select>

        {/* Theme select */}
        <div className="flex items-center gap-1.5 bg-canvas-surface border border-canvas-border rounded px-2 py-1 hover:border-canvas-highlight transition-colors">
          <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1"
            title="Editor Color Theme"
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

        {hasUnsavedChanges && (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 animate-pulse">
            ● Unsaved edits
          </span>
        )}

        {/* Custom Version Diff banner if active */}
        {customDiffLabel && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/70 border border-sky-600/50 text-xs text-sky-300 font-mono">
            <span>Diff: {customDiffLabel}</span>
            {onExitCustomDiff && (
              <button
                onClick={onExitCustomDiff}
                className="hover:text-white p-0.5 rounded"
                title="Exit version comparison and return to editor"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action toolbars */}
      <div className="flex items-center gap-2">

        {/* Diff Navigation controls (Diff mode only) */}
        {isDiffMode && (
          <div className="flex items-center gap-0.5 bg-canvas-surface border border-canvas-border rounded p-0.5">
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

        {/* Diff Toggle Button with Live Status */}
        <button
          onClick={onToggleDiffMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
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
          <span>{isDiffMode ? 'Editor' : 'Inspect Diff'}</span>

          {!isDiffMode && (
            diffStats.hasChanges ? (
              <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                +{diffStats.added}/-{diffStats.removed}
              </span>
            ) : (
              <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-canvas-elevated text-slate-500 border border-canvas-border">
                No diff
              </span>
            )
          )}
        </button>

        {/* Side-by-side vs Inline toggle (Diff mode only) */}
        {isDiffMode && (
          <button
            onClick={onToggleSideBySide}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-canvas-surface border border-canvas-border text-xs text-slate-300 hover:border-canvas-highlight hover:text-white transition-colors"
            title={isSideBySide ? 'Switch to Unified Inline View' : 'Switch to Split Side-by-Side View'}
          >
            {isSideBySide ? (
              <>
                <Columns className="w-3.5 h-3.5 text-brand-primary" />
                <span>Side-by-Side</span>
              </>
            ) : (
              <>
                <Rows className="w-3.5 h-3.5 text-brand-primary" />
                <span>Inline</span>
              </>
            )}
          </button>
        )}

        {/* Markdown View Mode selector (When language === 'markdown' and not diff mode) */}
        {!isDiffMode && language === 'markdown' && onMarkdownViewModeChange && (
          <div className="flex items-center bg-canvas-surface border border-canvas-border rounded p-0.5 text-xs">
            <button
              onClick={() => onMarkdownViewModeChange('edit')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'edit'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Edit markdown source only"
            >
              <Code className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onMarkdownViewModeChange('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'split'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-side edit and rendered preview"
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => onMarkdownViewModeChange('preview')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                markdownViewMode === 'preview'
                  ? 'bg-canvas-elevated text-brand-primary font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rendered preview only"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Format Document Button */}
        {!isDiffMode && (
          <button
            onClick={onFormatDocument}
            className="p-1.5 rounded bg-canvas-surface border border-canvas-border text-slate-400 hover:text-brand-primary hover:border-canvas-highlight transition-colors"
            title="Format Document (Shift+Alt+F)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Copy Patch/Diff button */}
        {isDiffMode && (
          <button
            onClick={onCopyDiff}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-canvas-surface border border-canvas-border text-xs text-slate-300 hover:border-canvas-highlight hover:text-white transition-colors"
            title="Copy Diff Output (Unified Patch)"
          >
            {copiedDiff ? <Check className="w-3.5 h-3.5 text-diff-added" /> : <FileDiff className="w-3.5 h-3.5" />}
            <span>Copy Diff</span>
          </button>
        )}

        {/* Copy code button */}
        <button
          onClick={onCopyContent}
          className="p-1.5 rounded bg-canvas-surface border border-canvas-border text-slate-400 hover:text-slate-100 hover:border-canvas-highlight transition-colors"
          title="Copy Code"
        >
          {copiedCode ? <Check className="w-4 h-4 text-diff-added" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* History timeline toggle */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-canvas-surface border border-canvas-border text-xs text-slate-300 hover:border-canvas-highlight hover:text-white transition-colors"
          title="View Revisions & History"
        >
          <History className="w-3.5 h-3.5" />
          <span>Revisions</span>
        </button>

        {/* Save Version Snapshot */}
        <button
          onClick={onSavePrompt}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-brand-primary hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-95"
          title="Save Version (Ctrl+S / Cmd+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Version</span>
          <kbd className="hidden sm:inline-block text-[10px] opacity-75 font-mono px-1 py-0.2 rounded bg-black/20">
            Ctrl+S
          </kbd>
        </button>
      </div>
    </header>
  );
};
