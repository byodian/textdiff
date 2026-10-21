// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WorkspacePage from '../src/app/page';
import { storage } from '../src/lib/storage';

describe('Command Palette and Search Modal Mutual Exclusivity', () => {
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
    await storage.workspaces.create('Personal Workspace');
    const wsList = await storage.workspaces.list();
    await storage.snippets.create({
      title: 'Test Document',
      filename: 'test.ts',
      language: 'typescript',
      currentCode: 'const greeting = "hello";',
      workspaceId: wsList[0]?.id,
    });
  });

  it('ensures Command Palette and Search Modal can never exist simultaneously on page via shortcuts', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Initially both are closed
    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();

    // 1. Press Ctrl+Shift+P -> Command Palette opens
    await act(async () => {
      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true });
    });

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();

    // 2. While Command Palette is open, press Ctrl+K -> Command Palette closes and Search Modal opens
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });

    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();
    expect(screen.getByPlaceholderText(/Search or ask a question/i)).toBeDefined();

    // 3. While Search Modal is open, press Ctrl+Shift+P -> Search Modal closes and Command Palette opens
    await act(async () => {
      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true });
    });

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();

    // 4. Press Ctrl+Shift+P again while Command Palette is open -> Command Palette closes
    await act(async () => {
      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true });
    });

    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();

    // 5. Press Ctrl+K to open Search Modal
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });

    expect(screen.getByPlaceholderText(/Search or ask a question/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();

    // 6. Press Ctrl+K again -> Search Modal closes
    await act(async () => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });

    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();
  });

  it('closes Search Modal when opening Command Palette via UI actions and vice versa', async () => {
    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // 1. Open Search Modal via sidebar search button
    const searchBtns = screen.getAllByTitle(/Search documents/i);
    await act(async () => {
      fireEvent.click(searchBtns[0]);
    });

    expect(screen.getByPlaceholderText(/Search or ask a question/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Type a command or search/i)).toBeNull();

    // 2. Open Command Palette via Header More actions -> Command Palette
    const moreBtn = screen.getByTitle(/More actions/i);
    await act(async () => {
      fireEvent.click(moreBtn);
    });
    const paletteMenuItem = screen.getByText('Command Palette');
    await act(async () => {
      fireEvent.click(paletteMenuItem);
    });

    // Search Modal MUST be closed, and Command Palette MUST be open (in theme-picker mode)
    expect(screen.queryByPlaceholderText(/Search or ask a question/i)).toBeNull();
    expect(screen.getByPlaceholderText(/Select Color Theme/i)).toBeDefined();
  });
});
