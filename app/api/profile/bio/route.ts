import { NextResponse } from 'next/server';
import { getProfileByUserId, updateBio } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (!profile) return NextResponse.json({ error: 'Profile missing' }, { status: 400 });

  const { bio } = await request.json();
  if ((bio || '').length > 160) return NextResponse.json({ error: 'Bio max length is 160.' }, { status: 400 });

  await updateBio(auth.accessToken, auth.user.id, bio || '');
  return NextResponse.json({ ok: true });
}
