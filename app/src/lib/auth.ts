import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 10);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function signInWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createSessionForUser(userId: string) {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30d
  await prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  return { token: raw, expiresAt };
}

export async function getCurrentUser() {
  const cookie = cookies().get('session');
  if (!cookie?.value) return null;
  const tokenHash = hashToken(cookie.value);
  const session = await prisma.session.findFirst({ where: { tokenHash, expiresAt: { gt: new Date() } }, include: { user: true } });
  return session?.user ?? null;
}

export async function deleteSessionFromCookie() {
  const cookie = cookies().get('session');
  if (cookie?.value) {
    const tokenHash = hashToken(cookie.value);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
}

function parseCookie(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

export async function getUserFromCookieHeader(cookieHeader: string | null | undefined) {
  const map = parseCookie(cookieHeader);
  const token = map['session'];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.session.findFirst({ where: { tokenHash, expiresAt: { gt: new Date() } }, include: { user: true } });
  return session?.user ?? null;
}

export async function deleteSessionFromCookieHeader(cookieHeader: string | null | undefined) {
  const map = parseCookie(cookieHeader);
  const token = map['session'];
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}
