import { redirect } from 'next/navigation';
import { ForumFeed } from '@/components/forum-feed';
import { TopNav } from '@/components/top-nav';
import { getForums, getPosts, getProfileByUserId } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export default async function ForumPage({ searchParams }: { searchParams: { sort?: 'new' | 'active' } }) {
  const auth = await getServerAuth();
  if (!auth) redirect('/auth');

  const profile = await getProfileByUserId(auth.accessToken, auth.user.id);
  if (!profile) redirect('/onboarding');

  const sort = searchParams.sort === 'active' ? 'active' : 'new';
  const [forums, posts] = await Promise.all([getForums(auth.accessToken), getPosts(auth.accessToken, sort)]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <ForumFeed forums={forums} initialPosts={posts} currentSort={sort} />
    </main>
  );
}
