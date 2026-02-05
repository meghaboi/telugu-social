import { TopNav } from '@/components/top-nav';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <section className="space-y-3 rounded-2xl border border-white/10 bg-surface p-5">
        <h1 className="text-2xl font-semibold">Privacy (MVP Placeholder)</h1>
        <p className="text-muted">We currently store profile information, posts, comments, reactions, moderation reports, and authentication metadata required to run telugu.social.</p>
        <p className="text-muted">Data is used only for core product functionality, abuse prevention, and moderation. We do not sell user data.</p>
      </section>
    </main>
  );
}
