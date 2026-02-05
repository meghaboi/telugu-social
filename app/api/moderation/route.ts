import { NextResponse } from 'next/server';
import { setCommentHidden, setPostHidden } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, comment_id, action } = await request.json();
  const hide = action === 'remove';

  if (post_id) await setPostHidden(auth.accessToken, post_id, hide);
  if (comment_id) await setCommentHidden(auth.accessToken, comment_id, hide);

  return NextResponse.json({ ok: true });
}
