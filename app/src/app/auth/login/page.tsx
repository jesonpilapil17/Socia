"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
      return;
    }
    router.push('/');
  };

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="block text-sm text-white/70">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-white/70">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div className="text-sm text-white/70">No account? <a className="underline" href="/auth/register">Register</a></div>
    </div>
  );
}
