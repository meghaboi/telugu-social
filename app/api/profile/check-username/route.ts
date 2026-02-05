import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/server-auth';
import { getProfileByUsername } from '@/lib/data';

export async function GET(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const username = (searchParams.get('username') || '').trim().toLowerCase();
  if (!username) return NextResponse.json({ available: false });

  const existing = await getProfileByUsername(auth.accessToken, username);
  return NextResponse.json({ available: !existing });
}
