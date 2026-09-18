// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchModal } from '../src/components/SearchModal';
import { SnippetSummary, WorkspaceItem } from '../src/components/Sidebar';

describe('Notion-Style SearchModal Component', () => {
  const dummyWorkspaces: WorkspaceItem[] = [
    { id: 'ws-1', name: 'Personal' },
    { id: 'ws-2', name: 'Work' },
  ];

  const dummySnippets: SnippetSummary[] = [
    {
      id: 'snip-1',
      title: 'orders.sql',
      filename: 'orders.sql',
      language: 'sql',
      updatedAt: new Date().toISOString(), // Today
      workspaceId: 'ws-1',
      versions: [{ versionNo: 1 }],
      ...({ currentCode: 'SELECT * FROM orders WHERE status = "PAID";' } as any),
    },
    {
      id: 'snip-2',
      title: 'auth.ts',
      filename: 'auth.ts',
      language: 'typescript',
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Past week
      workspaceId: 'ws-2',
      versions: [{ versionNo: 2 }],
      ...({ currentCode: 'export function authenticateUser(token: string) { return true; }' } as any),
    },
    {
      id: 'snip-3',
      title: 'notes.md',
      filename: 'notes.md',
      language: 'markdown',
      updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // Older
      workspaceId: 'ws-1',
      versions: [{ versionNo: 1 }],
      ...({ currentCode: '# Meeting notes\nReview quarterly roadmap' } as any),
    },
  ];

  it('renders search modal with Notion-style input, groups, and controls', () => {
    const handleClose = vi.fn();
    const handleSelect = vi.fn();

    render(
      <SearchModal
        isOpen={true}
        onClose={handleClose}
        snippets={dummySnippets}
        activeSnippetId="snip-1"
        workspaces={dummyWorkspaces}
        activeWorkspaceId="ws-1"
        onSelectSnippet={handleSelect}
      />
    );

    expect(screen.getByPlaceholderText(/Search or ask a question in documents/i)).toBeDefined();
    expect(screen.getAllByText('orders.sql').length).toBeGreaterThan(0);
    expect(screen.getAllByText('auth.ts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('notes.md').length).toBeGreaterThan(0);
  });

  it('toggles highlight pane and updates hover title between Hide/Show highlight pane', () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={vi.fn()}
        snippets={dummySnippets}
        activeSnippetId="snip-1"
        workspaces={dummyWorkspaces}
        activeWorkspaceId="ws-1"
        onSelectSnippet={vi.fn()}
      />
    );

    // Initial state: highlight pane is visible
    const paneBtn = screen.getByTitle('Hide highlight pane');
    expect(paneBtn).toBeDefined();
    expect(screen.getByText('Preview')).toBeDefined();

    // Click to hide highlight pane
    fireEvent.click(paneBtn);

    // Title should dynamically flip to "Show highlight pane"
    expect(screen.getByTitle('Show highlight pane')).toBeDefined();
    expect(screen.queryByText('Preview')).toBeNull();

    // Click to restore highlight pane
    fireEvent.click(screen.getByTitle('Show highlight pane'));
    expect(screen.getByTitle('Hide highlight pane')).toBeDefined();
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('toggles filters row and updates hover title between Hide/Show filters', () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={vi.fn()}
        snippets={dummySnippets}
        activeSnippetId="snip-1"
        workspaces={dummyWorkspaces}
        activeWorkspaceId="ws-1"
        onSelectSnippet={vi.fn()}
      />
    );

    // Initial state: filters are visible
    const filterBtn = screen.getByTitle('Hide filters');
    expect(filterBtn).toBeDefined();
    expect(screen.getByText('Title only')).toBeDefined();

    // Click to hide filters
    fireEvent.click(filterBtn);

    // Title should dynamically flip to "Show filters"
    expect(screen.getByTitle('Show filters')).toBeDefined();
    expect(screen.queryByText('Title only')).toBeNull();

    // Click to restore filters
    fireEvent.click(screen.getByTitle('Show filters'));
    expect(screen.getByTitle('Hide filters')).toBeDefined();
    expect(screen.getByText('Title only')).toBeDefined();
  });

  it('filters by query and title-only toggle', () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={vi.fn()}
        snippets={dummySnippets}
        activeSnippetId="snip-1"
        workspaces={dummyWorkspaces}
        activeWorkspaceId="ws-1"
        onSelectSnippet={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search or ask a question/i);

    // Search by content that only exists in currentCode of auth.ts
    fireEvent.change(input, { target: { value: 'authenticateUser' } });
    expect(screen.getAllByText('auth.ts').length).toBeGreaterThan(0);
    expect(screen.queryByText('orders.sql')).toBeNull();

    // Now enable "Title only" filter
    const titleOnlyBtn = screen.getByText('Title only');
    fireEvent.click(titleOnlyBtn);

    // "authenticateUser" is not in any title, so it should show no documents found
    expect(screen.getByText('No documents found')).toBeDefined();

    // Search for "orders" in title
    fireEvent.change(input, { target: { value: 'orders' } });
    expect(screen.getAllByText('orders.sql').length).toBeGreaterThan(0);
  });

  it('navigates with keyboard ArrowDown, ArrowUp, Enter and Escape', () => {
    const handleClose = vi.fn();
    const handleSelect = vi.fn();

    render(
      <SearchModal
        isOpen={true}
        onClose={handleClose}
        snippets={dummySnippets}
        activeSnippetId="snip-1"
        workspaces={dummyWorkspaces}
        activeWorkspaceId="ws-1"
        onSelectSnippet={handleSelect}
      />
    );

    // Press ArrowDown to select next item (auth.ts)
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Press Enter to select
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('snip-2');
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
