import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';
import { passesCsrf } from '@/lib/security';

// POST { url, title, description }
export async function POST(req: Request) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { url, title, description } = body as { url?: string; title?: string; description?: string };
  if (!url || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const created = await prisma.video.create({ data: { userId: user.id, url, title, description: description || '' } });
  // credit UPLOAD task directly
  await ensureTasksForToday(user.id);
  await incrementFirstIncompleteOfType(user.id, 'UPLOAD');
  return NextResponse.json({ video: created });
}
