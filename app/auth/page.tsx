'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const [phone, setPhone] = useState('+91');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get('next') || '/forum';

  async function send() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Failed to send OTP');
    setSent(true);
  }

  async function verify() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/verify', { method: 'POST', body: JSON.stringify({ phone, token }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Verification failed');
    router.push(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Sign in with phone OTP</h1>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg bg-surface p-3" placeholder="+919876543210" />
      {!sent ? (
        <button onClick={send} disabled={loading} className="rounded-lg bg-accent p-3 font-medium text-black">{loading ? 'Sending...' : 'Send OTP'}</button>
      ) : (
        <>
          <input value={token} onChange={(e) => setToken(e.target.value)} className="rounded-lg bg-surface p-3" placeholder="Enter OTP" />
          <button onClick={verify} disabled={loading} className="rounded-lg bg-accent p-3 font-medium text-black">{loading ? 'Verifying...' : 'Verify & continue'}</button>
        </>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </main>
  );
}
