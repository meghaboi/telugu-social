import { NextResponse } from 'next/server';
import { upsertReaction } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, comment_id, emoji } = await request.json();
  await upsertReaction(auth.accessToken, { user_id: auth.user.id, post_id, comment_id, emoji });
  return NextResponse.json({ ok: true });
}
