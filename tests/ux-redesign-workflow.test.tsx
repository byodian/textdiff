// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../src/components/Sidebar';
import { EditorHeader } from '../src/components/EditorHeader';

describe('TextDiff Redesigned UX & Information Architecture', () => {
  it('renders Workspace selector dropdown in Sidebar and allows switching', () => {
    const onSelectWorkspace = vi.fn();
    const onCreateWorkspace = vi.fn();
    const workspaces = [
      { id: 'ws-1', name: 'Default Workspace', _count: { snippets: 2 } },
      { id: 'ws-2', name: 'Order Service Nacos', _count: { snippets: 1 } },
    ];

    render(
      <Sidebar
        snippets={[]}
        activeId={null}
        searchQuery=""
        isCollapsed={false}
        workspaces={workspaces}
        activeWorkspaceId="ws-1"
        onSelectWorkspace={onSelectWorkspace}
        onCreateWorkspace={onCreateWorkspace}
        onToggleCollapse={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    // Workspace button is visible
    const wsBtn = screen.getByTitle('Switch Workspace');
    expect(wsBtn).toBeDefined();
    expect(screen.getByText('Default Workspace')).toBeDefined();

    // Open dropdown
    fireEvent.click(wsBtn);
    expect(screen.getByText('Order Service Nacos')).toBeDefined();

    // Select other workspace
    fireEvent.click(screen.getByText('Order Service Nacos'));
    expect(onSelectWorkspace).toHaveBeenCalledWith('ws-2');
  });

  it('renders clean document header with Unsaved Edits and History button, omitting version badge clutter', () => {
    const onOpenHistory = vi.fn();
    const onToggleDiffMode = vi.fn();
    const onSavePrompt = vi.fn();

    render(
      <EditorHeader
        title="schema.sql"
        theme="vs-dark"
        onThemeChange={vi.fn()}
        isDiffMode={false}
        isSideBySide={true}
        versionCount={5}
        hasUnsavedChanges={true}
        diffStats={{ added: 4, removed: 1, hasChanges: true }}
        copiedCode={false}
        copiedDiff={false}
        onTitleChange={vi.fn()}
        onTitleBlur={vi.fn()}
        onToggleDiffMode={onToggleDiffMode}
        onToggleSideBySide={vi.fn()}
        onOpenHistory={onOpenHistory}
        onSavePrompt={onSavePrompt}
        onFormatDocument={vi.fn()}
        onCopyContent={vi.fn()}
        onCopyDiff={vi.fn()}
        onNextDiffChunk={vi.fn()}
        onPrevDiffChunk={vi.fn()}
      />
    );

    // Version badge is removed from header to reduce clutter
    expect(screen.queryByTitle(/Current snapshot version/i)).toBeNull();

    // Unsaved edits indicator is rendered and clicking toggles diff mode
    const unsavedBtn = screen.getByTitle(/Unsaved edits/i);
    expect(unsavedBtn).toBeDefined();
    fireEvent.click(unsavedBtn);
    expect(onToggleDiffMode).toHaveBeenCalledTimes(1);

    // Dedicated History button is present in toolbar
    const historyBtn = screen.getByTitle('Revision History');
    expect(historyBtn).toBeDefined();
    fireEvent.click(historyBtn);
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });
});
