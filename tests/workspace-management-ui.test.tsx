// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteWorkspaceModal } from '../src/components/DeleteWorkspaceModal';
import { MoveDocumentModal } from '../src/components/MoveDocumentModal';
import { Sidebar, WorkspaceItem, SnippetSummary } from '../src/components/Sidebar';

describe('DeleteWorkspaceModal Component', () => {
  it('displays pre-condition protection notice and prevents deletion when workspace contains documents', () => {
    const onConfirmDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspaceName="Frontend Core"
        snippetCount={5}
        onClose={onClose}
        onConfirmDelete={onConfirmDelete}
      />
    );

    expect(screen.getByText('Cannot Delete Workspace')).toBeDefined();
    expect(screen.getByText('Frontend Core')).toBeDefined();
    expect(screen.getByText('5 documents')).toBeDefined();
    expect(screen.getByText(/a workspace must be empty before it can be deleted/i)).toBeDefined();

    // The dangerous delete button should NOT be rendered
    expect(screen.queryByRole('button', { name: /delete workspace/i })).toBeNull();

    // Clicking "Got it" button closes the modal
    const gotItBtn = screen.getByRole('button', { name: /got it/i });
    fireEvent.click(gotItBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmDelete).not.toHaveBeenCalled();
  });

  it('allows deletion when workspace is empty (snippetCount === 0)', () => {
    const onConfirmDelete = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspaceName="Empty Workspace"
        snippetCount={0}
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
      />
    );

    expect(screen.getAllByText('Delete Workspace').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Empty Workspace')).toBeDefined();
    expect(screen.getByText(/this workspace is empty and contains no documents/i)).toBeDefined();

    const deleteBtn = screen.getByRole('button', { name: /delete workspace/i });
    fireEvent.click(deleteBtn);
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose on Escape key press or Cancel button click for empty workspace', () => {
    const onClose = vi.fn();
    render(
      <DeleteWorkspaceModal
        isOpen={true}
        workspaceName="Empty Workspace"
        snippetCount={0}
        onClose={onClose}
        onConfirmDelete={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('MoveDocumentModal Component', () => {
  const sampleWorkspaces: WorkspaceItem[] = [
    { id: 'ws-1', name: 'Workspace One', _count: { snippets: 3 } },
    { id: 'ws-2', name: 'Workspace Two', _count: { snippets: 7 } },
    { id: 'ws-3', name: 'Workspace Three', _count: { snippets: 0 } },
  ];

  it('filters out currentWorkspaceId and lists other target workspaces', () => {
    const onMove = vi.fn();
    render(
      <MoveDocumentModal
        isOpen={true}
        documentTitle="API Spec.md"
        currentWorkspaceId="ws-1"
        workspaces={sampleWorkspaces}
        onClose={vi.fn()}
        onMoveToWorkspace={onMove}
      />
    );

    expect(screen.getByText('Move Document')).toBeDefined();
    expect(screen.getByText('API Spec.md')).toBeDefined();

    // ws-1 should NOT be shown in the candidate list
    expect(screen.queryByText('Workspace One')).toBeNull();

    // ws-2 and ws-3 should be present
    expect(screen.getByText('Workspace Two')).toBeDefined();
    expect(screen.getByText('Workspace Three')).toBeDefined();

    // Clicking Workspace Two triggers onMove with its id
    fireEvent.click(screen.getByText('Workspace Two'));
    expect(onMove).toHaveBeenCalledWith('ws-2');
  });

  it('displays empty message when no candidate workspaces are available', () => {
    render(
      <MoveDocumentModal
        isOpen={true}
        documentTitle="SingleDoc"
        currentWorkspaceId="ws-1"
        workspaces={[{ id: 'ws-1', name: 'Workspace One' }]}
        onClose={vi.fn()}
        onMoveToWorkspace={vi.fn()}
      />
    );

    expect(screen.getByText(/no other workspaces available/i)).toBeDefined();
  });
});

describe('Sidebar Workspace Actions & Move Document Trigger', () => {
  const workspaces: WorkspaceItem[] = [
    { id: 'ws-1', name: 'Workspace One', _count: { snippets: 1 } },
    { id: 'ws-2', name: 'Workspace Two', _count: { snippets: 2 } },
  ];

  const snippets: SnippetSummary[] = [
    {
      id: 'snip-1',
      title: 'Guide.md',
      language: 'markdown',
      updatedAt: new Date().toISOString(),
      workspaceId: 'ws-1',
    },
  ];

  it('allows inline renaming of a workspace in the dropdown menu', () => {
    const onRename = vi.fn();
    render(
      <Sidebar
        snippets={snippets}
        activeId="snip-1"
        isCollapsed={false}
        workspaces={workspaces}
        activeWorkspaceId="ws-1"
        onRenameWorkspace={onRename}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
        onToggleCollapse={vi.fn()}
      />
    );

    // Open workspace menu
    const switchBtn = screen.getByTitle('Switch Workspace');
    fireEvent.click(switchBtn);

    // Click rename button for Workspace One
    const renameButtons = screen.getAllByTitle('Rename workspace');
    fireEvent.click(renameButtons[0]);

    // An input should appear with 'Workspace One'
    const input = screen.getByDisplayValue('Workspace One');
    fireEvent.change(input, { target: { value: 'Renamed Workspace' } });

    // Submit the rename
    const saveBtn = screen.getByTitle('Save (Enter)');
    fireEvent.click(saveBtn);

    expect(onRename).toHaveBeenCalledWith('ws-1', 'Renamed Workspace');
  });

  it('disables delete button when only 1 workspace exists', () => {
    render(
      <Sidebar
        snippets={snippets}
        activeId="snip-1"
        isCollapsed={false}
        workspaces={[{ id: 'ws-only', name: 'Only Workspace' }]}
        activeWorkspaceId="ws-only"
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
        onToggleCollapse={vi.fn()}
      />
    );

    // Open workspace menu
    fireEvent.click(screen.getByTitle('Switch Workspace'));

    const deleteBtn = screen.getByTitle('Cannot delete the only remaining workspace');
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('triggers onRequestDeleteWorkspace when clicking delete on a workspace', () => {
    const onRequestDelete = vi.fn();
    render(
      <Sidebar
        snippets={snippets}
        activeId="snip-1"
        isCollapsed={false}
        workspaces={workspaces}
        activeWorkspaceId="ws-1"
        onRequestDeleteWorkspace={onRequestDelete}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
        onToggleCollapse={vi.fn()}
      />
    );

    // Open workspace menu
    fireEvent.click(screen.getByTitle('Switch Workspace'));

    const deleteButtons = screen.getAllByTitle('Delete workspace');
    fireEvent.click(deleteButtons[1]);

    expect(onRequestDelete).toHaveBeenCalledWith(workspaces[1]);
  });

  it('triggers onRequestMoveSnippet when clicking Move to workspace button on document', () => {
    const onMoveDoc = vi.fn();
    render(
      <Sidebar
        snippets={snippets}
        activeId="snip-1"
        isCollapsed={false}
        workspaces={workspaces}
        activeWorkspaceId="ws-1"
        onRequestMoveSnippet={onMoveDoc}
        onSelectSnippet={vi.fn()}
        onNewSnippet={vi.fn()}
        onDuplicateSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
        onToggleCollapse={vi.fn()}
      />
    );

    const moveBtn = screen.getByTitle('Move to workspace');
    fireEvent.click(moveBtn);

    expect(onMoveDoc).toHaveBeenCalledWith(snippets[0]);
  });
});
