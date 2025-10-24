import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const txs = await prisma.tokenTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ transactions: txs });
}
