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
});
