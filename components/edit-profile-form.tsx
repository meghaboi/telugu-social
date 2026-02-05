'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast-provider';

export function EditProfileForm({ initialBio }: { initialBio: string }) {
  const [bio, setBio] = useState(initialBio || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  async function save() {
    setLoading(true);
    setStatus('');
    const res = await fetch('/api/profile/bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const message = data.error || 'Failed to save profile.';
      setStatus(message);
      pushToast(message, 'error');
      return;
    }

    setStatus('Saved.');
    pushToast('Profile updated successfully.');
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5">
      <h1 className="text-xl font-semibold">Edit Bio</h1>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={5} className="mt-3 w-full rounded-lg bg-black/20 p-3" />
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{bio.length}/160</span>
        <button onClick={save} disabled={loading} className="rounded-md bg-accent px-3 py-2 font-semibold text-black disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
      {status && <p className="mt-2 text-sm text-muted">{status}</p>}
    </section>
  );
}
