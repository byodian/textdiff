// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getUiThemeColors, applyGlobalThemeColors } from '../src/lib/theme-colors';
import { EditorHeader } from '../src/components/EditorHeader';

describe('Theme Contrast & Button Text Colors', () => {
  it('returns white brandText for light themes', () => {
    const lightThemes = ['vs', 'github-light', 'solarized-light', 'clouds', 'active4d', 'quietlight'];
    
    for (const themeId of lightThemes) {
      const colors = getUiThemeColors(themeId, true);
      expect(colors.isLight).toBe(true);
      expect(colors.brandText).toBe('#ffffff');
      expect(colors.brandPrimary).toBeTruthy();
    }
  });

  it('returns dark brandText for dark themes', () => {
    const darkThemes = ['vs-dark', 'dracula', 'monokai', 'solarized-dark', 'one-dark-pro', 'nord'];

    for (const themeId of darkThemes) {
      const colors = getUiThemeColors(themeId, false);
      expect(colors.isLight).toBe(false);
      expect(colors.brandText).toBe('#020617');
      expect(colors.brandPrimary).toBeTruthy();
    }
  });

  it('injects --color-brand-text and toggles .light-theme / .dark-theme on document root', () => {
    // Apply light theme
    applyGlobalThemeColors('vs', true);
    expect(document.documentElement.style.getPropertyValue('--color-brand-text')).toBe('#ffffff');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Apply dark theme
    applyGlobalThemeColors('vs-dark', false);
    expect(document.documentElement.style.getPropertyValue('--color-brand-text')).toBe('#020617');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light-theme')).toBe(false);
  });

  it('EditorHeader Save button uses text-brand-text for adaptive contrast', () => {
    const defaultProps = {
      title: 'index.ts',
      isDiffMode: false,
      isSideBySide: true,
      diffStats: { added: 0, removed: 0, hasChanges: false },
      hasUnsavedChanges: false,
      copiedCode: false,
      copiedDiff: false,
      onTitleChange: vi.fn(),
      onTitleBlur: vi.fn(),
      onToggleDiffMode: vi.fn(),
      onToggleSideBySide: vi.fn(),
      onOpenHistory: vi.fn(),
      onSavePrompt: vi.fn(),
      onFormatDocument: vi.fn(),
      onCopyContent: vi.fn(),
      onCopyDiff: vi.fn(),
      onNextDiffChunk: vi.fn(),
      onPrevDiffChunk: vi.fn(),
    };

    render(React.createElement(EditorHeader, defaultProps));
    const saveBtn = screen.getByTitle(/Save Version/i);
    expect(saveBtn).toBeDefined();
    expect(saveBtn.className).toContain('text-brand-text');
    expect(saveBtn.className).toContain('bg-brand-primary');
    expect(saveBtn.className).not.toContain('text-slate-950');
  });

  it('DiffInspectorBar badges use high-contrast text classes for light mode', async () => {
    const { DiffInspectorBar } = await import('../src/components/DiffInspectorBar');
    render(
      React.createElement(DiffInspectorBar, {
        versionA: { id: 'v1', versionNo: 1, title: 't', code: 'a', commitMsg: null, createdAt: '' },
        versionB: null,
        currentVersionNo: 2,
        isSideBySide: true,
        diffStats: { added: 5, removed: 2, hasChanges: true },
        onToggleSideBySide: vi.fn(),
        onNextDiffChunk: vi.fn(),
        onPrevDiffChunk: vi.fn(),
        onExitDiff: vi.fn(),
        onRestoreVersion: vi.fn(),
      })
    );

    const addedBadge = screen.getByText('+5');
    const removedBadge = screen.getByText('-2');
    const restoreBtn = screen.getByTitle(/Restore v1 into draft buffer/i);

    expect(addedBadge.className).toContain('text-emerald-700');
    expect(removedBadge.className).toContain('text-rose-700');
    expect(restoreBtn.className).toContain('text-amber-800');
  });

  it('Sidebar active snippet and extension badges do not have border overload in dark mode', async () => {
    const { Sidebar } = await import('../src/components/Sidebar');
    render(
      React.createElement(Sidebar, {
        snippets: [
          {
            id: 's-1',
            title: 'My Document',
            language: 'typescript',
            filename: 'My Document.ts',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeId: 's-1',
        isDiffMode: false,
        onSelectSnippet: vi.fn(),
        onNewSnippet: vi.fn(),
        onDeleteSnippet: vi.fn(),
        onDuplicateSnippet: vi.fn(),
        searchQuery: '',
        onSearchChange: vi.fn(),
      })
    );

    const activeItem = screen.getByText('My Document').closest('.group');
    expect(activeItem).toBeTruthy();
    // Must NOT contain 4-sided box borders like border-t or border-r
    expect(activeItem?.className).not.toContain('border-t');
    expect(activeItem?.className).not.toContain('border-r');
    expect(activeItem?.className).not.toContain('border-b');
    // Must have the clean single indicator border-l-2
    expect(activeItem?.className).toContain('border-l-2');

    // Extension badge must not have a box border
    const extBadge = screen.getByText('.ts');
    expect(extBadge.className).not.toContain('border');
  });
});

