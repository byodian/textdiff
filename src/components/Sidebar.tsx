'use client';

import React from 'react';
import { 
  FileCode2, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  FolderGit2 
} from 'lucide-react';

export interface SnippetSummary {
  id: string;
  title: string;
  filename: string | null;
  language: string;
  updatedAt: string;
  versions?: { versionNo: number }[];
}

interface SidebarProps {
  snippets: SnippetSummary[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSnippet: (id: string) => void;
  onNewSnippet: () => void;
  onDeleteSnippet: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  snippets,
  activeId,
  searchQuery,
  onSearchChange,
  onSelectSnippet,
  onNewSnippet,
  onDeleteSnippet,
}) => {
  const filtered = snippets.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.filename && s.filename.toLowerCase().includes(q)) ||
      s.language.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="w-72 bg-canvas-elevated border-r border-canvas-border flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-canvas-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-brand-primary">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
              CodeDiff
              <span className="text-[10px] font-mono font-normal uppercase px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                PRO
              </span>
            </h1>
          </div>
        </div>
        <button
          onClick={onNewSnippet}
          className="p-1.5 rounded-md hover:bg-canvas-surface text-slate-400 hover:text-slate-100 transition-colors border border-transparent hover:border-canvas-border"
          title="New Snippet"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-canvas-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search snippets, files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-canvas-surface border border-canvas-border rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {searchQuery ? 'No snippets match your search' : 'No snippets yet. Create one!'}
          </div>
        ) : (
          filtered.map((s) => {
            const isActive = s.id === activeId;
            const latestVer = s.versions?.[0]?.versionNo ?? 1;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSnippet(s.id)}
                className={`group relative flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer transition-all ${
                  isActive
                    ? 'bg-canvas-surface border border-canvas-highlight text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:bg-canvas-surface/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileCode2 className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-brand-primary' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-xs truncate">
                      {s.title || 'Untitled Snippet'}
                    </span>
                    <span className="text-[10px] font-mono px-1 rounded bg-canvas-highlight/50 text-slate-400">
                      v{latestVer}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="truncate font-mono text-[10px]">
                      {s.filename || s.language}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => onDeleteSnippet(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-diff-removed transition-opacity rounded"
                  title="Delete snippet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
