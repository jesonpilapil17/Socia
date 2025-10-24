import { NextResponse } from 'next/server';
import { deleteSessionFromCookie } from '@/lib/auth';

export async function POST() {
  await deleteSessionFromCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('session');
  return res;
}
