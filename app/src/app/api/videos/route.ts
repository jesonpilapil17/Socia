import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookieHeader } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  const url = new URL(req.url);
  const take = Math.min(parseInt(url.searchParams.get('take') || '20', 10), 50);
  const cursor = url.searchParams.get('cursor') || undefined;
  const tab = url.searchParams.get('tab') || 'foryou';

  let where: any = {};
  if (user && tab === 'following') {
    const following = await prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } });
    const followingIds = following.map((f) => f.followingId);
    where = { userId: { in: followingIds.length ? followingIds : ['__none__'] } };
  }

  let videos = [] as Array<{
    id: string; userId: string; url: string; title: string; description: string; createdAt: Date; views: number;
  }>;

  if (tab === 'trending') {
    // Pick top by likes count; fallback to views
    const likeGroups = await prisma.like.groupBy({
      by: ['videoId'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } as any },
      take,
    } as any);
    const ids = likeGroups.map((g: any) => g.videoId);
    if (ids.length > 0) {
      const list = await prisma.video.findMany({ where: { id: { in: ids } } });
      const map = new Map(list.map((v) => [v.id, v]));
      videos = ids.map((id) => map.get(id)!).filter(Boolean) as any;
    }
    if (videos.length < take) {
      const more = await prisma.video.findMany({ orderBy: { views: 'desc' }, take: take - videos.length });
      const seen = new Set(videos.map((v) => v.id));
      videos = [...videos, ...more.filter((m) => !seen.has(m.id))] as any;
    }
  } else {
    videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }) as any;
  }

  let likedIds = new Set<string>();
  let savedIds = new Set<string>();
  if (user && videos.length > 0) {
    const likes = await prisma.like.findMany({
      where: { userId: user.id, videoId: { in: videos.map((v) => v.id) } },
      select: { videoId: true },
    });
    likedIds = new Set(likes.map((l) => l.videoId));
    const saves = await prisma.bookmark.findMany({ where: { userId: user.id, videoId: { in: videos.map((v) => v.id) } }, select: { videoId: true } });
    savedIds = new Set(saves.map((s) => s.videoId));
  }

  const counts = await prisma.like.groupBy({
    by: ['videoId'],
    _count: { _all: true },
    where: { videoId: { in: videos.map((v) => v.id) } },
  });
  const countMap = new Map(counts.map((c) => [c.videoId, c._count._all]));

  const authors = await prisma.user.findMany({ where: { id: { in: videos.map((v) => v.userId) } }, select: { id: true, username: true } });
  const authorMap = new Map(authors.map((a) => [a.id, a.username]));
  const commentCounts = await prisma.comment.groupBy({ by: ['videoId'], _count: { _all: true }, where: { videoId: { in: videos.map((v)=> v.id) } } });
  const commentCountMap = new Map(commentCounts.map((c) => [c.videoId, c._count._all]));

  const data = videos.map((v) => ({
    id: v.id,
    url: v.url,
    title: v.title,
    description: v.description,
    userId: v.userId,
    username: authorMap.get(v.userId) || 'user',
    createdAt: v.createdAt,
    likesCount: countMap.get(v.id) || 0,
    commentsCount: commentCountMap.get(v.id) || 0,
    views: (v as any).views ?? 0,
    liked: likedIds.has(v.id),
    saved: savedIds.has(v.id),
  }));

  const nextCursor = videos.length === take ? videos[videos.length - 1].id : null;
  return NextResponse.json({ videos: data, nextCursor });
}
