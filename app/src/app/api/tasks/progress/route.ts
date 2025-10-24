import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { incrementTaskProgress } from '@/lib/tasks';

export async function POST(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { taskId } = body as { taskId?: string };
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  const updated = await incrementTaskProgress(user.id, taskId);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ task: updated });
}
