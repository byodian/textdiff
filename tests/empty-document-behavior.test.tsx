// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { POST as createSnippet } from '../legacy/api/snippets/route';

describe('Empty Document Lifecycle & No-Blank-Version Rule', () => {
  beforeEach(async () => {
    await prisma.snippetVersion.deleteMany();
    await prisma.snippet.deleteMany();
  });

  it('does NOT create a version when snippet is created with empty or whitespace-only code', async () => {
    const req = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: '',
      }),
    });

    const res = await createSnippet(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Untitled Document');
    // Rule: 文档创建后不将空白内容作为第一个版本
    expect(data.versions).toBeDefined();
    expect(data.versions.length).toBe(0);

    // Verify in database directly
    const versionsInDb = await prisma.snippetVersion.findMany({
      where: { snippetId: data.id },
    });
    expect(versionsInDb.length).toBe(0);
  });

  it('creates initial version 1 when snippet is created with non-empty code (e.g. from template or paste)', async () => {
    const req = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Starter Template',
        language: 'typescript',
        currentCode: 'console.log("Ready!");',
      }),
    });

    const res = await createSnippet(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.versions.length).toBe(1);
    expect(data.versions[0].versionNo).toBe(1);
    expect(data.versions[0].code).toBe('console.log("Ready!");');
  });

  it('first save on a previously empty unversioned document creates versionNo 1', async () => {
    // 1. Create empty document
    const createReq = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Notes',
        language: 'plaintext',
        currentCode: '',
      }),
    });
    const createRes = await createSnippet(createReq);
    const snippet = await createRes.json();
    expect(snippet.versions.length).toBe(0);

    // 2. Put code and save version
    const { PUT: updateSnippet } = await import('../legacy/api/snippets/[id]/route');
    const updateReq = new Request(`http://localhost:3000/api/snippets/${snippet.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Notes',
        currentCode: 'My first note',
        createVersion: true,
        commitMsg: 'Initial real note',
      }),
    });
    const updateRes = await updateSnippet(updateReq, { params: { id: snippet.id } });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();

    expect(updated.versions.length).toBe(1);
    expect(updated.versions[0].versionNo).toBe(1);
    expect(updated.versions[0].code).toBe('My first note');
  });

  it('silently cleans up and deletes newly created empty document when switching away without edits', async () => {
    const { render, screen, act, fireEvent } = await import('@testing-library/react');
    const { default: WorkspacePage } = await import('../src/app/page');
    const { storage } = await import('../src/lib/storage');

    await storage.clearAll();
    await storage.backup.importData({
      version: 1,
      app: 'textdiff',
      exportedAt: new Date().toISOString(),
      workspaces: [{ id: 'ws-default', name: 'Personal Workspace', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      snippets: [
        {
          id: 'empty-doc',
          title: 'Untitled Document',
          language: 'plaintext',
          currentCode: '',
          workspaceId: 'ws-default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'existing-doc',
          title: 'Existing.ts',
          language: 'typescript',
          currentCode: 'const a = 1;',
          workspaceId: 'ws-default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      versions: [
        { id: 'v-1', snippetId: 'existing-doc', versionNo: 1, title: 'Existing.ts', code: 'const a = 1;', createdAt: new Date().toISOString() },
      ],
    });

    const deleteSpy = vi.spyOn(storage.snippets, 'delete');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // Currently on empty-doc with 0 versions and empty code
    // Click on existing-doc in sidebar (split title has "Existing" and ".ts")
    const existingDocItem = screen.getByText(/Existing/);
    await act(async () => {
      fireEvent.click(existingDocItem);
    });

    // Must NOT pop up Unsaved Changes in Document
    expect(screen.queryByText(/Unsaved Changes in Document/i)).toBeNull();

    // Must delete the empty unedited document in storage
    expect(deleteSpy).toHaveBeenCalledWith('empty-doc');
  });

  it('allows creating a document in an empty workspace via quick area New Document button', async () => {
    const { render, screen, act, fireEvent } = await import('@testing-library/react');
    const { default: WorkspacePage } = await import('../src/app/page');
    const { storage } = await import('../src/lib/storage');

    await storage.clearAll();
    await storage.workspaces.create('Empty Workspace');
    const createSpy = vi.spyOn(storage.snippets, 'create');

    await act(async () => {
      render(React.createElement(WorkspacePage));
    });

    // 1. Initially in an empty workspace, should display WorkspaceEmptyState
    expect(screen.getByText('No document selected')).toBeDefined();

    // 2. Click the quick area "New Document" button
    const quickNewDocBtn = screen.getByText('New Document').closest('button')!;
    expect(quickNewDocBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(quickNewDocBtn);
    });

    // Verify storage.snippets.create was executed to create a new document in the empty workspace
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Untitled Document',
      })
    );
  });

  it('allows creating a document in an empty workspace via sidebar header add button', async () => {
    const { render, screen, act, fireEvent } = await import('@testing-library/react');
    const { default: WorkspacePage } = await import('../src/app/page');
    const { storage } = await import('../src/lib/storage');

    await storage.clearAll();
    await storage.workspaces.create('Empty Workspace');
    const createSpy = vi.spyOn(storage.snippets, 'create');

    let renderedContainer: HTMLElement;
    await act(async () => {
      const res = render(React.createElement(WorkspacePage));
      renderedContainer = res.container;
    });

    // Click the sidebar header add button
    const sidebarAddBtn = renderedContainer!.querySelector('aside button[title^="New Document"]') as HTMLButtonElement;
    expect(sidebarAddBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(sidebarAddBtn);
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Untitled Document',
      })
    );
  });
});
