'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  PanelRight, 
  SlidersHorizontal, 
  FileCode, 
  FileText, 
  Folder, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { SnippetSummary, WorkspaceItem } from './Sidebar';
import { getShortcutLabel } from '@/lib/platform';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: SnippetSummary[];
  activeSnippetId?: string | null;
  workspaces: WorkspaceItem[];
  activeWorkspaceId?: string | null;
  onSelectSnippet: (id: string) => void;
}

type TimeGroup = 'Today' | 'Past week' | 'Past 30 days' | 'Older';

function getTimeGroup(isoString: string): TimeGroup {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays < 1 && date.getDate() === now.getDate()) {
    return 'Today';
  }
  if (diffDays <= 7) {
    return 'Past week';
  }
  if (diffDays <= 30) {
    return 'Past 30 days';
  }
  return 'Older';
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  snippets,
  activeSnippetId,
  workspaces,
  activeWorkspaceId,
  onSelectSnippet,
}) => {
  const [query, setQuery] = useState('');
  const [titleOnly, setTitleOnly] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showHighlightPane, setShowHighlightPane] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Available unique languages in current snippets
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    snippets.forEach((s) => {
      if (s.language) langs.add(s.language.toLowerCase());
    });
    return Array.from(langs).sort();
  }, [snippets]);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter snippets based on query, titleOnly, workspace, language
  const filteredSnippets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snippets.filter((s) => {
      // Workspace filter
      if (selectedWorkspaceId !== 'all') {
        if ((s.workspaceId || '') !== selectedWorkspaceId) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage !== 'all') {
        if (s.language.toLowerCase() !== selectedLanguage.toLowerCase()) {
          return false;
        }
      }

      // Query filter
      if (!q) return true;

      const titleMatch = (s.title || '').toLowerCase().includes(q) || 
                         (s.filename || '').toLowerCase().includes(q);
      if (titleOnly) {
        return titleMatch;
      }

      const codeMatch = ((s as any).currentCode || (s as any).code || '').toLowerCase().includes(q);
      return titleMatch || codeMatch;
    });
  }, [snippets, query, titleOnly, selectedWorkspaceId, selectedLanguage]);

  // Group filtered snippets by time
  const groupedSnippets = useMemo(() => {
    const groups: Record<TimeGroup, SnippetSummary[]> = {
      'Today': [],
      'Past week': [],
      'Past 30 days': [],
      'Older': [],
    };

    filteredSnippets.forEach((s) => {
      const group = getTimeGroup(s.updatedAt);
      groups[group].push(s);
    });

    const result: { group: TimeGroup; items: SnippetSummary[] }[] = [];
    const order: TimeGroup[] = ['Today', 'Past week', 'Past 30 days', 'Older'];
    order.forEach((g) => {
      if (groups[g].length > 0) {
        result.push({ group: g, items: groups[g] });
      }
    });

    return result;
  }, [filteredSnippets]);

  // Flattened items for keyboard indexing
  const flatItems = useMemo(() => {
    return groupedSnippets.flatMap((g) => g.items);
  }, [groupedSnippets]);

  // Ensure selectedIndex is within valid bounds
  useEffect(() => {
    if (flatItems.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= flatItems.length) {
      setSelectedIndex(flatItems.length - 1);
    }
  }, [flatItems.length, selectedIndex]);

  // Currently focused snippet for the highlight/preview pane
  const currentSnippet = flatItems[selectedIndex] || null;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
        return;
      }

      if (e.key === 'Enter') {
        if (currentSnippet) {
          e.preventDefault();
          onSelectSnippet(currentSnippet.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, currentSnippet, onSelectSnippet, onClose]);

  if (!isOpen) return null;

  // Find workspace name helper
  const getWorkspaceName = (wsId?: string | null) => {
    if (!wsId) return 'Personal';
    const ws = workspaces.find((w) => w.id === wsId);
    return ws ? ws.name : 'Personal';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 px-4 pb-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input & Controls */}
        <div className="px-4 py-3 border-b border-canvas-border flex items-center gap-3 bg-canvas-elevated shrink-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search or ask a question in documents..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1 pl-2 border-l border-canvas-border">
            {/* Toggle Highlight Pane */}
            <button
              type="button"
              onClick={() => setShowHighlightPane((prev) => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showHighlightPane 
                  ? 'text-brand-primary bg-canvas-surface' 
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-canvas-surface'
              }`}
              title={showHighlightPane ? 'Hide highlight pane' : 'Show highlight pane'}
            >
              <PanelRight className="w-4 h-4" />
            </button>

            {/* Toggle Filters */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showFilters 
                  ? 'text-brand-primary bg-canvas-surface' 
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-canvas-surface'
              }`}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notion Filter Chips Bar */}
        {showFilters && (
          <div className="px-4 py-2 border-b border-canvas-border bg-canvas-surface/40 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            {/* Title only pill */}
            <button
              type="button"
              onClick={() => setTitleOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                titleOnly
                  ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary'
                  : 'bg-canvas-surface border-canvas-border text-slate-600 dark:text-slate-300 hover:border-canvas-highlight'
              }`}
            >
              <span className="font-semibold text-[11px]">Aa</span>
              <span>Title only</span>
            </button>

            {/* Workspace Filter Dropdown */}
            {workspaces.length > 0 && (
              <div className="relative">
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="appearance-none bg-canvas-surface border border-canvas-border hover:border-canvas-highlight text-slate-700 dark:text-slate-300 rounded-full pl-3 pr-7 py-1 text-xs outline-none cursor-pointer"
                >
                  <option value="all">In All Workspaces</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      In {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            )}

            {/* Language Filter Dropdown */}
            {availableLanguages.length > 0 && (
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="appearance-none bg-canvas-surface border border-canvas-border hover:border-canvas-highlight text-slate-700 dark:text-slate-300 rounded-full pl-3 pr-7 py-1 text-xs outline-none cursor-pointer"
                >
                  <option value="all">Language: All</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      Language: {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* Main Content Area: Left Results List + Right Highlight Pane */}
        <div className="flex-1 flex overflow-hidden min-h-[300px]">
          {/* Left Results Column */}
          <div ref={listContainerRef} className="flex-1 overflow-y-auto p-2 space-y-4 min-w-0">
            {flatItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-600 dark:text-slate-400">No documents found</p>
                <p className="text-[11px]">Try adjusting your search terms or filter criteria.</p>
              </div>
            ) : (
              groupedSnippets.map(({ group, items }) => (
                <div key={group} className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((snippet) => {
                      const itemIndex = flatItems.findIndex((s) => s.id === snippet.id);
                      const isSelected = itemIndex === selectedIndex;
                      const isCurrentDoc = snippet.id === activeSnippetId;
                      const isMarkdown = snippet.language === 'markdown';

                      return (
                        <div
                          key={snippet.id}
                          onClick={() => {
                            onSelectSnippet(snippet.id);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-slate-200/70 dark:bg-canvas-surface text-slate-900 dark:text-white font-medium shadow-sm'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-canvas-surface/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isMarkdown ? (
                              <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                            ) : (
                              <FileCode className="w-4 h-4 text-brand-primary shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate text-xs">
                                <span className="truncate font-semibold">
                                  {snippet.title || 'Untitled Document'}
                                </span>
                                {snippet.filename && (
                                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                                    .{snippet.filename.split('.').pop()}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                <span>{getWorkspaceName(snippet.workspaceId)}</span>
                                <span className="mx-1.5">·</span>
                                <span className="font-mono text-[10px]">{snippet.language}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-500 shrink-0">
                            {formatRelativeTime(snippet.updatedAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Highlight / Live Preview Pane */}
          {showHighlightPane && (
            <div className="w-72 sm:w-80 md:w-96 border-l border-canvas-border bg-canvas-surface/30 p-4 flex flex-col justify-between overflow-hidden shrink-0">
              {currentSnippet ? (
                <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
                  <div className="flex items-start justify-between gap-2 border-b border-canvas-border pb-3 shrink-0">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                        <Folder className="w-3 h-3 text-brand-primary" />
                        <span>{getWorkspaceName(currentSnippet.workspaceId)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {currentSnippet.title || 'Untitled Document'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-canvas-surface border border-canvas-border font-mono uppercase text-brand-primary">
                          {currentSnippet.language}
                        </span>
                        <span>Updated {formatRelativeTime(currentSnippet.updatedAt)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSnippet(currentSnippet.id);
                        onClose();
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-canvas-surface transition-colors shrink-0"
                      title="Open document"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Code/Content Preview Box */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Preview
                    </div>
                    <div className="flex-1 overflow-y-auto rounded-lg bg-white dark:bg-canvas-default border border-slate-200 dark:border-canvas-border p-3 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
                      {((currentSnippet as any).currentCode || (currentSnippet as any).code || '').trim() ? (
                        <pre className="whitespace-pre-wrap break-all">
                          {((currentSnippet as any).currentCode || (currentSnippet as any).code || '')
                            .split('\n')
                            .slice(0, 30)
                            .join('\n')}
                        </pre>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          Empty document buffer.
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectSnippet(currentSnippet.id);
                      onClose();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-brand-primary text-brand-text text-xs font-semibold hover:brightness-110 active:scale-95 transition-all text-center shrink-0"
                  >
                    Open Document (↵)
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
                  Select a document to preview
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-canvas-surface/70 border-t border-canvas-border flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] font-mono mr-1">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] font-mono mr-1">↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] font-mono mr-1">↵</kbd>
              Open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] font-mono mr-1">Esc</kbd>
              Close
            </span>
          </div>

          <div className="text-[10px] font-mono">
            {flatItems.length} {flatItems.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>
    </div>
  );
};
