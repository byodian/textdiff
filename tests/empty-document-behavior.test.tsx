// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { POST as createSnippet } from '../src/app/api/snippets/route';

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
    const { PUT: updateSnippet } = await import('../src/app/api/snippets/[id]/route');
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

    const snippetsData = [
      {
        id: 'empty-doc',
        title: 'Untitled Document',
        language: 'plaintext',
        currentCode: '',
        versions: [],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'existing-doc',
        title: 'Existing.ts',
        language: 'typescript',
        currentCode: 'const a = 1;',
        versions: [{ versionNo: 1, title: 'Existing.ts', code: 'const a = 1;' }],
        updatedAt: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/workspaces') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url === '/api/snippets' || url.startsWith('/api/snippets?')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(snippetsData) });
      }
      if (url === '/api/snippets/empty-doc') {
        if (options?.method === 'DELETE') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(snippetsData[0]) });
      }
      if (url === '/api/snippets/existing-doc') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(snippetsData[1]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

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

    // Must delete the empty unedited document
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/snippets/empty-doc',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
