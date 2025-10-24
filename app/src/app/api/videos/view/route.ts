import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';
import { passesCsrf } from '@/lib/security';

// POST { videoId }
export async function POST(req: Request) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  const body = await req.json().catch(() => ({}));
  const { videoId } = body as { videoId?: string };
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  try {
    await prisma.video.update({ where: { id: videoId }, data: { views: { increment: 1 } } });
    if (user) {
      await ensureTasksForToday(user.id);
      await incrementFirstIncompleteOfType(user.id, 'WATCH');
    }
  } catch (e) {
    // ignore if not found
  }
  return NextResponse.json({ ok: true });
}
