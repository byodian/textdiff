import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Try reading directly from prisma
    const [workspaces, snippets, versions] = await Promise.all([
      prisma.workspace.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.snippet.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.snippetVersion.findMany({ orderBy: [{ snippetId: 'asc' }, { versionNo: 'asc' }] }),
    ]);

    if (workspaces.length > 0 || snippets.length > 0) {
      const backupData = {
        version: 1,
        app: 'textdiff',
        exportedAt: new Date().toISOString(),
        workspaces: workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
        })),
        snippets: snippets.map((s) => ({
          id: s.id,
          workspaceId: s.workspaceId,
          title: s.title,
          filename: s.filename,
          language: s.language,
          currentCode: s.currentCode,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        versions: versions.map((v) => ({
          id: v.id,
          snippetId: v.snippetId,
          versionNo: v.versionNo,
          title: v.title,
          code: v.code,
          commitMsg: v.commitMsg,
          createdAt: v.createdAt.toISOString(),
        })),
      };

      return NextResponse.json({ success: true, source: 'prisma', data: backupData });
    }

    // 2. Fallback to backup-dev.json if db had 0 records
    const backupFile = path.resolve(process.cwd(), 'backup-dev.json');
    if (fs.existsSync(backupFile)) {
      const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
      return NextResponse.json({ success: true, source: 'file', data });
    }

    return NextResponse.json({ success: false, message: 'No dev database data found' }, { status: 404 });
  } catch (err: unknown) {
    // If prisma query fails, try fallback to backup-dev.json
    try {
      const backupFile = path.resolve(process.cwd(), 'backup-dev.json');
      if (fs.existsSync(backupFile)) {
        const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
        return NextResponse.json({ success: true, source: 'file', data });
      }
    } catch {
      // ignore
    }

    const message = err instanceof Error ? err.message : 'Failed to export dev data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
