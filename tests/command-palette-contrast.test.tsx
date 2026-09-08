// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../src/components/CommandPalette';

describe('CommandPalette Dark Theme Contrast', () => {
  it('renders command options with high-contrast text and without dark slate/black text in dark theme', () => {
    render(
      React.createElement(CommandPalette, {
        isOpen: true,
        currentTheme: 'vs-dark',
        isDiffMode: false,
        isMarkdown: false,
        onClose: vi.fn(),
        onNewSnippet: vi.fn(),
        onSavePrompt: vi.fn(),
        onOpenHistory: vi.fn(),
        onToggleDiffMode: vi.fn(),
        onToggleSideBySide: vi.fn(),
        onFormatDocument: vi.fn(),
        onCopyContent: vi.fn(),
        onCopyDiff: vi.fn(),
        onSelectTheme: vi.fn(),
        onPreviewTheme: vi.fn(),
      })
    );

    // Get all command item titles
    const titleElements = document.querySelectorAll('.theme-item-title');
    expect(titleElements.length).toBeGreaterThan(0);

    titleElements.forEach((el) => {
      const className = el.className;
      // In dark theme, command option text must NOT use near-black text classes (text-slate-950 or text-slate-800)
      // which cause the text to be completely invisible against the dark elevated background.
      expect(className).not.toContain('text-slate-950');
      expect(className).not.toContain('text-slate-800');
    });

    // Check highlighted item title has bright text (e.g. text-white or text-slate-100)
    const highlighted = document.querySelector('.theme-item-highlight');
    expect(highlighted).toBeTruthy();
    const highlightedTitle = highlighted?.querySelector('.theme-item-title');
    expect(highlightedTitle).toBeTruthy();
    expect(
      highlightedTitle?.className.includes('text-white') ||
      highlightedTitle?.className.includes('text-slate-100')
    ).toBe(true);

    // Check unhighlighted items do not use text-slate-600
    const itemContainers = document.querySelectorAll('.cursor-pointer');
    itemContainers.forEach((item) => {
      if (!item.classList.contains('theme-item-highlight')) {
        expect(item.className).not.toContain('text-slate-600');
      }
    });
  });

  it('renders theme picker options with high-contrast text in dark theme', () => {
    const { getByText } = render(
      React.createElement(CommandPalette, {
        isOpen: true,
        currentTheme: 'vs-dark',
        isDiffMode: false,
        isMarkdown: false,
        onClose: vi.fn(),
        onNewSnippet: vi.fn(),
        onSavePrompt: vi.fn(),
        onOpenHistory: vi.fn(),
        onToggleDiffMode: vi.fn(),
        onToggleSideBySide: vi.fn(),
        onFormatDocument: vi.fn(),
        onCopyContent: vi.fn(),
        onCopyDiff: vi.fn(),
        onSelectTheme: vi.fn(),
        onPreviewTheme: vi.fn(),
      })
    );

    // Click to open theme picker
    const themeCmd = getByText('Preferences: Color Theme...');
    act(() => {
      fireEvent.click(themeCmd);
    });

    const titleElements = document.querySelectorAll('.theme-item-title');
    expect(titleElements.length).toBeGreaterThan(0);

    titleElements.forEach((el) => {
      expect(el.className).not.toContain('text-slate-950');
      expect(el.className).not.toContain('text-slate-800');
    });

    const highlighted = document.querySelector('.theme-item-highlight');
    expect(highlighted).toBeTruthy();
    const highlightedTitle = highlighted?.querySelector('.theme-item-title');
    expect(highlightedTitle?.className).toContain('text-white');
  });
});
