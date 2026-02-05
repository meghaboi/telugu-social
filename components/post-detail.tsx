'use client';

import { Badge } from '@/components/badge';
import { reactions } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/toast-provider';

type Comment = {
  id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  profiles: { username: string; city: string };
};

export function PostDetail({ post, initialComments }: { post: any; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/post-comments?postId=${post.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments || []);
    }, 3000);
    return () => clearInterval(timer);
  }, [post.id]);

  async function submitComment() {
    setCommentError('');
    setIsSaving(true);

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, content: content.trim() })
    });

    const data = await res.json();
    setIsSaving(false);

    if (!res.ok) {
      const message = data.error || 'Comment could not be posted. Please try again.';
      setCommentError(message);
      pushToast(message, 'error');
      return;
    }

    setContent('');
    pushToast('Comment added.');
    trackEvent('comment_added', { post_id: post.id });

    const refreshed = await fetch(`/api/post-comments?postId=${post.id}`);
    const refreshedData = await refreshed.json();
    setComments(refreshedData.comments || []);
  }

  async function reactToComment(commentId: string, emoji: string) {
    const res = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, emoji })
    });

    if (!res.ok) {
      pushToast('Reaction failed. Please try again.', 'error');
      return;
    }

    trackEvent('reaction_added', { comment_id: commentId, emoji });
  }

  async function reportComment(commentId: string) {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, reason: 'Reported from post detail' })
    });

    if (!res.ok) {
      pushToast('Report failed. Please retry.', 'error');
      return;
    }

    pushToast('Report submitted. Moderators have been notified.');
    trackEvent('report_submitted', { comment_id: commentId });
  }

  const visibleComments = useMemo(() => comments, [comments]);

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-white/10 bg-surface p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge>{post.forums.category}</Badge>
          <Badge>{post.forums.name}</Badge>
          <Badge>{post.profiles.city}</Badge>
        </div>
        {post.is_hidden ? <p className="text-muted">Post hidden - under review.</p> : <p>{post.content}</p>}
      </article>
      <div className="rounded-2xl border border-white/10 bg-surface p-4">
        <h2 className="mb-2 text-lg font-semibold">Comments</h2>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={500} rows={3} className="w-full rounded-lg bg-black/20 p-3" placeholder="Reply to this post" />
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{content.length}/500</span>
          <button onClick={submitComment} disabled={isSaving || !content.trim()} className="rounded-md bg-accent px-3 py-2 font-semibold text-black disabled:opacity-50">
            {isSaving ? 'Adding...' : 'Add comment'}
          </button>
        </div>
        {commentError && <p className="mt-2 text-sm text-red-400">{commentError}</p>}
      </div>

      {!visibleComments.length && <article className="rounded-xl border border-dashed border-white/20 bg-surface p-4 text-muted">No comments yet. Start the thread.</article>}

      {visibleComments.map((comment) => (
        <article key={comment.id} className="rounded-xl border border-white/10 bg-surface p-3">
          <p className="text-sm text-muted">
            @{comment.profiles.username} • {comment.profiles.city}
          </p>
          <p className="mt-2">{comment.is_hidden ? 'Comment removed by moderators.' : comment.content}</p>
          {!comment.is_hidden && (
            <div className="mt-2 flex gap-2">
              {reactions.map((emoji) => (
                <button key={emoji} onClick={() => reactToComment(comment.id, emoji)} className="rounded bg-white/10 px-2 py-1 text-sm">
                  {emoji}
                </button>
              ))}
              <button onClick={() => reportComment(comment.id)} className="text-sm text-red-300">
                Report
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
