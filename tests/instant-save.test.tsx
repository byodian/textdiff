// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WorkspacePage from '../src/app/page';
import { PostSaveToast } from '../src/components/PostSaveToast';
import { HistoryDrawer } from '../src/components/HistoryDrawer';
import { storage } from '../src/lib/storage';

// Mock snippet data
const mockSnippet = {
  id: 'snip-1',
  title: 'Test Snippet',
  filename: 'test.ts',
  language: 'typescript',
  currentCode: 'const x = 1;',
  workspaceId: 'ws-default',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Optimistic Instant Save & Post-Save Annotation (Scheme A)', () => {
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
      workspaces: [{ id: 'ws-default', name: 'Personal Workspace', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      snippets: [mockSnippet],
      versions: [
        { id: 'v-1', snippetId: 'snip-1', versionNo: 1, title: 'Test Snippet', code: 'const x = 1;', commitMsg: 'Initial', createdAt: new Date().toISOString() },
      ],
    });
  });

  it('does NOT save when there are no modifications in workspace', async () => {
    const updateSpy = vi.spyOn(storage.snippets, 'update');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    expect(screen.queryByRole('status')).toBeNull();

    // 1. Click "Save Version" in header when unmodified
    const saveBtn = screen.getByTitle(/Save Version/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // No storage update and no toast
    expect(updateSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();

    // 2. Press Ctrl+S when unmodified
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    expect(updateSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('instant-saves immediately with zero modals when modifications exist', async () => {
    const updateSpy = vi.spyOn(storage.snippets, 'update');

    // Store draft in localStorage beforehand so snippet loads with unsaved modifications
    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 2;');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Verify unsaved edits indicator exists
    expect(screen.getByText(/Unsaved edits/i)).toBeDefined();

    // Click "Save Version" in header
    const saveBtn = screen.getByTitle(/Save Version/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Verify NO blocking modal appears
    expect(screen.queryByText(/Save New Version/i)).toBeNull();

    // Verify storage update was called with createVersion: true
    expect(updateSpy).toHaveBeenCalledWith(
      'snip-1',
      expect.objectContaining({
        createVersion: true,
        currentCode: 'const modifiedCode = 2;',
      })
    );

    // Verify PostSaveToast is displayed with Saved as and Add Note
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(/Saved as/i)).toBeDefined();
    expect(screen.getAllByText(/v2/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Add Note')).toBeDefined();
  });

  it('instant-saves via Ctrl+S keyboard shortcut when modifications exist', async () => {
    const updateSpy = vi.spyOn(storage.snippets, 'update');

    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 2;');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    expect(screen.getByText(/Unsaved edits/i)).toBeDefined();

    // Trigger Ctrl+S
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'snip-1',
      expect.objectContaining({
        createVersion: true,
      })
    );
  });

  it('instant-saves via Cmd+S keyboard shortcut on macOS', async () => {
    const updateSpy = vi.spyOn(storage.snippets, 'update');

    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 3;');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Trigger Cmd+S with metaKey and code 'KeyS'
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', code: 'KeyS', metaKey: true });
    });

    expect(updateSpy).toHaveBeenCalledWith(
      'snip-1',
      expect.objectContaining({
        createVersion: true,
      })
    );
  });

  it('ignores repeated keydown events (e.repeat) when holding Ctrl+S', async () => {
    const updateSpy = vi.spyOn(storage.snippets, 'update');

    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 4;');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Simulate key repeat: e.repeat is true
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true, repeat: true });
    });

    // Should NOT trigger any storage update calls
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('prevents concurrent in-flight save requests from duplicate button clicks or rapid events', async () => {
    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 5;');

    // Delay update resolution to simulate in-flight state
    let resolveUpdate: (val: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    const originalUpdate = storage.snippets.update.bind(storage.snippets);
    const updateSpy = vi.spyOn(storage.snippets, 'update').mockImplementation(async (id, input) => {
      await updatePromise;
      return originalUpdate(id, input);
    });

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    const saveBtn = screen.getByTitle(/Save Version/i);

    // Rapidly click save button twice
    await act(async () => {
      fireEvent.click(saveBtn);
      fireEvent.click(saveBtn);
    });

    // Only 1 update request should be initiated, second must be blocked by in-flight lock
    expect(updateSpy).toHaveBeenCalledTimes(1);

    // Resolve in-flight promise
    await act(async () => {
      resolveUpdate!({});
    });
  });

  it('renders PostSaveToast component with diff badges and expandable note form', async () => {
    const onAddNote = vi.fn();
    const onRevert = vi.fn();
    const onClose = vi.fn();

    render(
      <PostSaveToast
        versionNo={3}
        additions={6}
        deletions={2}
        onAddNote={onAddNote}
        onRevert={onRevert}
        onClose={onClose}
      />
    );

    expect(screen.getByText('v3')).toBeDefined();
    expect(screen.getByText('+6')).toBeDefined();
    expect(screen.getByText('-2')).toBeDefined();

    // Click Add Note to expand input form
    act(() => {
      fireEvent.click(screen.getByText('Add Note'));
    });
    const input = screen.getByPlaceholderText(/Describe this version/i);
    expect(input).toBeDefined();

    // Type note and submit
    act(() => {
      fireEvent.change(input, { target: { value: 'fix sql schema' } });
      fireEvent.click(screen.getByText('Save'));
    });

    expect(onAddNote).toHaveBeenCalledWith('fix sql schema');
  });

  it('renders HistoryDrawer with inline note editing', async () => {
    const onUpdateMsg = vi.fn();

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        versions={[
          {
            id: 'v-1',
            versionNo: 1,
            title: 'Doc',
            code: 'content',
            commitMsg: 'Old commit message',
            createdAt: new Date().toISOString(),
          },
        ]}
        selectedVersionA={null}
        selectedVersionB={null}
        onCompareWithCurrent={vi.fn()}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
        onUpdateVersionMsg={onUpdateMsg}
      />
    );

    expect(screen.getByText('Old commit message')).toBeDefined();

    // Click edit note pencil button
    const editBtn = screen.getByTitle('Edit note');
    act(() => {
      fireEvent.click(editBtn);
    });

    // Input form should be visible
    const noteInput = screen.getByPlaceholderText('Version note...');
    act(() => {
      fireEvent.change(noteInput, { target: { value: 'New revised note' } });
      fireEvent.click(screen.getByTitle('Save note'));
    });

    expect(onUpdateMsg).toHaveBeenCalledWith('v-1', 'New revised note');
  });

  it('closes History modal via close button and Escape key, and simplifies card actions', async () => {
    const onClose = vi.fn();
    const onCompare = vi.fn();
    const onRevert = vi.fn();

    const sampleVersion = {
      id: 'v-1',
      versionNo: 1,
      title: 'Doc',
      code: 'content',
      commitMsg: 'Initial version',
      createdAt: new Date().toISOString(),
    };

    render(
      <HistoryDrawer
        isOpen={true}
        onClose={onClose}
        versions={[sampleVersion]}
        selectedVersionA={null}
        selectedVersionB={null}
        onCompareWithCurrent={onCompare}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={onRevert}
        onUpdateVersionMsg={vi.fn()}
        documentTitle="test.ts"
        currentDraftCode="modified content"
      />
    );

    // Header contains Revision History and document title
    expect(screen.getByText('Revision History')).toBeDefined();
    expect(screen.getByText('test.ts')).toBeDefined();

    // Redundant card buttons are NOT present
    expect(screen.queryByText('Diff Draft')).toBeNull();

    // Clicking card triggers comparison
    const versionCard = screen.getByText('Initial version').closest('.cursor-pointer')!;
    expect(versionCard).toBeDefined();
    fireEvent.click(versionCard);
    expect(onCompare).toHaveBeenCalledWith(sampleVersion);

    // Global Restore action in header
    const restoreBtn = screen.getByText('Restore v1');
    expect(restoreBtn).toBeDefined();
    fireEvent.click(restoreBtn);
    expect(onRevert).toHaveBeenCalledWith(sampleVersion);

    // Click close X button
    const closeBtn = screen.getByTitle('Close (Esc)');
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape should close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
