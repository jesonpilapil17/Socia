"use client";
import { useEffect, useRef, useState } from 'react';

type Video = {
  id: string;
  url: string;
  title: string;
  description: string;
  likesCount: number;
  liked: boolean;
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (!reset && cursor) params.set('cursor', cursor);
    const res = await fetch(`/api/videos?${params.toString()}`);
    const data = await res.json().catch(() => ({ videos: [], nextCursor: null }));
    setLoading(false);
    setCursor(data.nextCursor || null);
    setVideos((prev) => (reset ? data.videos : [...prev, ...data.videos]));
  };

  useEffect(() => {
    fetchPage(true);
  }, []);

  const toggleLike = async (v: Video) => {
    const action = v.liked ? 'unlike' : 'like';
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, liked: !v.liked, likesCount: x.likesCount + (v.liked ? -1 : 1) } : x)));
    await fetch('/api/videos/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: v.id, action }) });
    if (!v.liked) {
      // credit LIKE task
      await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'LIKE' }) });
    }
  };

  const onVisible = async (index: number) => {
    const v = videos[index];
    if (!v) return;
    // credit WATCH on first view
    await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'WATCH' }) });
    // prefetch next page when nearing end
    if (index >= videos.length - 2 && cursor && !loading) {
      fetchPage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
      >
        {videos.map((v, i) => (
          <div key={v.id} className="h-screen w-full relative snap-start">
            <video
              className="h-full w-full object-cover"
              src={v.url}
              onPlay={() => onVisible(i)}
              controls
              playsInline
              preload="metadata"
            />
            <div className="absolute bottom-20 left-4 right-4 text-white">
              <div className="text-lg font-semibold drop-shadow">{v.title}</div>
              <div className="text-sm opacity-80 drop-shadow">{v.description}</div>
            </div>
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-3">
              <button onClick={() => toggleLike(v)} className={`rounded-full px-3 py-2 ${v.liked ? 'bg-red-600' : 'bg-white/20'} text-white`}>❤ {v.likesCount}</button>
            </div>
          </div>
        ))}
        {loading && <div className="h-20 text-center text-white">Loading...</div>}
      </div>
    </div>
  );
}
