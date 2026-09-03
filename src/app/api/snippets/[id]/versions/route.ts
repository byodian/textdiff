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
