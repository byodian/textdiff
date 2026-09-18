'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  PanelLeftClose, 
  PanelLeft, 
  Copy,
  FolderGit2,
  ChevronDown,
  FolderPlus,
  Folder,
  Check
} from 'lucide-react';
import { splitTitleAndExtension, formatTitleWithExtension } from '@/lib/languages';

export interface SnippetSummary {
  id: string;
  title: string;
  filename?: string | null;
  language: string;
  updatedAt: string;
  workspaceId?: string | null;
  versions?: { versionNo: number }[];
}

export interface WorkspaceItem {
  id: string;
  name: string;
  _count?: { snippets: number };
}

interface SidebarProps {
  snippets: SnippetSummary[];
  activeId: string | null;
  searchQuery: string;
  isCollapsed: boolean;
  workspaces?: WorkspaceItem[];
  activeWorkspaceId?: string | null;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  onToggleCollapse: () => void;
  onSearchChange: (q: string) => void;
  activeHasUnsavedChanges?: boolean;
  onSelectSnippet: (id: string) => void;
  onNewSnippet: () => void;
  onDuplicateSnippet: (id: string, e: React.MouseEvent) => void;
  onDeleteSnippet: (id: string, e: React.MouseEvent) => void;
}

function formatExactDateTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `Today ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }

  if (d.getFullYear() === now.getFullYear()) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${timeStr}`;
  }

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  snippets,
  activeId,
  searchQuery,
  isCollapsed,
  workspaces,
  activeWorkspaceId,
  activeHasUnsavedChanges,
  onSelectWorkspace,
  onCreateWorkspace,
  onToggleCollapse,
  onSearchChange,
  onSelectSnippet,
  onNewSnippet,
  onDuplicateSnippet,
  onDeleteSnippet,
}) => {
  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [isAddingWs, setIsAddingWs] = useState(false);
  const wsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isWsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) {
        setIsWsMenuOpen(false);
        setIsAddingWs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWsMenuOpen]);

  const wsList = Array.isArray(workspaces) ? workspaces : [];
  const activeWs = wsList.find((w) => w.id === activeWorkspaceId) || wsList[0];
  const activeWsName = activeWs?.name || 'Default Workspace';

  const handleCreateWsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim() && onCreateWorkspace) {
      onCreateWorkspace(newWsName.trim());
      setNewWsName('');
      setIsAddingWs(false);
      setIsWsMenuOpen(false);
    }
  };

  const filtered = snippets.filter((s) => {
    const q = searchQuery.toLowerCase();
    const fullTitle = formatTitleWithExtension(s.title, s.language, s.filename).toLowerCase();
    return (
      fullTitle.includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q)
    );
  });

  return (
    <aside 
      className={`relative flex flex-col h-full bg-canvas-elevated border-r border-canvas-border select-none shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        isCollapsed ? 'w-14' : 'w-72'
      }`}
    >
      {/* Collapsed Rail (w-14) */}
      <div 
        className={`w-14 absolute inset-y-0 left-0 flex flex-col items-center py-3 z-10 transition-all duration-200 ${
          isCollapsed 
            ? 'opacity-100 pointer-events-auto delay-100 scale-100' 
            : 'opacity-0 pointer-events-none scale-95'
        }`}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-canvas-surface transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNewSnippet}
          className="mt-3 p-2 rounded-lg bg-sky-500/10 text-brand-primary hover:bg-sky-500/20 transition-colors"
          title="New Document"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Content Panel (w-72) */}
      <div 
        className={`w-72 min-w-[18rem] flex flex-col h-full transition-all duration-200 ${
          isCollapsed 
            ? 'opacity-0 pointer-events-none -translate-x-4' 
            : 'opacity-100 pointer-events-auto translate-x-0 delay-75'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-canvas-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-brand-primary">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <h1 className="font-semibold text-sm tracking-wide text-slate-100">
              TextDiff
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewSnippet}
              className="p-1.5 rounded-md hover:bg-canvas-surface text-slate-400 hover:text-slate-100 transition-colors"
              title="New Document"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md hover:bg-canvas-surface text-slate-400 hover:text-slate-100 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Selector Dropdown (When workspaces are available) */}
        {wsList.length > 0 && (
          <div className="px-3 pt-2 pb-1 shrink-0 relative z-30" ref={wsMenuRef}>
            <button
              type="button"
              onClick={() => setIsWsMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-canvas-surface/80 text-xs text-slate-200 transition-colors group"
              title="Switch Workspace"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span className="truncate font-semibold tracking-tight text-slate-200 group-hover:text-white">
                  {activeWsName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-canvas-surface/80 px-1 py-0.2 rounded shrink-0">
                  {snippets.length}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
            </button>

            {isWsMenuOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-canvas-surface border border-canvas-border rounded-lg shadow-2xl py-1 z-40 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {wsList.map((ws) => {
                    const isSelected = ws.id === (activeWorkspaceId || activeWs?.id);
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          onSelectWorkspace?.(ws.id);
                          setIsWsMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-canvas-elevated text-left transition-colors ${
                          isSelected ? 'text-brand-primary font-medium' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-canvas-border my-1" />

                {isAddingWs ? (
                  <form onSubmit={handleCreateWsSubmit} className="p-2 space-y-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Workspace name..."
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      className="w-full bg-canvas-elevated border border-canvas-border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-primary"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingWs(false)}
                        className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newWsName.trim()}
                        className="px-2.5 py-0.5 text-[11px] font-medium bg-brand-primary text-brand-text rounded hover:brightness-110 disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingWs(true)}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-canvas-elevated text-left text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Workspace</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="px-3 py-1.5 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-canvas-surface hover:bg-canvas-surface focus:bg-canvas-surface border border-transparent hover:border-canvas-border focus:border-brand-primary rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5 rounded text-xs font-bold leading-none"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Snippets List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 min-h-0">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {searchQuery ? 'No documents match your search' : 'No documents yet. Create one!'}
            </div>
          ) : (
            filtered.map((s) => {
              const isActive = s.id === activeId;
              const { baseTitle, extension } = splitTitleAndExtension(
                s.title,
                s.language,
                s.filename
              );
              const fullTitle = `${baseTitle}${extension}`;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSnippet(s.id)}
                  className={`group relative flex items-start justify-between gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all ${
                    isActive
                      ? 'bg-canvas-surface text-slate-100 shadow-sm border-l-2 border-l-brand-primary'
                      : 'text-slate-400 hover:bg-canvas-surface/50 hover:text-slate-200 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0" title={fullTitle}>
                      <span className="font-medium text-xs truncate text-slate-200 group-hover:text-white">
                        {baseTitle}
                      </span>
                      {extension && (
                        <span className="shrink-0 text-[10px] font-mono px-1 py-0.2 rounded bg-canvas-surface/70 text-slate-400">
                          {extension}
                        </span>
                      )}
                      {isActive && activeHasUnsavedChanges && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0 ml-0.5" 
                          title="Unsaved modifications in draft"
                        />
                      )}
                    </div>
                    <div 
                      className="text-[10px] font-mono text-slate-500 mt-1 truncate"
                      title={`Last modified: ${formatExactDateTime(s.updatedAt)}`}
                    >
                      {formatRelativeTime(s.updatedAt)}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                    <button
                      onClick={(e) => onDuplicateSnippet(s.id, e)}
                      className="p-1 hover:text-brand-primary transition-colors rounded hover:bg-canvas-elevated"
                      title="Duplicate document"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => onDeleteSnippet(s.id, e)}
                      className="p-1 hover:text-diff-removed transition-colors rounded hover:bg-canvas-elevated"
                      title="Delete document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
