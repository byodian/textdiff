import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { GET as listSnippets, POST as createSnippet } from '../src/app/api/snippets/route';
import { GET as getSnippet, PUT as updateSnippet, DELETE as deleteSnippet } from '../src/app/api/snippets/[id]/route';
import { GET as getVersions } from '../src/app/api/snippets/[id]/versions/route';

describe('HTTP API Seam Tests', () => {
  beforeEach(async () => {
    await prisma.snippetVersion.deleteMany();
    await prisma.snippet.deleteMany();
  });

  it('can create, retrieve, update with version snapshot, and delete via API', async () => {
    // 1. Create Snippet
    const createReq = new Request('http://localhost:3000/api/snippets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'API Test Snippet',
        filename: 'algo.py',
        language: 'python',
        currentCode: 'def solve(): pass',
      }),
    });
    const createRes = await createSnippet(createReq);
    expect(createRes.status).toBe(201);
    const createdData = await createRes.json();
    expect(createdData.id).toBeDefined();
    expect(createdData.title).toBe('API Test Snippet');
    expect(createdData.versions.length).toBe(1);

    // 2. List Snippets
    const listRes = await listSnippets();
    const listData = await listRes.json();
    expect(listData.length).toBe(1);
    expect(listData[0].id).toBe(createdData.id);

    // 3. Update Snippet with a new snapshot version
    const updateReq = new Request(`http://localhost:3000/api/snippets/${createdData.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        currentCode: 'def solve(): return 42',
        createVersion: true,
        commitMsg: 'Implemented solver',
      }),
    });
    const updateRes = await updateSnippet(updateReq, { params: { id: createdData.id } });
    const updateData = await updateRes.json();
    expect(updateData.currentCode).toBe('def solve(): return 42');
    expect(updateData.versions.length).toBe(2);
    expect(updateData.versions[0].versionNo).toBe(2);
    expect(updateData.versions[0].commitMsg).toBe('Implemented solver');

    // 4. Query Versions
    const versionsReq = new Request(`http://localhost:3000/api/snippets/${createdData.id}/versions`);
    const versionsRes = await getVersions(versionsReq, { params: { id: createdData.id } });
    const versionsData = await versionsRes.json();
    expect(versionsData.length).toBe(2);

    // 5. Delete Snippet
    const deleteReq = new Request(`http://localhost:3000/api/snippets/${createdData.id}`, {
      method: 'DELETE',
    });
    const deleteRes = await deleteSnippet(deleteReq, { params: { id: createdData.id } });
    expect(deleteRes.status).toBe(200);

    // Verify deletion in DB
    const count = await prisma.snippet.count();
    expect(count).toBe(0);
  });
});
