// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CommandPalette } from '../src/components/CommandPalette';

describe('CommandPalette Keyboard and Theme Navigation', () => {
  it('opens in commands mode and exits on Escape', () => {
    const handleClose = vi.fn();
    render(
      React.createElement(CommandPalette, {
        isOpen: true,
        currentTheme: 'vs-dark',
        isDiffMode: false,
        isMarkdown: false,
        onClose: handleClose,
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

    expect(screen.getByPlaceholderText(/type a command or search/i)).toBeDefined();

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('navigates themes without exiting theme-picker mode and supports Escape to return to commands', async () => {
    const handlePreviewTheme = vi.fn();
    const handleSelectTheme = vi.fn();
    const handleClose = vi.fn();

    const props = {
      isOpen: true,
      currentTheme: 'vs-dark',
      isDiffMode: false,
      isMarkdown: false,
      onClose: handleClose,
      onNewSnippet: vi.fn(),
      onSavePrompt: vi.fn(),
      onOpenHistory: vi.fn(),
      onToggleDiffMode: vi.fn(),
      onToggleSideBySide: vi.fn(),
      onFormatDocument: vi.fn(),
      onCopyContent: vi.fn(),
      onCopyDiff: vi.fn(),
      onSelectTheme: handleSelectTheme,
      onPreviewTheme: handlePreviewTheme,
    };

    const { rerender } = render(React.createElement(CommandPalette, props));

    // 1. Open Theme Picker by clicking Preferences: Color Theme...
    const themeCmd = screen.getByText('Preferences: Color Theme...');
    fireEvent.click(themeCmd);

    // Now in theme-picker mode
    expect(screen.getByPlaceholderText(/Select Color Theme/i)).toBeDefined();

    // 2. Press ArrowDown to navigate theme
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });

    // Theme preview should have been called
    expect(handlePreviewTheme).toHaveBeenCalled();
    const lastPreviewed = handlePreviewTheme.mock.calls[handlePreviewTheme.mock.calls.length - 1][0];

    // Simulate page.tsx updating currentTheme prop because of preview
    rerender(React.createElement(CommandPalette, { ...props, currentTheme: lastPreviewed }));

    // CRUCIAL: It must STILL be in theme-picker mode! It must NOT reset to commands mode!
    expect(screen.getByPlaceholderText(/Select Color Theme/i)).toBeDefined();

    // 3. Press Escape in theme-picker mode: should revert preview and return to commands mode
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    // Reverts to original theme 'vs-dark'
    expect(handlePreviewTheme).toHaveBeenLastCalledWith('vs-dark');

    // And mode is now commands mode!
    expect(screen.getByPlaceholderText(/type a command or search/i)).toBeDefined();
    expect(handleClose).not.toHaveBeenCalled();

    // 4. Press Escape in commands mode: should now close palette
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('selects theme with Enter key and closes palette', () => {
    const handleSelectTheme = vi.fn();
    const handleClose = vi.fn();

    render(
      React.createElement(CommandPalette, {
        isOpen: true,
        currentTheme: 'vs-dark',
        isDiffMode: false,
        isMarkdown: false,
        onClose: handleClose,
        onNewSnippet: vi.fn(),
        onSavePrompt: vi.fn(),
        onOpenHistory: vi.fn(),
        onToggleDiffMode: vi.fn(),
        onToggleSideBySide: vi.fn(),
        onFormatDocument: vi.fn(),
        onCopyContent: vi.fn(),
        onCopyDiff: vi.fn(),
        onSelectTheme: handleSelectTheme,
        onPreviewTheme: vi.fn(),
      })
    );

    // Open Theme Picker
    fireEvent.click(screen.getByText('Preferences: Color Theme...'));

    // Press Enter to select
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });

    expect(handleSelectTheme).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders Dark, Light, and All filter buttons in theme-picker mode with proper theme classes', () => {
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

    // Open Theme Picker
    fireEvent.click(screen.getByText('Preferences: Color Theme...'));

    // Verify filter buttons exist
    const allBtn = screen.getByTitle('Show all themes');
    const darkBtn = screen.getByTitle('Filter to dark themes only');
    const lightBtn = screen.getByTitle('Filter to light themes only');

    expect(allBtn).toBeDefined();
    expect(darkBtn).toBeDefined();
    expect(lightBtn).toBeDefined();

    // Verify initial "All" is active
    expect(allBtn.className).toContain('theme-filter-btn-all');
    expect(allBtn.className).toContain('active');

    // Theme badge buttons exist and have theme-badge-dark / theme-badge-light
    const darkBadges = document.querySelectorAll('.theme-badge-dark');
    const lightBadges = document.querySelectorAll('.theme-badge-light');
    expect(darkBadges.length).toBeGreaterThan(0);
    expect(lightBadges.length).toBeGreaterThan(0);

    // Filter to Light themes
    fireEvent.click(lightBtn);
    expect(lightBtn.className).toContain('active');
    expect(darkBtn.className).not.toContain('active');

    // Only light themes should be rendered now
    const filteredDarkBadges = document.querySelectorAll('.theme-badge-dark');
    expect(filteredDarkBadges.length).toBe(0);
    const filteredLightBadges = document.querySelectorAll('.theme-badge-light');
    expect(filteredLightBadges.length).toBeGreaterThan(0);

    // Filter to Dark themes
    fireEvent.click(darkBtn);
    expect(darkBtn.className).toContain('active');
    expect(lightBtn.className).not.toContain('active');

    const filteredDarkBadgesAfter = document.querySelectorAll('.theme-badge-dark');
    expect(filteredDarkBadgesAfter.length).toBeGreaterThan(0);
    const filteredLightBadgesAfter = document.querySelectorAll('.theme-badge-light');
    expect(filteredLightBadgesAfter.length).toBe(0);
  });

  it('filters theme type when clicking a theme badge button in the list', () => {
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

    // Open Theme Picker
    fireEvent.click(screen.getByText('Preferences: Color Theme...'));

    // Click the first "light" badge button in the list
    const firstLightBadge = document.querySelector('.theme-badge-light') as HTMLElement;
    expect(firstLightBadge).toBeTruthy();
    fireEvent.click(firstLightBadge);

    // Now only light themes should be visible
    const darkBadges = document.querySelectorAll('.theme-badge-dark');
    expect(darkBadges.length).toBe(0);
  });

  it('applies high-contrast theme-item-highlight and theme-item-title classes on hover/focus', () => {
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

    // Initial command items: first item is highlighted with high-contrast text
    const highlightedCmd = document.querySelector('.theme-item-highlight');
    expect(highlightedCmd).toBeTruthy();
    const titleSpan = highlightedCmd?.querySelector('.theme-item-title');
    expect(titleSpan).toBeTruthy();
    expect(titleSpan?.className).toContain('text-white');
    expect(titleSpan?.className).not.toContain('text-slate-950');
    expect(titleSpan?.className).not.toContain('text-slate-800');
    expect(titleSpan?.className).toContain('font-semibold');

    // Hover over second command
    const commandItems = document.querySelectorAll('.cursor-pointer');
    if (commandItems[1]) {
      fireEvent.mouseEnter(commandItems[1]);
      const newHighlighted = document.querySelector('.theme-item-highlight');
      expect(newHighlighted).toBe(commandItems[1]);
      const newTitle = newHighlighted?.querySelector('.theme-item-title');
      expect(newTitle?.className).toContain('text-white');
      expect(newTitle?.className).not.toContain('text-slate-950');
    }

    // Switch to theme-picker mode
    fireEvent.click(screen.getByText('Preferences: Color Theme...'));

    const highlightedTheme = document.querySelector('.theme-item-highlight');
    expect(highlightedTheme).toBeTruthy();
    const themeTitle = highlightedTheme?.querySelector('.theme-item-title');
    expect(themeTitle).toBeTruthy();
    expect(themeTitle?.className).toContain('text-white');
    expect(themeTitle?.className).not.toContain('text-slate-950');
    expect(themeTitle?.className).toContain('font-semibold');
  });
});
