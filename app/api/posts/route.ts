import { NextResponse } from 'next/server';
import { createPost, getProfileByUserId, isRateLimited } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (!profile) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 });

  const limited = await isRateLimited(auth.accessToken, profile, 'post');
  if (limited) return NextResponse.json({ error: 'Daily post limit reached for new accounts.' }, { status: 429 });

  const { forum_id, content } = await request.json();
  if (!content || content.length > 500) return NextResponse.json({ error: 'Post must be 1-500 chars.' }, { status: 400 });

  await createPost(auth.accessToken, { forum_id, content, author_id: auth.user.id });
  return NextResponse.json({ ok: true });
}
