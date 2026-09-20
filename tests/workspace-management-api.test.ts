import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { POST as createWorkspace } from '../src/app/api/workspaces/route';
import { PUT as renameWorkspace, DELETE as deleteWorkspace } from '../src/app/api/workspaces/[id]/route';
import { POST as createSnippet, GET as listSnippets } from '../src/app/api/snippets/route';
import { PUT as updateSnippet } from '../src/app/api/snippets/[id]/route';

describe('Workspace Management API Tests', () => {
  beforeEach(async () => {
    await prisma.snippetVersion.deleteMany();
    await prisma.snippet.deleteMany();
    await prisma.workspace.deleteMany();
  });

  describe('PUT /api/workspaces/[id] (Rename)', () => {
    it('successfully renames an existing workspace', async () => {
      const ws = await prisma.workspace.create({
        data: { name: 'Old Workspace Name' },
      });

      const req = new Request(`http://localhost:3000/api/workspaces/${ws.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Shiny Workspace' }),
      });

      const res = await renameWorkspace(req, { params: { id: ws.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(ws.id);
      expect(data.name).toBe('New Shiny Workspace');
      expect(data._count?.snippets).toBe(0);

      const dbWs = await prisma.workspace.findUnique({ where: { id: ws.id } });
      expect(dbWs?.name).toBe('New Shiny Workspace');
    });

    it('rejects empty or whitespace-only workspace names with 400', async () => {
      const ws = await prisma.workspace.create({
        data: { name: 'Valid Workspace' },
      });

      const req = new Request(`http://localhost:3000/api/workspaces/${ws.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: '   ' }),
      });

      const res = await renameWorkspace(req, { params: { id: ws.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('cannot be empty');
    });

    it('returns 404 for non-existent workspace id', async () => {
      const req = new Request('http://localhost:3000/api/workspaces/non-existent-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Valid Name' }),
      });

      const res = await renameWorkspace(req, { params: { id: 'non-existent-id' } });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/workspaces/[id] (Delete)', () => {
    it('refuses to delete the only remaining workspace', async () => {
      const onlyWs = await prisma.workspace.create({
        data: { name: 'Single Workspace' },
      });

      const req = new Request(`http://localhost:3000/api/workspaces/${onlyWs.id}`, {
        method: 'DELETE',
      });

      const res = await deleteWorkspace(req, { params: { id: onlyWs.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Cannot delete the only remaining workspace');

      // Verify workspace was not deleted
      const check = await prisma.workspace.findUnique({ where: { id: onlyWs.id } });
      expect(check).not.toBeNull();
    });

    it('refuses to delete workspace if it still contains documents', async () => {
      const ws1 = await prisma.workspace.create({ data: { name: 'Workspace 1' } });
      const ws2 = await prisma.workspace.create({ data: { name: 'Workspace 2' } });

      // Create a document in ws1
      const doc = await prisma.snippet.create({
        data: {
          title: 'Doc in WS1',
          currentCode: 'hello',
          workspaceId: ws1.id,
        },
      });

      const req = new Request(`http://localhost:3000/api/workspaces/${ws1.id}`, {
        method: 'DELETE',
      });

      const res = await deleteWorkspace(req, { params: { id: ws1.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('still contains 1 document');
      expect(data.snippetCount).toBe(1);

      // Neither ws1 nor doc should be deleted
      const checkWs = await prisma.workspace.findUnique({ where: { id: ws1.id } });
      expect(checkWs).not.toBeNull();
      const checkDoc = await prisma.snippet.findUnique({ where: { id: doc.id } });
      expect(checkDoc).not.toBeNull();
    });

    it('successfully deletes an empty workspace when count > 1', async () => {
      const ws1 = await prisma.workspace.create({ data: { name: 'Empty Workspace 1' } });
      const ws2 = await prisma.workspace.create({ data: { name: 'Workspace 2' } });

      const req = new Request(`http://localhost:3000/api/workspaces/${ws1.id}`, {
        method: 'DELETE',
      });

      const res = await deleteWorkspace(req, { params: { id: ws1.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const checkWs = await prisma.workspace.findUnique({ where: { id: ws1.id } });
      expect(checkWs).toBeNull();

      const checkWs2 = await prisma.workspace.findUnique({ where: { id: ws2.id } });
      expect(checkWs2).not.toBeNull();
    });
  });

  describe('Document Workspace Switching (PUT /api/snippets/[id])', () => {
    it('moves a snippet from one workspace to another', async () => {
      const wsA = await prisma.workspace.create({ data: { name: 'Workspace Alpha' } });
      const wsB = await prisma.workspace.create({ data: { name: 'Workspace Beta' } });

      const snippet = await prisma.snippet.create({
        data: {
          title: 'Config File',
          currentCode: 'config=true',
          workspaceId: wsA.id,
        },
      });

      // Move snippet to Workspace Beta
      const moveReq = new Request(`http://localhost:3000/api/snippets/${snippet.id}`, {
        method: 'PUT',
        body: JSON.stringify({ workspaceId: wsB.id }),
      });

      const moveRes = await updateSnippet(moveReq, { params: { id: snippet.id } });
      expect(moveRes.status).toBe(200);
      const updated = await moveRes.json();
      expect(updated.workspaceId).toBe(wsB.id);

      // Check query with workspaceId filter
      const listResA = await listSnippets(new Request(`http://localhost:3000/api/snippets?workspaceId=${wsA.id}`));
      const listA = await listResA.json();
      expect(listA.length).toBe(0);

      const listResB = await listSnippets(new Request(`http://localhost:3000/api/snippets?workspaceId=${wsB.id}`));
      const listB = await listResB.json();
      expect(listB.length).toBe(1);
      expect(listB[0].id).toBe(snippet.id);
    });
  });
});
