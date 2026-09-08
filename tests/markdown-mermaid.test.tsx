// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownPreview } from '../src/components/MarkdownPreview';

describe('MarkdownPreview Mermaid Code Block Preview', () => {
  beforeAll(() => {
    // Provide getBBox polyfill for jsdom environment
    if (typeof window !== 'undefined' && typeof window.SVGElement !== 'undefined') {
      const svgProto = window.SVGElement.prototype as unknown as { getBBox?: () => unknown };
      if (!svgProto.getBBox) {
        svgProto.getBBox = () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          bottom: 100,
          left: 0,
          right: 200,
          top: 0,
          toJSON: () => {},
        });
      }
    }
  });

  it('detects mermaid code block and renders mermaid container', () => {
    const rawCode = 'graph TD\nA-->B';
    const content = `\`\`\`mermaid\n${rawCode}\n\`\`\``;
    const { container } = render(React.createElement(MarkdownPreview, { content, theme: 'vs-dark' }));

    const mermaidBlock = container.querySelector('.mermaid-block');
    expect(mermaidBlock).not.toBeNull();
    expect(mermaidBlock?.getAttribute('data-mermaid')).toBe(encodeURIComponent(rawCode));
    expect(container.querySelector('.mermaid-header')).not.toBeNull();
    expect(container.textContent).toContain('mermaid');
  });

  it('keeps normal code blocks as standard pre/code elements', () => {
    const content = '```typescript\nconst x: number = 42;\n```';
    const { container } = render(React.createElement(MarkdownPreview, { content, theme: 'vs-dark' }));

    expect(container.querySelector('.mermaid-block')).toBeNull();
    const codeEl = container.querySelector('pre code.language-typescript');
    expect(codeEl).not.toBeNull();
    expect(codeEl?.textContent).toContain('const x: number = 42;');
  });

  it('asynchronously renders mermaid SVG into diagram container', async () => {
    const content = '```mermaid\ngraph TD\nA[Start] --> B[End]\n```';
    const { container } = render(React.createElement(MarkdownPreview, { content, theme: 'vs-dark' }));

    await waitFor(
      () => {
        const svg = container.querySelector('.mermaid-diagram svg');
        expect(svg).not.toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('displays graceful error message on invalid mermaid syntax without crashing', async () => {
    // Intentionally invalid mermaid code
    const content = '```mermaid\ninvalid_diagram_type_XYZ\n```';
    const { container } = render(React.createElement(MarkdownPreview, { content, theme: 'vs-dark' }));

    await waitFor(
      () => {
        expect(container.textContent).toContain('Mermaid 语法错误');
      },
      { timeout: 3000 }
    );
  });

  it('copies mermaid raw code when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const rawCode = 'graph LR\nClient --> Server';
    const content = `\`\`\`mermaid\n${rawCode}\n\`\`\``;
    const { container } = render(React.createElement(MarkdownPreview, { content, theme: 'vs-dark' }));

    const copyBtn = container.querySelector('[data-copy-mermaid]') as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();

    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(rawCode);
    expect(copyBtn.textContent).toBe('Copied!');
  });
});
