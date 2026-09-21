// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../src/components/EditorHeader';

describe('EditorHeader Responsive & Prioritized Actions', () => {
  const defaultProps = {
    title: 'README.md',
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

  it('does not render redundant theme select in More actions dropdown and delegates to Command Palette', () => {
    const onOpenThemePalette = vi.fn();
    render(React.createElement(EditorHeader, { ...defaultProps, onOpenThemePalette }));

    fireEvent.click(screen.getByTitle(/More actions/i));

    // The theme dropdown select MUST NOT be present
    expect(screen.queryByRole('combobox')).toBeNull();

    // Command Palette action is available instead
    const paletteBtn = screen.getByText('Command Palette');
    expect(paletteBtn).toBeDefined();
    fireEvent.click(paletteBtn);
    expect(onOpenThemePalette).toHaveBeenCalledTimes(1);
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

  it('renders Undo and Redo toolbar buttons and triggers callbacks when clicked in modified state', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true,
      })
    );

    const undoBtn = screen.getByRole('button', { name: 'Undo' });
    const redoBtn = screen.getByRole('button', { name: 'Redo' });

    expect(undoBtn).toBeDefined();
    expect(redoBtn).toBeDefined();

    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(redoBtn);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('disables Undo and Redo buttons by default when text is not modified', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        onUndo,
        onRedo,
      })
    );

    const undoBtn = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    const redoBtn = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement;

    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);
  });

  it('disables Undo and Redo buttons when canUndo or canRedo is explicitly false', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        onUndo,
        onRedo,
        canUndo: false,
        canRedo: false,
      })
    );

    const undoBtn = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    const redoBtn = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement;

    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);
  });

  it('unifies header control heights to compact h-7 across all buttons and inputs', () => {
    const { container } = render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        hasUnsavedChanges: true,
        diffStats: { added: 12, removed: 4, hasChanges: true },
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        versionCount: 3,
      })
    );

    // Title input has h-7
    const titleInput = screen.getByPlaceholderText(/Document Title/i);
    expect(titleInput.className).toContain('h-7');

    // Unsaved edits button has h-7
    const unsavedBtn = screen.getByTitle(/Unsaved edits \(\+12\/-4\)\. Click to inspect diff\./i);
    expect(unsavedBtn).toBeDefined();
    expect(unsavedBtn.className).toContain('h-7');

    // Mode switch container has h-7
    const modeSwitchContainer = unsavedBtn.closest('header')?.querySelector('.bg-canvas-surface.rounded-md');
    expect(modeSwitchContainer?.className).toContain('h-7');

    // Undo/Redo container has h-7
    const undoRedoContainer = screen.getByRole('group', { name: 'Undo and Redo' });
    expect(undoRedoContainer.className).toContain('h-7');

    // History button has h-7
    const historyBtn = screen.getByTitle(/Revision History/i);
    expect(historyBtn.className).toContain('h-7');

    // Save button has h-7
    const saveBtn = screen.getByTitle(/Save Version/i);
    expect(saveBtn.className).toContain('h-7');

    // More actions button has h-7 and w-7
    const moreBtn = screen.getByTitle(/More actions/i);
    expect(moreBtn.className).toContain('h-7');
    expect(moreBtn.className).toContain('w-7');
  });

  it('hides Unsaved edits and Editor/Diff text on screens below xl and provides informative hover tooltips', () => {
    render(
      React.createElement(EditorHeader, {
        ...defaultProps,
        hasUnsavedChanges: true,
        diffStats: { added: 8, removed: 3, hasChanges: true },
        isDiffMode: false,
      })
    );

    // Unsaved edits text element has hidden xl:inline responsive class
    const unsavedText = screen.getByText('Unsaved edits');
    expect(unsavedText.className).toContain('hidden xl:inline');

    // Tooltip includes diff stats and instruction
    const unsavedBtn = screen.getByTitle('Unsaved edits (+8/-3). Click to inspect diff.');
    expect(unsavedBtn).toBeDefined();

    // Editor button text has hidden xl:inline and descriptive title
    const editorText = screen.getByText('Editor');
    expect(editorText.className).toContain('hidden xl:inline');
    expect(screen.getByTitle('Editor mode (Edit document)')).toBeDefined();

    // Diff button text has hidden xl:inline and diff stats title
    const diffText = screen.getByText('Diff');
    expect(diffText.className).toContain('hidden xl:inline');
    expect(screen.getByTitle('Diff mode (+8/-3)')).toBeDefined();
  });
});

