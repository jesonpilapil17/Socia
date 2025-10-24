import { NextResponse } from 'next/server';
import { createSessionForUser, signInWithPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const user = await signInWithPassword(email, password);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const { token, expiresAt } = await createSessionForUser(user.id);
    const res = NextResponse.json({ ok: true, user: { email: user.email, username: user.username } });
    res.cookies.set('session', token, { httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal', message: String(e?.message || e) }, { status: 500 });
  }
}
