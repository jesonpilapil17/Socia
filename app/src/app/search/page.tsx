"use client";
import { useEffect, useState } from 'react';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const search = async () => {
    if (!q.trim()) { setVideos([]); setUsers([]); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({ videos: [], users: [] }));
    setVideos(data.videos || []);
    setUsers(data.users || []);
  };

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <input className="input" placeholder="Search videos, #hashtags, @users" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid gap-4">
        {users.length > 0 && (
          <div className="card">
            <div className="font-semibold mb-2">Users</div>
            <ul className="space-y-1">
              {users.map((u) => <li key={u.id}><a className="underline" href={`/u/${u.username}`}>@{u.username}</a></li>)}
            </ul>
          </div>
        )}
        <div className="card">
          <div className="font-semibold mb-2">Videos</div>
          <ul className="space-y-1">
            {videos.map((v) => <li key={v.id} className="flex justify-between"><span>{v.title}</span><a className="btn" href={`/?v=${v.id}`}>Open</a></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
