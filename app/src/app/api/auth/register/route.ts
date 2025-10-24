import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionForUser, hashPassword, signInWithPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, username, password } = body as { email?: string; username?: string; password?: string };
  if (!email || !username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return NextResponse.json({ error: 'User exists' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({ data: { email, username, passwordHash } });

  // set session cookie like login
  const user = await signInWithPassword(email, password);
  if (!user) return NextResponse.json({ ok: true });
  const { token, expiresAt } = await createSessionForUser(created.id);
  const res = NextResponse.json({ ok: true, user: { email: user.email, username: user.username } });
  res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt });
  return res;
}
