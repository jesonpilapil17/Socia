"use client";
import { useEffect, useState } from 'react';

export default function UserProfile({ params }: { params: { username: string } }) {
  const username = params.username;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
    const data = await res.json().catch(() => ({}));
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [username]);

  const toggleFollow = async () => {
    if (!profile?.user) return;
    const action = profile.isFollowing ? 'unfollow' : 'follow';
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (res.ok) load();
  };

  if (loading) return <div>Loading...</div>;
  if (!profile?.user) return <div>Not found</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">@{profile.user.username}</h1>
      <div className="flex gap-6 text-sm">
        <div><b>{profile.followers}</b> Followers</div>
        <div><b>{profile.following}</b> Following</div>
      </div>
      <button className="border px-3 py-1" onClick={toggleFollow}>{profile.isFollowing ? 'Unfollow' : 'Follow'}</button>
    </div>
  );
}
