import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Create or fetch Connect account
  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express', email: user.email });
    accountId = account.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeAccountId: accountId } });
  }

  const link = await stripe.accountLinks.create({
    account: accountId!,
    refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/payouts',
    return_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/payouts',
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
