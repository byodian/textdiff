// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import WorkspacePage from '../src/app/page';

describe('Initial Workspace Selection and Cross-Workspace Search', () => {
  const dummyWorkspaces = [
    { id: 'ws-default', name: 'Default Workspace' },
    { id: 'ws-work', name: 'Work Project' },
  ];

  const defaultSnippets = [
    {
      id: 'snip-1',
      title: 'default-note.md',
      filename: 'default-note.md',
      language: 'markdown',
      currentCode: '# Default workspace doc',
      workspaceId: 'ws-default',
      updatedAt: new Date().toISOString(),
      versions: [{ versionNo: 1, title: 'default-note.md', code: '# Default workspace doc' }],
    },
  ];

  const workSnippets = [
    {
      id: 'snip-2',
      title: 'work-task.ts',
      filename: 'work-task.ts',
      language: 'typescript',
      currentCode: 'export const task = 1;',
      workspaceId: 'ws-work',
      updatedAt: new Date().toISOString(),
      versions: [{ versionNo: 1, title: 'work-task.ts', code: 'export const task = 1;' }],
    },
  ];

  const allSnippets = [...defaultSnippets, ...workSnippets];

  beforeEach(() => {
    vi.restoreAllMocks();
    const storage: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, val: string) => { storage[key] = val; }),
        removeItem: vi.fn((key: string) => { delete storage[key]; }),
        clear: vi.fn(() => { for (const k in storage) delete storage[k]; }),
      },
      writable: true,
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/workspaces') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dummyWorkspaces),
        });
      }
      if (url === '/api/snippets') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(allSnippets),
        });
      }
      if (url === '/api/snippets?workspaceId=ws-default') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultSnippets),
        });
      }
      if (url === '/api/snippets?workspaceId=ws-work') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(workSnippets),
        });
      }
      if (url === '/api/snippets/snip-1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(defaultSnippets[0]),
        });
      }
      if (url === '/api/snippets/snip-2') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(workSnippets[0]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
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

    // Verify /api/snippets was requested with workspaceId parameter
    expect(global.fetch).toHaveBeenCalledWith('/api/snippets?workspaceId=ws-default');
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
