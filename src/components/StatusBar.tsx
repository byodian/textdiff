'use client';

import React from 'react';
import { Sparkles, ChevronUp, ChevronDown, Check, FileText } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { getShortcutLabel } from '@/lib/platform';

interface StatusBarProps {
  language: string;
  code: string;
  isDiffMode: boolean;
  diffStats?: { added: number; removed: number; hasChanges: boolean };
  onFormatDocument?: () => void;
  onNextDiffChunk?: () => void;
  onPrevDiffChunk?: () => void;
  onOpenLanguagePicker?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  language,
  code,
  isDiffMode,
  diffStats,
  onFormatDocument,
  onNextDiffChunk,
  onPrevDiffChunk,
  onOpenLanguagePicker,
}) => {
  const currentLangName = React.useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.id === language)?.name || language.toUpperCase();
  }, [language]);

  const lineCount = React.useMemo(() => {
    return code ? code.split('\n').length : 0;
  }, [code]);

  const charCount = React.useMemo(() => {
    return code ? code.length : 0;
  }, [code]);

  return (
    <footer className="h-7 bg-canvas-elevated/90 border-t border-canvas-border px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 z-20">
      {/* Left items: Language Mode Selector, Encoding, Spacing */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenLanguagePicker}
          className="flex items-center gap-1 font-sans font-medium text-slate-300 hover:text-brand-primary hover:bg-canvas-surface px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Select Language Mode"
        >
          <FileText className="w-3 h-3 text-brand-primary" />
          <span className="text-[11px]">{currentLangName}</span>
        </button>
        <span className="text-slate-600">|</span>
        <span>UTF-8</span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">Spaces: 2</span>
      </div>

      {/* Center item: Diff chunks or stats */}
      {isDiffMode && diffStats && (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-600 dark:text-slate-400">Changes:</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+{diffStats.added}</span>
          <span className="text-rose-700 dark:text-rose-400 font-semibold">-{diffStats.removed}</span>
          {onPrevDiffChunk && onNextDiffChunk && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                type="button"
                onClick={onPrevDiffChunk}
                className="p-0.5 rounded hover:bg-canvas-surface text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                title="Previous Change"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onNextDiffChunk}
                className="p-0.5 rounded hover:bg-canvas-surface text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                title="Next Change"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right items: Format Document, Line/Char count */}
      <div className="flex items-center gap-3">
        {onFormatDocument && !isDiffMode && (
          <button
            type="button"
            onClick={onFormatDocument}
            className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-brand-primary px-1.5 py-0.5 rounded hover:bg-canvas-surface transition-colors"
            title={`Format Document (${getShortcutLabel('format')})`}
          >
            <Sparkles className="w-3 h-3 text-brand-primary" />
            <span>Format</span>
            <kbd className="hidden md:inline text-[9px] text-slate-500 font-mono">{getShortcutLabel('format')}</kbd>
          </button>
        )}
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}, {charCount} chars
        </span>
      </div>
    </footer>
  );
};
