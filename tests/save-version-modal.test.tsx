// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WorkspacePage from '../src/app/page';

// Mock fetch
const mockSnippet = {
  id: 'snip-1',
  title: 'Test Snippet',
  filename: 'test.ts',
  language: 'typescript',
  currentCode: 'const x = 1;',
  updatedAt: new Date().toISOString(),
  versions: [{ id: 'v-1', versionNo: 1, title: 'Test Snippet', code: 'const x = 1;', commitMsg: 'Initial', createdAt: new Date().toISOString() }],
};

describe('Save Version Modal Trigger Guard', () => {
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
      if (url === '/api/snippets') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockSnippet]),
        });
      }
      if (url === '/api/snippets/snip-1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSnippet),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('does NOT open Save Version modal when there are no modifications in workspace', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Save modal should NOT be present initially
    expect(screen.queryByText(/Save New Version/i)).toBeNull();

    // 1. Click "Save Version" in header when there are no modifications
    const saveBtn = screen.getByTitle(/Save Version/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Save modal MUST NOT pop up because there are no modifications
    expect(screen.queryByText(/Save New Version/i)).toBeNull();

    // 2. Press Ctrl+S when there are no modifications
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    // Save modal still MUST NOT pop up
    expect(screen.queryByText(/Save New Version/i)).toBeNull();
  });

  it('DOES open Save Version modal when workspace code has modifications', async () => {
    // Store draft in localStorage beforehand so snippet loads with unsaved modifications
    window.localStorage.setItem('textdiff_draft:snip-1', 'const modifiedCode = 2;');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Unsaved changes indicator should be visible
    expect(screen.getByText(/Unsaved edits/i)).toBeDefined();

    // 1. Click "Save Version" in header when there are modifications
    const saveBtn = screen.getByTitle(/Save Version/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Save modal MUST pop up
    expect(screen.getByText(/Save New Version/i)).toBeDefined();

    // Close modal
    const cancelBtn = screen.getByText('Cancel');
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    expect(screen.queryByText(/Save New Version/i)).toBeNull();

    // 2. Press Ctrl+S when there are modifications
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    // Save modal MUST pop up again
    expect(screen.getByText(/Save New Version/i)).toBeDefined();
  });
});
