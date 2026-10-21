import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const prisma = new PrismaClient();

async function exportDevDb() {
  console.log('Reading development SQLite database via Prisma...');

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const snippets = await prisma.snippet.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const versions = await prisma.snippetVersion.findMany({
    orderBy: [{ snippetId: 'asc' }, { versionNo: 'asc' }],
  });

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

  const outputPath = path.resolve(rootDir, 'backup-dev.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`Successfully exported development database to ${outputPath}`);
  console.log(`- Workspaces: ${backupData.workspaces.length}`);
  console.log(`- Snippets:   ${backupData.snippets.length}`);
  console.log(`- Versions:   ${backupData.versions.length}`);
  console.log(`- File size:  ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

exportDevDb()
  .catch((err) => {
    console.error('Export failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
