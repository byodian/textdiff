import { beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Snippet" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "filename" TEXT,
      "language" TEXT NOT NULL DEFAULT 'typescript',
      "currentCode" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SnippetVersion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "snippetId" TEXT NOT NULL,
      "versionNo" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "commitMsg" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SnippetVersion_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SnippetVersion_snippetId_versionNo_idx" ON "SnippetVersion"("snippetId", "versionNo");
  `);
});
