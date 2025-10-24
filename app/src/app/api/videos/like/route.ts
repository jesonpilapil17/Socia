import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST { videoId, action: 'like' | 'unlike' }
export async function POST(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { videoId, action } = body as { videoId?: string; action?: 'like' | 'unlike' };
  if (!videoId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    if (action === 'like') {
      await prisma.like.create({ data: { userId: user.id, videoId } });
    } else {
      await prisma.like.deleteMany({ where: { userId: user.id, videoId } });
    }
  } catch (e) {
    // ignore unique violation on like create
  }

  const likesCount = await prisma.like.count({ where: { videoId } });
  const liked = action === 'like';
  return NextResponse.json({ liked, likesCount });
}
