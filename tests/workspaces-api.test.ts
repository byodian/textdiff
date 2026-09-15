import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { GET as listWorkspaces, POST as createWorkspace } from '../src/app/api/workspaces/route';
import { GET as listSnippets, POST as createSnippet } from '../src/app/api/snippets/route';

describe('Workspaces & Document Domain API Seam Tests', () => {
  beforeEach(async () => {
    await prisma.snippetVersion.deleteMany();
    await prisma.snippet.deleteMany();
    await prisma.workspace.deleteMany();
  });

  it('auto-provisions Default Workspace when querying an empty database', async () => {
    const res = await listWorkspaces();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Default Workspace');
  });

  it('creates custom workspaces and isolates documents by workspaceId', async () => {
    // 1. Create custom workspace
    const wsReq = new Request('http://localhost:3000/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'Order Service Nacos' }),
    });
    const wsRes = await createWorkspace(wsReq);
    expect(wsRes.status).toBe(201);
    const ws = await wsRes.json();
    expect(ws.name).toBe('Order Service Nacos');

    // 2. Create document in this custom workspace
    const docReq = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'application.yml',
        filename: 'application.yml',
        language: 'yaml',
        currentCode: 'server:\n  port: 8080',
        workspaceId: ws.id,
      }),
    });
    const docRes = await createSnippet(docReq);
    expect(docRes.status).toBe(201);
    const doc = await docRes.json();
    expect(doc.workspaceId).toBe(ws.id);

    // 3. Create document without workspace (defaults to none or default)
    const otherReq = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'General SQL',
        currentCode: 'SELECT 1;',
      }),
    });
    await createSnippet(otherReq);

    // 4. Query with ?workspaceId filter
    const filterReq = new Request(`http://localhost:3000/api/snippets?workspaceId=${ws.id}`);
    const filterRes = await listSnippets(filterReq);
    const filteredList = await filterRes.json();
    expect(filteredList.length).toBe(1);
    expect(filteredList[0].id).toBe(doc.id);
    expect(filteredList[0].title).toBe('application.yml');
  });
});
