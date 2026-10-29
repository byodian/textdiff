// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../src/components/EditorHeader';

describe('EditorHeader Document Export', () => {
  const baseProps = {
    title: 'README.md',
    language: 'markdown',
    isDiffMode: false,
    diffStats: { added: 0, removed: 0, hasChanges: false },
    hasUnsavedChanges: false,
    copiedCode: false,
    copiedDiff: false,
    onTitleChange: vi.fn(),
    onTitleBlur: vi.fn(),
    onToggleDiffMode: vi.fn(),
    onOpenHistory: vi.fn(),
    onSavePrompt: vi.fn(),
    onFormatDocument: vi.fn(),
    onCopyContent: vi.fn(),
    onCopyDiff: vi.fn(),
  };

  it('does not render a standalone Export button in header toolbar', () => {
    const onExportDocument = vi.fn();
    render(React.createElement(EditorHeader, { ...baseProps, onExportDocument }));

    // Standalone export button should NOT exist in the header outside dropdown
    expect(screen.queryByTitle(/Export Document \(Raw/i)).toBeNull();
    expect(screen.queryByLabelText('Export Document')).toBeNull();
  });

  it('exposes export actions in the More actions (...) menu for Markdown documents', () => {
    const onExportDocument = vi.fn();
    render(React.createElement(EditorHeader, { ...baseProps, onExportDocument }));

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);

    const rawOption = screen.getByText('Export File');
    const pdfOption = screen.getByText(/Export as PDF \(\.pdf\)/i);
    const docxOption = screen.getByText(/Export as Word \(\.docx\)/i);

    expect(rawOption).toBeDefined();
    expect(pdfOption).toBeDefined();
    expect(docxOption).toBeDefined();

    // Trigger raw export
    fireEvent.click(rawOption);
    expect(onExportDocument).toHaveBeenCalledWith('raw');
  });

  it('triggers PDF and DOCX export from More actions menu for Markdown documents', () => {
    const onExportDocument = vi.fn();
    render(React.createElement(EditorHeader, { ...baseProps, onExportDocument }));

    const moreBtn = screen.getByTitle(/More actions/i);

    // Open More menu and trigger PDF
    fireEvent.click(moreBtn);
    fireEvent.click(screen.getByText(/Export as PDF \(\.pdf\)/i));
    expect(onExportDocument).toHaveBeenCalledWith('pdf');

    // Open More menu and trigger DOCX
    fireEvent.click(moreBtn);
    fireEvent.click(screen.getByText(/Export as Word \(\.docx\)/i));
    expect(onExportDocument).toHaveBeenCalledWith('docx');
  });

  it('disables PDF and DOCX options in More actions menu for non-markdown documents', () => {
    const onExportDocument = vi.fn();
    render(
      React.createElement(EditorHeader, {
        ...baseProps,
        title: 'script.py',
        language: 'python',
        onExportDocument,
      })
    );

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);

    const pdfBtn = screen.getByTitle(/PDF export is only available for Markdown files/i);
    expect(pdfBtn).toBeDefined();
    expect(pdfBtn.hasAttribute('disabled')).toBe(true);

    const docxBtn = screen.getByTitle(/Word export is only available for Markdown files/i);
    expect(docxBtn).toBeDefined();
    expect(docxBtn.hasAttribute('disabled')).toBe(true);

    // Clicking disabled buttons does not trigger export
    fireEvent.click(pdfBtn);
    expect(onExportDocument).not.toHaveBeenCalled();

    fireEvent.click(docxBtn);
    expect(onExportDocument).not.toHaveBeenCalled();

    // Raw export is still enabled and working without showing filename in label
    const rawBtn = screen.getByText('Export File');
    expect(screen.queryByText(/Export File \(script\.py\)/i)).toBeNull();
    fireEvent.click(rawBtn);
    expect(onExportDocument).toHaveBeenCalledWith('raw');
  });

  it('does not render export options when onExportDocument is not provided', () => {
    render(React.createElement(EditorHeader, { ...baseProps }));

    const moreBtn = screen.getByTitle(/More actions/i);
    fireEvent.click(moreBtn);

    expect(screen.queryByText(/Export File/i)).toBeNull();
    expect(screen.queryByText(/Export as PDF/i)).toBeNull();
    expect(screen.queryByText(/Export as Word/i)).toBeNull();
  });
});
