'use client';

import { mvpCities } from '@/lib/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/toast-provider';

export function OnboardingForm({ userId }: { userId: string }) {
  const [username, setUsername] = useState('');
  const [city, setCity] = useState(mvpCities[0]);
  const [ageRange, setAgeRange] = useState('');
  const [availability, setAvailability] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pushToast } = useToast();
  const next = useSearchParams().get('next') || '/forum';

  const usernameError =
    username.length === 0 ? 'Username is required.' : !/^[a-z0-9_]{3,24}$/.test(username) ? 'Use 3-24 chars: lowercase letters, numbers, underscores.' : '';

  async function checkUsername(value: string) {
    const normalized = value.toLowerCase().trim();
    setUsername(normalized);
    setAvailability('');

    if (normalized.length < 3 || !/^[a-z0-9_]{3,24}$/.test(normalized)) return;

    const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(normalized)}`);
    const data = await res.json();
    setAvailability(data.available ? '✅ Available' : '❌ Username taken');
  }

  async function submit() {
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);
    setError('');
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, username: username.toLowerCase(), city, age_range: ageRange || null })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      const message = data.error || 'Could not save profile';
      setError(message);
      pushToast(message, 'error');
      return;
    }

    pushToast('Profile created. Welcome!');
    router.push(next);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-surface p-5">
      <h1 className="text-2xl font-semibold">Create your profile</h1>
      <div>
        <label className="mb-1 block text-sm text-muted">Username</label>
        <input value={username} onChange={(e) => checkUsername(e.target.value)} className="w-full rounded-lg bg-black/20 p-3" maxLength={24} />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted">{availability || 'Choose a unique username.'}</span>
          <span className="text-muted">{username.length}/24</span>
        </div>
        {usernameError && <p className="mt-1 text-xs text-red-400">{usernameError}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">City (required)</label>
        <select value={city} onChange={(e) => setCity(e.target.value as (typeof mvpCities)[number])} className="w-full rounded-lg bg-black/20 p-3">
          {mvpCities.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Age range (optional)</label>
        <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className="w-full rounded-lg bg-black/20 p-3">
          <option value="">Prefer not to say</option>
          <option value="13-17">13-17</option>
          <option value="18-21">18-21</option>
          <option value="22-25">22-25</option>
          <option value="26+">26+</option>
        </select>
      </div>
      <button onClick={submit} disabled={loading || !!usernameError || availability === '❌ Username taken'} className="rounded-lg bg-accent px-4 py-2 font-semibold text-black disabled:opacity-50">
        {loading ? 'Saving...' : 'Continue'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
