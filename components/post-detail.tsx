'use client';

import { Badge } from '@/components/badge';
import { reactions } from '@/lib/constants';
import { useEffect, useState } from 'react';

export function PostDetail({ post, initialComments }: { post: any; initialComments: any[] }) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/post-comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [post.id]);

  async function submitComment() {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, content })
    });
    if (res.ok) {
      setContent('');
      const refreshed = await fetch(`/api/post-comments?postId=${post.id}`);
      const data = await refreshed.json();
      setComments(data.comments || []);
    }
  }

  async function reactToComment(commentId: string, emoji: string) {
    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, emoji })
    });
  }

  async function reportComment(commentId: string) {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, reason: 'Reported from post detail' })
    });
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-white/10 bg-surface p-4">
        <div className="mb-2 flex flex-wrap gap-2"><Badge>{post.forums.category}</Badge><Badge>{post.forums.name}</Badge><Badge>{post.profiles.city}</Badge></div>
        <p>{post.content}</p>
      </article>
      <div className="rounded-2xl border border-white/10 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold">Comments</h2>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={500} rows={3} className="w-full rounded-lg bg-black/20 p-3" placeholder="Reply to this post" />
        <button onClick={submitComment} className="mt-2 rounded-md bg-accent px-3 py-2 font-semibold text-black">Add comment</button>
      </div>

      {comments.map((comment) => (
        <article key={comment.id} className="rounded-xl border border-white/10 bg-surface p-3">
          <p className="text-sm text-muted">@{comment.profiles.username} • {comment.profiles.city}</p>
          <p className="mt-2">{comment.content}</p>
          <div className="mt-2 flex gap-2">
            {reactions.map((emoji) => <button key={emoji} onClick={() => reactToComment(comment.id, emoji)} className="rounded bg-white/10 px-2 py-1 text-sm">{emoji}</button>)}
            <button onClick={() => reportComment(comment.id)} className="text-sm text-red-300">Report</button>
          </div>
        </article>
      ))}
    </section>
  );
}
