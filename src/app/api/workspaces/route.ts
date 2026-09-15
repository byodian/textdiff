import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { snippets: true },
        },
      },
    });

    if (workspaces.length === 0) {
      const defaultWs = await prisma.workspace.create({
        data: {
          name: 'Default Workspace',
        },
        include: {
          _count: {
            select: { snippets: true },
          },
        },
      });
      workspaces = [defaultWs];
    }

    return NextResponse.json(workspaces);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body?.name || '').trim() || 'Untitled Workspace';

    const workspace = await prisma.workspace.create({
      data: { name },
      include: {
        _count: {
          select: { snippets: true },
        },
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
