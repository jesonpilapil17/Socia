"use client";
import { useEffect, useRef, useState } from 'react';

type Video = {
  id: string;
  url: string;
  title: string;
  description: string;
  username?: string;
  likesCount: number;
  liked: boolean;
  commentsCount?: number;
  saved?: boolean;
  views?: number;
};

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<'foryou' | 'following' | 'trending'>('foryou');
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; content: string; user: { id: string; username: string } }>>([]);
  const [commentInput, setCommentInput] = useState('');

  const fetchPage = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (!reset && cursor) params.set('cursor', cursor);
    params.set('tab', tab);
    const res = await fetch(`/api/videos?${params.toString()}`);
    const data = await res.json().catch(() => ({ videos: [], nextCursor: null }));
    setLoading(false);
    setCursor(data.nextCursor || null);
    setVideos((prev) => (reset ? data.videos : [...prev, ...data.videos]));
  };

  useEffect(() => {
    setCursor(null);
    fetchPage(true);
  }, [tab]);

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
    // increment views + credit WATCH
    await fetch('/api/videos/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: v.id }) });
    // prefetch next page when nearing end
    if (index >= videos.length - 2 && cursor && !loading) {
      fetchPage();
    }
  };

  const toggleSave = async (v: Video) => {
    const action = v.saved ? 'unsave' : 'save';
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, saved: !v.saved } : x)));
    await fetch('/api/videos/bookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: v.id, action }) });
  };

  const openComments = async (videoId: string) => {
    setOpenCommentsFor(videoId);
    const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    } else {
      setComments([]);
    }
  };

  const postComment = async () => {
    if (!openCommentsFor || !commentInput.trim()) return;
    const res = await fetch(`/api/videos/${encodeURIComponent(openCommentsFor)}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: commentInput })
    });
    if (res.ok) {
      setCommentInput('');
      openComments(openCommentsFor);
    }
  };

  const shareVideo = async (v: Video) => {
    const url = `${window.location.origin}/?v=${encodeURIComponent(v.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: v.title, text: v.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
      }
    } catch {}
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
              <div className="text-sm opacity-80 drop-shadow">@{v.username} — {v.description}</div>
            </div>
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-3">
              <button onClick={() => toggleLike(v)} className={`btn ${v.liked ? 'bg-white text-black hover:bg-white' : ''}`}>❤ {v.likesCount}</button>
              <button onClick={() => openComments(v.id)} className="btn">💬 {v.commentsCount ?? 0}</button>
              <button onClick={() => toggleSave(v)} className={`btn ${v.saved ? 'bg-white text-black hover:bg-white' : ''}`}>🔖</button>
              <button onClick={() => shareVideo(v)} className="btn">↗</button>
              <div className="text-xs text-white/80">{v.views ?? 0} views</div>
            </div>
          </div>
        ))}
        {loading && <div className="h-20 text-center text-white">Loading...</div>}
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white flex gap-2 bg-white/10 rounded-full px-2 py-1 backdrop-blur">
        <button className={`chip ${tab==='foryou'?'bg-white text-black':''}`} onClick={()=>setTab('foryou')}>For You</button>
        <button className={`chip ${tab==='following'?'bg-white text-black':''}`} onClick={()=>setTab('following')}>Following</button>
        <button className={`chip ${tab==='trending'?'bg-white text-black':''}`} onClick={()=>setTab('trending')}>Trending</button>
      </div>
      {openCommentsFor && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setOpenCommentsFor(null)}>
          <div className="w-full sm:w-[420px] h-full bg-black border-l border-white/10 p-4 flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Comments</div>
              <button className="btn" onClick={() => setOpenCommentsFor(null)}>Close</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="border-b border-white/10 pb-2">
                  <div className="text-sm text-white/70">@{c.user.username}</div>
                  <div>{c.content}</div>
                </div>
              ))}
              {comments.length === 0 && <div className="text-white/60">No comments yet</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <input className="input flex-1" placeholder="Add a comment" value={commentInput} onChange={e=>setCommentInput(e.target.value)} />
              <button className="btn-primary" onClick={postComment}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
