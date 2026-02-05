import { NextResponse } from 'next/server';
import { createProfile, getProfileByUsername } from '@/lib/data';
import { mvpCities } from '@/lib/constants';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, username, city, age_range } = await request.json();
  if (id !== auth.user.id) return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: 'Username must be 3-24 chars: letters, numbers, underscores.' }, { status: 400 });
  if (!mvpCities.includes(city)) return NextResponse.json({ error: 'City is required.' }, { status: 400 });

  const existing = await getProfileByUsername(auth.accessToken, username);
  if (existing) return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });

  await createProfile(auth.accessToken, { id, username, city, age_range });
  return NextResponse.json({ ok: true });
}
