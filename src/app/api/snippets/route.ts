import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req?: Request) {
  try {
    let whereClause = {};
    if (req && req.url) {
      const url = new URL(req.url);
      const wsId = url.searchParams.get('workspaceId');
      if (wsId) {
        whereClause = { workspaceId: wsId };
      }
    }

    const snippets = await prisma.snippet.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
      },
    });
    return NextResponse.json(snippets);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, filename, language, currentCode, workspaceId } = body;

    const snippet = await prisma.snippet.create({
      data: {
        title: title || 'Untitled Document',
        filename: filename || null,
        language: language || 'plaintext',
        currentCode: currentCode || '',
        workspaceId: workspaceId || null,
        versions: {
          create: {
            versionNo: 1,
            title: title || 'Untitled Document',
            code: currentCode || '',
            commitMsg: 'Initial version',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
