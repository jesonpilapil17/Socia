"use client";
import { useEffect, useState } from 'react';

type Task = { id: string; progressCount: number; rewardTokens: number; completedAt: string | null; template: { title: string; targetCount: number } };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refresh = async () => {
    const res = await fetch('/api/tasks/today');
    if (!res.ok) return;
    const data = await res.json();
    setTasks(data.tasks || []);
  };

  useEffect(() => { refresh(); }, []);

  const progress = async (id: string) => {
    await fetch('/api/tasks/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: id }) });
    await refresh();
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Today\'s Tasks</h1>
      <ul className="space-y-2">
        {tasks.map(t => (
          <li key={t.id} className="border p-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.template.title}</div>
              <div className="text-sm text-gray-600">{t.progressCount}/{t.template.targetCount} — Reward {t.rewardTokens} tokens</div>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white disabled:opacity-50" disabled={!!t.completedAt} onClick={()=>progress(t.id)}>
              {t.completedAt ? 'Completed' : 'Progress +1'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
