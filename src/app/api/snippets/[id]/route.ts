import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
        },
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, filename, language, currentCode, createVersion, commitMsg } = body;

    const existing = await prisma.snippet.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const nextVersionNo = (existing.versions[0]?.versionNo ?? 0) + 1;

    const updated = await prisma.snippet.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : existing.title,
        filename: filename !== undefined ? filename : existing.filename,
        language: language !== undefined ? language : existing.language,
        currentCode: currentCode !== undefined ? currentCode : existing.currentCode,
        ...(createVersion
          ? {
              versions: {
                create: {
                  versionNo: nextVersionNo,
                  title: title || existing.title,
                  code: currentCode !== undefined ? currentCode : existing.currentCode,
                  commitMsg: commitMsg || `Version ${nextVersionNo}`,
                },
              },
            }
          : {}),
      },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.snippet.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
