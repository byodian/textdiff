// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../src/components/Sidebar';

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
});
