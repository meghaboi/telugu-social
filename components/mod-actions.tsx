'use client';

export function ModActions({ postId, commentId }: { postId?: string; commentId?: string }) {
  async function act(action: 'approve' | 'remove') {
    await fetch('/api/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, comment_id: commentId, action })
    });
    window.location.reload();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button onClick={() => act('approve')} className="rounded bg-white/10 px-3 py-1 text-sm">Approve</button>
      <button onClick={() => act('remove')} className="rounded bg-red-500/30 px-3 py-1 text-sm">Remove</button>
    </div>
  );
}
