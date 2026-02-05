'use client';

import { mvpCities } from '@/lib/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function OnboardingForm({ userId }: { userId: string }) {
  const [username, setUsername] = useState('');
  const [city, setCity] = useState(mvpCities[0]);
  const [ageRange, setAgeRange] = useState('');
  const [availability, setAvailability] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get('next') || '/forum';

  async function checkUsername(value: string) {
    setUsername(value);
    if (value.length < 3) return setAvailability('');
    const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(value.toLowerCase())}`);
    const data = await res.json();
    setAvailability(data.available ? '✅ Available' : '❌ Taken');
  }

  async function submit() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, username: username.toLowerCase(), city, age_range: ageRange || null })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Could not save profile');
    router.push(next);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-surface p-5">
      <h1 className="text-2xl font-semibold">Create your profile</h1>
      <div>
        <label className="mb-1 block text-sm text-muted">Username</label>
        <input value={username} onChange={(e) => checkUsername(e.target.value)} className="w-full rounded-lg bg-black/20 p-3" maxLength={24} />
        {availability && <p className="mt-1 text-xs text-muted">{availability}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">City (required)</label>
        <select value={city} onChange={(e) => setCity(e.target.value as (typeof mvpCities)[number])} className="w-full rounded-lg bg-black/20 p-3">
          {mvpCities.map((option) => (
            <option key={option} value={option}>{option}</option>
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
      <button onClick={submit} disabled={loading || !username || availability === '❌ Taken'} className="rounded-lg bg-accent px-4 py-2 font-semibold text-black">
        {loading ? 'Saving...' : 'Continue'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
