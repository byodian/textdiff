import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/dev/db-backup/route';

describe('Dev Database Backup API', () => {
  it('returns valid BackupData from development SQLite database or backup file', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.version).toBe(1);
    expect(data.data.app).toBe('textdiff');
    expect(Array.isArray(data.data.workspaces)).toBe(true);
    expect(Array.isArray(data.data.snippets)).toBe(true);
    expect(Array.isArray(data.data.versions)).toBe(true);
    expect(data.data.workspaces.length).toBeGreaterThanOrEqual(1);
  });
});
