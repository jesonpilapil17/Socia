import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signInWithPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, username, password } = body as { email?: string; username?: string; password?: string };
  if (!email || !username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return NextResponse.json({ error: 'User exists' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, username, passwordHash } });

  const user = await signInWithPassword(email, password);
  return NextResponse.json({ ok: true, user: { email: user?.email, username: user?.username } });
}
