import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const snippets = await prisma.snippet.findMany({
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
    const { title, filename, language, currentCode } = body;

    const snippet = await prisma.snippet.create({
      data: {
        title: title || 'Untitled Snippet',
        filename: filename || null,
        language: language || 'typescript',
        currentCode: currentCode || '',
        versions: {
          create: {
            versionNo: 1,
            title: title || 'Untitled Snippet',
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
