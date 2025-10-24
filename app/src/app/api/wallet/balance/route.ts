import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { getTokenBalance } from '@/lib/wallet';

export async function GET(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const balance = await getTokenBalance(user.id);
  return NextResponse.json({ balance });
}
