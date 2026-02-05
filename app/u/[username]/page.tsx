import { Badge } from '@/components/badge';
import { TopNav } from '@/components/top-nav';
import { getPostsByAuthor, getProfileByUsername } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const auth = await getServerAuth();
  if (!auth) return <main className="p-8">Please sign in.</main>;

  const profile = await getProfileByUsername(auth.accessToken, params.username);
  if (!profile) return <main className="p-8">User not found.</main>;

  const posts = await getPostsByAuthor(auth.accessToken, profile.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <section className="rounded-2xl border border-white/10 bg-surface p-5">
        <h1 className="text-2xl font-semibold">@{profile.username}</h1>
        <div className="mt-2 flex gap-2">
          <Badge>{profile.city}</Badge>
        </div>
        <p className="mt-3 text-muted">{profile.bio || 'No bio yet.'}</p>
        <p className="mt-1 text-sm text-muted">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-xl font-semibold">Posts</h2>
        {!posts.length && <article className="rounded-xl border border-dashed border-white/20 bg-surface p-4 text-muted">User hasn't posted anything yet.</article>}
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-white/10 bg-surface p-4">
            <p className="mb-2 text-xs text-muted">
              {post.forums?.name} • {new Date(post.created_at).toLocaleString()}
            </p>
            <p>{post.content}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
