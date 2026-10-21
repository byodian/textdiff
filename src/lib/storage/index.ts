/**
 * Local-First Client Storage Engine
 *
 * Implements persistent browser storage via IndexedDB with an in-memory
 * fallback for SSR, non-browser, and testing environments (Vitest/jsdom).
 */

export interface LocalWorkspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    snippets: number;
  };
}

export interface LocalVersion {
  id: string;
  snippetId: string;
  versionNo: number;
  title: string;
  code: string;
  commitMsg?: string | null;
  createdAt: string;
}

export interface LocalSnippet {
  id: string;
  workspaceId?: string | null;
  title: string;
  filename?: string | null;
  language: string;
  currentCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetDetail extends LocalSnippet {
  versions: LocalVersion[];
}

export interface SnippetSummary extends LocalSnippet {
  versions?: LocalVersion[];
}

export interface CreateSnippetInput {
  title?: string;
  filename?: string | null;
  language?: string;
  currentCode?: string;
  workspaceId?: string | null;
}

export interface UpdateSnippetInput {
  title?: string;
  filename?: string | null;
  language?: string;
  currentCode?: string;
  createVersion?: boolean;
  commitMsg?: string | null;
  workspaceId?: string | null;
}

export interface BackupData {
  version: number;
  app: string;
  exportedAt: string;
  workspaces: LocalWorkspace[];
  snippets: LocalSnippet[];
  versions: LocalVersion[];
}

export interface StorageBackend {
  getWorkspaces(): Promise<LocalWorkspace[]>;
  saveWorkspace(ws: LocalWorkspace): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;

  getSnippets(): Promise<LocalSnippet[]>;
  getSnippet(id: string): Promise<LocalSnippet | undefined>;
  saveSnippet(snippet: LocalSnippet): Promise<void>;
  deleteSnippet(id: string): Promise<void>;

  getVersions(): Promise<LocalVersion[]>;
  getVersion(id: string): Promise<LocalVersion | undefined>;
  saveVersion(version: LocalVersion): Promise<void>;
  deleteVersion(id: string): Promise<void>;
  deleteVersionsBySnippet(snippetId: string): Promise<void>;

  clear(): Promise<void>;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// In-Memory Storage Backend (for testing, SSR, or fallback)
// ---------------------------------------------------------------------------
export class MemoryBackend implements StorageBackend {
  private workspaces = new Map<string, LocalWorkspace>();
  private snippets = new Map<string, LocalSnippet>();
  private versions = new Map<string, LocalVersion>();

  async getWorkspaces(): Promise<LocalWorkspace[]> {
    return Array.from(this.workspaces.values());
  }

  async saveWorkspace(ws: LocalWorkspace): Promise<void> {
    this.workspaces.set(ws.id, { ...ws });
  }

  async deleteWorkspace(id: string): Promise<void> {
    this.workspaces.delete(id);
  }

  async getSnippets(): Promise<LocalSnippet[]> {
    return Array.from(this.snippets.values());
  }

  async getSnippet(id: string): Promise<LocalSnippet | undefined> {
    const s = this.snippets.get(id);
    return s ? { ...s } : undefined;
  }

  async saveSnippet(snippet: LocalSnippet): Promise<void> {
    this.snippets.set(snippet.id, { ...snippet });
  }

  async deleteSnippet(id: string): Promise<void> {
    this.snippets.delete(id);
  }

  async getVersions(): Promise<LocalVersion[]> {
    return Array.from(this.versions.values());
  }

  async getVersion(id: string): Promise<LocalVersion | undefined> {
    const v = this.versions.get(id);
    return v ? { ...v } : undefined;
  }

  async saveVersion(version: LocalVersion): Promise<void> {
    this.versions.set(version.id, { ...version });
  }

  async deleteVersion(id: string): Promise<void> {
    this.versions.delete(id);
  }

  async deleteVersionsBySnippet(snippetId: string): Promise<void> {
    this.versions.forEach((ver, id) => {
      if (ver.snippetId === snippetId) {
        this.versions.delete(id);
      }
    });
  }

  async clear(): Promise<void> {
    this.workspaces.clear();
    this.snippets.clear();
    this.versions.clear();
  }
}

// ---------------------------------------------------------------------------
// Browser Native IndexedDB Backend
// ---------------------------------------------------------------------------
const DB_NAME = 'textdiff_db';
const DB_VERSION = 1;

export class IndexedDBBackend implements StorageBackend {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('snippets')) {
          const sStore = db.createObjectStore('snippets', { keyPath: 'id' });
          sStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          sStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('versions')) {
          const vStore = db.createObjectStore('versions', { keyPath: 'id' });
          vStore.createIndex('snippetId', 'snippetId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async tx<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    fn: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const db = await this.getDB();
    const transaction = db.transaction(storeNames, mode);
    return fn(transaction);
  }

  async getWorkspaces(): Promise<LocalWorkspace[]> {
    return this.tx('workspaces', 'readonly', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('workspaces').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async saveWorkspace(ws: LocalWorkspace): Promise<void> {
    return this.tx('workspaces', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('workspaces').put(ws);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return this.tx('workspaces', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('workspaces').delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async getSnippets(): Promise<LocalSnippet[]> {
    return this.tx('snippets', 'readonly', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('snippets').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async getSnippet(id: string): Promise<LocalSnippet | undefined> {
    return this.tx('snippets', 'readonly', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('snippets').get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async saveSnippet(snippet: LocalSnippet): Promise<void> {
    return this.tx('snippets', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('snippets').put(snippet);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async deleteSnippet(id: string): Promise<void> {
    return this.tx('snippets', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('snippets').delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async getVersions(): Promise<LocalVersion[]> {
    return this.tx('versions', 'readonly', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('versions').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async getVersion(id: string): Promise<LocalVersion | undefined> {
    return this.tx('versions', 'readonly', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('versions').get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async saveVersion(version: LocalVersion): Promise<void> {
    return this.tx('versions', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('versions').put(version);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async deleteVersion(id: string): Promise<void> {
    return this.tx('versions', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const req = tx.objectStore('versions').delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  }

  async deleteVersionsBySnippet(snippetId: string): Promise<void> {
    const all = await this.getVersions();
    const toDelete = all.filter((v) => v.snippetId === snippetId);
    if (toDelete.length === 0) return;

    return this.tx('versions', 'readwrite', (tx) => {
      return new Promise((resolve, reject) => {
        const store = tx.objectStore('versions');
        for (const item of toDelete) {
          store.delete(item.id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['workspaces', 'snippets', 'versions'], 'readwrite');
    tx.objectStore('workspaces').clear();
    tx.objectStore('snippets').clear();
    tx.objectStore('versions').clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// ---------------------------------------------------------------------------
// High-Level Storage Facade
// ---------------------------------------------------------------------------
export class StorageManager {
  private backend: StorageBackend;

  constructor(backend?: StorageBackend) {
    if (backend) {
      this.backend = backend;
    } else if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
      this.backend = new IndexedDBBackend();
    } else {
      this.backend = new MemoryBackend();
    }
  }

  setBackend(backend: StorageBackend) {
    this.backend = backend;
  }

  private async ensureInitialized(): Promise<void> {
    const list = await this.backend.getWorkspaces();
    if (list.length === 0) {
      const now = new Date().toISOString();
      const defaultWs: LocalWorkspace = {
        id: generateId(),
        name: 'Default Workspace',
        createdAt: now,
        updatedAt: now,
      };
      await this.backend.saveWorkspace(defaultWs);
    }
  }

  // Workspaces API
  async listWorkspaces(): Promise<LocalWorkspace[]> {
    await this.ensureInitialized();
    const list = await this.backend.getWorkspaces();
    const snippets = await this.backend.getSnippets();

    // Sort by createdAt ascending
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Compute snippet counts
    return list.map((ws) => ({
      ...ws,
      _count: {
        snippets: snippets.filter((s) => s.workspaceId === ws.id).length,
      },
    }));
  }

  async createWorkspace(name: string): Promise<LocalWorkspace> {
    await this.ensureInitialized();
    const trimmed = (name || '').trim() || 'Untitled Workspace';
    const now = new Date().toISOString();
    const ws: LocalWorkspace = {
      id: generateId(),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      _count: { snippets: 0 },
    };
    await this.backend.saveWorkspace(ws);
    return ws;
  }

  async renameWorkspace(id: string, name: string): Promise<LocalWorkspace> {
    await this.ensureInitialized();
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new Error('Workspace name cannot be empty');
    }
    const workspaces = await this.backend.getWorkspaces();
    const existing = workspaces.find((w) => w.id === id);
    if (!existing) {
      throw new Error('Workspace not found');
    }
    const updated: LocalWorkspace = {
      ...existing,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
    await this.backend.saveWorkspace(updated);
    return updated;
  }

  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    await this.ensureInitialized();
    const workspaces = await this.backend.getWorkspaces();
    if (workspaces.length <= 1) {
      throw new Error('Cannot delete the only remaining workspace');
    }
    const existing = workspaces.find((w) => w.id === id);
    if (!existing) {
      throw new Error('Workspace not found');
    }
    const snippets = await this.backend.getSnippets();
    const count = snippets.filter((s) => s.workspaceId === id).length;
    if (count > 0) {
      throw new Error(
        `Cannot delete workspace "${existing.name}" because it still contains ${count} document${count > 1 ? 's' : ''}. Please move or delete the documents first.`
      );
    }
    await this.backend.deleteWorkspace(id);
    return { success: true };
  }

  // Snippets API
  async listSnippets(workspaceId?: string): Promise<SnippetSummary[]> {
    let snippets = await this.backend.getSnippets();
    if (workspaceId) {
      snippets = snippets.filter((s) => s.workspaceId === workspaceId);
    }
    // Sort by updatedAt descending
    snippets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const allVersions = await this.backend.getVersions();

    return snippets.map((s) => {
      const vers = allVersions
        .filter((v) => v.snippetId === s.id)
        .sort((a, b) => b.versionNo - a.versionNo);
      return {
        ...s,
        versions: vers.slice(0, 1),
      };
    });
  }

  async getSnippet(id: string): Promise<SnippetDetail | null> {
    const s = await this.backend.getSnippet(id);
    if (!s) return null;

    const allVersions = await this.backend.getVersions();
    const versions = allVersions
      .filter((v) => v.snippetId === id)
      .sort((a, b) => b.versionNo - a.versionNo);

    return {
      ...s,
      versions,
    };
  }

  async createSnippet(input: CreateSnippetInput): Promise<SnippetDetail> {
    const now = new Date().toISOString();
    const snippetId = generateId();
    const currentCode = input.currentCode || '';
    const title = input.title || 'Untitled Document';
    const language = input.language || 'plaintext';

    const snippet: LocalSnippet = {
      id: snippetId,
      workspaceId: input.workspaceId || null,
      title,
      filename: input.filename || null,
      language,
      currentCode,
      createdAt: now,
      updatedAt: now,
    };

    await this.backend.saveSnippet(snippet);

    const hasInitialCode = typeof currentCode === 'string' && currentCode.trim().length > 0;
    const versions: LocalVersion[] = [];

    if (hasInitialCode) {
      const v1: LocalVersion = {
        id: generateId(),
        snippetId,
        versionNo: 1,
        title,
        code: currentCode,
        commitMsg: 'Initial version',
        createdAt: now,
      };
      await this.backend.saveVersion(v1);
      versions.push(v1);
    }

    return {
      ...snippet,
      versions,
    };
  }

  async updateSnippet(id: string, input: UpdateSnippetInput): Promise<SnippetDetail> {
    const existing = await this.backend.getSnippet(id);
    if (!existing) {
      throw new Error('Snippet not found');
    }

    const targetCode = input.currentCode !== undefined ? input.currentCode : existing.currentCode;
    const allVersions = await this.backend.getVersions();
    const existingVersions = allVersions
      .filter((v) => v.snippetId === id)
      .sort((a, b) => b.versionNo - a.versionNo);

    const latestVersion = existingVersions[0];
    const isDuplicateContent = latestVersion && latestVersion.code === targetCode;
    const shouldCreateVersion = Boolean(input.createVersion && !isDuplicateContent);
    const nextVersionNo = (latestVersion?.versionNo ?? 0) + 1;

    const now = new Date().toISOString();
    const updatedSnippet: LocalSnippet = {
      ...existing,
      title: input.title !== undefined ? input.title : existing.title,
      filename: input.filename !== undefined ? input.filename : existing.filename,
      language: input.language !== undefined ? input.language : existing.language,
      workspaceId: input.workspaceId !== undefined ? input.workspaceId : existing.workspaceId,
      currentCode: targetCode,
      updatedAt: now,
    };

    await this.backend.saveSnippet(updatedSnippet);

    if (shouldCreateVersion) {
      const newVersion: LocalVersion = {
        id: generateId(),
        snippetId: id,
        versionNo: nextVersionNo,
        title: input.title || existing.title,
        code: targetCode,
        commitMsg: input.commitMsg || `Version ${nextVersionNo}`,
        createdAt: now,
      };
      await this.backend.saveVersion(newVersion);
      existingVersions.unshift(newVersion);
    }

    return {
      ...updatedSnippet,
      versions: existingVersions,
    };
  }

  async deleteSnippet(id: string): Promise<{ success: boolean }> {
    await this.backend.deleteVersionsBySnippet(id);
    await this.backend.deleteSnippet(id);
    return { success: true };
  }

  // Versions API
  async listVersions(snippetId: string): Promise<LocalVersion[]> {
    const all = await this.backend.getVersions();
    return all
      .filter((v) => v.snippetId === snippetId)
      .sort((a, b) => b.versionNo - a.versionNo);
  }

  async updateVersion(versionId: string, commitMsg: string | null): Promise<LocalVersion> {
    const existing = await this.backend.getVersion(versionId);
    if (!existing) {
      throw new Error('Version not found');
    }
    const updated: LocalVersion = {
      ...existing,
      commitMsg: commitMsg ?? null,
    };
    await this.backend.saveVersion(updated);
    return updated;
  }

  async deleteVersion(versionId: string): Promise<{ success: boolean }> {
    await this.backend.deleteVersion(versionId);
    return { success: true };
  }

  // Backup & Restore
  async exportBackup(): Promise<BackupData> {
    const [workspaces, snippets, versions] = await Promise.all([
      this.backend.getWorkspaces(),
      this.backend.getSnippets(),
      this.backend.getVersions(),
    ]);

    return {
      version: 1,
      app: 'textdiff',
      exportedAt: new Date().toISOString(),
      workspaces,
      snippets,
      versions,
    };
  }

  async importBackup(data: BackupData): Promise<{ success: boolean; importedCount: { workspaces: number; snippets: number; versions: number } }> {
    if (!data || typeof data !== 'object' || !Array.isArray(data.workspaces) || !Array.isArray(data.snippets)) {
      throw new Error('Invalid backup file format');
    }

    await this.backend.clear();

    for (const ws of data.workspaces) {
      await this.backend.saveWorkspace(ws);
    }
    for (const s of data.snippets) {
      await this.backend.saveSnippet(s);
    }
    if (Array.isArray(data.versions)) {
      for (const v of data.versions) {
        await this.backend.saveVersion(v);
      }
    }

    return {
      success: true,
      importedCount: {
        workspaces: data.workspaces.length,
        snippets: data.snippets.length,
        versions: data.versions?.length || 0,
      },
    };
  }

  async clearAll(): Promise<void> {
    await this.backend.clear();
  }
}

// Global Singleton storage instance
const defaultStorage = new StorageManager();

export const storage = {
  workspaces: {
    list: () => defaultStorage.listWorkspaces(),
    create: (name: string) => defaultStorage.createWorkspace(name),
    rename: (id: string, name: string) => defaultStorage.renameWorkspace(id, name),
    delete: (id: string) => defaultStorage.deleteWorkspace(id),
  },
  snippets: {
    list: (workspaceId?: string) => defaultStorage.listSnippets(workspaceId),
    get: (id: string) => defaultStorage.getSnippet(id),
    create: (input: CreateSnippetInput) => defaultStorage.createSnippet(input),
    update: (id: string, input: UpdateSnippetInput) => defaultStorage.updateSnippet(id, input),
    delete: (id: string) => defaultStorage.deleteSnippet(id),
  },
  versions: {
    list: (snippetId: string) => defaultStorage.listVersions(snippetId),
    update: (versionId: string, commitMsg: string | null) => defaultStorage.updateVersion(versionId, commitMsg),
    delete: (versionId: string) => defaultStorage.deleteVersion(versionId),
  },
  backup: {
    exportData: () => defaultStorage.exportBackup(),
    importData: (data: BackupData) => defaultStorage.importBackup(data),
  },
  setBackend: (backend: StorageBackend) => defaultStorage.setBackend(backend),
  clearAll: () => defaultStorage.clearAll(),
};

