'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Palette, 
  History, 
  Save, 
  Plus, 
  Split, 
  Copy, 
  FileDiff, 
  Sparkles, 
  Eye, 
  Check, 
  X,
  ChevronRight,
  Columns,
  Moon,
  Sun
} from 'lucide-react';
import { ALL_THEMES, EditorThemeOption } from '@/lib/themes';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  currentTheme: string;
  isDiffMode: boolean;
  isMarkdown: boolean;
  markdownViewMode?: 'edit' | 'split' | 'preview';
  onClose: () => void;
  onNewSnippet: () => void;
  onSavePrompt: () => void;
  onOpenHistory: () => void;
  onToggleDiffMode: () => void;
  onToggleSideBySide: () => void;
  onFormatDocument: () => void;
  onCopyContent: () => void;
  onCopyDiff: () => void;
  onSetMarkdownViewMode?: (mode: 'edit' | 'split' | 'preview') => void;
  onSelectTheme: (themeId: string) => void;
  onPreviewTheme: (themeId: string) => void;
}

type PaletteMode = 'commands' | 'theme-picker';

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  currentTheme,
  isDiffMode,
  isMarkdown,
  markdownViewMode,
  onClose,
  onNewSnippet,
  onSavePrompt,
  onOpenHistory,
  onToggleDiffMode,
  onToggleSideBySide,
  onFormatDocument,
  onCopyContent,
  onCopyDiff,
  onSetMarkdownViewMode,
  onSelectTheme,
  onPreviewTheme,
}) => {
  const [mode, setMode] = useState<PaletteMode>('commands');
  const [query, setQuery] = useState('');
  const [themeTypeFilter, setThemeTypeFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const initialThemeRef = useRef(currentTheme);
  const currentThemeRef = useRef(currentTheme);
  currentThemeRef.current = currentTheme;
  const prevOpenRef = useRef(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleOpenThemePicker = React.useCallback(() => {
    initialThemeRef.current = currentThemeRef.current;
    setMode('theme-picker');
    setQuery('');
    setThemeTypeFilter('all');
    const activeIdx = ALL_THEMES.findIndex((t) => t.id === currentThemeRef.current);
    setSelectedIndex(activeIdx >= 0 ? activeIdx : 0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  // Available commands list
  const commands: CommandItem[] = React.useMemo(() => {
    const list: CommandItem[] = [
      {
        id: 'theme:select',
        title: 'Preferences: Color Theme...',
        category: 'Preferences',
        icon: <Palette className="w-4 h-4 text-brand-primary" />,
        action: handleOpenThemePicker,
        keywords: 'color theme scheme skin dark light dracula github monokai',
      },
      {
        id: 'history:open',
        title: 'View: Open Revision History',
        category: 'View',
        icon: <History className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onOpenHistory();
        },
        keywords: 'revisions history versions rollback diff timeline',
      },
      {
        id: 'snippet:save',
        title: 'File: Save Version Snapshot',
        category: 'File',
        shortcut: 'Ctrl+S',
        icon: <Save className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          onSavePrompt();
        },
        keywords: 'save snapshot commit version',
      },
      {
        id: 'snippet:new',
        title: 'File: New Blank Snippet',
        category: 'File',
        icon: <Plus className="w-4 h-4 text-teal-400" />,
        action: () => {
          onClose();
          onNewSnippet();
        },
        keywords: 'new file snippet create blank empty buffer',
      },
      {
        id: 'diff:toggle',
        title: isDiffMode ? 'View: Exit Diff (Return to Editor)' : 'View: Inspect Diff with Saved Version',
        category: 'View',
        icon: <Split className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onClose();
          onToggleDiffMode();
        },
        keywords: 'diff compare inspect changes code editor',
      },
    ];

    if (isDiffMode) {
      list.push(
        {
          id: 'diff:toggle-split',
          title: 'View: Toggle Side-by-Side / Inline Diff',
          category: 'View',
          icon: <Columns className="w-4 h-4 text-purple-400" />,
          action: () => {
            onClose();
            onToggleSideBySide();
          },
          keywords: 'split side by side inline diff view',
        },
        {
          id: 'diff:copy',
          title: 'Edit: Copy Unified Diff Patch',
          category: 'Edit',
          icon: <FileDiff className="w-4 h-4 text-rose-400" />,
          action: () => {
            onClose();
            onCopyDiff();
          },
          keywords: 'copy patch diff git',
        }
      );
    }

    if (!isDiffMode) {
      list.push(
        {
          id: 'editor:format',
          title: 'Format: Format Document',
          category: 'Edit',
          shortcut: 'Shift+Alt+F',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          action: () => {
            onClose();
            onFormatDocument();
          },
          keywords: 'format document beautify prettier indent code',
        },
        {
          id: 'editor:copy',
          title: 'Edit: Copy Full Code',
          category: 'Edit',
          icon: <Copy className="w-4 h-4 text-slate-300" />,
          action: () => {
            onClose();
            onCopyContent();
          },
          keywords: 'copy code clipboard buffer',
        }
      );
    }

    if (isMarkdown && onSetMarkdownViewMode) {
      list.push(
        {
          id: 'markdown:edit',
          title: `Markdown: Source Code View ${markdownViewMode === 'edit' ? '(Current)' : ''}`,
          category: 'Markdown',
          icon: <Eye className="w-4 h-4 text-sky-400" />,
          action: () => {
            onClose();
            onSetMarkdownViewMode('edit');
          },
          keywords: 'markdown edit source code editor',
        },
        {
          id: 'markdown:split',
          title: `Markdown: Side-by-Side Split View ${markdownViewMode === 'split' ? '(Current)' : ''}`,
          category: 'Markdown',
          icon: <Columns className="w-4 h-4 text-sky-400" />,
          action: () => {
            onClose();
            onSetMarkdownViewMode('split');
          },
          keywords: 'markdown split preview side by side live',
        },
        {
          id: 'markdown:preview',
          title: `Markdown: Full Rendered Preview Only ${markdownViewMode === 'preview' ? '(Current)' : ''}`,
          category: 'Markdown',
          icon: <Eye className="w-4 h-4 text-emerald-400" />,
          action: () => {
            onClose();
            onSetMarkdownViewMode('preview');
          },
          keywords: 'markdown preview render view only html',
        }
      );
    }

    return list;
  }, [
    isDiffMode, 
    isMarkdown, 
    onClose, 
    onOpenHistory, 
    onSavePrompt, 
    onNewSnippet, 
    onToggleDiffMode, 
    onToggleSideBySide, 
    onCopyDiff, 
    onFormatDocument, 
    onCopyContent, 
    onSetMarkdownViewMode,
    markdownViewMode,
    handleOpenThemePicker
  ]);

  // Filter themes if in theme-picker mode
  const filteredThemes: EditorThemeOption[] = React.useMemo(() => {
    if (mode !== 'theme-picker') return [];
    const q = query.trim().toLowerCase();
    return ALL_THEMES.filter((t) => {
      const matchesType = themeTypeFilter === 'all' || t.type === themeTypeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    });
  }, [mode, query, themeTypeFilter]);

  // Filter commands if in commands mode
  const filteredCommands: CommandItem[] = React.useMemo(() => {
    if (mode !== 'commands') return [];
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.keywords && c.keywords.toLowerCase().includes(q))
    );
  }, [mode, query, commands]);

  const activeCount = mode === 'commands' ? filteredCommands.length : filteredThemes.length;

  // On open or reset
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setMode('commands');
      setQuery('');
      setThemeTypeFilter('all');
      setSelectedIndex(0);
      initialThemeRef.current = currentThemeRef.current;
      setTimeout(() => inputRef.current?.focus(), 40);
    } else if (!isOpen && prevOpenRef.current) {
      // Revert theme preview if closed unconfirmed
      if (mode === 'theme-picker') {
        onPreviewTheme(initialThemeRef.current);
      }
      setQuery('');
      setThemeTypeFilter('all');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, mode, onPreviewTheme]);

  // Index clamp
  useEffect(() => {
    if (selectedIndex >= activeCount) {
      setSelectedIndex(Math.max(0, activeCount - 1));
    }
  }, [selectedIndex, activeCount]);

  // Live theme preview while navigating theme-picker mode
  useEffect(() => {
    if (!isOpen || mode !== 'theme-picker') return;
    const themeItem = filteredThemes[selectedIndex];
    if (themeItem) {
      onPreviewTheme(themeItem.id);
    }
  }, [selectedIndex, filteredThemes, isOpen, mode, onPreviewTheme]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen) return;
    const container = listRef.current;
    if (container) {
      const el = container.children[selectedIndex] as HTMLElement;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleSelectTheme = React.useCallback((themeId: string) => {
    initialThemeRef.current = themeId;
    onSelectTheme(themeId);
    onClose();
  }, [onSelectTheme, onClose]);

  const handleExitThemePicker = React.useCallback(() => {
    onPreviewTheme(initialThemeRef.current);
    setMode('commands');
    setQuery('');
    setThemeTypeFilter('all');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [onPreviewTheme]);

  const handleCancel = React.useCallback(() => {
    if (mode === 'theme-picker') {
      onPreviewTheme(initialThemeRef.current);
    }
    onClose();
  }, [mode, onPreviewTheme, onClose]);

  // Global capture-phase keydown listener when palette is open
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'theme-picker') {
          handleExitThemePicker();
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % (activeCount || 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + activeCount) % (activeCount || 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'commands') {
          const cmd = filteredCommands[selectedIndex];
          if (cmd) cmd.action();
        } else {
          const th = filteredThemes[selectedIndex];
          if (th) {
            handleSelectTheme(th.id);
          }
        }
        return;
      }

      if (e.key === 'Backspace' && query === '' && mode === 'theme-picker') {
        e.preventDefault();
        handleExitThemePicker();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [
    isOpen,
    mode,
    query,
    activeCount,
    selectedIndex,
    filteredCommands,
    filteredThemes,
    handleExitThemePicker,
    handleSelectTheme,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-xl bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-canvas-border bg-canvas-surface/70">
          {mode === 'theme-picker' ? (
            <button
              onClick={handleExitThemePicker}
              className="flex items-center gap-1 text-xs text-brand-primary hover:underline shrink-0"
              title="Return to Command List"
            >
              <span>‹ Commands</span>
            </button>
          ) : (
            <Terminal className="w-4 h-4 text-brand-primary shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              mode === 'commands'
                ? "Type a command or search (e.g. 'theme', 'revisions', 'save')..."
                : "Select Color Theme (Up/Down to live preview, Enter to select)..."
            }
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />

          <button
            onClick={handleCancel}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Filter Bar (Theme Picker Mode only) */}
        {mode === 'theme-picker' && (
          <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-canvas-border bg-canvas-surface/40 text-xs">
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter theme by type">
              <button
                type="button"
                onClick={() => {
                  setThemeTypeFilter('all');
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  themeTypeFilter === 'all'
                    ? 'theme-filter-btn theme-filter-btn-all active ring-1 ring-brand-primary/30'
                    : 'theme-filter-btn theme-filter-btn-all border-transparent text-slate-400 hover:text-slate-200 hover:bg-canvas-surface'
                }`}
                title="Show all themes"
              >
                <Palette className="w-3 h-3" />
                <span>All ({ALL_THEMES.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeTypeFilter('dark');
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  themeTypeFilter === 'dark'
                    ? 'theme-filter-btn theme-filter-btn-dark active ring-1 ring-slate-500/30'
                    : 'theme-filter-btn theme-filter-btn-dark border-transparent text-slate-400 hover:text-slate-200 hover:bg-canvas-surface'
                }`}
                title="Filter to dark themes only"
              >
                <Moon className="w-3 h-3" />
                <span>Dark ({ALL_THEMES.filter((t) => t.type === 'dark').length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeTypeFilter('light');
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  themeTypeFilter === 'light'
                    ? 'theme-filter-btn theme-filter-btn-light active ring-1 ring-amber-500/30'
                    : 'theme-filter-btn theme-filter-btn-light border-transparent text-slate-400 hover:text-slate-200 hover:bg-canvas-surface'
                }`}
                title="Filter to light themes only"
              >
                <Sun className="w-3 h-3" />
                <span>Light ({ALL_THEMES.filter((t) => t.type === 'light').length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              {filteredThemes.length} {filteredThemes.length === 1 ? 'theme' : 'themes'}
            </span>
          </div>
        )}

        {/* List items */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5 select-none">
          {mode === 'commands' ? (
            filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No commands matching &quot;{query}&quot;
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isHighlighted
                        ? 'theme-item-highlight bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/40 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-canvas-surface/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{cmd.icon}</div>
                      <span className={`theme-item-title font-medium text-sm truncate ${
                        isHighlighted
                          ? 'text-slate-950 dark:text-white font-semibold'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {cmd.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredThemes.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No themes matching &quot;{query}&quot;
              </div>
            ) : (
              filteredThemes.map((t, idx) => {
                const isHighlighted = idx === selectedIndex;
                const isCurrent = t.id === currentTheme;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isHighlighted
                        ? 'theme-item-highlight bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/40 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-canvas-surface/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`theme-item-title font-medium text-sm truncate ${
                        isHighlighted
                          ? 'text-slate-950 dark:text-white font-semibold'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {t.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThemeTypeFilter(t.type);
                          setSelectedIndex(0);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                          t.type === 'dark'
                            ? 'theme-badge-dark'
                            : 'theme-badge-light'
                        }`}
                        title={`Filter by ${t.type} themes`}
                      >
                        {t.type}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-canvas/60 border-t border-canvas-border flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">Enter</kbd>
              Execute
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">Esc</kbd>
              {mode === 'theme-picker' ? 'Back' : 'Close'}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            {mode === 'commands' ? `${filteredCommands.length} commands` : `${filteredThemes.length} themes`}
          </div>
        </div>
      </div>
    </div>
  );
};
