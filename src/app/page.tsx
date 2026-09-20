'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar, SnippetSummary, WorkspaceItem } from '@/components/Sidebar';
import { EditorHeader } from '@/components/EditorHeader';
import { HistoryDrawer, VersionItem } from '@/components/HistoryDrawer';
import { PostSaveToast } from '@/components/PostSaveToast';
import { CommandPalette, PaletteMode } from '@/components/CommandPalette';
import { CodeCanvas, MonacoEditorInstance, MonacoDiffEditorInstance } from '@/components/CodeCanvas';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { UndoToast } from '@/components/UndoToast';
import { DeleteDocumentModal } from '@/components/DeleteDocumentModal';
import { DeleteWorkspaceModal } from '@/components/DeleteWorkspaceModal';
import { MoveDocumentModal } from '@/components/MoveDocumentModal';
import { DiffInspectorBar } from '@/components/DiffInspectorBar';
import { WorkspaceEmptyState } from '@/components/WorkspaceEmptyState';
import { StatusBar } from '@/components/StatusBar';
import { SearchModal } from '@/components/SearchModal';
import { 
  detectLanguageFromFilename, 
  detectLanguageFromTitle, 
  detectLanguageFromContent,
  formatTitleWithExtension 
} from '@/lib/languages';
import { SyntaxDiagnostic } from '@/lib/syntax-validator';
import { calculateDiffStats, createUnifiedPatchText } from '@/lib/diff-utils';
import { ALL_THEMES } from '@/lib/themes';
import { applyGlobalThemeColors } from '@/lib/theme-colors';
import { saveDraft, loadDraft, clearDraft } from '@/lib/draft-storage';

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const activeWorkspaceIdRef = useRef<string | null>(null);
  activeWorkspaceIdRef.current = activeWorkspaceId;
  const [snippets, setSnippets] = useState<SnippetSummary[]>([]);
  const [allSnippets, setAllSnippets] = useState<SnippetSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Responsive auto-collapse on screens < 1024px to preserve editor canvas & header space
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let prevWidth = window.innerWidth;
    if (prevWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth >= 1024 && currentWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else if (prevWidth < 1024 && currentWidth >= 1024) {
        setIsSidebarCollapsed(false);
      }
      prevWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify components and editor to recalculate layout after sidebar collapse transition
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  // Active Snippet State
  const [title, setTitle] = useState('Untitled Document');
  const [language, setLanguage] = useState('plaintext');
  const [code, setCode] = useState('');
  const [lastSavedCode, setLastSavedCode] = useState('');
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<SyntaxDiagnostic[]>([]);

  // Diff & Mode State
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isSideBySide, setIsSideBySide] = useState(true);
  const [markdownViewMode, setMarkdownViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteMode, setCommandPaletteMode] = useState<PaletteMode>('commands');

  // Load persisted theme on mount
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? (window.localStorage?.getItem('textdiff_theme') || window.localStorage?.getItem('codediff_theme')) : null;
      if (saved) {
        setEditorTheme(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply website-wide color theme whenever editorTheme changes
  useEffect(() => {
    const found = ALL_THEMES.find((t) => t.id === editorTheme);
    const isLight = found ? found.type === 'light' : false;
    applyGlobalThemeColors(editorTheme, isLight);
  }, [editorTheme]);

  const handleThemeChange = (newTheme: string) => {
    setEditorTheme(newTheme);
    try {
      localStorage.setItem('textdiff_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const handlePreviewTheme = (previewThemeId: string) => {
    setEditorTheme(previewThemeId);
  };

  // History comparison pair
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const [postSaveToast, setPostSaveToast] = useState<{
    versionId: string;
    versionNo: number;
    additions: number;
    deletions: number;
  } | null>(null);
  const [versionA, setVersionA] = useState<VersionItem | null>(null);
  const [versionB, setVersionB] = useState<VersionItem | null>(null);

  // Navigation Guard, Undo Toast, and Delete Modal states
  const [pendingNav, setPendingNav] = useState<
    | { type: 'select_snippet'; id: string }
    | { type: 'new_snippet' }
    | { type: 'select_workspace'; wsId: string }
    | null
  >(null);
  const [undoToast, setUndoToast] = useState<{ message: string; previousCode: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; versionCount: number } | null>(null);
  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{ id: string; name: string; snippetCount: number } | null>(null);
  const [moveSnippetTarget, setMoveSnippetTarget] = useState<SnippetSummary | null>(null);

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
      setLanguage(s.language || detectLanguageFromTitle(s.title) || 'plaintext');

      // If the loaded snippet belongs to another workspace, switch active workspace
      if (s.workspaceId && s.workspaceId !== activeWorkspaceIdRef.current) {
        setActiveWorkspaceId(s.workspaceId);
        activeWorkspaceIdRef.current = s.workspaceId;
        const wsRes = await fetch(`/api/snippets?workspaceId=${s.workspaceId}`);
        if (wsRes.ok) {
          const wsSnippets = await wsRes.json();
          setSnippets(wsSnippets);
        }
      }

      // Restore unsaved draft from localStorage if one exists
      const draft = loadDraft(s.id, s.currentCode);
      setCode(draft ?? s.currentCode);
      setLastSavedCode(s.currentCode);

      setVersions(s.versions || []);
      setVersionA(null);
      setVersionB(null);
      setIsDiffMode(false);
    } catch (err) {
      console.error('Failed to load snippet', err);
    }
  }, []);

  // Fetch all snippets across all workspaces for global search
  const fetchAllSnippets = useCallback(async () => {
    try {
      const res = await fetch('/api/snippets');
      if (!res.ok) return;
      const data = await res.json();
      setAllSnippets(data);
    } catch (err) {
      console.error('Failed to fetch all snippets', err);
    }
  }, []);

  // 2. Fetch snippet list for a workspace
  const fetchSnippets = useCallback(async (wsId?: string | null) => {
    try {
      const url = wsId ? `/api/snippets?workspaceId=${wsId}` : '/api/snippets';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setSnippets(data);
      if (data.length > 0) {
        loadSnippet(data[0].id);
      } else {
        setActiveId(null);
        setTitle('Untitled Document');
        setFilename('');
        setLanguage('plaintext');
        setCode('');
        setLastSavedCode('');
        setVersions([]);
      }
    } catch (err) {
      console.error('Failed to fetch snippets', err);
    }
  }, [loadSnippet]);

  // 3. Initialize workspaces on load: select default workspace and only its documents
  const initWorkspaceAndSnippets = useCallback(async () => {
    try {
      fetchAllSnippets();
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0) {
          const defaultWsId = data[0].id;
          setActiveWorkspaceId(defaultWsId);
          activeWorkspaceIdRef.current = defaultWsId;
          fetchSnippets(defaultWsId);
          return;
        }
      }
      fetchSnippets();
    } catch (err) {
      console.error('Failed to initialize workspaces', err);
      fetchSnippets();
    }
  }, [fetchSnippets, fetchAllSnippets]);

  useEffect(() => {
    initWorkspaceAndSnippets();
  }, [initWorkspaceAndSnippets]);

  // 4. New snippet (VS Code style: blank buffer, no default code, plaintext language)
  const handleNewSnippet = useCallback(async () => {
    const defaultSnippet = {
      title: 'Untitled Document',
      language: 'plaintext',
      currentCode: '',
      workspaceId: activeWorkspaceId || undefined,
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
        setAllSnippets((prev) => [created, ...prev]);
        loadSnippet(created.id);
      }
    } catch (err) {
      console.error('Failed to create snippet', err);
    }
  }, [loadSnippet, activeWorkspaceId]);

  // 5. Duplicate snippet
  const handleDuplicateSnippet = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const source = snippets.find((s) => s.id === id);
    if (!source) return;

    try {
      const detailRes = await fetch(`/api/snippets/${id}`);
      if (!detailRes.ok) return;
      const detail = await detailRes.json();

      const dupRes = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${detail.title} (Copy)`,
          language: detail.language,
          currentCode: detail.currentCode,
          workspaceId: detail.workspaceId || activeWorkspaceId || undefined,
        }),
      });

      if (dupRes.ok) {
        const duplicated = await dupRes.json();
        setSnippets((prev) => [duplicated, ...prev]);
        setAllSnippets((prev) => [duplicated, ...prev]);
        loadSnippet(duplicated.id);
      }
    } catch (err) {
      console.error('Failed to duplicate snippet', err);
    }
  }, [snippets, loadSnippet, activeWorkspaceId]);

  // Switch workspace
  const handleSelectWorkspace = useCallback((wsId: string) => {
    setActiveWorkspaceId(wsId);
    activeWorkspaceIdRef.current = wsId;
    fetchSnippets(wsId);
  }, [fetchSnippets]);

  // Create new workspace
  const handleCreateWorkspace = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const created = await res.json();
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
      activeWorkspaceIdRef.current = created.id;
      fetchSnippets(created.id);
    } catch (err) {
      console.error('Failed to create workspace', err);
    }
  }, [fetchSnippets]);

  // Rename workspace
  const handleRenameWorkspace = useCallback(async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: updated.name } : w)));
      }
    } catch (err) {
      console.error('Failed to rename workspace', err);
    }
  }, []);

  // Request delete workspace
  const handleRequestDeleteWorkspace = useCallback((ws: WorkspaceItem) => {
    if (workspaces.length <= 1) return;
    const count = ws.id === activeWorkspaceId
      ? snippets.length
      : (ws._count?.snippets ?? allSnippets.filter((s) => s.workspaceId === ws.id).length);
    setDeleteWorkspaceTarget({
      id: ws.id,
      name: ws.name,
      snippetCount: count,
    });
  }, [workspaces.length, activeWorkspaceId, snippets.length, allSnippets]);

  // Confirm delete workspace
  const handleConfirmDeleteWorkspace = useCallback(async () => {
    if (!deleteWorkspaceTarget) return;
    const targetId = deleteWorkspaceTarget.id;
    setDeleteWorkspaceTarget(null);
    try {
      const res = await fetch(`/api/workspaces/${targetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = workspaces.filter((w) => w.id !== targetId);
        setWorkspaces(remaining);
        setAllSnippets((prev) => prev.filter((s) => s.workspaceId !== targetId));

        if (activeWorkspaceId === targetId) {
          const nextWs = remaining[0];
          if (nextWs) {
            setActiveWorkspaceId(nextWs.id);
            activeWorkspaceIdRef.current = nextWs.id;
            fetchSnippets(nextWs.id);
          } else {
            setActiveWorkspaceId(null);
            activeWorkspaceIdRef.current = null;
            setSnippets([]);
            setActiveId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete workspace', err);
    }
  }, [deleteWorkspaceTarget, workspaces, activeWorkspaceId, fetchSnippets]);

  // Request move snippet
  const handleRequestMoveSnippet = useCallback((snippet: SnippetSummary) => {
    setMoveSnippetTarget(snippet);
  }, []);

  // Confirm move snippet to target workspace
  const handleConfirmMoveSnippet = useCallback(async (targetWorkspaceId: string) => {
    if (!moveSnippetTarget) return;
    const targetSnippet = moveSnippetTarget;
    setMoveSnippetTarget(null);

    try {
      const res = await fetch(`/api/snippets/${targetSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: targetWorkspaceId }),
      });

      if (res.ok) {
        const updated = snippets.filter((s) => s.id !== targetSnippet.id);
        setSnippets(updated);
        setAllSnippets((prev) =>
          prev.map((s) => (s.id === targetSnippet.id ? { ...s, workspaceId: targetWorkspaceId } : s))
        );

        setWorkspaces((prev) =>
          prev.map((w) => {
            if (w.id === targetWorkspaceId && w._count) {
              return { ...w, _count: { snippets: (w._count.snippets || 0) + 1 } };
            }
            if (w.id === (targetSnippet.workspaceId || activeWorkspaceId) && w._count) {
              return { ...w, _count: { snippets: Math.max(0, (w._count.snippets || 1) - 1) } };
            }
            return w;
          })
        );

        if (activeId === targetSnippet.id) {
          if (updated.length > 0) {
            loadSnippet(updated[0].id);
          } else {
            setActiveId(null);
            setTitle('Untitled Document');
            setFilename('');
            setLanguage('plaintext');
            setCode('');
            setLastSavedCode('');
            setVersions([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to move snippet to workspace', err);
    }
  }, [moveSnippetTarget, snippets, activeId, activeWorkspaceId, loadSnippet]);

  // 5. In-App Delete confirmation
  const requestDeleteSnippet = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = snippets.find((item) => item.id === id);
    setDeleteTarget({
      id,
      title: s?.title || 'Untitled Document',
      versionCount: s?.versions?.length ?? 1,
    });
  }, [snippets]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        clearDraft(id);
        const updated = snippets.filter((s) => s.id !== id);
        setSnippets(updated);
        setAllSnippets((prev) => prev.filter((s) => s.id !== id));
        if (activeId === id) {
          if (updated.length > 0) {
            loadSnippet(updated[0].id);
          } else {
            setActiveId(null);
            setTitle('Untitled Document');
            setFilename('');
            setCode('');
            setLastSavedCode('');
            setVersions([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  }, [deleteTarget, snippets, activeId, loadSnippet]);

  // Helper to silently delete a newly created snippet if the user never entered any content
  const cleanupUntouchedEmptyDocument = useCallback((targetIdToSkip?: string) => {
    if (!activeId || activeId === targetIdToSkip) return;
    const isUntouched = versions.length === 0 && code.trim() === '' && lastSavedCode.trim() === '';
    if (isUntouched) {
      const idToDelete = activeId;
      clearDraft(idToDelete);
      fetch(`/api/snippets/${idToDelete}`, { method: 'DELETE' }).catch((err) => {
        console.error('Failed to cleanup empty document', err);
      });
      setSnippets((prev) => prev.filter((s) => s.id !== idToDelete));
      setAllSnippets((prev) => prev.filter((s) => s.id !== idToDelete));
    }
  }, [activeId, versions.length, code, lastSavedCode]);

  // Navigation Guard handlers
  const requestSelectSnippet = useCallback((id: string) => {
    if (id === activeId) return;
    if (code !== lastSavedCode) {
      setPendingNav({ type: 'select_snippet', id });
    } else {
      cleanupUntouchedEmptyDocument(id);
      loadSnippet(id);
    }
  }, [activeId, code, lastSavedCode, cleanupUntouchedEmptyDocument, loadSnippet]);

  const requestNewSnippet = useCallback(() => {
    if (code !== lastSavedCode) {
      setPendingNav({ type: 'new_snippet' });
    } else {
      const isUntouched = versions.length === 0 && code.trim() === '' && lastSavedCode.trim() === '';
      if (isUntouched) {
        // Already on a blank untouched document, no need to create another empty duplicate
        return;
      }
      handleNewSnippet();
    }
  }, [code, lastSavedCode, versions.length, handleNewSnippet]);

  const requestSelectWorkspace = useCallback((wsId: string) => {
    if (wsId === activeWorkspaceId) return;
    if (code !== lastSavedCode) {
      setPendingNav({ type: 'select_workspace', wsId });
    } else {
      cleanupUntouchedEmptyDocument();
      handleSelectWorkspace(wsId);
    }
  }, [activeWorkspaceId, code, lastSavedCode, cleanupUntouchedEmptyDocument, handleSelectWorkspace]);

  // Onboarding starter templates
  const handleApplyTemplate = useCallback(async (tpl: { title: string; language: string; code: string }) => {
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tpl.title,
          language: tpl.language,
          currentCode: tpl.code,
          workspaceId: activeWorkspaceId || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSnippets((prev) => [created, ...prev]);
        setAllSnippets((prev) => [created, ...prev]);
        loadSnippet(created.id);
      }
    } catch (err) {
      console.error('Failed to apply template', err);
    }
  }, [activeWorkspaceId, loadSnippet]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      let text = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      }
      const detected = detectLanguageFromContent(text || '', 'plaintext');
      const formattedTitle = formatTitleWithExtension('Pasted Document', detected);
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formattedTitle,
          language: detected,
          currentCode: text || '',
          workspaceId: activeWorkspaceId || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSnippets((prev) => [created, ...prev]);
        setAllSnippets((prev) => [created, ...prev]);
        loadSnippet(created.id);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard', err);
      handleNewSnippet();
    }
  }, [activeWorkspaceId, handleNewSnippet, loadSnippet]);

  // 6. Title change auto-detects language if title contains a recognizable extension
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const detected = detectLanguageFromTitle(newTitle, '');
    if (detected && detected !== language) {
      setLanguage(detected);
    }
  };

  // 7. Auto-save metadata (title, language) without creating a new version
  const handleAutoSaveMeta = useCallback(async (newTitle = title, newLanguage = language) => {
    if (!activeId) return;

    try {
      const res = await fetch(`/api/snippets/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim() || 'Untitled Document',
          language: newLanguage,
          currentCode: code,
          createVersion: false,
        }),
      });

      if (res.ok) {
        const updater = (prev: SnippetSummary[]) =>
          prev.map((s) =>
            s.id === activeId
              ? { ...s, title: newTitle.trim() || 'Untitled Document', language: newLanguage, updatedAt: new Date().toISOString() }
              : s
          );
        setSnippets(updater);
        setAllSnippets(updater);
      }
    } catch (err) {
      console.error('Failed to auto-save metadata', err);
    }
  }, [activeId, title, language, code]);

  // 7b. Auto-detect format from content when in plaintext or untitled document
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);

    const isUntitled = !title || title.trim().toLowerCase().startsWith('untitled document');
    if (language === 'plaintext' || isUntitled) {
      const detected = detectLanguageFromContent(newCode);
      if (detected && detected !== 'plaintext' && detected !== language) {
        setLanguage(detected);
        if (isUntitled) {
          const newTitle = formatTitleWithExtension(title || 'Untitled Document', detected);
          setTitle(newTitle);
          handleAutoSaveMeta(newTitle, detected);
        } else {
          handleAutoSaveMeta(title, detected);
        }
      }
    }
  }, [language, title, handleAutoSaveMeta]);

  // 7c. Manual trigger to auto-detect and adapt language format from content
  const handleAutoDetectLanguage = useCallback(() => {
    const detected = detectLanguageFromContent(code, 'plaintext');
    if (detected && detected !== language) {
      setLanguage(detected);
      const isUntitled = !title || title.trim().toLowerCase().startsWith('untitled document');
      if (isUntitled) {
        const newTitle = formatTitleWithExtension(title || 'Untitled Document', detected);
        setTitle(newTitle);
        handleAutoSaveMeta(newTitle, detected);
      } else {
        handleAutoSaveMeta(title, detected);
      }
    }
  }, [code, language, title, handleAutoSaveMeta]);

  // 8. Language change with auto-save
  const handleLanguageChange = (newLang: string) => {
    if (newLang === 'auto-detect') {
      handleAutoDetectLanguage();
      return;
    }
    setLanguage(newLang);
    handleAutoSaveMeta(title, newLang);
  };

  // 9. Instant Save: zero-interruption optimistic snapshot
  const handleInstantSave = useCallback(async (customNote?: unknown) => {
    if (!activeId || code === lastSavedCode) return;

    const stats = calculateDiffStats(lastSavedCode, code);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const autoNote = typeof customNote === 'string' && customNote.trim()
      ? customNote.trim()
      : `Snapshot at ${nowTime} (+${stats.added}/-${stats.removed})`;

    try {
      const res = await fetch(`/api/snippets/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Document',
          language,
          currentCode: code,
          createVersion: true,
          commitMsg: autoNote,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLastSavedCode(code);
        setMonacoCanUndo(false);
        setMonacoCanRedo(false);
        clearDraft(activeId);
        const newVersions: VersionItem[] = updated.versions || [];
        setVersions(newVersions);
        const updater = (prev: SnippetSummary[]) =>
          prev.map((s) =>
            s.id === activeId
              ? { 
                  ...s, 
                  title: title.trim() || 'Untitled Document', 
                  language, 
                  updatedAt: new Date().toISOString(),
                  versions: updated.versions || s.versions,
                }
              : s
          );
        setSnippets(updater);
        setAllSnippets(updater);

        // Flash 'Saved ✓' on header button
        setIsJustSaved(true);
        setTimeout(() => setIsJustSaved(false), 800);

        // Pop up non-intrusive post-save toast
        const latestVer = newVersions[0];
        if (latestVer) {
          setPostSaveToast({
            versionId: latestVer.id,
            versionNo: latestVer.versionNo,
            additions: stats.added,
            deletions: stats.removed,
          });
        }
      }
    } catch (err) {
      console.error('Failed to save version', err);
    }
  }, [activeId, code, lastSavedCode, title, language]);

  // Update a version's commit message retroactively
  const handleUpdateVersionMsg = useCallback(async (versionId: string, newMsg: string) => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/snippets/${activeId}/versions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, commitMsg: newMsg }),
      });
      if (res.ok) {
        setVersions((prev) =>
          prev.map((v) => (v.id === versionId ? { ...v, commitMsg: newMsg } : v))
        );
      }
    } catch (err) {
      console.error('Failed to update version note', err);
    }
  }, [activeId]);

  // Revert / Undo a freshly created version
  const handleRevertCreatedVersion = useCallback(async (versionId: string) => {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/snippets/${activeId}/versions?versionId=${versionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const versRes = await fetch(`/api/snippets/${activeId}/versions`);
        if (versRes.ok) {
          const freshVersions = await versRes.json();
          setVersions(freshVersions);
          if (freshVersions[0]) {
            setLastSavedCode(freshVersions[0].code);
          }
        }
      }
    } catch (err) {
      console.error('Failed to revert version', err);
    }
  }, [activeId]);

  const handleDiscardAndProceed = useCallback(() => {
    if (!pendingNav) return;
    if (activeId) {
      clearDraft(activeId);
      if (versions.length === 0) {
        const idToDelete = activeId;
        fetch(`/api/snippets/${idToDelete}`, { method: 'DELETE' }).catch((err) => {
          console.error('Failed to cleanup discarded empty document', err);
        });
        setSnippets((prev) => prev.filter((s) => s.id !== idToDelete));
        setAllSnippets((prev) => prev.filter((s) => s.id !== idToDelete));
      }
    }
    const nav = pendingNav;
    setPendingNav(null);
    if (nav.type === 'select_snippet') {
      loadSnippet(nav.id);
    } else if (nav.type === 'new_snippet') {
      handleNewSnippet();
    } else if (nav.type === 'select_workspace') {
      handleSelectWorkspace(nav.wsId);
    }
  }, [pendingNav, activeId, versions.length, loadSnippet, handleNewSnippet, handleSelectWorkspace]);

  const handleSaveAndProceed = useCallback(async () => {
    if (!pendingNav) return;
    await handleInstantSave('Auto-saved snapshot before switching');
    const nav = pendingNav;
    setPendingNav(null);
    if (nav.type === 'select_snippet') {
      loadSnippet(nav.id);
    } else if (nav.type === 'new_snippet') {
      handleNewSnippet();
    } else if (nav.type === 'select_workspace') {
      handleSelectWorkspace(nav.wsId);
    }
  }, [pendingNav, handleInstantSave, loadSnippet, handleNewSnippet, handleSelectWorkspace]);

  const hasUnsavedChanges = code !== lastSavedCode;

  // Undo / Redo availability tracking conforming to document editing state
  const [monacoCanUndo, setMonacoCanUndo] = useState(false);
  const [monacoCanRedo, setMonacoCanRedo] = useState(false);

  // Reset undo/redo state whenever switching snippets
  useEffect(() => {
    setMonacoCanUndo(false);
    setMonacoCanRedo(false);
  }, [activeId]);

  const handleUndoRedoChange = useCallback((u: boolean, r: boolean) => {
    setMonacoCanUndo(u);
    setMonacoCanRedo(r);
  }, []);

  // When text is not in a modified state, Undo is disabled.
  // Undo is available if the document has modifications and Monaco's undo stack (if available) allows undo.
  const canUndo = Boolean(hasUnsavedChanges && (monacoCanUndo || !editorRef.current));
  // Redo is available if an undone modification can be reapplied
  const canRedo = Boolean(monacoCanRedo);

  // Floating syntax diagnostics panel visibility state
  const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(false);
  const [isDiagnosticsDismissed, setIsDiagnosticsDismissed] = useState(false);

  // Automatically un-dismiss when new errors are detected
  const prevErrorCountRef = useRef(0);
  useEffect(() => {
    const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
    if (errorCount > 0 && errorCount !== prevErrorCountRef.current) {
      setIsDiagnosticsDismissed(false);
    }
    prevErrorCountRef.current = errorCount;
  }, [diagnostics]);

  // When user clicks the error badge in bottom-left StatusBar:
  // Restore and display the diagnostics panel
  const handleToggleDiagnostics = useCallback(() => {
    if (isDiagnosticsDismissed || !isDiagnosticsExpanded) {
      setIsDiagnosticsDismissed(false);
      setIsDiagnosticsExpanded(true);
    } else {
      setIsDiagnosticsExpanded(false);
    }
  }, [isDiagnosticsDismissed, isDiagnosticsExpanded]);

  // Keep ref to latest callbacks to avoid stale closures in event listeners
  const handleInstantSaveRef = useRef(handleInstantSave);
  handleInstantSaveRef.current = handleInstantSave;

  const handleNewSnippetRef = useRef(handleNewSnippet);
  handleNewSnippetRef.current = handleNewSnippet;

  // 10. Global keyboard shortcuts (Ctrl+S for Instant Save, Ctrl+Shift+P for Command Palette, Ctrl+Alt+N / Ctrl+N for New Document)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+S / Cmd+S => Instant Save (only if there are modifications)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key?.toLowerCase() === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        handleInstantSaveRef.current();
        return;
      }

      // 2. Ctrl+Shift+P / Cmd+Shift+P => Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteMode('commands');
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 3. Ctrl+Alt+N / Cmd+Option+N (and attempt on Ctrl+N / Cmd+N if permitted) => New Document
      const isKeyN = e.key?.toLowerCase() === 'n' || e.code === 'KeyN';
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && isKeyN) {
        e.preventDefault();
        handleNewSnippetRef.current();
        return;
      }

      // 4. Escape => Exit Diff Mode
      if (e.key === 'Escape' && isDiffMode) {
        setIsDiffMode(false);
        setVersionA(null);
        setVersionB(null);
        return;
      }

      // 5. Format Document (Shift+Alt+F on Windows/macOS, Ctrl+Shift+I on Linux)
      const isKeyF = e.key?.toLowerCase() === 'f' || e.code === 'KeyF';
      const isKeyI = e.key?.toLowerCase() === 'i' || e.code === 'KeyI';
      if ((e.shiftKey && e.altKey && isKeyF) || ((e.ctrlKey || e.metaKey) && e.shiftKey && isKeyI)) {
        e.preventDefault();
        handleFormatDocument();
        return;
      }

      // 6. Ctrl+K / Cmd+K or Ctrl+Shift+K => Open Search Modal
      const isKeyK = e.key?.toLowerCase() === 'k' || e.code === 'KeyK';
      const isSearchShortcut = (e.ctrlKey || e.metaKey) && !e.altKey && isKeyK;

      if (isSearchShortcut) {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isDiffMode]);

  // 11. Format document via Monaco Action
  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // 11b. Undo action
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    if (isDiffMode) {
      const modifiedEditor = diffEditorRef.current?.getModifiedEditor?.();
      if (modifiedEditor) {
        if (typeof modifiedEditor.trigger === 'function') {
          modifiedEditor.trigger('toolbar', 'undo', null);
        } else {
          modifiedEditor.getAction('undo')?.run();
        }
        modifiedEditor.focus?.();
        const model = modifiedEditor.getModel?.();
        if (model) {
          setMonacoCanUndo(typeof model.canUndo === 'function' ? model.canUndo() : false);
          setMonacoCanRedo(typeof model.canRedo === 'function' ? model.canRedo() : true);
        }
      }
    } else if (editorRef.current) {
      if (typeof editorRef.current.trigger === 'function') {
        editorRef.current.trigger('toolbar', 'undo', null);
      } else {
        editorRef.current.getAction('undo')?.run();
      }
      editorRef.current.focus?.();
      const model = editorRef.current.getModel?.();
      if (model) {
        setMonacoCanUndo(typeof model.canUndo === 'function' ? model.canUndo() : false);
        setMonacoCanRedo(typeof model.canRedo === 'function' ? model.canRedo() : true);
      }
    }
  }, [isDiffMode, canUndo]);

  // 11c. Redo action
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    if (isDiffMode) {
      const modifiedEditor = diffEditorRef.current?.getModifiedEditor?.();
      if (modifiedEditor) {
        if (typeof modifiedEditor.trigger === 'function') {
          modifiedEditor.trigger('toolbar', 'redo', null);
        } else {
          modifiedEditor.getAction('redo')?.run();
        }
        modifiedEditor.focus?.();
        const model = modifiedEditor.getModel?.();
        if (model) {
          setMonacoCanUndo(typeof model.canUndo === 'function' ? model.canUndo() : true);
          setMonacoCanRedo(typeof model.canRedo === 'function' ? model.canRedo() : false);
        }
      }
    } else if (editorRef.current) {
      if (typeof editorRef.current.trigger === 'function') {
        editorRef.current.trigger('toolbar', 'redo', null);
      } else {
        editorRef.current.getAction('redo')?.run();
      }
      editorRef.current.focus?.();
      const model = editorRef.current.getModel?.();
      if (model) {
        setMonacoCanUndo(typeof model.canUndo === 'function' ? model.canUndo() : true);
        setMonacoCanRedo(typeof model.canRedo === 'function' ? model.canRedo() : false);
      }
    }
  }, [isDiffMode, canRedo]);

  // 11d. Open Monaco Editor built-in Command Palette (F1)
  const handleOpenEditorCommandPalette = () => {
    setTimeout(() => {
      if (isDiffMode) {
        const modifiedEditor = diffEditorRef.current?.getModifiedEditor?.();
        if (modifiedEditor) {
          modifiedEditor.focus?.();
          modifiedEditor.getAction?.('editor.action.quickCommand')?.run();
        }
      } else if (editorRef.current) {
        editorRef.current.focus?.();
        editorRef.current.getAction?.('editor.action.quickCommand')?.run();
      }
    }, 50);
  };

  // 12. Diff navigation
  const handleNextDiffChunk = () => {
    if (diffEditorRef.current) {
      if (typeof diffEditorRef.current.goToDiff === 'function') {
        diffEditorRef.current.goToDiff('next');
      } else {
        const modifiedEditor = diffEditorRef.current.getModifiedEditor?.();
        modifiedEditor?.getAction?.('editor.action.diffReview.next')?.run();
      }
    }
  };

  const handlePrevDiffChunk = () => {
    if (diffEditorRef.current) {
      if (typeof diffEditorRef.current.goToDiff === 'function') {
        diffEditorRef.current.goToDiff('previous');
      } else {
        const modifiedEditor = diffEditorRef.current.getModifiedEditor?.();
        modifiedEditor?.getAction?.('editor.action.diffReview.prev')?.run();
      }
    }
  };

  // 13. Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 14. Safe Rollback to a specific history version (loads into working buffer as draft with undo support)
  const handleRevertToVersion = (ver: VersionItem) => {
    setUndoToast({
      message: `Restored v${ver.versionNo} to draft buffer.`,
      previousCode: code,
    });
    setCode(ver.code);
    if (activeId) {
      saveDraft(activeId, ver.code);
    }
    setVersionA(null);
    setVersionB(null);
    setIsDiffMode(false);
    setHistoryOpen(false);
  };

  const handleUndoRestore = () => {
    if (!undoToast) return;
    setCode(undoToast.previousCode);
    if (activeId) {
      saveDraft(activeId, undoToast.previousCode);
    }
    setUndoToast(null);
  };

  // 15. History comparison triggers
  const handleCompareWithCurrent = (ver: VersionItem) => {
    if (versionA?.id === ver.id && !versionB) {
      // Toggle off
      setVersionA(null);
      setVersionB(null);
      setIsDiffMode(false);
    } else {
      setVersionA(ver);
      setVersionB(null);
      setIsDiffMode(true);
    }
  };

  const handleCompareTwoVersions = (base: VersionItem, target: VersionItem) => {
    setVersionA(base);
    setVersionB(target);
    setIsDiffMode(true);
  };

  const handleExitCustomDiff = () => {
    setVersionA(null);
    setVersionB(null);
    setIsDiffMode(false);
  };

  // 16. Diff sources calculation
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

  const customDiffLabel = useMemo(() => {
    if (versionA && versionB) {
      return `v${versionA.versionNo} ↔ v${versionB.versionNo}`;
    }
    if (versionA) {
      return `v${versionA.versionNo} ↔ Current Draft`;
    }
    return null;
  }, [versionA, versionB]);

  // 17. Copy diff patch
  const handleCopyDiff = () => {
    const patch = createUnifiedPatchText(title || 'snippet', originalDiffCode, targetDiffCode);
    navigator.clipboard.writeText(patch);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  // Auto-persist draft to localStorage (debounced)
  useEffect(() => {
    if (!activeId) return;
    const timer = setTimeout(() => {
      if (code !== lastSavedCode) {
        saveDraft(activeId, code);
      } else {
        clearDraft(activeId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [activeId, code, lastSavedCode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-slate-100 antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        snippets={snippets}
        activeId={activeId}
        searchQuery={searchQuery}
        isCollapsed={isSidebarCollapsed}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        activeHasUnsavedChanges={hasUnsavedChanges}
        onSelectWorkspace={requestSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onRenameWorkspace={handleRenameWorkspace}
        onRequestDeleteWorkspace={handleRequestDeleteWorkspace}
        onRequestMoveSnippet={handleRequestMoveSnippet}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSearchChange={setSearchQuery}
        onSelectSnippet={requestSelectSnippet}
        onNewSnippet={requestNewSnippet}
        onDuplicateSnippet={handleDuplicateSnippet}
        onDeleteSnippet={requestDeleteSnippet}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {activeId ? (
          <>
            <EditorHeader
              title={title}
              onOpenThemePalette={() => {
                setCommandPaletteMode('theme-picker');
                setCommandPaletteOpen(true);
              }}
              isDiffMode={isDiffMode}
              isSideBySide={isSideBySide}
              diffStats={diffStats}
              hasUnsavedChanges={hasUnsavedChanges}
              isJustSaved={isJustSaved}
              copiedCode={copiedCode}
              copiedDiff={copiedDiff}
              versionCount={versions.length}
              customDiffLabel={customDiffLabel}
              onExitCustomDiff={handleExitCustomDiff}
              onTitleChange={handleTitleChange}
              onTitleBlur={() => handleAutoSaveMeta(title, language)}
              onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
              onToggleSideBySide={() => setIsSideBySide(!isSideBySide)}
              onOpenHistory={() => setHistoryOpen(true)}
              onSavePrompt={handleInstantSave}
              onFormatDocument={handleFormatDocument}
              onCopyContent={handleCopyCode}
              onCopyDiff={handleCopyDiff}
              onNextDiffChunk={handleNextDiffChunk}
              onPrevDiffChunk={handlePrevDiffChunk}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            <div className="flex-1 relative overflow-hidden isolate flex flex-col w-full">
              {/* Unified Diff Inspector Bar */}
              {isDiffMode && (
                <DiffInspectorBar
                  versionA={versionA}
                  versionB={versionB}
                  currentVersionNo={versions[0]?.versionNo ?? 1}
                  isSideBySide={isSideBySide}
                  diffStats={diffStats}
                  onToggleSideBySide={() => setIsSideBySide(!isSideBySide)}
                  onNextDiffChunk={handleNextDiffChunk}
                  onPrevDiffChunk={handlePrevDiffChunk}
                  onRestoreVersion={versionA ? () => handleRevertToVersion(versionA) : undefined}
                  onExitDiff={handleExitCustomDiff}
                />
              )}

              <div className="flex-1 relative overflow-hidden isolate w-full">
                <CodeCanvas
                  key={isDiffMode ? `diff-${versionA?.id || 'base'}-${versionB?.id || 'work'}` : `editor-${activeId}-${language === 'markdown' ? markdownViewMode : 'code'}`}
                  language={language}
                  code={code}
                  originalCode={originalDiffCode}
                  targetCode={targetDiffCode}
                  theme={editorTheme}
                  isDiffMode={isDiffMode}
                  isSideBySide={isSideBySide}
                  markdownViewMode={markdownViewMode}
                  onMarkdownViewModeChange={setMarkdownViewMode}
                  onCodeChange={handleCodeChange}
                  onDiagnosticsChange={setDiagnostics}
                  onUndoRedoChange={handleUndoRedoChange}
                  isDiagnosticsExpanded={isDiagnosticsExpanded}
                  onDiagnosticsExpandedChange={setIsDiagnosticsExpanded}
                  isDiagnosticsDismissed={isDiagnosticsDismissed}
                  onDiagnosticsDismissedChange={setIsDiagnosticsDismissed}
                  editorRef={editorRef}
                  diffEditorRef={diffEditorRef}
                  onInstantSave={handleInstantSave}
                  onOpenSearch={() => setIsSearchOpen(true)}
                />
              </div>

              {/* Developer Status Bar */}
              <StatusBar
                language={language}
                code={code}
                isDiffMode={isDiffMode}
                diffStats={diffStats}
                diagnostics={diagnostics}
                onFormatDocument={handleFormatDocument}
                onNextDiffChunk={handleNextDiffChunk}
                onPrevDiffChunk={handlePrevDiffChunk}
                onAutoDetectLanguage={handleAutoDetectLanguage}
                onToggleDiagnostics={handleToggleDiagnostics}
                onOpenLanguagePicker={() => {
                  setCommandPaletteMode('language-picker');
                  setCommandPaletteOpen(true);
                }}
              />
            </div>
          </>
        ) : (
          <WorkspaceEmptyState
            onNewDocument={requestNewSnippet}
            onApplyTemplate={handleApplyTemplate}
            onPasteFromClipboard={handlePasteFromClipboard}
          />
        )}
      </main>

      {/* Dedicated Full-Screen History Workspace (Scheme 2) */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          handleExitCustomDiff();
        }}
        versions={versions}
        selectedVersionA={versionA}
        selectedVersionB={versionB}
        onCompareWithCurrent={handleCompareWithCurrent}
        onCompareTwoVersions={handleCompareTwoVersions}
        onClearCustomDiff={handleExitCustomDiff}
        onRevertToVersion={handleRevertToVersion}
        onUpdateVersionMsg={handleUpdateVersionMsg}
        documentTitle={title}
        language={language}
        currentDraftCode={code}
        theme={editorTheme}
      />

      {/* Optimistic Post-Save Floating Toast */}
      {postSaveToast && (
        <PostSaveToast
          versionNo={postSaveToast.versionNo}
          additions={postSaveToast.additions}
          deletions={postSaveToast.deletions}
          onAddNote={(note) => handleUpdateVersionMsg(postSaveToast.versionId, note)}
          onRevert={() => handleRevertCreatedVersion(postSaveToast.versionId)}
          onClose={() => setPostSaveToast(null)}
        />
      )}

      {/* VS Code-style Command Palette (Ctrl+Shift+P) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        initialMode={commandPaletteMode}
        currentTheme={editorTheme}
        currentLanguage={language}
        isDiffMode={isDiffMode}
        isMarkdown={language === 'markdown'}
        markdownViewMode={markdownViewMode}
        onClose={() => {
          setCommandPaletteOpen(false);
          setCommandPaletteMode('commands');
        }}
        onNewSnippet={handleNewSnippet}
        onSavePrompt={handleInstantSave}
        onOpenHistory={() => setHistoryOpen(true)}
        onToggleDiffMode={() => setIsDiffMode((prev) => !prev)}
        onToggleSideBySide={() => setIsSideBySide((prev) => !prev)}
        onFormatDocument={handleFormatDocument}
        onCopyContent={handleCopyCode}
        onCopyDiff={handleCopyDiff}
        onSetMarkdownViewMode={setMarkdownViewMode}
        onSelectTheme={(th) => {
          handleThemeChange(th);
        }}
        onSelectLanguage={handleLanguageChange}
        onAutoDetectLanguage={handleAutoDetectLanguage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onPreviewTheme={handlePreviewTheme}
        onOpenEditorCommandPalette={handleOpenEditorCommandPalette}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Navigation Guard Modal for Unsaved Changes */}
      <UnsavedChangesModal
        isOpen={pendingNav !== null}
        documentTitle={title || 'Untitled Document'}
        onClose={() => setPendingNav(null)}
        onSaveAndProceed={handleSaveAndProceed}
        onDiscardAndProceed={handleDiscardAndProceed}
      />

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteDocumentModal
          isOpen={true}
          documentTitle={deleteTarget.title}
          versionCount={deleteTarget.versionCount}
          onClose={() => setDeleteTarget(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

      {/* Delete Workspace Confirmation Modal */}
      {deleteWorkspaceTarget && (
        <DeleteWorkspaceModal
          isOpen={true}
          workspaceName={deleteWorkspaceTarget.name}
          snippetCount={deleteWorkspaceTarget.snippetCount}
          onClose={() => setDeleteWorkspaceTarget(null)}
          onConfirmDelete={handleConfirmDeleteWorkspace}
        />
      )}

      {/* Move Document to Workspace Modal */}
      {moveSnippetTarget && (
        <MoveDocumentModal
          isOpen={true}
          documentTitle={moveSnippetTarget.title}
          currentWorkspaceId={moveSnippetTarget.workspaceId || activeWorkspaceId}
          workspaces={workspaces}
          onClose={() => setMoveSnippetTarget(null)}
          onMoveToWorkspace={handleConfirmMoveSnippet}
        />
      )}

      {/* Undo Restore Floating Toast */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={handleUndoRestore}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      {/* Notion-style Document Search Modal (Ctrl+K / Cmd+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        snippets={allSnippets.length > 0 ? allSnippets : snippets}
        activeSnippetId={activeId}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectSnippet={requestSelectSnippet}
      />
    </div>
  );
}
