// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../src/components/Sidebar';
import { splitTitleAndExtension, formatTitleWithExtension } from '../src/lib/languages';

describe('Sidebar Document Format Badge Synchronization', () => {
  it('synchronizes format badge with actual content format when language is plaintext or missing', () => {
    const snippets = [
      {
        id: 'snip-json',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: '{\n  "name": "textdiff",\n  "version": "1.0.0"\n}',
        updatedAt: new Date().toISOString(),
        versions: [{ versionNo: 1 }],
      },
      {
        id: 'snip-python',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'def calculate_total(items):\n    return sum(item.price for item in items)',
        updatedAt: new Date().toISOString(),
        versions: [{ versionNo: 1 }],
      },
      {
        id: 'snip-sql',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'SELECT id, username, email FROM users WHERE is_active = 1;',
        updatedAt: new Date().toISOString(),
        versions: [{ versionNo: 1 }],
      },
      {
        id: 'snip-go',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'package main\n\nfunc main() {\n    println("hello")\n}',
        updatedAt: new Date().toISOString(),
        versions: [{ versionNo: 1 }],
      },
    ];

    render(
      <Sidebar
        snippets={snippets}
        activeId="snip-json"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    // Verify badges match the actual format of the content
    expect(screen.getByText('.json')).toBeDefined();
    expect(screen.getByText('.py')).toBeDefined();
    expect(screen.getByText('.sql')).toBeDefined();
    expect(screen.getByText('.go')).toBeDefined();
  });

  it('overrides stale default typescript extension when content is python or json', () => {
    // In legacy DB schemas, default language was "typescript", resulting in Untitled Document.ts
    const { baseTitle: baseJson, extension: extJson } = splitTitleAndExtension(
      'Untitled Document.ts',
      'typescript',
      null,
      '{"status": "success", "data": [1, 2, 3]}'
    );
    expect(baseJson).toBe('Untitled Document');
    expect(extJson).toBe('.json');

    const { baseTitle: basePy, extension: extPy } = splitTitleAndExtension(
      'Untitled Document.ts',
      'typescript',
      null,
      'import math\n\ndef area(radius):\n    return math.pi * radius ** 2'
    );
    expect(basePy).toBe('Untitled Document');
    expect(extPy).toBe('.py');
  });

  it('reconciles mismatched title extension when explicit language is set', () => {
    // Document was saved as Untitled Document.txt but user switched to Python
    const { baseTitle, extension } = splitTitleAndExtension(
      'Untitled Document.txt',
      'python',
      null,
      ''
    );
    expect(baseTitle).toBe('Untitled Document');
    expect(extension).toBe('.py');
  });

  it('updates sidebar badge synchronously when snippets prop changes', () => {
    const initialSnippets = [
      {
        id: 'doc-1',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'hello plain text',
        updatedAt: new Date().toISOString(),
      },
    ];

    const { rerender } = render(
      <Sidebar
        snippets={initialSnippets}
        activeId="doc-1"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    expect(screen.getByText('.txt')).toBeDefined();

    // User pastes JSON in editor -> snippets prop is updated with effective language and code
    const updatedSnippets = [
      {
        id: 'doc-1',
        title: 'Untitled Document.json',
        language: 'json',
        currentCode: '{\n  "service": "auth"\n}',
        updatedAt: new Date().toISOString(),
      },
    ];

    rerender(
      <Sidebar
        snippets={updatedSnippets}
        activeId="doc-1"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    expect(screen.queryByText('.txt')).toBeNull();
    expect(screen.getByText('.json')).toBeDefined();
  });

  it('filters documents in sidebar based on actual content format', () => {
    const snippets = [
      {
        id: 'doc-py',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'def run(): pass',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'doc-txt',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: 'just plain notes',
        updatedAt: new Date().toISOString(),
      },
    ];

    const { rerender } = render(
      <Sidebar
        snippets={snippets}
        activeId="doc-py"
        searchQuery=".py"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    // Only python document should be rendered
    expect(screen.getByText('.py')).toBeDefined();
    expect(screen.queryByText('.txt')).toBeNull();
  });

  it('protects explicit .txt files from being converted to .md even if language is markdown', () => {
    const { baseTitle, extension } = splitTitleAndExtension(
      'notes.txt',
      'markdown',
      null,
      '# Meeting notes\nSome plain content'
    );
    expect(baseTitle).toBe('notes');
    expect(extension).toBe('.txt');
  });

  it('keeps untitled plaintext notes with hash headings as .txt', () => {
    const { baseTitle, extension } = splitTitleAndExtension(
      'Untitled Document',
      'plaintext',
      null,
      '# 今日待办\n1. 买菜\n2. 散步'
    );
    expect(baseTitle).toBe('Untitled Document');
    expect(extension).toBe('.txt');
  });
});
