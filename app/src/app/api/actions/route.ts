import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';
import { passesCsrf } from '@/lib/security';

// Record a user action to advance matching daily task type
// POST { type: 'WATCH' | 'LIKE' | 'COMMENT' | 'UPLOAD' | 'FOLLOW' | 'CUSTOM' }
export async function POST(req: Request) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { type } = body as { type?: string };
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

  await ensureTasksForToday(user.id);
  const updated = await incrementFirstIncompleteOfType(user.id, type as any);
  return NextResponse.json({ ok: true, updated });
}
