import { NextResponse } from 'next/server';
import { getUserFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureTasksForToday, incrementFirstIncompleteOfType } from '@/lib/tasks';
import { passesCsrf } from '@/lib/security';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

export async function POST(req: Request) {
  if (!passesCsrf(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getUserFromCookieHeader(req.headers.get('cookie'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const title = (form.get('title') as string) || 'Untitled';
  const description = (form.get('description') as string) || '';
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const id = randomUUID();
  const uploadsDir = path.join(process.cwd(), 'app', 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${id}.${ext}`;
  const abs = path.join(uploadsDir, filename);
  await writeFile(abs, buffer);

  const publicUrl = `/uploads/${filename}`;

  const created = await prisma.video.create({ data: { userId: user.id, url: publicUrl, title, description } });
  await ensureTasksForToday(user.id);
  await incrementFirstIncompleteOfType(user.id, 'UPLOAD');
  return NextResponse.json({ video: created });
}
