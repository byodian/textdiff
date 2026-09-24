// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../src/components/EditorHeader';
import { CommandPalette } from '../src/components/CommandPalette';

describe('Editor Undo/Redo State Conformance', () => {
  const baseHeaderProps = {
    title: 'test.ts',
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

  it('greys out both Undo and Redo buttons when text is not in a modified state (clean document)', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <EditorHeader
        {...baseHeaderProps}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={false}
        canRedo={false}
      />
    );

    // Toolbar does not render duplicate Undo/Redo
    expect(screen.queryByRole('group', { name: 'Undo and Redo' })).toBeNull();

    // Open More actions dropdown
    fireEvent.click(screen.getByTitle(/More actions/i));

    const undoBtn = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    const redoBtn = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement;

    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);
    expect(undoBtn.className).toContain('cursor-not-allowed');
    expect(redoBtn.className).toContain('cursor-not-allowed');
    expect(undoBtn.title).toContain('无可撤销更改');
    expect(redoBtn.title).toContain('无可重做更改');

    fireEvent.click(undoBtn);
    expect(onUndo).not.toHaveBeenCalled();

    fireEvent.click(redoBtn);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('enables Undo and greys out Redo when text has active modifications', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <EditorHeader
        {...baseHeaderProps}
        hasUnsavedChanges={true}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={true}
        canRedo={false}
      />
    );

    // Toolbar does not render duplicate Undo/Redo
    expect(screen.queryByRole('group', { name: 'Undo and Redo' })).toBeNull();

    // Open More actions dropdown
    fireEvent.click(screen.getByTitle(/More actions/i));

    const undoBtn = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    const redoBtn = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement;

    expect(redoBtn.disabled).toBe(true);
    expect(redoBtn.className).toContain('cursor-not-allowed');
    fireEvent.click(redoBtn);
    expect(onRedo).not.toHaveBeenCalled();

    expect(undoBtn.disabled).toBe(false);
    expect(undoBtn.className).toContain('hover:text-white');
    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('enables Redo and greys out Undo when all changes have been undone back to unmodified state', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <EditorHeader
        {...baseHeaderProps}
        hasUnsavedChanges={false}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={false}
        canRedo={true}
      />
    );

    // Toolbar does not render duplicate Undo/Redo
    expect(screen.queryByRole('group', { name: 'Undo and Redo' })).toBeNull();

    // Open More actions dropdown
    fireEvent.click(screen.getByTitle(/More actions/i));

    const undoBtn = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement;
    const redoBtn = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement;

    expect(undoBtn.disabled).toBe(true);
    fireEvent.click(undoBtn);
    expect(onUndo).not.toHaveBeenCalled();

    expect(redoBtn.disabled).toBe(false);
    fireEvent.click(redoBtn);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('greys out Undo and Redo items in Command Palette when text is not in a modified state', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        currentTheme="vs-dark"
        isDiffMode={false}
        onClose={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onSavePrompt={vi.fn()}
        onOpenHistory={vi.fn()}
        onToggleDiffMode={vi.fn()}
        onToggleSideBySide={vi.fn()}
        onFormatDocument={vi.fn()}
        onCopyContent={vi.fn()}
        onCopyDiff={vi.fn()}
        onSelectTheme={vi.fn()}
        onPreviewTheme={vi.fn()}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={false}
        canRedo={false}
      />
    );

    const undoItem = screen.getByText(/Edit: Undo/);
    const redoItem = screen.getByText(/Edit: Redo/);

    expect(undoItem).toBeDefined();
    expect(redoItem).toBeDefined();

    fireEvent.click(undoItem);
    expect(onUndo).not.toHaveBeenCalled();

    fireEvent.click(redoItem);
    expect(onRedo).not.toHaveBeenCalled();
  });
});
