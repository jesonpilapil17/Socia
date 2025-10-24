import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { passesCsrf } from '@/lib/security';

// POST { videoId, action: 'like' | 'unlike' }
export async function POST(req: Request) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { videoId, action } = body as { videoId?: string; action?: 'like' | 'unlike' };
  if (!videoId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    if (action === 'like') {
      await prisma.like.create({ data: { userId: user.id, videoId } });
      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (video && video.userId !== user.id) {
        await prisma.notification.create({ data: { userId: video.userId, actorId: user.id, type: 'LIKE' as any, videoId } });
      }
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
