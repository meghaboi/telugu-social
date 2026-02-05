import { TopNav } from '@/components/top-nav';
import { getReports } from '@/lib/data';
import { getServerAuth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { ModActions } from '@/components/mod-actions';

export default async function ModPage() {
  const auth = await getServerAuth();
  if (!auth) redirect('/auth');

  const reports = await getReports(auth.accessToken);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <h1 className="mb-4 text-2xl font-semibold">Moderator Dashboard</h1>
      <div className="space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-xl border border-white/10 bg-surface p-4">
            <p className="text-xs text-muted">{new Date(report.created_at).toLocaleString()} • {report.reason}</p>
            <p className="mt-2">{report.posts?.content || report.comments?.content}</p>
            <ModActions postId={report.post_id} commentId={report.comment_id} />
          </article>
        ))}
      </div>
    </main>
  );
}
