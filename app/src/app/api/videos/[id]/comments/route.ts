import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const videoId = params.id;
  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const videoId = params.id;
  const body = await req.json().catch(() => ({}));
  const { content } = body as { content?: string };
  if (!content || content.trim().length === 0) return NextResponse.json({ error: 'Empty content' }, { status: 400 });

  const created = await prisma.comment.create({ data: { userId: user.id, videoId, content: content.trim() } });
  // credit COMMENT task directly
  await ensureTasksForToday(user.id);
  await incrementFirstIncompleteOfType(user.id, 'COMMENT');
  return NextResponse.json({ comment: created });
}
