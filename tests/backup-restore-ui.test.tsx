// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WorkspacePage from '../src/app/page';
import { storage } from '../src/lib/storage';

describe('Backup & Restore UI Integration', () => {
  const dummyWorkspaces = [
    { id: 'ws-1', name: 'Personal Lab', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  const dummySnippets = [
    {
      id: 'snip-backup-1',
      title: 'my-config.yaml',
      filename: 'my-config.yaml',
      language: 'yaml',
      currentCode: 'version: 1.0',
      workspaceId: 'ws-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const dummyVersions = [
    {
      id: 'v-1',
      snippetId: 'snip-backup-1',
      versionNo: 1,
      title: 'my-config.yaml',
      code: 'version: 1.0',
      commitMsg: 'Initial version',
      createdAt: new Date().toISOString(),
    },
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
      snippets: dummySnippets,
      versions: dummyVersions,
    });
  });

  it('renders Export Backup and Import Backup in EditorHeader More actions menu', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Open More actions menu
    const moreBtn = screen.getByTitle(/More actions/i);
    await act(async () => {
      fireEvent.click(moreBtn);
    });

    // Both actions should exist in dropdown
    expect(screen.getByText('Export Backup (JSON)')).toBeDefined();
    expect(screen.getByText('Import Backup (JSON)')).toBeDefined();
    expect(screen.getByText('Import from dev.db')).toBeDefined();
  });

  it('triggers storage export when clicking Export Backup in More actions menu', async () => {
    const exportSpy = vi.spyOn(storage.backup, 'exportData');

    // Mock URL.createObjectURL and revokeObjectURL
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    const moreBtn = screen.getByTitle(/More actions/i);
    await act(async () => {
      fireEvent.click(moreBtn);
    });

    const exportBtn = screen.getByText('Export Backup (JSON)');
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(exportSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
  });

  it('renders Export and Import commands in Command Palette', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Open Command Palette via Ctrl+Shift+P
    await act(async () => {
      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true });
    });

    // Verify commands exist
    expect(screen.getByText('Data: Export All Workspaces Backup (JSON)')).toBeDefined();
    expect(screen.getByText('Data: Import Workspaces Backup (JSON)')).toBeDefined();
    expect(screen.getByText('Data: Import from Dev SQLite Database (dev.db)')).toBeDefined();
  });

  it('renders Import Backup and Import from dev.db buttons in WorkspaceEmptyState when no document is active', async () => {
    await storage.clearAll();

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    expect(screen.getByText('No document selected')).toBeDefined();
    expect(screen.getByText('Import Backup')).toBeDefined();
    expect(screen.getByText('Import from dev.db')).toBeDefined();
  });

  it('triggers dev db import when clicking Import from dev.db in empty state', async () => {
    await storage.clearAll();

    const devBackupData = {
      version: 1,
      app: 'textdiff',
      exportedAt: new Date().toISOString(),
      workspaces: [{ id: 'ws-dev', name: 'Dev Workspace', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      snippets: [{ id: 'snip-dev', workspaceId: 'ws-dev', title: 'test.ts', language: 'typescript', currentCode: 'const a = 1;', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      versions: [],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/dev/db-backup') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: devBackupData }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const importSpy = vi.spyOn(storage.backup, 'importData');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    const importDevBtn = screen.getByText('Import from dev.db');
    await act(async () => {
      fireEvent.click(importDevBtn);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/dev/db-backup');
    expect(importSpy).toHaveBeenCalledWith(devBackupData);
  });
});
