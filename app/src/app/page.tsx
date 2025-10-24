"use client";
import { useEffect, useState } from 'react';

type Task = {
  id: string;
  progressCount: number;
  rewardTokens: number;
  completedAt: string | null;
  template: { title: string; targetCount: number };
};

export default function Home() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const refresh = async () => {
    const t = await fetch("/api/tasks/today").then(r => r.json()).catch(() => ({ tasks: [] }));
    setTasks(t.tasks || []);
    const b = await fetch("/api/wallet/balance").then(r => r.json()).catch(() => ({ balance: 0 }));
    setBalance(b.balance || 0);
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async () => {
    await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    await refresh();
  };

  const complete = async (id: string) => {
    await fetch("/api/tasks/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: id }) });
    await refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Tok-Tasks Demo</h1>
        <div className="flex gap-2">
          <input className="border px-2 py-1" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
          <input className="border px-2 py-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
          <button className="bg-black text-white px-3 py-1" onClick={login}>Login</button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold">Balance: {balance} tokens</h2>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Today&apos;s Tasks</h2>
        <ul className="space-y-2">
          {tasks.map(t => (
            <li key={t.id} className="border p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.template.title}</div>
                <div className="text-sm text-gray-600">{t.progressCount}/{t.template.targetCount} — Reward {t.rewardTokens} tokens</div>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white disabled:opacity-50" disabled={!!t.completedAt} onClick={()=>complete(t.id)}>
                {t.completedAt ? 'Completed' : 'Progress +1'}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
