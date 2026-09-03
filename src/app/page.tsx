'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar, SnippetSummary } from '@/components/Sidebar';
import { EditorHeader } from '@/components/EditorHeader';
import { HistoryDrawer, VersionItem } from '@/components/HistoryDrawer';
import { SaveModal } from '@/components/SaveModal';
import { CodeCanvas, MonacoEditorInstance, MonacoDiffEditorInstance } from '@/components/CodeCanvas';
import { detectLanguageFromFilename } from '@/lib/languages';
import { calculateDiffStats, createUnifiedPatchText } from '@/lib/diff-utils';

export default function WorkspacePage() {
  const [snippets, setSnippets] = useState<SnippetSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active Snippet State
  const [title, setTitle] = useState('Untitled Snippet');
  const [filename, setFilename] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [lastSavedCode, setLastSavedCode] = useState('');
  const [versions, setVersions] = useState<VersionItem[]>([]);

  // Diff & Mode State
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isSideBySide, setIsSideBySide] = useState(true);

  // History comparison pair
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [versionA, setVersionA] = useState<VersionItem | null>(null);
  const [versionB, setVersionB] = useState<VersionItem | null>(null);

  // Copy feedback states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // Editor refs
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const diffEditorRef = useRef<MonacoDiffEditorInstance | null>(null);

  // 1. Load snippet detail
  const loadSnippet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}`);
      if (!res.ok) return;
      const s = await res.json();
      setActiveId(s.id);
      setTitle(s.title);
      setFilename(s.filename || '');
      setLanguage(s.language || 'typescript');
      setCode(s.currentCode);
      setLastSavedCode(s.currentCode);
      setVersions(s.versions || []);
      setVersionA(null);
      setVersionB(null);
      setIsDiffMode(false);
    } catch (err) {
      console.error('Failed to load snippet', err);
    }
  }, []);

  // 2. New snippet
  const handleNewSnippet = useCallback(async () => {
    const defaultSnippet = {
      title: 'New Snippet',
      filename: 'index.ts',
      language: 'typescript',
      currentCode: '// Start drafting or paste code here...\nfunction greeting(name: string): string {\n  return `Hello, ${name}!`;\n}\n',
    };

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultSnippet),
      });
      if (res.ok) {
        const created = await res.json();
        setSnippets((prev) => [created, ...prev]);
        loadSnippet(created.id);
      }
    } catch (err) {
      console.error('Failed to create snippet', err);
    }
  }, [loadSnippet]);

  // 3. Duplicate snippet
  const handleDuplicateSnippet = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const source = snippets.find((s) => s.id === id);
    if (!source) return;

    try {
      // fetch full details to get current code
      const detailRes = await fetch(`/api/snippets/${id}`);
      if (!detailRes.ok) return;
      const detail = await detailRes.json();

      const dupRes = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${detail.title} (Copy)`,
          filename: detail.filename,
          language: detail.language,
          currentCode: detail.currentCode,
        }),
      });

      if (dupRes.ok) {
        const duplicated = await dupRes.json();
        setSnippets((prev) => [duplicated, ...prev]);
        loadSnippet(duplicated.id);
      }
    } catch (err) {
      console.error('Failed to duplicate snippet', err);
    }
  }, [snippets, loadSnippet]);

  // 4. Fetch initial snippet list
  const fetchSnippets = useCallback(async () => {
    try {
      const res = await fetch('/api/snippets');
      if (!res.ok) return;
      const data = await res.json();
      setSnippets(data);
      if (data.length > 0) {
        loadSnippet(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch snippets', err);
    }
  }, [loadSnippet]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  // 5. Delete snippet
  const handleDeleteSnippet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = snippets.filter((s) => s.id !== id);
        setSnippets(updated);
        if (activeId === id) {
          if (updated.length > 0) {
            loadSnippet(updated[0].id);
          } else {
            setActiveId(null);
            setTitle('');
            setFilename('');
            setCode('');
            setLastSavedCode('');
            setVersions([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete snippet', err);
    }
  };

  // 6. Filename change auto-detects language
  const handleFilenameChange = (val: string) => {
    setFilename(val);
    const detected = detectLanguageFromFilename(val);
    setLanguage(detected);
  };

  // 7. Save version snapshot
  const handleSaveVersion = async (commitMsg: string) => {
    if (!activeId) return;

    try {
      const res = await fetch(`/api/snippets/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          filename,
          language,
          currentCode: code,
          createVersion: true,
          commitMsg,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLastSavedCode(code);
        setVersions(updated.versions || []);
        // update summary in sidebar
        setSnippets((prev) =>
          prev.map((s) => (s.id === activeId ? { ...s, title, filename, language, updatedAt: new Date().toISOString() } : s))
        );
      }
    } catch (err) {
      console.error('Failed to save version', err);
    }
  };

  // 8. Format document via Monaco Action
  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // 9. Diff navigation
  const handleNextDiffChunk = () => {
    if (diffEditorRef.current) {
      const nav = diffEditorRef.current.getDiffNavigator?.() || diffEditorRef.current;
      nav.next?.();
    }
  };

  const handlePrevDiffChunk = () => {
    if (diffEditorRef.current) {
      const nav = diffEditorRef.current.getDiffNavigator?.() || diffEditorRef.current;
      nav.previous?.();
    }
  };

  // 10. Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 11. Revert to a specific history version
  const handleRevertToVersion = (ver: VersionItem) => {
    if (confirm(`Revert workspace code to v${ver.versionNo}?`)) {
      setCode(ver.code);
      setIsDiffMode(false);
      setHistoryOpen(false);
    }
  };

  // 12. Diff sources calculation
  const originalDiffCode = useMemo(() => {
    if (versionA) return versionA.code;
    return lastSavedCode;
  }, [versionA, lastSavedCode]);

  const targetDiffCode = useMemo(() => {
    if (versionB) return versionB.code;
    return code;
  }, [versionB, code]);

  const diffStats = useMemo(() => {
    return calculateDiffStats(originalDiffCode, targetDiffCode);
  }, [originalDiffCode, targetDiffCode]);

  // 13. Copy diff patch
  const handleCopyDiff = () => {
    const patch = createUnifiedPatchText(filename || 'snippet', originalDiffCode, targetDiffCode);
    navigator.clipboard.writeText(patch);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const hasUnsavedChanges = code !== lastSavedCode;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-slate-100 antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        snippets={snippets}
        activeId={activeId}
        searchQuery={searchQuery}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSearchChange={setSearchQuery}
        onSelectSnippet={loadSnippet}
        onNewSnippet={handleNewSnippet}
        onDuplicateSnippet={handleDuplicateSnippet}
        onDeleteSnippet={handleDeleteSnippet}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {activeId ? (
          <>
            <EditorHeader
              title={title}
              filename={filename}
              language={language}
              isDiffMode={isDiffMode}
              isSideBySide={isSideBySide}
              diffStats={diffStats}
              hasUnsavedChanges={hasUnsavedChanges}
              copiedCode={copiedCode}
              copiedDiff={copiedDiff}
              onTitleChange={setTitle}
              onFilenameChange={handleFilenameChange}
              onLanguageChange={setLanguage}
              onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
              onToggleSideBySide={() => setIsSideBySide(!isSideBySide)}
              onOpenHistory={() => setHistoryOpen(true)}
              onSavePrompt={() => setSaveModalOpen(true)}
              onFormatDocument={handleFormatDocument}
              onCopyContent={handleCopyCode}
              onCopyDiff={handleCopyDiff}
              onNextDiffChunk={handleNextDiffChunk}
              onPrevDiffChunk={handlePrevDiffChunk}
            />

            <div className="flex-1 relative overflow-hidden">
              <CodeCanvas
                language={language}
                code={code}
                originalCode={originalDiffCode}
                isDiffMode={isDiffMode}
                isSideBySide={isSideBySide}
                onCodeChange={setCode}
                editorRef={editorRef}
                diffEditorRef={diffEditorRef}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <p className="text-sm font-medium mb-3">No active snippet selected</p>
            <button
              onClick={handleNewSnippet}
              className="px-4 py-2 rounded-lg bg-brand-primary text-slate-950 text-xs font-semibold shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
            >
              Create New Snippet
            </button>
          </div>
        )}
      </main>

      {/* History Revisions Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versions}
        selectedVersionA={versionA}
        selectedVersionB={versionB}
        onSelectVersionA={(v) => {
          setVersionA(versionA?.id === v.id ? null : v);
          setIsDiffMode(true);
        }}
        onSelectVersionB={(v) => {
          setVersionB(versionB?.id === v.id ? null : v);
          setIsDiffMode(true);
        }}
        onRevertToVersion={handleRevertToVersion}
      />

      {/* Save Version Modal */}
      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleSaveVersion}
        currentVersionNo={versions[0]?.versionNo ?? 0}
      />
    </div>
  );
}
