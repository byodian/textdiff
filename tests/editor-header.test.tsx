// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../src/components/EditorHeader';

describe('EditorHeader Responsive & Prioritized Actions', () => {
  const defaultProps = {
    title: 'README.md',
    theme: 'vs-dark',
    onThemeChange: vi.fn(),
    onOpenThemePalette: vi.fn(),
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

  it('renders clean document header without format-specific view clutter or filename redundancy', () => {
    render(React.createElement(EditorHeader, defaultProps));

    // Markdown view modes MUST NOT be in header (moved to edit area)
    expect(screen.queryByTitle(/Edit markdown source only/i)).toBeNull();
    expect(screen.queryByTitle(/Side-by-side edit and rendered preview/i)).toBeNull();
    expect(screen.queryByTitle(/Rendered preview only/i)).toBeNull();

    // Filename input and version badge MUST NOT be in header
    expect(screen.queryByPlaceholderText(/filename/i)).toBeNull();
    expect(screen.queryByText(/v1/)).toBeNull();

    // Document identity (title) and primary action
    expect(screen.getByDisplayValue('README.md')).toBeDefined();
    const saveBtn = screen.getByTitle(/Save Version/i);
    expect(saveBtn).toBeDefined();
    fireEvent.click(saveBtn);
    expect(defaultProps.onSavePrompt).toHaveBeenCalledTimes(1);
  });

  it('opens More actions dropdown menu and contains secondary utilities', () => {
    const onFormatDocument = vi.fn();
    const onCopyContent = vi.fn();
    const onOpenThemePalette = vi.fn();

    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        onFormatDocument,
        onCopyContent,
        onOpenThemePalette,
      })
    );

    // More actions button
    const moreBtn = screen.getByTitle(/More actions/i);
    expect(moreBtn).toBeDefined();

    // Initially dropdown items are not visible
    expect(screen.queryByText('Format Document')).toBeNull();

    // Open dropdown
    fireEvent.click(moreBtn);

    // Dropdown items should now be visible
    expect(screen.getByText('Format Document')).toBeDefined();
    expect(screen.getByText('Copy Code')).toBeDefined();
    expect(screen.getByText('Command Palette')).toBeDefined();

    // Clicking Format Document triggers handler and closes dropdown
    fireEvent.click(screen.getByText('Format Document'));
    expect(onFormatDocument).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Format Document')).toBeNull();
  });

  it('triggers onOpenHistory when clicking History button', () => {
    const onOpenHistory = vi.fn();
    render(React.createElement(EditorHeader, { ...defaultProps, onOpenHistory }));

    const historyBtn = screen.getByTitle(/Revision History/i);
    fireEvent.click(historyBtn);

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown menu when Escape is pressed', () => {
    render(React.createElement(EditorHeader, defaultProps));

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);
    expect(screen.getByText('Format Document')).toBeDefined();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Format Document')).toBeNull();
  });

  it('changes theme from inside the More actions dropdown', () => {
    const onThemeChange = vi.fn();
    render(React.createElement(EditorHeader, { ...defaultProps, onThemeChange }));

    fireEvent.click(screen.getByTitle(/More actions/i));

    // The theme dropdown inside More menu
    const themeSelects = screen.getAllByRole('combobox');
    // Find the one containing vs-dark
    const themeSelect = themeSelects.find((s) => (s as HTMLSelectElement).value === 'vs-dark');
    expect(themeSelect).toBeDefined();

    if (themeSelect) {
      fireEvent.change(themeSelect, { target: { value: 'dracula' } });
      expect(onThemeChange).toHaveBeenCalledWith('dracula');
    }
  });

  it('ensures header and dropdown have proper stacking context z-index classes', () => {
    const { container } = render(React.createElement(EditorHeader, defaultProps));

    const header = container.querySelector('header');
    expect(header).toBeDefined();
    expect(header?.className).toContain('relative');
    expect(header?.className).toContain('z-30');

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);

    const dropdownContainer = moreBtn.parentElement;
    expect(dropdownContainer?.className).toContain('z-40');

    const dropdownMenu = screen.getByText('Format Document').closest('.z-50');
    expect(dropdownMenu).toBeDefined();
    expect(dropdownMenu?.className).toContain('z-50');
  });

  it('does not render duplicate side-by-side or prev/next chunk buttons when isDiffMode is true', () => {
    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        isDiffMode: true,
      })
    );

    expect(screen.queryByTitle(/Previous Change Chunk/i)).toBeNull();
    expect(screen.queryByTitle(/Next Change Chunk/i)).toBeNull();
    expect(screen.queryByTitle(/Switch to Unified Inline View/i)).toBeNull();
    expect(screen.queryByTitle(/Switch to Split Side-by-Side View/i)).toBeNull();
    expect(screen.queryByText('Side-by-Side')).toBeNull();
    expect(screen.queryByText('Inline')).toBeNull();
  });
});
