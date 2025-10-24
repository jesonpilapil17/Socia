import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await prisma.bookmark.findMany({ where: { userId: user.id }, include: { video: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items });
}
