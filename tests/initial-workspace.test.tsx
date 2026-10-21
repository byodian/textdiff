// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import WorkspacePage from '../src/app/page';
import { storage } from '../src/lib/storage';

describe('Initial Workspace Selection and Cross-Workspace Search', () => {
  const dummyWorkspaces = [
    { id: 'ws-default', name: 'Default Workspace', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ws-work', name: 'Work Project', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const defaultSnippets = [
    {
      id: 'snip-1',
      title: 'default-note.md',
      filename: 'default-note.md',
      language: 'markdown',
      currentCode: '# Default workspace doc',
      workspaceId: 'ws-default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const defaultVersions = [
    { id: 'v-1', snippetId: 'snip-1', versionNo: 1, title: 'default-note.md', code: '# Default workspace doc', createdAt: new Date().toISOString() },
  ];

  const workSnippets = [
    {
      id: 'snip-2',
      title: 'work-task.ts',
      filename: 'work-task.ts',
      language: 'typescript',
      currentCode: 'export const task = 1;',
      workspaceId: 'ws-work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const workVersions = [
    { id: 'v-2', snippetId: 'snip-2', versionNo: 1, title: 'work-task.ts', code: 'export const task = 1;', createdAt: new Date().toISOString() },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    const storageState: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storageState[key] || null),
        setItem: vi.fn((key: string, val: string) => { storageState[key] = val; }),
        removeItem: vi.fn((key: string) => { delete storageState[key]; }),
        clear: vi.fn(() => { for (const k in storageState) delete storageState[k]; }),
      },
      writable: true,
    });

    await storage.clearAll();
    await storage.backup.importData({
      version: 1,
      app: 'textdiff',
      exportedAt: new Date().toISOString(),
      workspaces: dummyWorkspaces,
      snippets: [...defaultSnippets, ...workSnippets],
      versions: [...defaultVersions, ...workVersions],
    });
  });

  it('selects default workspace on initial mount and only loads its documents into sidebar', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Sidebar should display "Default Workspace"
    expect(screen.getByText('Default Workspace')).toBeDefined();

    // Default workspace document should be loaded and visible in sidebar
    expect(screen.getByText('default-note')).toBeDefined();

    // Work workspace document should NOT be in the sidebar snippet list
    expect(screen.queryByText('work-task')).toBeNull();
  });

  it('switches active workspace automatically when loading a snippet from another workspace', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Open SearchModal via Ctrl+K
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });

    // In SearchModal, work-task.ts from ws-work should be visible because search searches across all workspaces
    const workDocItem = screen.getByText('work-task');
    expect(workDocItem).toBeDefined();

    // Click on work-task.ts to select it
    await act(async () => {
      fireEvent.click(workDocItem);
    });

    // The active workspace should have switched to "Work Project"
    expect(screen.getByText('Work Project')).toBeDefined();

    // Sidebar should now display work-task and not default-note
    expect(screen.getByText('work-task')).toBeDefined();
    expect(screen.queryByText('default-note')).toBeNull();
  });
});
