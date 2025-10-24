"use client";
import { useEffect, useState } from 'react';

type SavedItem = { id: string; videoId: string; video: { id: string; title: string } };

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const load = async () => {
    const res = await fetch('/api/me/saved');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Saved</h1>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="card flex justify-between">
            <div>
              <div className="font-medium">{it.video.title}</div>
            </div>
            <a className="btn" href={`/?v=${it.videoId}`}>Open</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
