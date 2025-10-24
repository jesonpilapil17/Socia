"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('description', description);
      const res = await fetch('/api/videos/upload/file', { method: 'POST', headers: { 'x-csrf': '1' }, body: fd });
      setMessage(res.ok ? 'Uploaded!' : 'Upload failed');
      return;
    }
    const res = await fetch('/api/videos/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf': '1' }, body: JSON.stringify({ url, title, description }) });
    if (res.ok) setMessage('Uploaded!'); else setMessage('Upload failed');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Upload via URL</h1>
      {message && <div className="text-sm text-white/70">{message}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/70">Video URL</label>
          <input className="input" value={url} onChange={e=>setUrl(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-white/70">Or Upload File</label>
          <input className="input file:mr-4 file:rounded-full file:border-0 file:bg-white file:text-black" type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm text-white/70">Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-white/70">Description</label>
          <input className="input" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <button className="btn-primary w-full">Upload</button>
      </form>
    </div>
  );
}
