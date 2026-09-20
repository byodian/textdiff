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

  it('returns high-contrast white brandText for dark themes', () => {
    const darkThemes = ['vs-dark', 'dracula', 'monokai', 'solarized-dark', 'one-dark-pro', 'nord'];

    for (const themeId of darkThemes) {
      const colors = getUiThemeColors(themeId, false);
      expect(colors.isLight).toBe(false);
      expect(colors.brandText).toBe('#ffffff');
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
    expect(document.documentElement.style.getPropertyValue('--color-brand-text')).toBe('#ffffff');
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

    render(React.createElement(EditorHeader, { ...defaultProps, versionCount: 2 }));
    const saveBtn = screen.getByTitle(/Save Version/i);
    expect(saveBtn).toBeDefined();
    expect(saveBtn.className).toContain('text-brand-text');
    expect(saveBtn.className).toContain('bg-brand-primary');
    expect(saveBtn.className).not.toContain('text-slate-950');
    expect(saveBtn.className).not.toContain('shadow');

    const historyBtn = screen.getByTitle(/Revision History/i);
    expect(historyBtn).toBeDefined();
    expect(historyBtn.className).toContain('text-slate-100');
    expect(historyBtn.className).not.toContain('text-slate-300');

    const versionBadge = screen.getByText('2');
    expect(versionBadge).toBeDefined();
    expect(versionBadge.className).toContain('text-slate-200');
    expect(versionBadge.className).not.toContain('text-slate-400');
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

    // Search button in sidebar header and collapsed rail must be present with platform-aware tooltip
    const searchBtns = screen.getAllByTitle(/Search documents/i);
    expect(searchBtns.length).toBeGreaterThan(0);
  });

  it('tailwind config withOpacity never outputs NaN% for solid or translucent tokens', async () => {
    const tailwindConfig = (await import('../tailwind.config')).default;
    const canvasColors = tailwindConfig.theme?.extend?.colors?.canvas as any;
    const brandColors = tailwindConfig.theme?.extend?.colors?.brand as any;

    expect(typeof canvasColors.DEFAULT).toBe('function');

    // Standard Tailwind utility call without slash opacity (passes CSS variable or default)
    const solidCanvas = canvasColors.DEFAULT({ opacityValue: 'var(--tw-bg-opacity, 1)' });
    expect(solidCanvas).not.toContain('NaN');
    expect(solidCanvas).toBe('var(--color-canvas-default, #0b0f19)');

    const solidElevated = canvasColors.elevated({ opacityValue: 'var(--tw-bg-opacity, 1)' });
    expect(solidElevated).not.toContain('NaN');
    expect(solidElevated).toBe('var(--color-canvas-elevated, #111827)');

    const solidSurface = canvasColors.surface({ opacityValue: 'var(--tw-bg-opacity, 1)' });
    expect(solidSurface).not.toContain('NaN');
    expect(solidSurface).toBe('var(--color-canvas-surface, #161e2e)');

    const solidBorder = canvasColors.border({ opacityValue: 'var(--tw-border-opacity, 1)' });
    expect(solidBorder).not.toContain('NaN');
    expect(solidBorder).toBe('var(--color-canvas-border, #1f293d)');

    const solidBrand = brandColors.primary({ opacityValue: 'var(--tw-bg-opacity, 1)' });
    expect(solidBrand).not.toContain('NaN');
    expect(solidBrand).toBe('var(--color-brand-primary, #38bdf8)');

    // Translucent Tailwind utility call with slash opacity (e.g. /70, /80)
    const translucentSurface = canvasColors.surface({ opacityValue: '0.7' });
    expect(translucentSurface).not.toContain('NaN');
    expect(translucentSurface).toBe('color-mix(in srgb, var(--color-canvas-surface, #161e2e) 70%, transparent)');
  });
});

