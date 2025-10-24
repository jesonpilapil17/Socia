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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>
      <div className="card flex items-center justify-between">
        <div className="text-white/80">Balance</div>
        <div className="text-2xl font-semibold">{balance} <span className="text-white/60 text-base">tokens</span></div>
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn" onClick={connectStripe}>
          {me?.stripeAccountId ? 'Manage Stripe Payouts' : 'Connect Stripe' }
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input className="input max-w-[160px]" type="number" value={tokens} onChange={e=>setTokens(parseInt(e.target.value||'0'))} />
        <button className="btn-primary" onClick={redeem}>Redeem</button>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Recent Transactions</h2>
        <ul className="text-sm space-y-1">
          {transactions.map((t) => (
            <li key={t.id} className="flex justify-between border-b border-white/10 py-2">
              <span>{t.type}</span>
              <span className={t.amount >= 0 ? 'text-green-600' : 'text-red-600'}>{t.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
