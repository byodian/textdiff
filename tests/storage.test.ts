import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager, MemoryBackend } from '../src/lib/storage';

describe('Local-First Storage Engine Tests', () => {
  let backend: MemoryBackend;
  let storage: StorageManager;

  beforeEach(() => {
    backend = new MemoryBackend();
    storage = new StorageManager(backend);
  });

  describe('Workspaces Management', () => {
    it('initializes Default Workspace when empty', async () => {
      const workspaces = await storage.listWorkspaces();
      expect(workspaces.length).toBe(1);
      expect(workspaces[0].name).toBe('Default Workspace');
      expect(workspaces[0]._count?.snippets).toBe(0);
    });

    it('can create a new workspace with trimmed name', async () => {
      const created = await storage.createWorkspace('  Project Delta  ');
      expect(created.name).toBe('Project Delta');
      expect(created.id).toBeDefined();

      const list = await storage.listWorkspaces();
      expect(list.length).toBe(2);
      expect(list.map((w) => w.name)).toContain('Project Delta');
    });

    it('can rename an existing workspace', async () => {
      const ws = await storage.createWorkspace('Old Name');
      const renamed = await storage.renameWorkspace(ws.id, 'New Name');
      expect(renamed.name).toBe('New Name');

      const list = await storage.listWorkspaces();
      const target = list.find((w) => w.id === ws.id);
      expect(target?.name).toBe('New Name');
    });

    it('throws error when renaming workspace with empty string', async () => {
      const ws = await storage.createWorkspace('Test WS');
      await expect(storage.renameWorkspace(ws.id, '   ')).rejects.toThrow(
        /Workspace name cannot be empty/
      );
    });

    it('prevents deleting the only remaining workspace', async () => {
      const [defaultWs] = await storage.listWorkspaces();
      await expect(storage.deleteWorkspace(defaultWs.id)).rejects.toThrow(
        /Cannot delete the only remaining workspace/
      );
    });

    it('prevents deleting workspace that still contains documents', async () => {
      const ws = await storage.createWorkspace('Active WS');
      await storage.createSnippet({
        title: 'Doc.ts',
        currentCode: 'const x = 1;',
        workspaceId: ws.id,
      });

      await expect(storage.deleteWorkspace(ws.id)).rejects.toThrow(
        /Cannot delete workspace "Active WS" because it still contains 1 document/
      );
    });

    it('deletes an empty workspace successfully when other workspaces exist', async () => {
      const ws = await storage.createWorkspace('To Delete');
      const res = await storage.deleteWorkspace(ws.id);
      expect(res.success).toBe(true);

      const list = await storage.listWorkspaces();
      expect(list.find((w) => w.id === ws.id)).toBeUndefined();
    });
  });

  describe('Snippets & Versions Lifecycle', () => {
    it('creates an empty unversioned document when code is empty', async () => {
      const snippet = await storage.createSnippet({
        title: 'Untitled.txt',
        currentCode: '',
      });

      expect(snippet.id).toBeDefined();
      expect(snippet.title).toBe('Untitled.txt');
      expect(snippet.versions.length).toBe(0);
    });

    it('creates Version 1 when initial code is non-empty', async () => {
      const snippet = await storage.createSnippet({
        title: 'Server.ts',
        language: 'typescript',
        currentCode: 'const port = 8080;',
      });

      expect(snippet.versions.length).toBe(1);
      expect(snippet.versions[0].versionNo).toBe(1);
      expect(snippet.versions[0].code).toBe('const port = 8080;');
      expect(snippet.versions[0].commitMsg).toBe('Initial version');
    });

    it('lists snippets filtered by workspaceId and sorted by updatedAt desc', async () => {
      const [defaultWs] = await storage.listWorkspaces();
      const otherWs = await storage.createWorkspace('Other WS');

      await storage.createSnippet({
        title: 'Doc1.ts',
        currentCode: '1',
        workspaceId: defaultWs.id,
      });

      await storage.createSnippet({
        title: 'Doc2.ts',
        currentCode: '2',
        workspaceId: otherWs.id,
      });

      const defaultDocs = await storage.listSnippets(defaultWs.id);
      expect(defaultDocs.length).toBe(1);
      expect(defaultDocs[0].title).toBe('Doc1.ts');

      const otherDocs = await storage.listSnippets(otherWs.id);
      expect(otherDocs.length).toBe(1);
      expect(otherDocs[0].title).toBe('Doc2.ts');

      const allDocs = await storage.listSnippets();
      expect(allDocs.length).toBe(2);
    });

    it('creates new version snapshot on update when createVersion is true and content changed', async () => {
      const snippet = await storage.createSnippet({
        title: 'Notes.md',
        currentCode: '# Line 1',
      });
      expect(snippet.versions.length).toBe(1);

      const updated = await storage.updateSnippet(snippet.id, {
        currentCode: '# Line 1\n# Line 2',
        createVersion: true,
        commitMsg: 'Added line 2',
      });

      expect(updated.currentCode).toBe('# Line 1\n# Line 2');
      expect(updated.versions.length).toBe(2);
      expect(updated.versions[0].versionNo).toBe(2);
      expect(updated.versions[0].commitMsg).toBe('Added line 2');
    });

    it('does NOT create duplicate version when content is identical', async () => {
      const snippet = await storage.createSnippet({
        title: 'App.tsx',
        currentCode: 'export default () => <div />;',
      });
      expect(snippet.versions.length).toBe(1);

      const updated = await storage.updateSnippet(snippet.id, {
        currentCode: 'export default () => <div />;',
        createVersion: true,
      });

      expect(updated.versions.length).toBe(1);
    });

    it('can update metadata (title, language, workspaceId) without creating versions', async () => {
      const snippet = await storage.createSnippet({
        title: 'Config.txt',
        currentCode: 'foo=bar',
      });

      const updated = await storage.updateSnippet(snippet.id, {
        title: 'Config.properties',
        language: 'properties',
      });

      expect(updated.title).toBe('Config.properties');
      expect(updated.language).toBe('properties');
      expect(updated.versions.length).toBe(1);
    });

    it('cascades deletion of all version snapshots when snippet is deleted', async () => {
      const snippet = await storage.createSnippet({
        title: 'Draft.md',
        currentCode: 'Initial',
      });
      await storage.updateSnippet(snippet.id, {
        currentCode: 'Updated',
        createVersion: true,
      });

      const beforeDelete = await storage.listVersions(snippet.id);
      expect(beforeDelete.length).toBe(2);

      await storage.deleteSnippet(snippet.id);

      const afterDelete = await storage.listVersions(snippet.id);
      expect(afterDelete.length).toBe(0);

      const retrieved = await storage.getSnippet(snippet.id);
      expect(retrieved).toBeNull();
    });

    it('updates version commit note and can delete individual versions', async () => {
      const snippet = await storage.createSnippet({
        title: 'Script.py',
        currentCode: 'print(1)',
      });
      const v1 = snippet.versions[0];

      const updatedVer = await storage.updateVersion(v1.id, 'New custom summary note');
      expect(updatedVer.commitMsg).toBe('New custom summary note');

      const delRes = await storage.deleteVersion(v1.id);
      expect(delRes.success).toBe(true);

      const remaining = await storage.listVersions(snippet.id);
      expect(remaining.length).toBe(0);
    });
  });

  describe('Backup & Restore (JSON Export / Import)', () => {
    it('exports all workspaces, snippets, and versions to backup format', async () => {
      const ws = await storage.createWorkspace('Backup WS');
      const snippet = await storage.createSnippet({
        title: 'ExportMe.ts',
        currentCode: 'export const hello = "world";',
        workspaceId: ws.id,
      });

      const backup = await storage.exportBackup();
      expect(backup.version).toBe(1);
      expect(backup.app).toBe('textdiff');
      expect(backup.workspaces.some((w) => w.name === 'Backup WS')).toBe(true);
      expect(backup.snippets.some((s) => s.title === 'ExportMe.ts')).toBe(true);
      expect(backup.versions.length).toBeGreaterThan(0);
    });

    it('restores backup cleanly and overwrites existing state', async () => {
      const backupData = {
        version: 1,
        app: 'textdiff',
        exportedAt: new Date().toISOString(),
        workspaces: [
          {
            id: 'ws-restored',
            name: 'Restored Workspace',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        snippets: [
          {
            id: 'snip-restored',
            workspaceId: 'ws-restored',
            title: 'Restored.sql',
            language: 'sql',
            currentCode: 'SELECT 1;',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        versions: [
          {
            id: 'ver-restored',
            snippetId: 'snip-restored',
            versionNo: 1,
            title: 'Restored.sql',
            code: 'SELECT 1;',
            commitMsg: 'Imported version',
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const result = await storage.importBackup(backupData);
      expect(result.success).toBe(true);
      expect(result.importedCount.workspaces).toBe(1);
      expect(result.importedCount.snippets).toBe(1);
      expect(result.importedCount.versions).toBe(1);

      const workspaces = await storage.listWorkspaces();
      expect(workspaces.length).toBe(1);
      expect(workspaces[0].name).toBe('Restored Workspace');

      const snippets = await storage.listSnippets();
      expect(snippets.length).toBe(1);
      expect(snippets[0].title).toBe('Restored.sql');

      const versions = await storage.listVersions('snip-restored');
      expect(versions.length).toBe(1);
      expect(versions[0].code).toBe('SELECT 1;');
    });
  });
});
