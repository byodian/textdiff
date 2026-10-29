// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../src/components/CommandPalette';

describe('CommandPalette Export Actions', () => {
  const baseProps = {
    isOpen: true,
    currentTheme: 'vs-dark',
    currentLanguage: 'markdown',
    isDiffMode: false,
    isMarkdown: true,
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
  };

  it('renders raw, PDF, and DOCX export commands for markdown documents', () => {
    const onExportDocument = vi.fn();
    render(React.createElement(CommandPalette, { ...baseProps, onExportDocument, isMarkdown: true }));

    expect(screen.getByText('Export: Document (Raw / As-Is)')).toBeDefined();
    expect(screen.getByText('Export: Markdown as PDF (.pdf)')).toBeDefined();
    expect(screen.getByText('Export: Markdown as Word (.docx)')).toBeDefined();

    fireEvent.click(screen.getByText('Export: Markdown as PDF (.pdf)'));
    expect(onExportDocument).toHaveBeenCalledWith('pdf');
  });

  it('only renders raw export command for non-markdown documents', () => {
    const onExportDocument = vi.fn();
    render(
      React.createElement(CommandPalette, {
        ...baseProps,
        onExportDocument,
        currentLanguage: 'python',
        isMarkdown: false,
      })
    );

    expect(screen.getByText('Export: Document (Raw / As-Is)')).toBeDefined();
    expect(screen.queryByText('Export: Markdown as PDF (.pdf)')).toBeNull();
    expect(screen.queryByText('Export: Markdown as Word (.docx)')).toBeNull();

    fireEvent.click(screen.getByText('Export: Document (Raw / As-Is)'));
    expect(onExportDocument).toHaveBeenCalledWith('raw');
  });
});
