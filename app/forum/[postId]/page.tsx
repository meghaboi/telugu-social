import { redirect } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { PostDetail } from '@/components/post-detail';
import { getComments, getPost } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export default async function PostPage({ params }: { params: { postId: string } }) {
  const auth = await getServerAuth();
  if (!auth) redirect('/auth');

  const post = await getPost(auth.accessToken, params.postId);
  if (!post) redirect('/forum');

  const comments = await getComments(auth.accessToken, params.postId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <PostDetail post={post} initialComments={comments} />
    </main>
  );
}
