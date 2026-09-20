import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Workspace name cannot be empty' }, { status: 400 });
    }

    const existing = await prisma.workspace.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: { name },
      include: {
        _count: {
          select: { snippets: true },
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
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const count = await prisma.workspace.count();
    if (count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only remaining workspace' },
        { status: 400 }
      );
    }

    const existing = await prisma.workspace.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const snippetCount = await prisma.snippet.count({
      where: { workspaceId: params.id },
    });

    if (snippetCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete workspace "${existing.name}" because it still contains ${snippetCount} document${snippetCount > 1 ? 's' : ''}. Please move or delete the documents first.`,
          snippetCount,
        },
        { status: 400 }
      );
    }

    await prisma.workspace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
