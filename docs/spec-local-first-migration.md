# Specification: Local-First Storage Migration

## 1. Domain Entities & Schema

### 1.1 Workspaces (`workspaces`)
```typescript
interface LocalWorkspace {
  id: string;          // uuid or nanoid
  name: string;
  createdAt: string;   // ISO timestamp
  updatedAt: string;
}
```

### 1.2 Snippets (`snippets`)
```typescript
interface LocalSnippet {
  id: string;
  workspaceId: string; // Foreign key to Workspace.id
  title: string;
  filename?: string | null;
  language: string;
  currentCode: string;
  createdAt: string;
  updatedAt: string;
}
```

### 1.3 Snippet Versions (`versions`)
```typescript
interface LocalVersion {
  id: string;
  snippetId: string;   // Foreign key to Snippet.id
  versionNo: number;   // Incremental: 1, 2, 3...
  title: string;
  code: string;
  commitMsg?: string | null;
  createdAt: string;
}
```

---

## 2. Storage Adapter Layer (`src/lib/storage`)

A single, clean facade module `storage` (`src/lib/storage/index.ts`):

- **Workspaces**:
  - `listWorkspaces(): Promise<WorkspaceSummary[]>`: returns all workspaces ordered by `createdAt asc`, with `_count.snippets` included. If empty, automatically creates and returns `Default Workspace`.
  - `createWorkspace(name: string): Promise<LocalWorkspace>`
  - `renameWorkspace(id: string, name: string): Promise<LocalWorkspace>`
  - `deleteWorkspace(id: string): Promise<{ success: boolean }>`: verifies not the only remaining workspace and has 0 snippets.

- **Snippets**:
  - `listSnippets(workspaceId?: string): Promise<SnippetSummary[]>`: returns snippets with latest version snapshot in `versions[0]`.
  - `getSnippet(id: string): Promise<SnippetDetail | null>`: returns snippet with full descending versions array.
  - `createSnippet(data: CreateSnippetInput): Promise<SnippetDetail>`: if initial code provided, automatically creates Version 1.
  - `updateSnippet(id: string, data: UpdateSnippetInput): Promise<SnippetDetail>`: updates metadata, updates `currentCode`, optionally creates a new version if content changed and `createVersion: true`.
  - `deleteSnippet(id: string): Promise<{ success: boolean }>`: deletes snippet and its cascade versions.

- **Versions**:
  - `listVersions(snippetId: string): Promise<LocalVersion[]>`: returns all versions descending by `versionNo`.
  - `updateVersion(versionId: string, commitMsg: string | null): Promise<LocalVersion>`: updates commit note.
  - `deleteVersion(versionId: string): Promise<{ success: boolean }>`: deletes specific version snapshot.

- **Backup / Restore**:
  - `exportBackup(): Promise<BackupData>`: dumps all workspaces, snippets, and versions into a clean JSON structure.
  - `importBackup(backup: BackupData): Promise<void>`: restores data from JSON.

---

## 3. Implementation Plan

1. **Implement `src/lib/storage/index.ts`**:
   - IndexedDB object stores: `workspaces`, `snippets`, `versions`.
   - Index on `snippets.workspaceId` and `versions.snippetId`.
   - Memory storage fallback when running in Node.js / SSR / Vitest jsdom environments.
2. **Refactor `src/app/page.tsx`**:
   - Replace all `fetch('/api/...')` calls with direct calls to `storage.*`.
   - Add Backup Export and Restore triggers in the More Actions menu or Command Palette.
3. **Verify and Update Tests**:
   - Ensure all existing unit & integration tests pass seamlessly with the storage layer.
4. **Configure Static Export**:
   - Update `next.config.mjs` to add `output: 'export'`.
