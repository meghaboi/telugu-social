import { NextResponse } from 'next/server';
import { createReport } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, comment_id, reason } = await request.json();
  await createReport(auth.accessToken, { reporter_id: auth.user.id, post_id, comment_id, reason: reason || 'Community safety concern' });
  return NextResponse.json({ ok: true });
}
