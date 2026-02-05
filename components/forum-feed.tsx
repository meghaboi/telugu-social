'use client';

import Link from 'next/link';
import { Badge } from '@/components/badge';
import { reactions } from '@/lib/constants';
import { useMemo, useState } from 'react';

type Forum = { id: string; name: string; category: string };

type Post = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  forum_id: string;
  forums: { name: string; category: string };
  profiles: { username: string; city: string };
};

export function ForumFeed({ forums, initialPosts, currentSort }: { forums: Forum[]; initialPosts: Post[]; currentSort: 'new' | 'active' }) {
  const [posts, setPosts] = useState(initialPosts);
  const [forumId, setForumId] = useState(forums[0]?.id || '');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sortedPosts = useMemo(() => posts, [posts]);

  async function submitPost() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forum_id: forumId, content })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Failed to post');
    window.location.reload();
  }

  async function react(postId: string, emoji: string) {
    setPosts((prev) => [...prev]);
    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, emoji })
    });
  }

  async function report(postId: string) {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, reason: 'Reported from forum feed' })
    });
    alert('Reported. Thanks for keeping the forum safe.');
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-surface p-4">
        <h2 className="mb-3 text-lg font-semibold">Create Post</h2>
        <select value={forumId} onChange={(e) => setForumId(e.target.value)} className="mb-3 w-full rounded-lg bg-black/20 p-3">
          {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.category} • {forum.name}</option>)}
        </select>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-lg bg-black/20 p-3" maxLength={500} rows={4} placeholder="Share something with the community..." />
        <div className="mt-2 flex items-center justify-between text-xs text-muted"><span>{content.length}/500</span><button onClick={submitPost} disabled={loading || !content.trim()} className="rounded-md bg-accent px-3 py-2 font-semibold text-black">{loading ? 'Posting...' : 'Post'}</button></div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex gap-3 text-sm">
        <Link href="/forum?sort=new" className={currentSort === 'new' ? 'text-accent' : 'text-muted'}>New</Link>
        <Link href="/forum?sort=active" className={currentSort === 'active' ? 'text-accent' : 'text-muted'}>Active</Link>
      </div>

      {sortedPosts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="mb-2 flex flex-wrap gap-2"><Badge>{post.forums.category}</Badge><Badge>{post.forums.name}</Badge><Badge>{post.profiles.city}</Badge></div>
          <Link href={`/u/${post.profiles.username}`} className="text-sm text-muted">@{post.profiles.username}</Link>
          <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {reactions.map((emoji) => <button key={emoji} onClick={() => react(post.id, emoji)} className="rounded bg-white/10 px-2 py-1 text-sm">{emoji}</button>)}
            <Link href={`/forum/${post.id}`} className="text-sm text-muted">Comments</Link>
            <button onClick={() => report(post.id)} className="text-sm text-red-300">Report</button>
          </div>
        </article>
      ))}
    </div>
  );
}
