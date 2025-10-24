"use client";
import { useEffect, useState } from 'react';

type Item = { id: string; type: 'LIKE'|'COMMENT'|'FOLLOW'; createdAt: string; actor: { username: string }; videoId?: string|null; commentId?: string|null; readAt?: string|null };

export default function NotificationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const load = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications || []);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">@{n.actor.username}</div>
              <div className="text-white/70 text-sm">
                {n.type === 'LIKE' && 'liked your video'}
                {n.type === 'COMMENT' && 'commented on your video'}
                {n.type === 'FOLLOW' && 'followed you'}
              </div>
            </div>
            {n.videoId && <a className="btn" href={`/?v=${n.videoId}`}>Open</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
