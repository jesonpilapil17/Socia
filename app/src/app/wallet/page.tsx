"use client";
import { useEffect, useState } from 'react';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [tokens, setTokens] = useState(100);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [me, setMe] = useState<{ stripeAccountId: string | null } | null>(null);

  const refresh = async () => {
    const res = await fetch('/api/wallet/balance');
    if (!res.ok) return;
    const data = await res.json();
    setBalance(data.balance || 0);
    const txRes = await fetch('/api/wallet/transactions');
    if (txRes.ok) {
      const t = await txRes.json();
      setTransactions(t.transactions || []);
    }
    const meRes = await fetch('/api/auth/me');
    if (meRes.ok) {
      const m = await meRes.json();
      setMe(m.user);
    }
  };

  useEffect(() => { refresh(); }, []);

  const redeem = async () => {
    await fetch('/api/stripe/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokens }) });
    await refresh();
  };

  const connectStripe = async () => {
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.url) window.location.href = data.url as string;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Wallet</h1>
      <div>Balance: {balance} tokens</div>
      <div className="flex gap-2 items-center">
        <button className="bg-purple-600 text-white px-3 py-1" onClick={connectStripe}>
          {me?.stripeAccountId ? 'Manage Stripe Payouts' : 'Connect Stripe' }
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input className="border px-2 py-1" type="number" value={tokens} onChange={e=>setTokens(parseInt(e.target.value||'0'))} />
        <button className="bg-black text-white px-3 py-1" onClick={redeem}>Redeem</button>
      </div>
      <div>
        <h2 className="font-semibold">Recent Transactions</h2>
        <ul className="text-sm space-y-1">
          {transactions.map((t) => (
            <li key={t.id} className="flex justify-between border-b py-1">
              <span>{t.type}</span>
              <span className={t.amount >= 0 ? 'text-green-600' : 'text-red-600'}>{t.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
