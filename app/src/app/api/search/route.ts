import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ videos: [], users: [] });

  const take = Math.min(parseInt(url.searchParams.get('take') || '20', 10), 50);
  const hashtag = q.startsWith('#') ? q.slice(1) : null;

  const videos = await prisma.video.findMany({
    where: hashtag
      ? { description: { contains: `#${hashtag}`, mode: 'insensitive' } }
      : { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const users = await prisma.user.findMany({
    where: { username: { contains: q.replace(/^@/, ''), mode: 'insensitive' } },
    select: { id: true, username: true },
    take: 10,
  });

  return NextResponse.json({ videos, users });
}
