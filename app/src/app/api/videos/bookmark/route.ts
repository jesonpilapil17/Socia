import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';

// POST { videoId, action: 'save' | 'unsave' }
export async function POST(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { videoId, action } = body as { videoId?: string; action?: 'save' | 'unsave' };
  if (!videoId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (action === 'save') {
    try { await prisma.bookmark.create({ data: { userId: user.id, videoId } }); } catch {}
  } else {
    await prisma.bookmark.deleteMany({ where: { userId: user.id, videoId } });
  }
  const saved = action === 'save';
  return NextResponse.json({ saved });
}
