import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';
import { passesCsrf } from '@/lib/security';

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const current = await getUserFromCookieHeader(req.headers.get('cookie'));
  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);
  let isFollowing = false;
  if (current) {
    const rel = await prisma.follow.findFirst({ where: { followerId: current.id, followingId: user.id } });
    isFollowing = !!rel;
  }
  return NextResponse.json({ user: { id: user.id, username: user.username }, followers, following, isFollowing });
}

// POST { action: 'follow' | 'unfollow' }
export async function POST(req: Request, { params }: { params: { username: string } }) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const me = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const target = await prisma.user.findUnique({ where: { username: params.username } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: 'Cannot follow self' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: 'follow' | 'unfollow' };
  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  if (action === 'follow') {
    try { await prisma.follow.create({ data: { followerId: me.id, followingId: target.id } }); } catch {}
    await ensureTasksForToday(me.id);
    await incrementFirstIncompleteOfType(me.id, 'FOLLOW');
    // notify target
    await prisma.notification.create({ data: { userId: target.id, actorId: me.id, type: 'FOLLOW' as any } });
  } else {
    await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: target.id } });
  }

  const followers = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ ok: true, followers });
}
