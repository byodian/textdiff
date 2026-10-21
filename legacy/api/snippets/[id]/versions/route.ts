import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const versions = await prisma.snippetVersion.findMany({
      where: { snippetId: params.id },
      orderBy: { versionNo: 'desc' },
    });
    return NextResponse.json(versions);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { versionId, commitMsg } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const updated = await prisma.snippetVersion.update({
      where: { id: versionId },
      data: {
        commitMsg: commitMsg ?? null,
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
    const url = new URL(req.url);
    const versionId = url.searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    await prisma.snippetVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
