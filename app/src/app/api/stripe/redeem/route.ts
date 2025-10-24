import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getTokenBalance, tokensToUsdCents } from '@/lib/wallet';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { tokens } = body as { tokens?: number };
  if (!tokens || tokens <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  if (!user.stripeAccountId) return NextResponse.json({ error: 'Connect not set up' }, { status: 400 });

  const balance = await getTokenBalance(user.id);
  if (tokens > balance) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  const amountUsdCents = tokensToUsdCents(tokens);

  const redemption = await prisma.$transaction(async (tx) => {
    const r = await tx.redemption.create({
      data: {
        userId: user.id,
        tokens,
        amountUsdCents,
        status: 'PROCESSING' as any,
        stripeAccountId: user.stripeAccountId!,
      },
    });

    await tx.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: -tokens,
        type: 'REDEMPTION' as any,
        redemptionId: r.id,
      },
    });

    return r;
  });

  // In production, you'd use Transfers or PaymentIntents; here we simulate a transfer
  try {
    const transfer = await stripe.transfers.create({
      amount: amountUsdCents,
      currency: 'usd',
      destination: user.stripeAccountId!,
      description: `Token redemption ${redemption.id}`,
    });

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { status: 'PAID' as any, stripeTransferId: transfer.id },
    });
  } catch (e) {
    await prisma.redemption.update({ where: { id: redemption.id }, data: { status: 'FAILED' as any } });
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
