import { prisma } from './prisma';

export async function getTokenBalance(userId: string): Promise<number> {
  const result = await prisma.tokenTransaction.aggregate({
    _sum: { amount: true },
    where: { userId },
  });
  return result._sum.amount ?? 0;
}

export const TOKENS_PER_USD = 100; // 100 tokens = $1

export function tokensToUsdCents(tokens: number): number {
  return Math.floor((tokens / TOKENS_PER_USD) * 100);
}
