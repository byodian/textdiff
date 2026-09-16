// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeCanvas } from '../src/components/CodeCanvas';

describe('Markdown Floating View Controls in Edit Area', () => {
  const defaultProps = {
    language: 'markdown',
    code: '# Header\nContent',
    originalCode: '',
    isDiffMode: false,
    isSideBySide: false,
    markdownViewMode: 'split' as const,
    onCodeChange: vi.fn(),
    editorRef: { current: null },
    diffEditorRef: { current: null },
    onMarkdownViewModeChange: vi.fn(),
  };

  it('renders floating markdown controls inside edit area for markdown files', () => {
    render(React.createElement(CodeCanvas, defaultProps));

    // Floating view mode buttons in edit canvas
    expect(screen.getByTitle(/Edit markdown source only/i)).toBeDefined();
    expect(screen.getByTitle(/Side-by-side edit and rendered preview/i)).toBeDefined();
    expect(screen.getByTitle(/Rendered preview only/i)).toBeDefined();

    // Verify icon-only presentation (no visible text labels to minimize distraction)
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Split')).toBeNull();
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('triggers view mode change when clicking floating Edit/Split/Preview buttons', () => {
    const onMarkdownViewModeChange = vi.fn();
    render(
      React.createElement(CodeCanvas, {
        ...defaultProps,
        onMarkdownViewModeChange,
      })
    );

    // Click Preview
    act(() => {
      fireEvent.click(screen.getByTitle(/Rendered preview only/i));
    });
    expect(onMarkdownViewModeChange).toHaveBeenCalledWith('preview');

    // Click Edit
    act(() => {
      fireEvent.click(screen.getByTitle(/Edit markdown source only/i));
    });
    expect(onMarkdownViewModeChange).toHaveBeenCalledWith('edit');

    // Click Split
    act(() => {
      fireEvent.click(screen.getByTitle(/Side-by-side edit and rendered preview/i));
    });
    expect(onMarkdownViewModeChange).toHaveBeenCalledWith('split');
  });

  it('does NOT render floating markdown controls when language is not markdown', () => {
    render(
      React.createElement(CodeCanvas, {
        ...defaultProps,
        language: 'typescript',
      })
    );

    expect(screen.queryByTitle(/Edit markdown source only/i)).toBeNull();
    expect(screen.queryByTitle(/Side-by-side edit and rendered preview/i)).toBeNull();
    expect(screen.queryByTitle(/Rendered preview only/i)).toBeNull();
  });

  it('does NOT render floating markdown controls in diff mode', () => {
    render(
      React.createElement(CodeCanvas, {
        ...defaultProps,
        isDiffMode: true,
      })
    );

    expect(screen.queryByTitle(/Edit markdown source only/i)).toBeNull();
    expect(screen.queryByTitle(/Side-by-side edit and rendered preview/i)).toBeNull();
    expect(screen.queryByTitle(/Rendered preview only/i)).toBeNull();
  });
});
