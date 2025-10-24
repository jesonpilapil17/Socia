import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday } from '@/lib/tasks';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getUserFromCookieHeader(req.headers.get('cookie'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tasks = await ensureTasksForToday(user.id);
    const withTemplate = await prisma.userDailyTask.findMany({ where: { id: { in: tasks.map(t => t.id) } }, include: { template: true } });
    return NextResponse.json({ tasks: withTemplate });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal', message: String(e?.message || e) }, { status: 500 });
  }
}
