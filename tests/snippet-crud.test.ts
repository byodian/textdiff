import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';

describe('Snippet CRUD seam tests', () => {
  beforeEach(async () => {
    await prisma.snippetVersion.deleteMany();
    await prisma.snippet.deleteMany();
  });

  it('can create a snippet with initial version and retrieve it', async () => {
    const snippet = await prisma.snippet.create({
      data: {
        title: 'Initial Script',
        filename: 'script.ts',
        language: 'typescript',
        currentCode: 'console.log("hello world");',
        versions: {
          create: {
            versionNo: 1,
            title: 'Initial Script',
            code: 'console.log("hello world");',
            commitMsg: 'Initial commit',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    expect(snippet.id).toBeDefined();
    expect(snippet.title).toBe('Initial Script');
    expect(snippet.versions.length).toBe(1);
    expect(snippet.versions[0].versionNo).toBe(1);
    expect(snippet.versions[0].code).toBe('console.log("hello world");');
  });

  it('can update snippet code and append new version', async () => {
    const snippet = await prisma.snippet.create({
      data: {
        title: 'Draft',
        language: 'javascript',
        currentCode: 'const a = 1;',
      },
    });

    const updated = await prisma.snippet.update({
      where: { id: snippet.id },
      data: {
        currentCode: 'const a = 2;',
        versions: {
          create: {
            versionNo: 1,
            title: 'Draft',
            code: 'const a = 2;',
            commitMsg: 'Update a value',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    expect(updated.currentCode).toBe('const a = 2;');
    expect(updated.versions[0].commitMsg).toBe('Update a value');
  });

  it('cascades deletion of versions when snippet is deleted', async () => {
    const snippet = await prisma.snippet.create({
      data: {
        title: 'To Delete',
        language: 'python',
        currentCode: 'print("delete me")',
        versions: {
          create: {
            versionNo: 1,
            title: 'To Delete',
            code: 'print("delete me")',
          },
        },
      },
    });

    await prisma.snippet.delete({
      where: { id: snippet.id },
    });

    const versions = await prisma.snippetVersion.findMany({
      where: { snippetId: snippet.id },
    });

    expect(versions.length).toBe(0);
  });
});
