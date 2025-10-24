"use client";
import { useEffect, useState } from 'react';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [tokens, setTokens] = useState(100);

  const refresh = async () => {
    const res = await fetch('/api/wallet/balance');
    if (!res.ok) return;
    const data = await res.json();
    setBalance(data.balance || 0);
  };

  useEffect(() => { refresh(); }, []);

  const redeem = async () => {
    await fetch('/api/stripe/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokens }) });
    await refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Wallet</h1>
      <div>Balance: {balance} tokens</div>
      <div className="flex gap-2 items-center">
        <input className="border px-2 py-1" type="number" value={tokens} onChange={e=>setTokens(parseInt(e.target.value||'0'))} />
        <button className="bg-black text-white px-3 py-1" onClick={redeem}>Redeem</button>
      </div>
    </div>
  );
}
