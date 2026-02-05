import { NextResponse } from 'next/server';
import { getComments } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  const auth = await getServerAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  if (!postId) return NextResponse.json({ comments: [] });

  const comments = await getComments(auth.accessToken, postId);
  return NextResponse.json({ comments });
}
