// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeCanvas } from '../src/components/CodeCanvas';

describe('Markdown Split Pane Draggable Resizer', () => {
  it('renders draggable divider in markdown split view', () => {
    const editorRef = { current: null };
    const diffEditorRef = { current: null };

    const { container } = render(
      React.createElement(CodeCanvas, {
        language: 'markdown',
        code: '# Markdown Title\nSome content',
        originalCode: '',
        isDiffMode: false,
        isSideBySide: false,
        markdownViewMode: 'split',
        onCodeChange: () => {},
        editorRef,
        diffEditorRef,
      })
    );

    const divider = screen.getByTitle(/Drag to resize/i);
    expect(divider).toBeDefined();

    // Divider has cursor-col-resize class
    expect(divider.className).toContain('cursor-col-resize');
  });

  it('updates split ratio when dragged and resets on double click', () => {
    const editorRef = { current: null };
    const diffEditorRef = { current: null };

    const { container } = render(
      React.createElement(CodeCanvas, {
        language: 'markdown',
        code: '# Markdown Title\nSome content',
        originalCode: '',
        isDiffMode: false,
        isSideBySide: false,
        markdownViewMode: 'split',
        onCodeChange: () => {},
        editorRef,
        diffEditorRef,
      })
    );

    const divider = screen.getByTitle(/Drag to resize/i);
    const parentContainer = divider.parentElement as HTMLElement;

    // Mock getBoundingClientRect
    parentContainer.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 600,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const leftPane = parentContainer.children[0] as HTMLElement;
    expect(leftPane.style.width).toBe('50%');

    // Start drag
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 500 });
    });

    // Move to 700px (70%)
    act(() => {
      fireEvent.pointerMove(window, { clientX: 700 });
    });

    expect(leftPane.style.width).toBe('70%');

    // Release drag
    act(() => {
      fireEvent.pointerUp(window, { clientX: 700 });
    });

    expect(leftPane.style.width).toBe('70%');

    // Double click resets to 50%
    act(() => {
      fireEvent.doubleClick(divider);
    });

    expect(leftPane.style.width).toBe('50%');
  });
});
