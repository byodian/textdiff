// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownPreview } from '../src/components/MarkdownPreview';

describe('MarkdownPreview Theme Background and Colors', () => {
  it('adapts background to Dracula theme', () => {
    const { container } = render(
      React.createElement(MarkdownPreview, {
        content: '# Hello Dracula\nThis is a test.',
        theme: 'dracula',
      })
    );

    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.backgroundColor).toBe('rgb(40, 42, 54)'); // #282a36
  });

  it('adapts background to GitHub Light theme', () => {
    const { container } = render(
      React.createElement(MarkdownPreview, {
        content: '# Hello GitHub Light\nThis is a test.',
        theme: 'github-light',
      })
    );

    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.backgroundColor).toBe('rgb(255, 255, 255)'); // #ffffff
  });

  it('adapts background to Monokai theme', () => {
    const { container } = render(
      React.createElement(MarkdownPreview, {
        content: '# Hello Monokai\nThis is a test.',
        theme: 'monokai',
      })
    );

    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.backgroundColor).toBe('rgb(39, 40, 34)'); // #272822
  });

  it('adapts background to Solarized Dark theme', () => {
    const { container } = render(
      React.createElement(MarkdownPreview, {
        content: '# Hello Solarized Dark\nThis is a test.',
        theme: 'solarized-dark',
      })
    );

    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.backgroundColor).toBe('rgb(0, 43, 54)'); // #002b36
  });

  it('dynamically updates background when theme prop changes', () => {
    const { container, rerender } = render(
      React.createElement(MarkdownPreview, {
        content: '# Dynamic Theme Test',
        theme: 'dracula',
      })
    );

    const previewDiv = container.firstChild as HTMLElement;
    expect(previewDiv.style.backgroundColor).toBe('rgb(40, 42, 54)'); // #282a36

    // Change theme to GitHub Light
    rerender(
      React.createElement(MarkdownPreview, {
        content: '# Dynamic Theme Test',
        theme: 'github-light',
      })
    );

    expect(previewDiv.style.backgroundColor).toBe('rgb(255, 255, 255)'); // #ffffff
  });
});
