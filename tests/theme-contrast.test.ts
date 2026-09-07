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
      filename: 'index.ts',
      language: 'typescript',
      theme: 'vs',
      onThemeChange: vi.fn(),
      isDiffMode: false,
      isSideBySide: true,
      diffStats: { added: 0, removed: 0, hasChanges: false },
      hasUnsavedChanges: false,
      copiedCode: false,
      copiedDiff: false,
      onTitleChange: vi.fn(),
      onTitleBlur: vi.fn(),
      onFilenameChange: vi.fn(),
      onFilenameBlur: vi.fn(),
      onLanguageChange: vi.fn(),
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
});
