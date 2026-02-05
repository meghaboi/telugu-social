'use client';

import { useToast } from '@/components/toast-provider';

export function ModActions({ postId, commentId }: { postId?: string; commentId?: string }) {
  const { pushToast } = useToast();

  async function act(action: 'approve' | 'remove') {
    const res = await fetch('/api/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, comment_id: commentId, action })
    });

    if (!res.ok) {
      pushToast('Moderator action failed. Please retry.', 'error');
      return;
    }

    pushToast(action === 'approve' ? 'Content approved.' : 'Content removed.');
    window.location.reload();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button onClick={() => act('approve')} className="rounded bg-white/10 px-3 py-1 text-sm">
        Approve
      </button>
      <button onClick={() => act('remove')} className="rounded bg-red-500/30 px-3 py-1 text-sm">
        Remove
      </button>
    </div>
  );
}
