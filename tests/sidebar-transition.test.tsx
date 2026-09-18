// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../src/components/Sidebar';
import { getShortcutLabel } from '../src/lib/platform';

describe('Sidebar smooth collapse and expand transition', () => {
  const dummySnippets = [
    {
      id: '1',
      title: 'Test Snippet',
      filename: 'index.ts',
      language: 'typescript',
      updatedAt: new Date().toISOString(),
      versions: [{ versionNo: 1 }],
    },
  ];

  it('renders with expanded width w-72 and animated transition classes when not collapsed', () => {
    const onToggleCollapse = vi.fn();
    const { container } = render(
      <Sidebar
        snippets={dummySnippets}
        activeId="1"
        searchQuery=""
        isCollapsed={false}
        onToggleCollapse={onToggleCollapse}
        onSearchChange={() => {}}
        onSelectSnippet={() => {}}
        onNewSnippet={() => {}}
        onDuplicateSnippet={() => {}}
        onDeleteSnippet={() => {}}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.className).toContain('w-72');
    expect(aside?.className).toContain('transition-[width]');
    expect(aside?.className).toContain('duration-300');
    expect(aside?.className).toContain('overflow-hidden');
    expect(screen.getByText('TextDiff')).toBeDefined();

    // PanelLeftClose button is available
    const collapseBtn = screen.getByTitle(/Collapse Sidebar/i);
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders with collapsed width w-14 and shows rail button when collapsed', () => {
    const onToggleCollapse = vi.fn();
    const { container } = render(
      <Sidebar
        snippets={dummySnippets}
        activeId="1"
        searchQuery=""
        isCollapsed={true}
        onToggleCollapse={onToggleCollapse}
        onSearchChange={() => {}}
        onSelectSnippet={() => {}}
        onNewSnippet={() => {}}
        onDuplicateSnippet={() => {}}
        onDeleteSnippet={() => {}}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.className).toContain('w-14');
    expect(aside?.className).toContain('transition-[width]');

    const expandBtn = screen.getByTitle(/Expand Sidebar/i);
    fireEvent.click(expandBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('displays document title directly followed by format extension', () => {
    const testSnippets = [
      {
        id: 's-1',
        title: 'UserAuth',
        language: 'typescript',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 's-2',
        title: 'README.md',
        language: 'markdown',
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <Sidebar
        snippets={testSnippets}
        activeId="s-1"
        searchQuery=""
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onSearchChange={() => {}}
        onSelectSnippet={() => {}}
        onNewSnippet={() => {}}
        onDuplicateSnippet={() => {}}
        onDeleteSnippet={() => {}}
      />
    );

    // Document with no extension in title gets .ts appended
    expect(screen.getByText('UserAuth')).toBeDefined();
    expect(screen.getByText('.ts')).toBeDefined();

    // Document with existing .md in title displays .md
    expect(screen.getByText('README')).toBeDefined();
    expect(screen.getByText('.md')).toBeDefined();
  });

  it('renders New Document button with Ctrl+Alt+N shortcut tooltip and handles click', () => {
    const onNewSnippet = vi.fn();
    render(
      <Sidebar
        snippets={dummySnippets}
        activeId="1"
        searchQuery=""
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onSearchChange={() => {}}
        onSelectSnippet={() => {}}
        onNewSnippet={onNewSnippet}
        onDuplicateSnippet={() => {}}
        onDeleteSnippet={() => {}}
      />
    );

    const newBtns = screen.getAllByTitle(`New Document (${getShortcutLabel('new')})`);
    expect(newBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(newBtns[0]);
    expect(onNewSnippet).toHaveBeenCalledTimes(1);
  });
});
