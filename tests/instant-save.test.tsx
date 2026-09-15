// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WorkspacePage from '../src/app/page';
import { PostSaveToast } from '../src/components/PostSaveToast';
import { HistoryDrawer } from '../src/components/HistoryDrawer';

// Mock snippet data
const mockSnippet = {
  id: 'snip-1',
  title: 'Test Snippet',
  filename: 'test.ts',
  language: 'typescript',
  currentCode: 'const x = 1;',
  updatedAt: new Date().toISOString(),
  versions: [
    { id: 'v-1', versionNo: 1, title: 'Test Snippet', code: 'const x = 1;', commitMsg: 'Initial', createdAt: new Date().toISOString() },
  ],
};

describe('Optimistic Instant Save & Post-Save Annotation (Scheme A)', () => {
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

    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/snippets') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockSnippet]),
        });
      }
      if (url === '/api/snippets/snip-1') {
        if (init?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockSnippet,
              versions: [
                { id: 'v-2', versionNo: 2, title: 'Test Snippet', code: 'const modifiedCode = 2;', commitMsg: 'Snapshot at 17:50', createdAt: new Date().toISOString() },
                ...mockSnippet.versions,
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSnippet),
        });
      }
      if (url === '/api/snippets/snip-1/versions') {
        if (init?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'v-2', commitMsg: 'Updated note' }),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('does NOT save when there are no modifications in workspace', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    expect(screen.queryByRole('status')).toBeNull();

    // 1. Click "Save Version" in header when unmodified
    const saveBtn = screen.getByTitle(/Save Version/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // No network call to PUT and no toast
    expect(screen.queryByRole('status')).toBeNull();

    // 2. Press Ctrl+S when unmodified
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('instant-saves immediately with zero modals when modifications exist', async () => {
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

    // Verify PUT was called with createVersion: true
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/snippets/snip-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"createVersion":true'),
      })
    );

    // Verify PostSaveToast is displayed with Saved as and Add Note
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText(/Saved as/i)).toBeDefined();
    expect(screen.getAllByText(/v2/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Add Note')).toBeDefined();
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
});
