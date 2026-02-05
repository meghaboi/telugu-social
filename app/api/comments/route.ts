import { NextResponse } from 'next/server';
import { createComment, getProfileByUserId, isRateLimited } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (!profile) return NextResponse.json({ error: 'Complete onboarding first.' }, { status: 400 });

  const limited = await isRateLimited(auth.accessToken, profile, 'comment');
  if (limited) return NextResponse.json({ error: 'Daily comment limit reached for new accounts.' }, { status: 429 });

  const { post_id, content } = await request.json();
  if (!content || content.length > 500) return NextResponse.json({ error: 'Comment must be 1-500 chars.' }, { status: 400 });

  await createComment(auth.accessToken, { post_id, content, author_id: auth.user.id });
  return NextResponse.json({ ok: true });
}
