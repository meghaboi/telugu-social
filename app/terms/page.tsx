import { TopNav } from '@/components/top-nav';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <TopNav />
      <section className="space-y-3 rounded-2xl border border-white/10 bg-surface p-5">
        <h1 className="text-2xl font-semibold">Terms (MVP Placeholder)</h1>
        <p className="text-muted">By using telugu.social, you agree not to post harassment, hate speech, explicit abuse, spam, or illegal content.</p>
        <p className="text-muted">Content may be removed by moderators. Repeated abuse can result in account restrictions.</p>
      </section>
    </main>
  );
}
