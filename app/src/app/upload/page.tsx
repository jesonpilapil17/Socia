"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/videos/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, title, description }) });
    if (res.ok) setMessage('Uploaded!'); else setMessage('Upload failed');
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Upload via URL</h1>
      {message && <div className="text-sm">{message}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Video URL</label>
          <input className="border px-2 py-1 w-full" value={url} onChange={e=>setUrl(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Title</label>
          <input className="border px-2 py-1 w-full" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <input className="border px-2 py-1 w-full" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <button className="bg-black text-white px-3 py-2 w-full">Upload</button>
      </form>
    </div>
  );
}
