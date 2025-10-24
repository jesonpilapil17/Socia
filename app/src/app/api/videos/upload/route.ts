import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';

// POST { url, title, description }
export async function POST(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { url, title, description } = body as { url?: string; title?: string; description?: string };
  if (!url || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const created = await prisma.video.create({ data: { userId: user.id, url, title, description: description || '' } });
  // credit UPLOAD task
  try { await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'UPLOAD' }) }); } catch {}
  return NextResponse.json({ video: created });
}
