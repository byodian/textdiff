// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../src/components/EditorHeader';

describe('EditorHeader Responsive & Prioritized Actions', () => {
  const defaultProps = {
    title: 'README.md',
    filename: 'README.md',
    language: 'markdown',
    theme: 'vs-dark',
    onThemeChange: vi.fn(),
    onOpenThemePalette: vi.fn(),
    isDiffMode: false,
    isSideBySide: true,
    markdownViewMode: 'split' as const,
    onMarkdownViewModeChange: vi.fn(),
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

  it('renders markdown view modes and primary save button in markdown format', () => {
    render(React.createElement(EditorHeader, defaultProps));

    // Markdown view modes
    expect(screen.getByTitle(/Edit markdown source only/i)).toBeDefined();
    expect(screen.getByTitle(/Side-by-side edit and rendered preview/i)).toBeDefined();
    expect(screen.getByTitle(/Rendered preview only/i)).toBeDefined();

    // Primary action
    const saveBtn = screen.getByTitle(/Save Version/i);
    expect(saveBtn).toBeDefined();
    fireEvent.click(saveBtn);
    expect(defaultProps.onSavePrompt).toHaveBeenCalledTimes(1);
  });

  it('toggles markdown view mode when clicking split/edit/preview buttons', () => {
    const onMarkdownViewModeChange = vi.fn();
    render(React.createElement(EditorHeader, { ...defaultProps, onMarkdownViewModeChange }));

    fireEvent.click(screen.getByTitle(/Rendered preview only/i));
    expect(onMarkdownViewModeChange).toHaveBeenCalledWith('preview');

    fireEvent.click(screen.getByTitle(/Edit markdown source only/i));
    expect(onMarkdownViewModeChange).toHaveBeenCalledWith('edit');
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
    expect(screen.getByText('Revisions')).toBeDefined();
    expect(screen.getByText('Format Document')).toBeDefined();
    expect(screen.getByText('Copy Code')).toBeDefined();
    expect(screen.getByText('Command Palette')).toBeDefined();

    // Clicking Format Document triggers handler and closes dropdown
    fireEvent.click(screen.getByText('Format Document'));
    expect(onFormatDocument).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Format Document')).toBeNull();
  });

  it('triggers onOpenHistory when clicking Revisions inside More actions dropdown', () => {
    const onOpenHistory = vi.fn();
    render(React.createElement(EditorHeader, { ...defaultProps, onOpenHistory }));

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);

    const revisionsBtn = screen.getByText('Revisions');
    fireEvent.click(revisionsBtn);

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Revisions')).toBeNull();
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
});
